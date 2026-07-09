import { getCatalog, resolveImageUrl, type Catalog, type StaticProduct } from "product-catalog-client"

// Base URL of the deployed product catalogue (data + images). Override per env;
// falls back to the shared deployment so it works without config.
export const CATALOG_URL =
    process.env.NEXT_PUBLIC_CATALOG_URL || "https://product-catalog-five-self.vercel.app"

/** Resolve a catalogue image path (e.g. "/products/...") to an absolute URL. */
export const img = (path: string | null | undefined) => resolveImageUrl(CATALOG_URL, path)

// The catalogue carries a per-colour model-image library (all views × both
// crops) that the package types don't yet describe — model these locally.
export type ModelImageRef = { viewId: number; crop: string; image: string }
type AppearanceWithModels = StaticProduct["appearances"][number] & {
    modelImages?: ModelImageRef[]
}

// Rewrite every image field to an absolute catalogue URL once, at load time, so
// the rest of the app can keep using `.image` / `.preview` / `.modelImage` /
// `.modelImages` directly in <img src> without per-call resolution.
function absolutize(products: StaticProduct[]): StaticProduct[] {
    return products.map(p => ({
        ...p,
        preview: img(p.preview),
        modelImageFront: p.modelImageFront ? img(p.modelImageFront) : null,
        appearances: p.appearances.map(a => {
            const models = (a as AppearanceWithModels).modelImages
            return {
                ...a,
                image: img(a.image),
                modelImage: a.modelImage ? img(a.modelImage) : null,
                views: a.views.map(v => ({ ...v, image: img(v.image) })),
                ...(models
                    ? { modelImages: models.map(m => ({ ...m, image: img(m.image) })) }
                    : {}),
            }
        }),
    }))
}

/**
 * All model/mood images for a product to show in the tile hover carousel: every
 * view (front/back/sides) of the given colour, ordered by view, one crop. Falls
 * back to the first colour that has model images (covers socks/caps/mugs which
 * carry a single mood shot). Returns absolute URLs, or [] when none exist.
 */
export function modelImagesFor(
    product: StaticProduct,
    appearanceId?: string,
    crop: string = "detail"
): string[] {
    const appearances = product.appearances as AppearanceWithModels[]
    const source =
        appearances.find(a => a.id === appearanceId && a.modelImages?.length) ??
        appearances.find(a => a.modelImages?.length)
    const models = source?.modelImages
    if (!models?.length) return []

    const wanted = models.filter(m => m.crop === crop)
    const list = (wanted.length ? wanted : models)
        .slice()
        .sort((a, b) => a.viewId - b.viewId)
        .map(m => m.image)
    return [...new Set(list)]
}

/** Fetch the catalogue and absolutize its image URLs. */
export async function loadCatalog(): Promise<Catalog> {
    const c = await getCatalog(CATALOG_URL)
    return { featuredProductId: c.featuredProductId, products: absolutize(c.products) }
}

// --- Live Spreadshirt image-server rendering (Tier A) -----------------------
// The catalogue carries real Spreadshirt ids (productType, appearance, view),
// so we can render product images live instead of using the re-hosted webp.
// `modelId` renders the product on a real model photo — but needs a VALID id
// per product type (enumerate via the authenticated productTypes API); an
// unknown id silently falls back to the flat render.
//
// NOTE: the canonical version of this lives in product-catalog-client
// (`productTypeRenderUrl`); duplicated here so b2b can use it before the pinned
// package tarball is re-published.
export const IMAGE_SERVER_BASE =
    process.env.NEXT_PUBLIC_IMAGE_SERVER_BASE ||
    "https://image.spreadshirtmedia.net/image-server/v1"

export type ProductTypeRenderOptions = {
    productTypeId: string | number
    viewId: string | number
    appearanceId?: string | number
    width?: number
    height?: number
    crop?: "detail" | "list" | "full" | string
    modelId?: string | number
    format?: "jpg" | "png" | "webp"
}

export function productTypeRenderUrl(o: ProductTypeRenderOptions): string {
    const root = IMAGE_SERVER_BASE.replace(/\/+$/, "")
    const params: string[] = []
    if (o.width != null) params.push(`width=${o.width}`)
    if (o.height != null) params.push(`height=${o.height}`)
    if (o.appearanceId != null) params.push(`appearanceId=${o.appearanceId}`)
    if (o.crop != null) params.push(`crop=${o.crop}`)
    if (o.modelId != null) params.push(`modelId=${o.modelId}`)
    const suffix = params.length ? `,${params.join(",")}` : ""
    return `${root}/productTypes/${o.productTypeId}/views/${o.viewId}${suffix}.${o.format ?? "jpg"}`
}

// --- On-model rendering (Tier B) --------------------------------------------
// Ported from create-omat's useProductPreviewImages. The image server places
// the design onto a real model photo server-side. The render spec is a set of
// comma-separated params appended after the viewId, e.g.
//   {base}/products/{productKey}/views/1,modelId=42,crop=detail,appearanceId=1251,backgroundColor=F4F4F4
//
// Resources:
//   productTypes/{id}   — BLANK product on a model (no design). No creds needed.
//   products/{key}      — a SAVED product carrying the design, on a model.
//   compositions/{key}  — the flat design composition (no model).
//
// `productKey` identifies a design saved on Spreadshirt's backend. b2b's local
// canvas is NOT such a product, so design-on-model only lights up once a real
// productKey exists (paste one in the preview modal to test, or wire the
// save-design flow). `modelId`/`crop`/`appearanceIds` come from the model-image
// metadata (see fetchModelImages()).

const BG = "F4F4F4"

type RenderSpec = {
    modelId?: string | number
    crop?: string
    appearanceId?: string | number
    backgroundColor?: string
    width?: number
    height?: number
}

function renderSuffix(o: RenderSpec): string {
    const params: string[] = []
    if (o.modelId != null) params.push(`modelId=${o.modelId}`)
    if (o.crop != null) params.push(`crop=${o.crop}`)
    if (o.appearanceId != null) params.push(`appearanceId=${o.appearanceId}`)
    params.push(`backgroundColor=${o.backgroundColor ?? BG}`)
    const spec = params.length ? `,${params.join(",")}` : ""
    const q: string[] = []
    if (o.width != null) q.push(`width=${o.width}`)
    if (o.height != null) q.push(`height=${o.height}`)
    return spec + (q.length ? `?${q.join("&")}` : "")
}

/** Blank product type on a model photo (no design). Works without credentials. */
export function productTypeModelUrl(
    o: RenderSpec & { productTypeId: string | number; viewId: string | number }
): string {
    const root = IMAGE_SERVER_BASE.replace(/\/+$/, "")
    return `${root}/productTypes/${o.productTypeId}/views/${o.viewId}${renderSuffix(o)}`
}

/** A saved product (design) rendered on a model photo. Needs a real productKey. */
export function productModelUrl(
    o: RenderSpec & { productKey: string; viewId: string | number }
): string {
    const root = IMAGE_SERVER_BASE.replace(/\/+$/, "")
    return `${root}/products/${o.productKey}/views/${o.viewId}${renderSuffix(o)}`
}

/** Flat design composition (no model). Needs a real productKey. */
export function compositionUrl(o: {
    productKey: string
    viewId: string | number
    width?: number
    height?: number
}): string {
    const root = IMAGE_SERVER_BASE.replace(/\/+$/, "")
    const q: string[] = []
    if (o.width != null) q.push(`width=${o.width}`)
    if (o.height != null) q.push(`height=${o.height}`)
    return `${root}/compositions/${o.productKey}/views/${o.viewId}${q.length ? `?${q.join("&")}` : ""}`
}

// Model-image metadata (modelId, crop, which appearances/views it covers). In
// create-omat this comes from the internal model-image renderer; locally we
// proxy it through b2b's /api/model-images route (which calls create-omat).
export type ModelImageMeta = {
    modelId: number
    viewId: number
    appearanceIds: number[]
    crops: string[]
    tags: string[]
    hasPersons: boolean
}

export async function fetchModelImages(productTypeId: string | number): Promise<ModelImageMeta[]> {
    try {
        const res = await fetch(`/api/model-images/${productTypeId}`)
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data?.modelImages) ? data.modelImages : []
    } catch {
        return []
    }
}

/** Model images that cover a given appearance + view, best (highest priority) first. */
export function modelImagesForAppearanceAndView(
    modelImages: ModelImageMeta[],
    appearanceId: string | number,
    viewId: string | number
): ModelImageMeta[] {
    const aid = String(appearanceId)
    const vid = Number(viewId)
    return modelImages.filter(
        m => m.viewId === vid && m.appearanceIds.map(String).includes(aid)
    )
}
