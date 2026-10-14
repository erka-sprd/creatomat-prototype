import { deriveGarment, type Garment } from "@/lib/assortment"

// ============================================================================
// Mocked embroidery hoop frame sizes.
//
// The hoop frame is the largest area an embroidery machine can stitch in one
// go. create-omat learns that a design exceeds it from the decoration service's
// precheck (DESIGN_TOO_LARGE), which only rejects a size and never says what
// the hoop frame is. Rather than probe that service, the prototype uses these
// hand-picked sizes: the share of the print area's width and of its height the
// hoop frame spans, per garment — 1/5 means a fifth as wide and a fifth as tall.
// null means no hoop frame limit.
// ============================================================================

const HOOP_FRAME_FRACTION_BY_GARMENT: Partial<Record<Garment, number | null>> = {
    tshirt: 1 / 5,
    longsleeve: 1 / 5,
    tank: 1 / 5,
    polo: 1 / 5,
    hoodie: 1 / 2, // incl. sweatshirts and zips — deriveGarment groups them
    bag: 1 / 2,
    cap: null, // caps and hats
}

// Everything not listed above (socks, pants, bodysuits, home & living, …).
const DEFAULT_HOOP_FRAME_FRACTION = 1 / 7

// A design measured off a rendered bitmap lands a pixel or so over an element
// sized exactly to the hoop frame; overshoot within this share still fits.
const HOOP_FRAME_TOLERANCE = 0.01

/** Share of the print area's width/height the hoop frame spans, or null for no limit. */
export function embroideryHoopFrameFraction(productName: string): number | null {
    const fraction = HOOP_FRAME_FRACTION_BY_GARMENT[deriveGarment(productName)]
    return fraction === undefined ? DEFAULT_HOOP_FRAME_FRACTION : fraction
}

/**
 * Uniform scale (≤ 1) that brings a design of `w` × `h` (fractions of the print
 * area) inside the hoop frame. 1 when it already fits or there is no limit.
 */
export function embroideryHoopFitScale(w: number, h: number, hoop: number | null): number {
    if (hoop === null || w <= 0 || h <= 0) return 1
    const scale = Math.min(hoop / w, hoop / h)
    return scale >= 1 - HOOP_FRAME_TOLERANCE ? 1 : scale
}

/**
 * Uniform scale (up or down) that makes a design of `w` × `h` fill the hoop
 * frame — its longer side, relative to the print area, reaches the frame's
 * edge. Used to size new elements in the embroidery flow; 1 without a limit.
 */
export function embroideryHoopFillScale(w: number, h: number, hoop: number | null): number {
    if (hoop === null || w <= 0 || h <= 0) return 1
    return Math.min(hoop / w, hoop / h)
}
