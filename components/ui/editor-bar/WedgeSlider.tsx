"use client"

import { useRef, useState } from "react"

type WedgeSliderProps = {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  width?: number
  // Glide the thumb to the new value (used for +/- steps). Always off while the
  // user is actively dragging so the thumb tracks the pointer 1:1.
  animate?: boolean
}

// Drag-relative slider: pressing the thumb does NOT change the value — only
// actual pointer movement does. A native <input type="range"> jumps the value to
// wherever you click (so grabbing the thumb near its edge nudges it), which felt
// wrong for the zoom handle. Here we track movement from the press point instead.
export function WedgeSlider({ min, max, value, onChange, width = 140, animate = false }: WedgeSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    start: number
    vertical: boolean
    length: number
    startValue: number
  } | null>(null)

  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const percentage = ((value - min) / (max - min)) * 100

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    const rect = el.getBoundingClientRect()
    // The parent may rotate the slider; the rendered rect tells us the on-screen
    // orientation so vertical (rotated) sliders map upward drag to higher values.
    const vertical = rect.height >= rect.width
    dragRef.current = {
      start: vertical ? e.clientY : e.clientX,
      vertical,
      length: vertical ? rect.height : rect.width,
      startValue: value,
    }
    setIsDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d || d.length === 0) return
    const current = d.vertical ? e.clientY : e.clientX
    const deltaPx = d.vertical ? d.start - current : current - d.start
    const next = clamp(d.startValue + (deltaPx / d.length) * (max - min))
    if (next !== value) onChange(next)
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (trackRef.current?.hasPointerCapture(e.pointerId)) {
      trackRef.current.releasePointerCapture(e.pointerId)
    }
    dragRef.current = null
    setIsDragging(false)
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
      </div>
    </div>
  )
}
