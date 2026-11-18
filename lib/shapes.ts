import type { CSSProperties } from "react"

import { SHAPE_PATHS } from "./shape-paths"

// The shapes an image can be cut to — create-omat's Shape panels (ShapeGrid on
// desktop, ShapePanel on mobile). There the engine swaps the block's shape for
// the vector path; here the image is masked with the same path instead.

export type ShapeId = (typeof SHAPE_PATHS)[number]["id"]
export type ShapeDef = (typeof SHAPE_PATHS)[number]

export const SHAPES: readonly ShapeDef[] = SHAPE_PATHS

const SHAPES_BY_ID = new Map<string, ShapeDef>(SHAPES.map(shape => [shape.id, shape]))

export const shapeById = (id: string | null | undefined): ShapeDef | null =>
  (id && SHAPES_BY_ID.get(id)) || null

// "No Shape" and the panels' fallback label, as in create-omat's en-GB.
export const NO_SHAPE_LABEL = "No Shape"
export const SHAPES_PANEL_TITLE = "Shapes"

// The path as an SVG image. Stretched to whatever box it masks, as the engine
// stretches the vector path to the block's frame. Even-odd, so the cut-outs
// (Ring, Frame, …) keep their holes.
const shapeSvgUrl = (shape: ShapeDef) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${shape.width} ${shape.height}" preserveAspectRatio="none"><path fill-rule="evenodd" d="${shape.path}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const maskUrls = new Map<string, string>()
const maskUrl = (shape: ShapeDef) => {
  let url = maskUrls.get(shape.id)
  if (!url) {
    url = shapeSvgUrl(shape)
    maskUrls.set(shape.id, url)
  }
  return url
}

// The image cut to its shape: it covers the shape's box, as the engine's fill
// covers the block, and the path masks it. Spread onto the <img>.
export const shapedImageStyle = (id: string | null | undefined): CSSProperties | undefined => {
  const shape = shapeById(id)
  if (!shape) return undefined
  const url = maskUrl(shape)
  return {
    objectFit: "cover",
    maskImage: url,
    WebkitMaskImage: url,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  }
}

// The panel tiles' silhouette — create-omat masks a neutral-700 square with the
// shape's thumbnail, kept to its own proportions (mask-size: contain).
export const shapeThumbStyle = (shape: ShapeDef): CSSProperties => {
  const url = maskUrl(shape)
  return {
    maskImage: url,
    WebkitMaskImage: url,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  }
}

// create-omat's resizeBlockIfNeeded: a shape with other proportions than the
// box reshapes the box to them — the width kept when the shape is wider than
// the box, else the height. Works in pixels, given the box's on-screen size;
// returns the factors to scale the stored width and height by.
export const shapeBoxScale = (
  shape: ShapeDef,
  boxWidthPx: number,
  boxHeightPx: number
): { width: number; height: number } => {
  const shapeAspect = shape.width / shape.height
  const boxAspect = boxWidthPx / boxHeightPx
  if (!(boxWidthPx > 0 && boxHeightPx > 0) || Math.abs(shapeAspect - boxAspect) < 0.01) {
    return { width: 1, height: 1 }
  }
  return shapeAspect > boxAspect
    ? { width: 1, height: boxAspect / shapeAspect }
    : { width: shapeAspect / boxAspect, height: 1 }
}
