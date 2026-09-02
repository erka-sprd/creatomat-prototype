"use client"

import { pathMetrics } from "@/lib/text-path"

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
  const m = pathMetrics(path)
  if (!m.width && !m.height) return null
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
