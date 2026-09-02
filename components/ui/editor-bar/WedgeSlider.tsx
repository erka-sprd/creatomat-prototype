"use client"

import { useEffect, useId, useRef, useState } from "react"

type WedgeSliderProps = {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  width?: number
  // Glide the thumb to the new value (used for +/- steps). Always off while the
  // user is actively dragging so the thumb tracks the pointer 1:1.
  animate?: boolean
  // Opt-in: pressing bare track jumps the value to that point, then dragging
  // continues from there. Presses that land on the thumb never jump, so you can
  // grab the handle by its tips without it shifting. Off = pure drag-relative.
  jumpOnTrackClick?: boolean
  // Where a track-click should send the value. Give the owner an eased setter
  // (e.g. the zoom dock's rAF tween) so the jump glides instead of snapping;
  // falls back to onChange for an instant jump.
  onJump?: (value: number) => void
  // Track shape. "wedge" (default) is the subtle taper of the zoom dock and the
  // editor bar; "taper" rakes properly — 6px on the left to 16px on the right —
  // for sliders where the track itself reads as "more towards this end".
  track?: "wedge" | "taper"
  // "taper" only: colour of the travelled part of the track, up to the thumb.
  // Omitted leaves the whole track in its resting grey.
  trackFill?: string
  // "taper" only: 0–1 positions along the track to punch a dot into it, sized
  // and placed to sit inside it with 2px clear all round — see taperMarkX.
  marks?: number[]
  // Fires on grab and on release, so the owner can swap what it shows while the
  // handle is being moved.
  onDragChange?: (dragging: boolean) => void
  // Show the value as a percentage above the handle — how create-omat's mobile
  // size panel reads out its slider.
  showPercentage?: boolean
}

// End thicknesses of the "taper" track, and the clearance a mark dot keeps
// inside it.
const TAPER_START_HEIGHT = 6
const TAPER_END_HEIGHT = 16
const MARK_INSET = 2
// Below this the dot would vanish where the track is thinnest.
const MIN_MARK_RADIUS = 1.5

/**
 * Rounded trapezoid: a semicircular cap at each end (radius = half that end's
 * thickness) joined by the tangent-ish edges. Drawn at 1:1 in user units so the
 * caps stay circular — unlike the "wedge" path, which is scaled to fit.
 */
const taperPath = (width: number) => {
  const r0 = TAPER_START_HEIGHT / 2
  const r1 = TAPER_END_HEIGHT / 2
  const mid = TAPER_END_HEIGHT / 2
  const left = r0
  const right = Math.max(left, width - r1)
  return [
    `M ${left} ${mid - r0}`,
    `L ${right} ${mid - r1}`,
    `A ${r1} ${r1} 0 0 1 ${right} ${mid + r1}`,
    `L ${left} ${mid + r0}`,
    `A ${r0} ${r0} 0 0 1 ${left} ${mid - r0}`,
    "Z",
  ].join(" ")
}

/** Track thickness at a given x, from the linear taper between the two ends. */
const taperHeightAt = (x: number, width: number) =>
  width > 0
    ? TAPER_START_HEIGHT +
      (TAPER_END_HEIGHT - TAPER_START_HEIGHT) * Math.min(1, Math.max(0, x / width))
    : TAPER_START_HEIGHT

/** Dot radius where the track is `height` thick. */
const markRadius = (height: number) =>
  Math.max(MIN_MARK_RADIUS, (height - MARK_INSET * 2) / 2)

// Travel before a press counts as a drag, so a click doesn't register as one.
const DRAG_THRESHOLD_PX = 3
// A press held this long counts as a drag even if it never moves — long enough
// that an ordinary click stays a click.
const HOLD_ANNOUNCE_MS = 150

// Thumb hit size along the drag axis: the 20px circle plus its 2px border on
// each side (box-content) = 24px across, so ±12px from the thumb's centre.
const THUMB_RADIUS = 12

/**
 * Where the handle's centre sits at `fraction` (0–1) of the range: inset by its
 * own radius at both ends, since it is laid out with left:% + translateX(-%).
 * Exported so labels under the track can line up with the handle that lands on
 * them — the mark dots hug the track's ends instead (taperMarkX), so the two
 * mappings differ slightly at the extremes.
 */
export const thumbCentreX = (fraction: number, width: number) =>
  THUMB_RADIUS + fraction * Math.max(0, width - THUMB_RADIUS * 2)

// Drag-relative slider: pressing the thumb does NOT change the value — only
// actual pointer movement does. A native <input type="range"> jumps the value to
// wherever you click (so grabbing the thumb near its edge nudges it), which felt
// wrong for the zoom handle. Here we track movement from the press point instead.
export function WedgeSlider({
  min,
  max,
  value,
  onChange,
  width = 140,
  animate = false,
  jumpOnTrackClick = false,
  onJump,
  track = "wedge",
  trackFill,
  marks,
  onDragChange,
  showPercentage = false,
}: WedgeSliderProps) {
  // Unique per instance: two sliders on a page must not share a clip path.
  const fillClipId = useId()
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    start: number
    vertical: boolean
    length: number
    startValue: number
  } | null>(null)
  // Whether onDragChange(true) has been sent for the press in progress. It goes
  // out once the pointer actually travels — so a plain click (press, release,
  // no movement) never announces a drag, which would otherwise blink whatever
  // the owner swaps in and straight back out — or once the press is held long
  // enough to be a deliberate hold rather than a click.
  const announcedRef = useRef(false)
  const holdTimerRef = useRef<number | null>(null)
  const cancelHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }
  const announceDrag = () => {
    cancelHoldTimer()
    if (announcedRef.current) return
    announcedRef.current = true
    onDragChange?.(true)
  }
  useEffect(() => cancelHoldTimer, [])

  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const percentage = ((value - min) / (max - min)) * 100
  // The thumb's centre travels inset by its own radius at both ends — the same
  // mapping handlePointerDown uses, reused here to place the fill and the marks.
  const travel = Math.max(0, width - THUMB_RADIUS * 2)
  const thumbCentre = THUMB_RADIUS + (travel * (value - min)) / (max - min)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    const rect = el.getBoundingClientRect()
    // The parent may rotate the slider; the rendered rect tells us the on-screen
    // orientation so vertical (rotated) sliders map upward drag to higher values.
    const vertical = rect.height >= rect.width
    const length = vertical ? rect.height : rect.width
    const pos = vertical ? e.clientY : e.clientX

    // Where the press landed, measured from the track's `min` end. A rotated
    // (vertical) slider runs bottom → top, so measure down from its bottom edge.
    const fromMin = vertical ? rect.bottom - pos : pos - rect.left
    // The thumb's centre travels inset by its own radius at both ends (it is laid
    // out with left:%  + translateX(-%)), so map through that same inset.
    const travel = length - THUMB_RADIUS * 2
    const thumbCentre = THUMB_RADIUS + (travel * (value - min)) / (max - min)

    let startValue = value
    // Jump only for presses on bare track — never within the thumb, so grabbing
    // the handle (including by its upper/lower tip) leaves the value untouched.
    if (jumpOnTrackClick && travel > 0 && Math.abs(fromMin - thumbCentre) > THUMB_RADIUS) {
      startValue = clamp(min + ((fromMin - THUMB_RADIUS) / travel) * (max - min))
      // Eased when the owner supplies onJump; the drag below still starts from
      // the target, so a drag mid-glide simply takes over.
      if (startValue !== value) (onJump ?? onChange)(startValue)
    }

    dragRef.current = { start: pos, vertical, length, startValue }
    announcedRef.current = false
    setIsDragging(true)
    // Held still on the handle: after HOLD_ANNOUNCE_MS it counts as a drag even
    // without travel, so parking a finger there still reveals the readout.
    cancelHoldTimer()
    holdTimerRef.current = window.setTimeout(() => {
      if (dragRef.current) announceDrag()
    }, HOLD_ANNOUNCE_MS)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d || d.length === 0) return
    const current = d.vertical ? e.clientY : e.clientX
    const deltaPx = d.vertical ? d.start - current : current - d.start
    // A press wobbles by a pixel or two before a release; only real travel
    // counts as a drag.
    if (Math.abs(deltaPx) > DRAG_THRESHOLD_PX) announceDrag()
    const next = clamp(d.startValue + (deltaPx / d.length) * (max - min))
    if (next !== value) onChange(next)
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (trackRef.current?.hasPointerCapture(e.pointerId)) {
      trackRef.current.releasePointerCapture(e.pointerId)
    }
    dragRef.current = null
    setIsDragging(false)
    cancelHoldTimer()
    if (announcedRef.current) {
      announcedRef.current = false
      onDragChange?.(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = (max - min) / 20
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault()
      onChange(clamp(value + step))
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault()
      onChange(clamp(value - step))
    }
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      className="group relative flex h-6 cursor-pointer touch-none items-center outline-none"
      style={{ minWidth: width, width }}
    >
      {track === "taper" ? (
        <svg
          className="pointer-events-none absolute"
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={TAPER_END_HEIGHT}
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={fillClipId}>
              {/* Up to the thumb's centre, so the fill meets the handle. */}
              <rect x="0" y="0" width={thumbCentre} height={TAPER_END_HEIGHT} />
            </clipPath>
          </defs>
          <path d={taperPath(width)} fill="#DEDEDE" />
          {trackFill && (
            <path d={taperPath(width)} fill={trackFill} clipPath={`url(#${fillClipId})`} />
          )}
          {/* Marks are punched in white so they read the same on the travelled
              part of the track as on the untouched one. They sit on the THUMB's
              travel, so the handle lands dead centre on the dot it stops at —
              which insets the outer two by the handle's own radius. */}
          {marks?.map(fraction => {
            const x = thumbCentreX(fraction, width)
            return (
              <circle
                key={fraction}
                cx={x}
                cy={TAPER_END_HEIGHT / 2}
                r={markRadius(taperHeightAt(x, width))}
                fill="#fff"
              />
            )
          })}
        </svg>
      ) : (
        <svg
          className="pointer-events-none absolute"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height="7"
          viewBox="0 0 140 7"
          fill="none"
        >
          <path
            d="M0 4.17231L136.482 0.00201946C138.407 -0.0568061 140 1.48787 140 3.41397C140 5.32519 138.431 6.86402 136.52 6.82687L0 4.17231Z"
            fill="#DEDEDE"
          />
        </svg>
      )}
      <div
        className="pointer-events-none absolute"
        style={{
          left: `${percentage}%`,
          transform: `translateX(-${percentage}%)`,
          transition: animate && !isDragging ? "left 250ms ease, transform 250ms ease" : "none",
        }}
      >
        <div
          className={
            "box-content size-5 rounded-full border-2 border-black bg-white transition-shadow duration-300 " +
            (isDragging
              ? "shadow-[0_0_0_6px_rgba(0,0,0,0.1)]"
              : "group-hover:shadow-[0_0_0_6px_rgba(0,0,0,0.1)]")
          }
        />
        {/* The readout create-omat puts above the handle on mobile: the value
            as a percentage of the range, in the display face at 28/36 and
            weight 900, riding the thumb. */}
        {showPercentage && (
          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2">
            <span className="font-display text-[28px] leading-[36px] font-[900] whitespace-nowrap text-black uppercase">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
