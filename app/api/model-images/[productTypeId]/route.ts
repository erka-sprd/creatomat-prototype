import { NextRequest, NextResponse } from "next/server"

// Proxy for model-image metadata (modelId, crop, covered appearances/views).
// The real source is Spreadgroup's internal model-image renderer, which
// create-omat already wraps at /api/assortment. We proxy through create-omat so
// no Spreadshirt credentials or internal (.vnet) URLs need to live in b2b.
//
// Requires create-omat running locally (default http://localhost:3000) and, for
// the underlying internal call, a VPN connection.
const CREATE_OMAT_BASE = process.env.CREATE_OMAT_BASE || "http://localhost:3000"
const SHOP_ID = process.env.MODEL_META_SHOP || "1133169"
const LOCALE = process.env.MODEL_META_LOCALE || "en_GB"

type OmatModelImage = {
    modelId: number
    viewId: number
    appearanceIds?: number[]
    crops?: string[]
    tags?: string[]
    active?: boolean
    persons?: unknown[]
}

export const GET = async (
    _req: NextRequest,
    { params }: { params: Promise<{ productTypeId: string }> }
) => {
    const { productTypeId } = await params
    const url = `${CREATE_OMAT_BASE}/api/assortment/${productTypeId}?mediaType=json&shopId=${SHOP_ID}&locale=${LOCALE}`
    try {
        const res = await fetch(url, { next: { revalidate: 3600 } })
        if (!res.ok) {
            return NextResponse.json(
                { error: `assortment upstream ${res.status}`, modelImages: [] },
                { status: 502 }
            )
        }
        const data = await res.json()
        const raw: OmatModelImage[] = Array.isArray(data?.modelImages) ? data.modelImages : []
        const modelImages = raw
            .filter(m => m.active !== false)
            .map(m => ({
                modelId: m.modelId,
                viewId: m.viewId,
                appearanceIds: m.appearanceIds ?? [],
                crops: m.crops ?? [],
                tags: m.tags ?? [],
                hasPersons: (m.persons?.length ?? 0) > 0,
            }))
        return NextResponse.json({ productTypeId, modelImages })
    } catch (error) {
        return NextResponse.json(
            { error: `proxy failed: ${(error as Error).message}`, modelImages: [] },
            { status: 502 }
        )
    }
}
