"use client"

import { useEffect, useState } from "react"
import { TEXT_CURVES, pathMetrics, type PathMetrics, type TextCurveId } from "@/lib/text-path"

/** What a preview holds before it has been measured — see CurvePreview. */
const EMPTY_METRICS: PathMetrics = { length: 0, x: 0, y: 0, width: 0, height: 0 }

// The "no curve" tile's icon: a plain straight baseline, the thing every other
// tile is a bend of. CE.SDK labels this state "None"
// (property.textOnPath.none); spelled out here so it reads as an action.
export const STRAIGHT_PATH = "M 0,0 L 120,0"

/** Rendered weight of every preview stroke, in CSS px. */
const STROKE_PX = 2

/**
 * A preset's shape drawn as its button. Fit into the box by its measured
 * bounding box, so paths of very different proportions all read at one size.
 *
 * The box is given in pixels rather than as a class because the stroke width is
 * derived from it: these paths have very different bounding boxes (120x60 for
 * the arches, 60x120 on their sides, 164x119 for Elevate) and
 * preserveAspectRatio shrinks each by its own factor, so a width in user units
 * would come out thinner on some tiles than others. Dividing the target weight
 * by that same factor cancels it exactly.
 *
 * vector-effect: non-scaling-stroke would express the same intent in one word,
 * but Chrome and Firefox disagree about it under a scaled viewBox — Chrome drew
 * these at half the asked-for weight. Doing the arithmetic ourselves renders
 * identically everywhere.
 */
export function CurvePreview({
  path,
  width = 48,
  height = 28,
  className,
}: {
  path: string
  width?: number
  height?: number
  className?: string
}) {
  // pathMetrics can only answer in a browser — it measures a laid-out SVG
  // element. Measuring during render therefore had the server and the client
  // disagree: the server had no metrics and returned null where the client
  // returned an <svg>, which is a hydration mismatch. Measuring after mount
  // instead, both start from the same empty box of the right size and the
  // drawn path arrives a tick later.
  const [m, setM] = useState(EMPTY_METRICS)
  useEffect(() => setM(pathMetrics(path)), [path])

  if (!m.width && !m.height) {
    return <svg width={width} height={height} className={className} aria-hidden="true" />
  }
  // A straight baseline has no height at all, which would make the viewBox
  // degenerate and scale the stroke away; give it a sliver to sit in.
  const h = m.height || Math.max(m.width * 0.04, 1)
  // A hair of padding so the stroke's own width is not clipped at the edges.
  const pad = Math.max(m.width, h) * 0.06
  const viewW = m.width + pad * 2
  const viewH = h + pad * 2
  // preserveAspectRatio="meet": the smaller of the two ratios wins.
  const scale = Math.min(width / viewW, height / viewH)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${m.x - pad} ${m.y - pad} ${viewW} ${viewH}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={scale > 0 ? STROKE_PX / scale : STROKE_PX}
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * The presets as one horizontal strip — the mobile sheet's Curve tab.
 *
 * The same tiles the desktop panel grids, laid in a row instead: a sheet has
 * width to scroll and no height to spend. "Do not curve" leads, as it does
 * there.
 *
 * Its own component so the handoff can show the mobile tab without opening a
 * drawer over the page, and show the one that ships rather than a copy of it.
 */
export function CurveStrip({
  curveId,
  onCurveChange,
}: {
  curveId: TextCurveId | null
  onCurveChange: (id: TextCurveId | null) => void
}) {
  return (
    <div className="no-scrollbar flex w-full items-center overflow-x-auto">
      <div className="flex items-center gap-2 pr-4 pl-4">
        {[null, ...TEXT_CURVES].map(curve => {
          const id = curve?.id ?? null
          const active = id === curveId
          return (
            <button
              key={id ?? "none"}
              type="button"
              aria-pressed={active}
              onClick={() => onCurveChange(id)}
              className={
                "flex h-[100px] w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xs border bg-neutral-100 px-2 transition " +
                (active ? "border-black" : "border-transparent active:bg-[#e9e9e9]")
              }
            >
              <CurvePreview path={curve ? (curve.iconPath ?? curve.path) : STRAIGHT_PATH} />
              <span className="text-[12px] font-semibold">{curve?.label ?? "Do not curve"}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
