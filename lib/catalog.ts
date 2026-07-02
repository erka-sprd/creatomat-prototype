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
