"use client"

/**
 * The index cards' pictures — each handoff's most characteristic change, played
 * on a loop so it reads at a glance, before any of the card's text.
 *
 * Drawings, not replicas: at thumbnail size the real components would only be
 * noise, so these keep just the shapes that carry the idea, in the product's
 * colours: white pills, lightly shadowed, on the card's tinted panel. The bulk
 * card's numbers are the
 * app's own volume-discount tiers, never typed in.
 */

import { useEffect, useState } from "react"
import { loadCatalog } from "@/lib/catalog"
import { majorVolumeDiscountTiersForProduct } from "@/lib/volume-discount"

const ART = "relative h-[150px] w-full overflow-hidden"

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])
  return reduced
}

/* ------------------------------------------------------- canvas-bottom-row */

const PILL = "absolute bottom-3 flex h-5 items-center rounded-full bg-white shadow-xs"
// The designer's default product, in one of its catalogue colours.
const CANVAS_PRODUCT_ID = "812"
const CANVAS_PRODUCT_COLOR = "mauve"

/** A catalogue product's front shot in CANVAS_PRODUCT_COLOR; null until loaded, or if the catalogue is out of reach. */
function useProductImage(id: string) {
  const [image, setImage] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    loadCatalog()
      .then(catalog => {
        const product = catalog.products.find(p => p.id === id)
        const appearance =
          product?.appearances.find(a => a.name.trim().toLowerCase() === CANVAS_PRODUCT_COLOR) ??
          product?.appearances[0]
        const src = appearance?.views[0]?.image
        if (live && src) setImage(src)
      })
      // A picture that can't load leaves the canvas empty, not the page broken.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [id])
  return image
}

/**
 * The scattered controls gather into one row: the upright zoom in the corner
 * lies down beside the views, and print technique arrives on their other side.
 */
export function CanvasRowArt() {
  const image = useProductImage(CANVAS_PRODUCT_ID)
  return (
    <div className={ART} aria-hidden="true">
      {image && (
        <img
          src={image}
          alt=""
          draggable={false}
          className="absolute top-2 left-1/2 h-[100px] w-[100px] -translate-x-1/2 object-contain"
        />
      )}
      {/* − and + alone, the gap between them where the percentage sits. */}
      <div className={`${PILL} ho-art-zoom left-[31px] w-11 justify-between px-1.5`}>
        <span className="h-px w-2 bg-neutral-800" />
        <span className="relative h-2 w-2">
          <span className="absolute top-1/2 left-0 h-px w-2 bg-neutral-800" />
          <span className="absolute top-0 left-1/2 h-2 w-px bg-neutral-800" />
        </span>
      </div>
      <div className={`${PILL} left-[81px] w-16 justify-center gap-1`}>
        <span className="size-3.5 rounded-full border border-black bg-neutral-50" />
        <span className="size-3.5 rounded-full bg-neutral-200" />
        <span className="size-3.5 rounded-full bg-neutral-200" />
      </div>
      <div className={`${PILL} ho-art-technique left-[151px] w-[58px] justify-center gap-1 px-2`}>
        <svg viewBox="0 0 10 12" className="h-2.5 w-2 shrink-0">
          <path d="M5 1 C7 4 9 6 9 8 A4 4 0 0 1 1 8 C1 6 3 4 5 1 Z" fill="#111" />
        </svg>
        <span className="text-[9px] leading-none font-semibold text-black">Print</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- curve-text */

const FLAT = "M30 98 Q120 98 210 98"
const ARC = "M30 108 Q120 18 210 108"
const CURVE_FONT = "Lobster Two"
// Indigo (Tailwind's indigo-600), apart from the canvas card's mauve shirt.
const CURVE_COLOR = "#4F46E5"

/** A line of text bending up along its baseline, and settling back flat. */
export function CurveTextArt() {
  const reduced = useReducedMotion()
  return (
    <div className={ART} aria-hidden="true">
      {/* The designer loads its fonts with the editor; the index has to ask. */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${CURVE_FONT.replace(" ", "+")}:wght@700&display=swap`}
        precedence="default"
      />
      <svg viewBox="0 0 240 150" className="size-full">
        <path id="ho-art-curve" d={reduced ? ARC : FLAT} fill="none">
          {!reduced && (
            <animate
              attributeName="d"
              dur="4.5s"
              repeatCount="indefinite"
              values={`${FLAT};${FLAT};${ARC};${ARC};${FLAT}`}
              keyTimes="0;0.18;0.42;0.78;1"
              calcMode="spline"
              keySplines="0 0 1 1;0.45 0 0.2 1;0 0 1 1;0.45 0 0.2 1"
            />
          )}
        </path>
        <use href="#ho-art-curve" stroke="#3355FF" strokeDasharray="3 4" strokeWidth="1" />
        <text
          fill={CURVE_COLOR}
          fontFamily={`"${CURVE_FONT}", cursive`}
          fontSize="30"
          fontWeight="700"
          textAnchor="middle"
        >
          <textPath href="#ho-art-curve" startOffset="50%">
            Curve text
          </textPath>
        </text>
      </svg>
    </div>
  )
}

/* --------------------------------------------------- bulk-purchase-rework */

// The designer's default product, the Men's Premium Organic T-Shirt.
const BULK_PRODUCT_ID = "812"
const BULK_STEP_MS = 1400

/**
 * The quantity climbing through the product's discount tiers, the discount
 * growing with it — one segment of the bar per tier.
 */
export function BulkDiscountArt() {
  const reduced = useReducedMotion()
  const tiers = majorVolumeDiscountTiersForProduct(BULK_PRODUCT_ID)
  const steps = [{ from: 1, percentage: 0 }, ...tiers]
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduced) return setI(steps.length - 1)
    // One extra beat on the top tier before starting over.
    const id = window.setInterval(() => setI(n => (n + 1) % (steps.length + 1)), BULK_STEP_MS)
    return () => window.clearInterval(id)
  }, [reduced, steps.length])
  const step = steps[Math.min(i, steps.length - 1)]
  const reached = Math.min(i, steps.length - 1)

  return (
    <div className={`${ART} flex flex-col justify-center gap-3 px-4`} aria-hidden="true">
      {/* The button 6px in from the pill on top, right and bottom alike. */}
      <div className="flex items-center justify-between gap-2 rounded-full bg-white p-1.5 pl-4 shadow-xs">
        <span
          key={step.from}
          className="ho-art-tick w-[80px] shrink-0 text-sm font-semibold whitespace-nowrap text-black tabular-nums"
        >
          {step.from}+ items
        </span>
        <span className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-white">
          Add to basket
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {tiers.map((t, n) => (
            <span
              key={t.from}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                n < reached ? "bg-[#DC2626]" : "bg-neutral-300"
              }`}
            />
          ))}
        </div>
        <span
          key={step.percentage}
          className={`ho-art-tick w-[74px] shrink-0 text-right whitespace-nowrap text-sm font-bold tabular-nums ${
            step.percentage ? "text-[#DC2626]" : "text-neutral-400"
          }`}
        >
          {step.percentage ? `−${step.percentage}% off` : "full price"}
        </span>
      </div>
    </div>
  )
}
