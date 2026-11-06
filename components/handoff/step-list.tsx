"use client"

/** The embroidery scenes' "If → Then" step list, the lit step centred on a turning roll. */

import { useLayoutEffect, useRef, useState } from "react"

import type { Step } from "@/components/handoff/embroidery-scene"

// How much of the neighbouring steps shows above and below the lit one, and
// how far each row away from it leans back, as on a roll.
const STEP_PEEK_PX = 34
const STEP_TILT_DEG = 42

/**
 * The scene's "If → Then" list, the step on the stage lit — in a window of
 * one fixed height, whatever the count: the tallest step plus a glimpse of a
 * neighbour above and below. The list glides so the lit step sits in the
 * middle; the others are faded, slightly blurred, cut by the window's soft
 * edges and tilted away (STEP_TILT_DEG a row) — steps on a turning roll.
 */
export function StepList({ steps, active }: { steps: Step[]; active: number }) {
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const [box, setBox] = useState({ centre: 0, tallest: 0 })
  useLayoutEffect(() => {
    const measure = () => {
      const row = rows.current[active]
      const tallest = Math.max(0, ...rows.current.map(r => r?.offsetHeight ?? 0))
      if (row) setBox({ centre: row.offsetTop + row.offsetHeight / 2, tallest })
    }
    measure()
    const ro = new ResizeObserver(measure)
    rows.current.forEach(r => r && ro.observe(r))
    return () => ro.disconnect()
  }, [active, steps])
  const windowH = box.tallest + STEP_PEEK_PX * 2

  return (
    <div
      className="overflow-hidden"
      style={{
        height: windowH || undefined,
        maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
      }}
    >
    <ol
      className="m-0 flex list-none flex-col gap-1 px-px py-0 transition-[translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ translate: `0 ${windowH / 2 - box.centre}px` }}
    >
      {steps.map((s, i) => (
        <li
          key={s.when}
          ref={el => {
            rows.current[i] = el
          }}
          // The lit step: the lightest purple, black text, and a dashed
          // outline two steps darker marching round it (.ho-march) — an SVG,
          // so the dashes follow the rounded corners and take no room.
          style={{ transform: `perspective(600px) rotateX(${Math.max(-80, Math.min(80, (active - i) * STEP_TILT_DEG))}deg)`, transition: "color 300ms, background-color 300ms, filter 300ms, opacity 300ms, transform 500ms cubic-bezier(0.22,1,0.36,1)" }}
          className={`relative grid grid-cols-[22px_minmax(0,1fr)_auto_minmax(0,1.25fr)] items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] leading-snug ${
            i === active ? "bg-purple-50 font-semibold text-purple-950" : "text-[var(--ho-muted)] opacity-70 blur-[1px]"
          }`}
        >
          {i === active && (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full overflow-visible text-purple-400"
            >
              <rect
                width="100%"
                height="100%"
                rx="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="ho-march"
              />
            </svg>
          )}
          <span
            className={`flex size-[20px] items-center justify-center rounded-full font-[family-name:var(--ho-mono)] text-[11px] transition-colors duration-300 ${
              i === active ? "bg-purple-200 text-purple-950" : "bg-[var(--ho-ground)]"
            }`}
          >
            {i + 1}
          </span>
          <span className="text-right first-letter:uppercase">{s.when}</span>
          <span aria-hidden="true" className="px-4">→</span>
          <span className="first-letter:uppercase">{s.then}</span>
        </li>
      ))}
    </ol>
    </div>
  )
}
