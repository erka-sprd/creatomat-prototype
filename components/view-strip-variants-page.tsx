"use client"

import type { StaticProduct } from "product-catalog-client"
import { useEffect, useState } from "react"

import { TechniqueSwitcher, ZoomControl } from "@/components/merged-bottom-row"
import { ViewStripVariant, type ViewStripVariantId } from "@/components/view-strip-variants"
import { loadCatalog } from "@/lib/catalog"
import { MAX_ZOOM } from "@/lib/designer-constants"

// TEMPORARY — /view-strip-variants: the desktop bottom row on a canvas-grey
// stage, with a tab bar on top to flip between the views strip's variants
// (components/view-strip-variants.tsx). The zoom and the technique switcher
// are the real ones, there for context; the zoom only counts.

const VARIANTS: { id: ViewStripVariantId; name: string; note: string }[] = [
  { id: "glide", name: "Glide", note: "A grey disc slides to the picked view, overshooting a touch." },
  { id: "pop", name: "Pop", note: "The picked view grows with a bounce; the others rest dimmed." },
  { id: "squircle", name: "Squircle", note: "The picked circle morphs into a soft rounded square." },
  { id: "ring", name: "Ring", note: "A thin black ring draws itself round the picked view." },
  { id: "dot", name: "Dot", note: "A small dot springs along under the views; the picked one lifts." },
]
const ZOOM_STEP = 1

export default function ViewStripVariantsPage() {
  const [product, setProduct] = useState<StaticProduct | null>(null)
  const [variant, setVariant] = useState<ViewStripVariantId>("glide")
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [technique, setTechnique] = useState<"standard" | "embroidery">("standard")

  useEffect(() => {
    loadCatalog()
      .then(c => {
        const p = c.products.find(x => x.id === c.featuredProductId) ?? c.products[0] ?? null
        setProduct(p)
        setActiveViewId(p?.views[0]?.id ?? null)
      })
      .catch(err => console.error("view-strip-variants: catalogue failed to load", err))
  }, [])

  const appearance = product?.appearances[0]
  const views = (product?.views ?? []).map(v => ({
    id: v.id,
    name: v.name,
    image: appearance?.views.find(av => av.id === v.id)?.image ?? "",
    photo: /close-?up|neck label/i.test(v.name),
  }))
  const activeImage = views.find(v => v.id === activeViewId)?.image
  const current = VARIANTS.find(v => v.id === variant)!

  return (
    <main className="flex h-screen flex-col gap-4 bg-white p-4">
      {/* The temporary tab bar. */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1 rounded-full bg-[var(--sprd-neutral-100)] p-1">
          {VARIANTS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariant(v.id)}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                variant === v.id ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-black"
              }`}
            >
              {i + 1}. {v.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-neutral-500">{current.note}</p>
      </div>

      {/* The canvas: desktop canvas grey, the active view's product image. */}
      <div className="relative flex-1 overflow-hidden rounded-[12px] bg-[#F4F4F4]">
        {activeImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage}
            alt=""
            className="absolute inset-0 m-auto max-h-[80%] max-w-[80%] object-contain"
            style={{ scale: zoom }}
          />
        )}
        <div
          className="absolute inset-x-6 bottom-6 grid items-end gap-3"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}
        >
          <div className="justify-self-end">
            <ZoomControl
              zoom={zoom}
              maxZoom={MAX_ZOOM}
              onStep={dir => setZoom(z => Math.min(MAX_ZOOM, Math.max(1, z + dir * ZOOM_STEP)))}
              onChange={setZoom}
              onJump={setZoom}
            />
          </div>
          <div>
            {views.length > 0 && (
              <ViewStripVariant
                key={variant}
                variant={variant}
                views={views}
                activeViewId={activeViewId}
                onSelect={setActiveViewId}
              />
            )}
          </div>
          <div className="justify-self-start">
            <TechniqueSwitcher
              value={technique}
              onChange={setTechnique}
              embroiderySupported={product?.embroidery ?? false}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
