import type { CSSProperties } from "react"

// The views strip's active-view label and the notch it bites out of the
// strip — shared by the bottom row (components/merged-bottom-row.tsx) and the
// strip's variants page (components/view-strip-variants.tsx). Kept out of the
// component files so they export components only (Fast Refresh).

// Between the strip's top and the active view's label pill above it —
// negative, so the pill overlaps the strip's edge.
export const ACTIVE_LABEL_GAP_PX = -6
// The strip is cut away around the label, this far out from it, so the
// label reads as biting into the strip — the canvas, whatever its colour,
// shows through the gap. A mask, not a border, so there's nothing to match.
const LABEL_NOTCH_GAP_PX = 3
// The strip's shadow (shadow-xs) as a drop-shadow on a wrapper: a box-shadow
// would be cut off by the strip's own mask, a drop-shadow follows the notch.
export const STRIP_SHADOW = "drop-shadow(0 1px 2px rgb(0 0 0 / 0.05))"
// How long the label (and its notch) takes to slide to a newly chosen view.
export const LABEL_SLIDE_MS = 250

// The strip's mask: all of it, less a pill LABEL_NOTCH_GAP_PX larger than the
// label all round, centred where the label overlaps the strip's top (x, from
// the strip's left edge) — sliding with the label. While the label gives way
// (a hover close-up), the notch slides up off the strip, so it closes as the
// label fades.
export function labelNotchMask(
  label: { w: number; h: number },
  x: number,
  closed: boolean
): CSSProperties {
  const w = label.w + 2 * LABEL_NOTCH_GAP_PX
  const h = label.h + 2 * LABEL_NOTCH_GAP_PX
  // The label's bottom sits -ACTIVE_LABEL_GAP_PX into the strip.
  const top = closed ? -h : -ACTIVE_LABEL_GAP_PX - label.h - LABEL_NOTCH_GAP_PX
  const notch = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' rx='${h / 2}'/></svg>`
  )}")`
  const image = `linear-gradient(#000 0 0), ${notch}`
  const size = `100% 100%, ${w}px ${h}px`
  const position = `0 0, ${x - w / 2}px ${top}px`
  const transition = `mask-position ${LABEL_SLIDE_MS}ms ease-out, -webkit-mask-position ${LABEL_SLIDE_MS}ms ease-out`
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: size,
    WebkitMaskSize: size,
    maskPosition: position,
    WebkitMaskPosition: position,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    // The full layer, less the notch under it.
    maskComposite: "subtract",
    WebkitMaskComposite: "source-out",
    transition,
  }
}
