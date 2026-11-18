// Flip, as create-omat's editor bar does it: each axis toggles on its own, and
// the whole image flips — its shape cut and effect with it.

export type FlipAxis = "horizontal" | "vertical"

export type Flippable = { flipX?: boolean; flipY?: boolean }

export const FLIP_LABEL = "Flip"
export const FLIP_HORIZONTAL_LABEL = "Flip horizontally"
export const FLIP_VERTICAL_LABEL = "Flip vertically"

export function toggleFlip<T extends Flippable>(el: T, axis: FlipAxis): T {
  return axis === "horizontal" ? { ...el, flipX: !el.flipX } : { ...el, flipY: !el.flipY }
}

// The CSS transform for an element's flip, or undefined when it isn't flipped.
export function flipTransform(el: Flippable): string | undefined {
  if (!el.flipX && !el.flipY) return undefined
  return `scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`
}
