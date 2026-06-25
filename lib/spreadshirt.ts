import {
  PRODUCTS,
  type StaticProduct,
  type StaticProductDetails,
  type StaticView,
  type StaticPrintArea,
} from "./products-data"

export type ViewImage = { id: string; image: string }

export type AppearanceData = {
  id: string
  name: string
  color: string
  image: string
  modelImage: string | null
  views: ViewImage[]
}

export type ProductTypeData = {
  id: string
  name: string
  price: number
  embroidery: boolean
  modelImageFront: string | null
  defaultViewId: string
  defaultAppearanceId: string
  appearances: AppearanceData[]
  views: StaticView[]
  printAreas: StaticPrintArea[]
  sizes: { id: string; name: string }[]
  details: StaticProductDetails
}

export function getProductType(id: string): ProductTypeData | null {
  const p: StaticProduct | undefined = PRODUCTS.find(x => x.id === id)
  if (!p) return null
  const defaultViewId = p.appearances[0]?.views[0]?.id ?? "1"
  const defaultAppearance =
    p.appearances.find(a => a.image === p.preview) ?? p.appearances[0]
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    embroidery: p.embroidery,
    modelImageFront: p.modelImageFront,
    defaultViewId,
    defaultAppearanceId: defaultAppearance?.id ?? "",
    appearances: p.appearances,
    views: p.views,
    printAreas: p.printAreas,
    sizes: p.sizes.map((name, i) => ({ id: String(i), name })),
    details: p.details,
  }
}

/**
 * Compute the print-area overlay rectangle (as percentages of the canvas) for
 * a given view. Returns null if the view has no print area mapping.
 */
export function getPrintAreaOverlay(
  product: ProductTypeData,
  viewId: string
): { left: number; top: number; width: number; height: number } | null {
  const view = product.views.find(v => v.id === viewId)
  const viewMap = view?.viewMaps[0]
  if (!view || !viewMap) return null
  const printArea = product.printAreas.find(pa => pa.id === viewMap.printAreaId)
  if (!printArea) return null
  const canvasW = viewMap.size.width || view.canvas.width
  const canvasH = viewMap.size.height || view.canvas.height
  if (!canvasW || !canvasH) return null
  return {
    left: (viewMap.offset.x / canvasW) * 100,
    top: (viewMap.offset.y / canvasH) * 100,
    width: (printArea.boundary.width / canvasW) * 100,
    height: (printArea.boundary.height / canvasH) * 100,
  }
}

export function productImageUrl(
  _productTypeId: string,
  _viewId: string,
  _appearanceId: string,
  _width = 800
) {
  // Kept for backwards compatibility — callers should prefer the appearance.image directly.
  const p = PRODUCTS.find(x => x.id === _productTypeId)
  return p?.appearances.find(a => a.id === _appearanceId)?.image ?? ""
}

// Deterministic pseudo-random for stable OOS per (productId, appearanceId).
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function buildOutOfStockMap(
  productId: string,
  appearances: { id: string }[],
  sizes: { name: string }[]
): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const a of appearances) {
    const seed = hash(`${productId}:${a.id}`)
    const count = seed % 3
    const picks = new Set<string>()
    let s = seed
    while (picks.size < Math.min(count, sizes.length)) {
      s = (s * 1664525 + 1013904223) >>> 0
      picks.add(sizes[s % sizes.length].name)
    }
    map[a.id] = Array.from(picks)
  }
  return map
}
