"use client"

import { useEffect, useRef } from "react"
import { WedgeSlider } from "./WedgeSlider"

// The canvas zoom dock's track-click easing, verbatim (designer.tsx,
// animateZoomTo), so the two sliders feel like one control.
const JUMP_DURATION_MS = 260
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * The editor bar's font-size slider, wired exactly like the canvas zoom
 * control: dragging stays drag-relative (grabbing the thumb never shifts the
 * value), while a press on bare track jumps to that point — eased with the same
 * rAF tween, so the text glides to the new size instead of snapping. A drag
 * started mid-glide takes over, as the zoom's does.
 */
export function FontSizeSlider({
  min,
  max,
  value,
  onChange,
  width,
}: {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  /** Track length in px; the slider draws an SVG track so it needs a number. */
  width?: number
}) {
  const rafRef = useRef<number | null>(null)
  // Read at the start of a tween, so a glide eases from wherever the size
  // actually is rather than from a value captured on some earlier render.
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  const cancel = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }
  useEffect(() => cancel, [])

  const animateTo = (target: number) => {
    cancel()
    const start = valueRef.current
    if (start === target) return
    const startTime = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / JUMP_DURATION_MS)
      onChange(start + (target - start) * easeOutCubic(t))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        onChange(target)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  return (
    <WedgeSlider
      min={min}
      max={max}
      value={value}
      width={width}
      // Any real drag movement cancels a glide in progress — the same guard the
      // zoom dock puts in its own onChange.
      onChange={v => {
        cancel()
        onChange(v)
      }}
      jumpOnTrackClick
      onJump={animateTo}
    />
  )
}
