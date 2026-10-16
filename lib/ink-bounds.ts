// The visible ("ink") extent of canvas objects, measured from the model the
// same way the designer's flatten pass draws them — so a live verdict taken
// while objects move matches the one measured off the flattened design on
// deselect (designBbox), rather than counting a graphic's transparent margins
// or a text box's empty line space.

export type InkRect = { l: number; t: number; r: number; b: number }

// ---------------------------------------------------------------------------
// Graphics: opaque bounds of the image, as fractions of its own size. drawImage
// stretches the image to the element's box, so the fractions apply to it as is.
// ---------------------------------------------------------------------------

const ALPHA_THRESHOLD = 10 // same cut-off as the flatten pass
const SAMPLE_PX = 256 // longest side the image is sampled at

const graphicInkCache = new Map<string, Promise<InkRect | null>>()

export function graphicInkFractions(src: string): Promise<InkRect | null> {
    const cached = graphicInkCache.get(src)
    if (cached) return cached
    const promise = new Promise<InkRect | null>(resolve => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(measureImage(img))
        img.onerror = () => resolve(null)
        img.src = src
    })
    graphicInkCache.set(src, promise)
    return promise
}

function measureImage(img: HTMLImageElement): InkRect | null {
    const s = SAMPLE_PX / Math.max(img.naturalWidth, img.naturalHeight, 1)
    const w = Math.max(1, Math.round(img.naturalWidth * s))
    const h = Math.max(1, Math.round(img.naturalHeight * s))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    let data: Uint8ClampedArray
    try {
        data = ctx.getImageData(0, 0, w, h).data
    } catch {
        return null // tainted canvas
    }
    let minX = w,
        minY = h,
        maxX = -1,
        maxY = -1
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
            if (data[(y * w + x) * 4 + 3] > ALPHA_THRESHOLD) {
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
    if (maxX < 0) return null
    return { l: minX / w, t: minY / h, r: (maxX + 1) / w, b: (maxY + 1) / h }
}

// ---------------------------------------------------------------------------
// Text: glyph extent of a text block, in px at the given font size, relative
// to the block's origin (its top-left, as the flatten pass draws it: baseline
// "top", lines fontSize apart, aligned within the widest line).
// ---------------------------------------------------------------------------

export type TextInkInput = {
    content: string
    fontFamily: string
    fontSize: number
    bold?: boolean
    italic?: boolean
    underline?: boolean
    textAlign?: "left" | "center" | "right"
}

let measureCtx: CanvasRenderingContext2D | null = null

export function textInkPx(t: TextInkInput): (InkRect & { blockW: number; blockH: number }) | null {
    measureCtx ??= document.createElement("canvas").getContext("2d")
    const ctx = measureCtx
    if (!ctx || t.fontSize <= 0) return null
    ctx.font = `${t.italic ? "italic " : ""}${t.bold ? 700 : 400} ${t.fontSize}px "${t.fontFamily}"`
    ctx.textBaseline = "top"
    const lines = t.content.split("\n")
    const metrics = lines.map(l => ctx.measureText(l))
    const blockW = Math.max(0, ...metrics.map(m => m.width))
    const align = t.textAlign ?? "left"
    let l = Infinity,
        top = Infinity,
        r = -Infinity,
        b = -Infinity
    metrics.forEach((m, i) => {
        if (!lines[i].trim()) return
        const dx =
            align === "center" ? (blockW - m.width) / 2 : align === "right" ? blockW - m.width : 0
        const y = i * t.fontSize
        l = Math.min(l, dx - m.actualBoundingBoxLeft)
        r = Math.max(r, dx + m.actualBoundingBoxRight)
        top = Math.min(top, y - m.actualBoundingBoxAscent)
        const underlineBottom = t.underline ? y + t.fontSize * 0.92 + Math.max(1, t.fontSize / 16) : -Infinity
        b = Math.max(b, y + m.actualBoundingBoxDescent, underlineBottom)
    })
    if (!Number.isFinite(l)) return null
    return { l, t: top, r, b, blockW, blockH: lines.length * t.fontSize }
}

// Axis-aligned bounds of `rect` rotated by `deg` about (cx, cy).
export function rotatedBounds(rect: InkRect, deg: number, cx: number, cy: number): InkRect {
    if (!deg) return rect
    const a = (deg * Math.PI) / 180
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const xs: number[] = []
    const ys: number[] = []
    for (const [x, y] of [
        [rect.l, rect.t],
        [rect.r, rect.t],
        [rect.l, rect.b],
        [rect.r, rect.b],
    ]) {
        xs.push(cx + (x - cx) * cos - (y - cy) * sin)
        ys.push(cy + (x - cx) * sin + (y - cy) * cos)
    }
    return { l: Math.min(...xs), t: Math.min(...ys), r: Math.max(...xs), b: Math.max(...ys) }
}
