import type { StaticProduct } from "product-catalog-client"

// Size-guide access for the designer's companion panel.
//
// The measurements are real Spreadshirt data: the catalogue generator pulls
// `sizes[].measures` from the productType payload and emits them as
// `sizeGuide` (see product-catalog/scripts/size-guide.mjs). The letters are
// positions on the garment diagram the shop shows beside its table, labelled
// the way create-omat labels them in translations/en-GB.json
// (product-details.size-chart.guide.size-in.*) — A and C are both lengths taken
// at different points.
//
// TEMPORARY: `sizeGuide`, `formatMeasure` and friends also live in
// product-catalog-client, but this proto installs that package from GitHub, so
// the field is invisible to TypeScript until the package is pushed and
// re-installed. Once it is, delete this module and import from the package
// instead — the shapes are identical on purpose.

export type SizeMeasure = { name: string; mm: number }
export type SizeEntry = { name: string; measures: SizeMeasure[] }

/** What each measurement letter means. */
export const SIZE_MEASURE_LABELS: Record<string, string> = {
    A: "Length",
    B: "Width",
    C: "Length",
}

/**
 * Same rounding create-omat uses (getLocalizedSize, src/utils/Units.ts): one
 * decimal for cm, two for inches. Number only — the unit belongs in the header.
 */
export function formatMeasure(mm: number, unit: "cm" | "in" = "cm"): string {
    return unit === "in" ? (mm / 25.4).toFixed(2) : (mm / 10).toFixed(1)
}

/** The product's published measurements, or [] when it has none. */
export function sizeGuideFor(products: StaticProduct[], productTypeId: string): SizeEntry[] {
    const product = products.find(p => p.id === productTypeId) as
        | (StaticProduct & { sizeGuide?: SizeEntry[] })
        | undefined
    return product?.sizeGuide ?? []
}

/**
 * Measurement letters this product publishes, in A→B→C order, taken from the
 * first size that has any — so every row lines up under the same columns.
 */
export function sizeMeasureColumns(sizeGuide: SizeEntry[]): string[] {
    const first = sizeGuide.find(s => s.measures.length > 0)
    return first ? first.measures.map(m => m.name) : []
}

/** One size's measurement by letter; null when not published. */
export function sizeMeasure(
    sizeGuide: SizeEntry[],
    sizeName: string,
    measureName: string
): number | null {
    return sizeGuide.find(s => s.name === sizeName)?.measures.find(m => m.name === measureName)?.mm ?? null
}

// ---- Live fallback ---------------------------------------------------------
//
// The catalogue is the intended source, but a deployed catalogue generated
// before `sizeGuide` existed carries no measurements. Rather than showing an
// empty guide there, fetch them straight from the same public endpoint the
// generator uses. Browser-safe: api.spreadshirt.net sends permissive CORS.

const SHOP_ID = "205909"
const MEASURE_ORDER = ["A", "B", "C"]
const liveCache = new Map<string, Promise<SizeEntry[]>>()

export function fetchSizeGuide(productTypeId: string): Promise<SizeEntry[]> {
    const cached = liveCache.get(productTypeId)
    if (cached) return cached
    const p = fetch(
        `https://api.spreadshirt.net/api/v1/shops/${SHOP_ID}/productTypes/${productTypeId}?mediaType=json&fullData=true`,
        { headers: { Accept: "application/json" } }
    )
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((detail: { sizes?: RawSize[] }) => {
            const guide = (detail.sizes ?? []).map(size => ({
                name: size.name,
                measures: MEASURE_ORDER.flatMap(letter => {
                    const mm = size.measures?.find(m => m.name === letter)?.value
                    return mm && mm.unit === "mm" && mm.value > 0
                        ? [{ name: letter, mm: mm.value }]
                        : []
                }),
            }))
            return guide.some(s => s.measures.length > 0) ? guide : []
        })
        .catch(() => [])
    liveCache.set(productTypeId, p)
    return p
}

type RawSize = {
    name: string
    measures?: { name: string; value: { value: number; unit: string } }[]
}
