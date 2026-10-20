"use client"

import { useEffect, useRef, type CSSProperties } from "react"

// The ?dtf=true version's stand-in for the stitched embroidery render: the
// design as a patch — one piece of material, in the product colour, that a
// machine would cut out and print the design onto. So the patch is not an
// outline that follows every contour but the design's solid silhouette:
// - its holes are filled (the counters of "e", "d", "o" are patch, not
//   garment showing through);
// - parts closer than BRIDGE_PX are joined (the letters of a word make one
//   piece, not one patch each) — a morphological closing: grow, then shrink
//   back by the same amount;
// - and it reaches OFFSET_PX past the design all round, its corners rounded
//   as a cutter leaves them.
// Distances are on screen, at zoom 1. The patch gets a slight emboss — light
// along its top-left rim, shade along its bottom-right — and the design sits
// on top, flat.
//
// Same contract as product-catalog-client's EmbroideryPreview: give it the
// flattened design (`src`) and it calls `onRendered` with a PNG of the result.
// Unlike that one, the result is larger than the design — the patch reaches
// past its edges — so `onRendered` also reports that margin (`pad`) as a
// share of the design's width and height, for the overlay to widen by.

const OFFSET_PX = 4
const BRIDGE_PX = 5
// Bevel depth, on screen.
const BEVEL_PX = 1
// Alpha above which a pixel of the design counts as design.
const ALPHA_THRESHOLD = 10

export type DtfPatchPad = { x: number; y: number }

// Squared Euclidean distance from every pixel to the nearest `feature` pixel
// (Felzenszwalb & Huttenlocher's linear-time transform, by rows then columns).
function squaredDistances(feature: Uint8Array, W: number, H: number): Float64Array {
  const INF = 1e20
  const d = new Float64Array(W * H)
  for (let i = 0; i < W * H; i++) d[i] = feature[i] ? 0 : INF
  const n = Math.max(W, H)
  const f = new Float64Array(n)
  const out = new Float64Array(n)
  const v = new Int32Array(n)
  const z = new Float64Array(n + 1)
  const pass = (len: number) => {
    let k = 0
    v[0] = 0
    z[0] = -INF
    z[1] = INF
    for (let q = 1; q < len; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
      while (s <= z[k]) {
        k--
        s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
      }
      k++
      v[k] = q
      z[k] = s
      z[k + 1] = INF
    }
    k = 0
    for (let q = 0; q < len; q++) {
      while (z[k + 1] < q) k++
      out[q] = (q - v[k]) * (q - v[k]) + f[v[k]]
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) f[x] = d[y * W + x]
    pass(W)
    for (let x = 0; x < W; x++) d[y * W + x] = out[x]
  }
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) f[y] = d[y * W + x]
    pass(H)
    for (let y = 0; y < H; y++) d[y * W + x] = out[y]
  }
  return d
}

// Everything the outside can't reach becomes part of the shape: a flood fill
// of the background from the canvas edge, the rest is filled.
function fillHoles(shape: Uint8Array, W: number, H: number) {
  const outside = new Uint8Array(W * H)
  const stack: number[] = []
  const push = (i: number) => {
    if (!shape[i] && !outside[i]) {
      outside[i] = 1
      stack.push(i)
    }
  }
  for (let x = 0; x < W; x++) {
    push(x)
    push((H - 1) * W + x)
  }
  for (let y = 0; y < H; y++) {
    push(y * W)
    push(y * W + W - 1)
  }
  while (stack.length) {
    const i = stack.pop()!
    const x = i % W
    if (x > 0) push(i - 1)
    if (x < W - 1) push(i + 1)
    if (i >= W) push(i - W)
    if (i < (H - 1) * W) push(i + W)
  }
  for (let i = 0; i < W * H; i++) if (!outside[i]) shape[i] = 1
}

export function DtfPatchPreview({
  src,
  color,
  screenScale,
  maxSize = 620,
  onRendered,
  style,
}: {
  src: string
  /** Product colour, as hex. */
  color: string
  /** Pixels of `src` per on-screen pixel at zoom 1. */
  screenScale: number
  maxSize?: number
  onRendered?: (url: string, pad: DtfPatchPad) => void
  style?: CSSProperties
}) {
  const onRenderedRef = useRef(onRendered)
  onRenderedRef.current = onRendered

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (cancelled) return
      const fit = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const w = Math.max(1, Math.round(img.width * fit))
      const h = Math.max(1, Math.round(img.height * fit))
      // Render pixels per on-screen pixel, after the fit.
      const px = Math.max(0.5, screenScale * fit)
      const offset = Math.max(1, OFFSET_PX * px)
      const bridge = BRIDGE_PX * px
      const bevel = Math.max(1, BEVEL_PX * px)
      // Room for the closing to grow into before it shrinks back, so the
      // canvas edge never clips it.
      const pad = Math.ceil(offset + bridge + 2)
      const W = w + 2 * pad
      const H = h + 2 * pad

      // The design's silhouette.
      const design = document.createElement("canvas")
      design.width = W
      design.height = H
      const dctx = design.getContext("2d", { willReadFrequently: true })!
      dctx.drawImage(img, pad, pad, w, h)
      const alpha = dctx.getImageData(0, 0, W, H).data
      const ink = new Uint8Array(W * H)
      for (let i = 0; i < W * H; i++) ink[i] = alpha[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0

      // Close: grow by `bridge`, then shrink back by it — gaps narrower than
      // twice that are bridged, the outline otherwise stays put.
      const toInk = squaredDistances(ink, W, H)
      const grownOutside = new Uint8Array(W * H)
      for (let i = 0; i < W * H; i++) grownOutside[i] = toInk[i] > bridge * bridge ? 1 : 0
      const toOutside = squaredDistances(grownOutside, W, H)
      const shape = new Uint8Array(W * H)
      for (let i = 0; i < W * H; i++) shape[i] = toOutside[i] > bridge * bridge ? 1 : 0
      for (let i = 0; i < W * H; i++) if (ink[i]) shape[i] = 1

      fillHoles(shape, W, H)

      // The margin: everything within `offset` of the shape, its edge
      // anti-aliased over a pixel.
      const toShape = squaredDistances(shape, W, H)
      const patch = dctx.createImageData(W, H)
      const hex = color.replace("#", "")
      const r = parseInt(hex.slice(0, 2), 16) || 0
      const g = parseInt(hex.slice(2, 4), 16) || 0
      const b = parseInt(hex.slice(4, 6), 16) || 0
      for (let i = 0; i < W * H; i++) {
        const a = Math.min(1, Math.max(0, offset + 0.5 - Math.sqrt(toShape[i])))
        patch.data[i * 4] = r
        patch.data[i * 4 + 1] = g
        patch.data[i * 4 + 2] = b
        patch.data[i * 4 + 3] = Math.round(a * 255)
      }
      const shapeCanvas = document.createElement("canvas")
      shapeCanvas.width = W
      shapeCanvas.height = H
      shapeCanvas.getContext("2d")!.putImageData(patch, 0, 0)

      const out = document.createElement("canvas")
      out.width = W
      out.height = H
      const ctx = out.getContext("2d")!
      ctx.drawImage(shapeCanvas, 0, 0)

      // Emboss: the rim the shape loses when shifted down-right is its
      // top-left edge — lit; shifted up-left, its bottom-right — shaded.
      const rim = (dx: number, dy: number, tint: string) => {
        const c = document.createElement("canvas")
        c.width = W
        c.height = H
        const rctx = c.getContext("2d")!
        rctx.drawImage(shapeCanvas, 0, 0)
        rctx.globalCompositeOperation = "destination-out"
        rctx.drawImage(shapeCanvas, dx, dy)
        rctx.globalCompositeOperation = "source-in"
        rctx.fillStyle = tint
        rctx.fillRect(0, 0, W, H)
        ctx.save()
        ctx.filter = `blur(${bevel / 2}px)`
        ctx.globalCompositeOperation = "source-atop"
        ctx.drawImage(c, 0, 0)
        ctx.restore()
      }
      rim(bevel, bevel, "rgba(255, 255, 255, 0.08)")
      rim(-bevel, -bevel, "rgba(0, 0, 0, 0.15)")

      // The design, flat on top.
      ctx.drawImage(img, pad, pad, w, h)

      onRenderedRef.current?.(out.toDataURL("image/png"), { x: pad / w, y: pad / h })
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src, color, screenScale, maxSize])

  return <span aria-hidden="true" style={style} />
}
