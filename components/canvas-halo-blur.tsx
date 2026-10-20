"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

// A blur behind the controls that float over the canvas — the editor bars
// and the canvas messages (preview loader, size and design-issue warnings) —
// reaching HALO_PX past them and fading out over that distance, so whatever
// of the product passes under them is softened and the eye stays on them.
//
// They slide in and out, stack under each other and fade, so rather than
// being told where they are, this follows them: every frame it measures the
// visible ones (marked `data-canvas-halo`, shown unless aria-hidden) and
// spans one blur over all of them — one, so where a bar and a message sit
// close the gap between them isn't blurred twice. It fades out when the last
// one goes. Sits above the canvas scroll area (z-0) and under the controls
// (z-4/5); never takes pointer events.

const HALO_PX = 70
const BLUR_PX = 12
const FADE_MS = 300

type Box = { left: number; top: number; width: number; height: number }

// Fades in from each edge over HALO_PX: the two gradients intersected give a
// rounded-off rectangle at full strength around the controls.
const EDGE_FADE = `linear-gradient(to right, transparent, black ${HALO_PX}px, black calc(100% - ${HALO_PX}px), transparent)`
const VERTICAL_FADE = `linear-gradient(to bottom, transparent, black ${HALO_PX}px, black calc(100% - ${HALO_PX}px), transparent)`

export function CanvasHaloBlur({ container }: { container: RefObject<HTMLElement | null> }) {
  const [box, setBox] = useState<Box | null>(null)
  // The last box shown, kept so the blur fades out where it was.
  const lastBox = useRef<Box | null>(null)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = requestAnimationFrame(measure)
      const root = container.current
      if (!root) return
      const c = root.getBoundingClientRect()
      let l = Infinity,
        t = Infinity,
        r = -Infinity,
        b = -Infinity
      root.querySelectorAll<HTMLElement>("[data-canvas-halo]").forEach(el => {
        if (el.getAttribute("aria-hidden") === "true") return
        const e = el.getBoundingClientRect()
        if (e.width === 0 || e.height === 0) return
        l = Math.min(l, e.left)
        t = Math.min(t, e.top)
        r = Math.max(r, e.right)
        b = Math.max(b, e.bottom)
      })
      const next: Box | null = Number.isFinite(l)
        ? {
            left: Math.round(l - c.left - HALO_PX),
            top: Math.round(t - c.top - HALO_PX),
            width: Math.round(r - l + 2 * HALO_PX),
            height: Math.round(b - t + 2 * HALO_PX),
          }
        : null
      setBox(prev =>
        prev === next ||
        (prev &&
          next &&
          prev.left === next.left &&
          prev.top === next.top &&
          prev.width === next.width &&
          prev.height === next.height)
          ? prev
          : next
      )
    }
    frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  }, [container])

  if (box) lastBox.current = box
  const shown = box ?? lastBox.current
  if (!shown) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-[3] transition-opacity ease-out"
      style={{
        ...shown,
        opacity: box ? 1 : 0,
        transitionDuration: `${FADE_MS}ms`,
        backdropFilter: `blur(${BLUR_PX}px)`,
        WebkitBackdropFilter: `blur(${BLUR_PX}px)`,
        maskImage: `${EDGE_FADE}, ${VERTICAL_FADE}`,
        WebkitMaskImage: `${EDGE_FADE}, ${VERTICAL_FADE}`,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    />
  )
}
