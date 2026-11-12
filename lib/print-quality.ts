// ============================================================================
// Mocked minimum print resolution.
//
// create-omat gets the DPI a print technique needs from the decoration
// service (`/print-techniques/available` → `minimumDpi`, `recommendedDpi`),
// but only uses it to pick the export resolution — it never stops a resize.
// The prototype instead stops an uploaded image from growing past the size its
// pixels still print sharp at, with this hand-picked value.
// ============================================================================

export const MIN_PRINT_DPI = 150

// The upload size the uploads panel recommends ("Best for printing") — a
// square this many pixels a side.
export const BEST_PRINT_SIDE_PX = 4000
// Below this many pixels on its longer side an upload ranks "low".
export const MODERATE_PRINT_SIDE_PX = 1500

export type PrintQualityRank = "low" | "moderate" | "good"

/** An image's pixel size as the tiles and the size message write it. */
export function pixelSizeLabel(size: { w: number; h: number }) {
    return `${size.w} × ${size.h} px`
}

/**
 * How well an upload prints, by its longer side: "good" from the size that
 * prints best, "moderate" from MODERATE_PRINT_SIDE_PX, "low" below. A vector
 * (SVG) prints sharp at any size.
 */
export function printQualityRank(
    size: { w: number; h: number },
    vector = false
): PrintQualityRank {
    const side = Math.max(size.w, size.h)
    if (vector || side >= BEST_PRINT_SIDE_PX) return "good"
    return side >= MODERATE_PRINT_SIDE_PX ? "moderate" : "low"
}

export const MM_PER_INCH = 25.4

/** Widest an image `pixelWidth` px wide may print, in mm, at MIN_PRINT_DPI. */
export function printMaxWidthMm(pixelWidth: number): number {
    return (pixelWidth * MM_PER_INCH) / MIN_PRINT_DPI
}

/**
 * Largest uniform scale a design `widthMm` wide, made from `pixelWidth` px,
 * may be resized to. Floored at 1, so one already over the limit can't grow
 * further but doesn't jump down either.
 */
export function printQualityMaxScale(widthMm: number, pixelWidth: number): number | null {
    if (widthMm <= 0 || pixelWidth <= 0) return null
    return Math.max(1, printMaxWidthMm(pixelWidth) / widthMm)
}

/**
 * Pixel width of an uploaded raster image, or null when there's no DPI limit:
 * not an upload (uploads are blob: URLs; the landing page's hands in a data:
 * URL), or a vector (SVG) that scales freely.
 */
export async function uploadPixelWidth(src: string): Promise<number | null> {
    if (!src.startsWith("blob:") && !src.startsWith("data:image/")) return null
    try {
        const blob = await (await fetch(src)).blob()
        if (blob.type === "image/svg+xml") return null
        const bitmap = await createImageBitmap(blob)
        const width = bitmap.width
        bitmap.close()
        return width
    } catch (e) {
        console.warn("Print quality: couldn't read upload size", e)
        return null
    }
}
