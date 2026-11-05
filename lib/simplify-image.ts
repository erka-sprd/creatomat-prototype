// "Simplify with AI" without the AI: makes an image easier to stitch in the
// browser — fewer colours, simpler shapes, no stray pixels — with canvas
// filters. It looks like a filter, not a redraw, but it stands in for the
// model call create-omat makes (fal.ai) until the proto has one.
//
// 1. Drawn small (MAX_SIZE_PX) and softened, so fine detail and thin lines
//    melt into their surroundings.
// 2. Its opaque pixels reduced to COLOR_COUNT flat colours (k-means).
// 3. Smoothed: each pixel takes the colour most of its neighbours have
//    (SMOOTH_PASSES), which rounds off jagged edges and drops specks.
// 4. Alpha made solid — opaque or clear — as thread is.

const MAX_SIZE_PX = 512
const SOFTEN_BLUR_PX = 2
const COLOR_COUNT = 5
const KMEANS_ITERATIONS = 10
// Every Nth opaque pixel trains the palette — plenty, and much quicker.
const KMEANS_SAMPLE_STEP = 7
const SMOOTH_PASSES = 2
const ALPHA_CUTOFF = 128
const TRANSPARENT = -1

type RGB = [number, number, number]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.src = src
  })
}

const distSq = (data: Uint8ClampedArray, i: number, c: RGB) =>
  (data[i] - c[0]) ** 2 + (data[i + 1] - c[1]) ** 2 + (data[i + 2] - c[2]) ** 2

function nearest(data: Uint8ClampedArray, i: number, palette: RGB[]) {
  let best = 0
  let bestD = Infinity
  palette.forEach((c, k) => {
    const d = distSq(data, i, c)
    if (d < bestD) {
      bestD = d
      best = k
    }
  })
  return best
}

// k-means on a sample of the opaque pixels, seeded evenly across the sample.
function palette(data: Uint8ClampedArray, opaque: number[]): RGB[] {
  const sample = opaque.filter((_, n) => n % KMEANS_SAMPLE_STEP === 0)
  if (sample.length === 0) return []
  const k = Math.min(COLOR_COUNT, sample.length)
  let centres: RGB[] = Array.from({ length: k }, (_, j) => {
    const i = sample[Math.floor((j * sample.length) / k)]
    return [data[i], data[i + 1], data[i + 2]]
  })
  for (let it = 0; it < KMEANS_ITERATIONS; it++) {
    const sums = centres.map(() => [0, 0, 0, 0])
    for (const i of sample) {
      const s = sums[nearest(data, i, centres)]
      s[0] += data[i]
      s[1] += data[i + 1]
      s[2] += data[i + 2]
      s[3]++
    }
    centres = centres.map((c, j) => {
      const [r, g, b, n] = sums[j]
      return n ? [r / n, g / n, b / n] : c
    })
  }
  return centres
}

// One majority pass over the label map: each pixel takes the label most of
// its 3×3 neighbourhood has (transparency counts as a label too).
function smooth(labels: Int16Array, w: number, h: number, k: number): Int16Array {
  const out = new Int16Array(labels.length)
  const counts = new Int16Array(k + 1)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      counts.fill(0)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.min(w - 1, Math.max(0, x + dx))
          const ny = Math.min(h - 1, Math.max(0, y + dy))
          counts[labels[ny * w + nx] + 1]++
        }
      }
      let best = labels[y * w + x] + 1
      counts.forEach((n, j) => {
        if (n > counts[best]) best = j
      })
      out[y * w + x] = best - 1
    }
  }
  return out
}

// "Fix with AI" for thin lines, likewise without the AI: thickens the design's
// lines rather than simplifying it away (the soften above would melt thin
// lines). Its alpha made solid, then grown THICKEN_SHARE of its longer side
// all round, one pixel a pass — each clear pixel touching ink takes that
// ink's colour — so every stroke gets wider in its own colour.
// Only strokes against transparency thicken; lines drawn over a filled area
// stay as they are (a real model would redraw them).
const THICKEN_SHARE = 0.008

/** The image with its lines thickened, as a PNG data URL. */
export async function thickenLines(src: string): Promise<string> {
  const img = await loadImage(src)
  const scale = Math.min(1, MAX_SIZE_PX / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("Canvas 2D is unavailable")
  ctx.drawImage(img, 0, 0, w, h)

  const image = ctx.getImageData(0, 0, w, h)
  const { data } = image
  for (let i = 3; i < data.length; i += 4) data[i] = data[i] >= ALPHA_CUTOFF ? 255 : 0
  const passes = Math.max(1, Math.round(Math.max(w, h) * THICKEN_SHARE))
  for (let p = 0; p < passes; p++) {
    const prev = new Uint8ClampedArray(data)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        if (prev[i + 3]) continue
        const from = inkNeighbour(prev, w, h, x, y)
        if (from < 0) continue
        data[i] = prev[from]
        data[i + 1] = prev[from + 1]
        data[i + 2] = prev[from + 2]
        data[i + 3] = 255
      }
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL("image/png")
}

// The data index of an opaque pixel among (x, y)'s eight neighbours, or -1.
function inkNeighbour(data: Uint8ClampedArray, w: number, h: number, x: number, y: number) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const j = (ny * w + nx) * 4
      if (data[j + 3]) return j
    }
  }
  return -1
}

/** The simplified image as a PNG data URL. */
export async function simplifyImage(src: string): Promise<string> {
  const img = await loadImage(src)
  const scale = Math.min(1, MAX_SIZE_PX / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("Canvas 2D is unavailable")
  ctx.filter = `blur(${SOFTEN_BLUR_PX}px)`
  ctx.drawImage(img, 0, 0, w, h)
  ctx.filter = "none"

  const image = ctx.getImageData(0, 0, w, h)
  const { data } = image
  const opaque: number[] = []
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] >= ALPHA_CUTOFF) opaque.push(i)
  const colors = palette(data, opaque)
  if (colors.length === 0) return canvas.toDataURL("image/png")

  let labels: Int16Array = new Int16Array(w * h).fill(TRANSPARENT)
  for (const i of opaque) labels[i / 4] = nearest(data, i, colors)
  for (let p = 0; p < SMOOTH_PASSES; p++) labels = smooth(labels, w, h, colors.length)

  labels.forEach((label, px) => {
    const i = px * 4
    if (label === TRANSPARENT) {
      data[i + 3] = 0
      return
    }
    const [r, g, b] = colors[label]
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = 255
  })
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL("image/png")
}
