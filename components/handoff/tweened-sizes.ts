"use client"

import { useEffect, useRef, useState } from "react"

import type { SceneDesign } from "@/components/handoff/embroidery-scene"

type Tween = { from: number; to: number; start: number; ms: number }

/**
 * A scene's designs with their size as it is this frame. While a design is
 * held by a corner (`resizing`), a change of its size is played out frame by
 * frame over its `motionMs` — linear, as a hand drags — rather than left to a
 * CSS tween. So everything read off the size follows it live: the box, the
 * hoop guide inside it (shown while the design is past the frame), the
 * cursor on its corner. Any other change of size applies at once (and is
 * tweened by CSS as before).
 */
export function useTweenedSizes(designs: SceneDesign[], instant: boolean): SceneDesign[] {
  const shown = useRef<Record<string, number>>({})
  const targets = useRef<Record<string, number>>({})
  const tweens = useRef<Record<string, Tween>>({})
  const frame = useRef(0)
  const [, setTick] = useState(0)

  useEffect(() => {
    const now = performance.now()
    for (const d of designs) {
      const before = targets.current[d.id]
      targets.current[d.id] = d.size
      if (before === undefined || before === d.size) continue
      if (d.resizing && !instant && (d.motionMs ?? 0) > 0) {
        tweens.current[d.id] = { from: shown.current[d.id] ?? before, to: d.size, start: now, ms: d.motionMs! }
      } else {
        delete tweens.current[d.id]
        shown.current[d.id] = d.size
      }
    }
    if (frame.current || Object.keys(tweens.current).length === 0) return
    const step = () => {
      const t = performance.now()
      for (const [id, tw] of Object.entries(tweens.current)) {
        const p = Math.min(1, (t - tw.start) / tw.ms)
        shown.current[id] = tw.from + (tw.to - tw.from) * p
        if (p >= 1) delete tweens.current[id]
      }
      setTick(n => n + 1)
      frame.current = Object.keys(tweens.current).length ? requestAnimationFrame(step) : 0
    }
    frame.current = requestAnimationFrame(step)
  }, [designs, instant])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return designs.map(d => {
    const size = tweens.current[d.id] ? shown.current[d.id] : d.size
    return size === d.size || size === undefined ? d : { ...d, size }
  })
}
