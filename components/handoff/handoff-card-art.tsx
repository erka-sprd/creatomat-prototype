"use client"

/**
 * The index cards' pictures — each handoff's most characteristic change, played
 * on a loop so it reads at a glance, before any of the card's text.
 *
 * Drawings, not replicas: at thumbnail size the real components would only be
 * noise, so these keep just the shapes that carry the idea, in the product's
 * colours: white pills, lightly shadowed, on the card's tinted panel. The
 * numbers are the app's own — the volume-discount tiers, the catalogue's
 * prices, the contact details — never typed in.
 */

import { useEffect, useState } from "react"
import { ChevronDown, Phone } from "lucide-react"
import { buildTiles } from "product-catalog-client"
import { BULK_EMAIL, BULK_ORDER_STRINGS, BULK_PURPLE } from "@/components/bulk-order-note"
import { CONTACT_OPTIONS } from "@/components/help-menu"
import { ZOOM_ICON_PATH } from "@/components/merged-bottom-row"
import { loadCatalog } from "@/lib/catalog"
import {
  discountedPrice,
  majorVolumeDiscountTiersForProduct,
  tileSale,
} from "@/lib/volume-discount"

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
// Front, back and side: the catalogue's first three views.
const STRIP_VIEWS = 3

/** A catalogue product's view shots in one of its colours, front first; empty until loaded, or if the catalogue is out of reach. */
export function useProductViews(id: string, color = CANVAS_PRODUCT_COLOR) {
  const [views, setViews] = useState<string[]>([])
  useEffect(() => {
    let live = true
    loadCatalog()
      .then(catalog => {
        const product = catalog.products.find(p => p.id === id)
        const appearance =
          product?.appearances.find(a => a.name.trim().toLowerCase() === color) ??
          product?.appearances[0]
        if (live && appearance) setViews(appearance.views.map(view => view.image))
      })
      // A picture that can't load leaves the canvas empty, not the page broken.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [id, color])
  return views
}

type Tile = ReturnType<typeof buildTiles>["allTiles"][number]

/** A catalogue product as the product panel tiles it — with its price; null until loaded. */
function useTile(id: string): Tile | null {
  const [tile, setTile] = useState<Tile | null>(null)
  useEffect(() => {
    let live = true
    loadCatalog()
      .then(catalog => {
        const found = buildTiles(catalog.products).allTiles.find(t => t.id === id)
        if (live && found) setTile(found)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [id])
  return tile
}

/** The zoom buttons' glyphs, from the designer's own paths. */
function ZoomGlyph({ d, className }: { d: string; className: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d={d} />
    </svg>
  )
}

/**
 * The scattered controls gather into one row: the upright zoom in the corner
 * lies down beside the views, and print technique arrives on their other side.
 */
export function CanvasRowArt() {
  const views = useProductViews(CANVAS_PRODUCT_ID)
  const [front] = views
  return (
    <div className={ART} aria-hidden="true">
      {front && (
        <img
          src={front}
          alt=""
          draggable={false}
          className="absolute top-2 left-1/2 h-[100px] w-[100px] -translate-x-1/2 object-contain"
        />
      )}
      {/* − and + alone, the gap between them where the percentage sits. */}
      <div className={`${PILL} ho-art-zoom left-[31px] w-11 justify-between px-1.5`}>
        {[ZOOM_ICON_PATH.minus, ZOOM_ICON_PATH.plus].map(d => (
          <ZoomGlyph key={d} d={d} className="size-2.5 text-black" />
        ))}
      </div>
      <div className={`${PILL} left-[81px] w-16 justify-center gap-0.5`}>
        {views.slice(0, STRIP_VIEWS).map(src => (
          <img key={src} src={src} alt="" draggable={false} className="size-4 object-contain" />
        ))}
      </div>
      <div className={`${PILL} ho-art-technique left-[151px] w-[58px] justify-center gap-1 px-2`}>
        <img src="/icons/icon-droplet.svg" alt="" draggable={false} className="size-2.5 shrink-0" />
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

/* --------------------------------------------- contact-customer-service */

/**
 * The Contact pill in the canvas corner, its menu dropping open under it —
 * the phone option and the bulk-order panel — and closing again.
 */
export function ContactArt() {
  const [option] = CONTACT_OPTIONS
  return (
    <div className={ART} aria-hidden="true">
      {/* The pill, as help-menu.tsx draws it: the phone and a chevron that flips. */}
      <div className="absolute top-3 right-4 flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-neutral-700 shadow-xs">
        <Phone className="size-3" strokeWidth={1.8} />
        <ChevronDown className="ho-art-chev size-2.5" strokeWidth={2} />
      </div>
      <div className="ho-art-menu absolute top-[46px] right-4 w-[132px] origin-top-right rounded-[8px] bg-white p-1 shadow-lg">
        <div className="flex items-start gap-1.5 px-2 py-1.5">
          <option.Icon className="mt-px size-2.5 shrink-0 text-neutral-700" />
          <span className="flex flex-col leading-tight">
            <span className="text-[8px] text-black">{option.label}</span>
            <span className="text-[6.5px] text-neutral-500">{option.sub}</span>
          </span>
        </div>
        {/* The bulk-order panel: its purple, its headline, the address field. */}
        <div
          className="mt-0.5 flex flex-col gap-1 rounded-[5px] px-2 py-2"
          style={{ backgroundColor: `color-mix(in oklab, ${BULK_PURPLE} 30%, transparent)` }}
        >
          <span className="font-display text-[7.5px] leading-tight font-medium text-black">
            {BULK_ORDER_STRINGS.headline}
          </span>
          <div
            className="flex items-center justify-between gap-1 rounded-[4px] px-1.5 py-1 text-[6.5px] text-black"
            style={{ backgroundColor: `color-mix(in oklab, ${BULK_PURPLE} 18%, white)` }}
          >
            <span className="underline">{BULK_EMAIL}</span>
            <span className="font-bold">{BULK_ORDER_STRINGS.copy}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ zoom-slider */

// The designer's default product again, in another of its catalogue colours.
export const ZOOM_PRODUCT_COLOR = "light blue"

/**
 * The zoom dock's handle stepping up its track and back, the product growing
 * and shrinking with it — eased, never snapped.
 */
export function ZoomArt() {
  const [front] = useProductViews(CANVAS_PRODUCT_ID, ZOOM_PRODUCT_COLOR)
  return (
    <div className={ART} aria-hidden="true">
      {front && (
        <img
          src={front}
          alt=""
          draggable={false}
          className="ho-art-zoom-shirt absolute top-1/2 left-1/2 h-[100px] w-[100px] -translate-x-1/2 -translate-y-1/2 object-contain"
        />
      )}
      {/* The dock, bottom-left as the designer parks it: plus, the wedge
          track with its handle, minus. */}
      <div className="absolute bottom-3 left-4 flex w-6 flex-col items-center gap-0.5 rounded-full bg-white py-1.5 text-black shadow-xs">
        <ZoomGlyph d={ZOOM_ICON_PATH.plus} className="ho-art-zoom-plus size-3 rounded-full" />
        <div className="relative flex h-11 w-2 items-center justify-center">
          <svg viewBox="0 0 7 44" className="absolute h-11 w-[7px]">
            <path d="M3.5 44 L0 3.5 A3.5 3.5 0 0 1 7 3.5 Z" fill="#DEDEDE" />
          </svg>
          <span className="ho-art-zoom-thumb absolute bottom-0 left-1/2 box-content size-2 -translate-x-1/2 rounded-full border-[1.5px] border-black bg-white" />
        </div>
        <ZoomGlyph d={ZOOM_ICON_PATH.minus} className="ho-art-zoom-minus size-3 rounded-full" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------- price-calculator */

// Each quantity holds this long; the first part of it the price is updating.
const PRICE_STEP_MS = 1500
const PRICE_LOADING_MS = 500
const eur = (n: number) => n.toFixed(2).replace(".", ",") + " €"

/**
 * The quantity stepping through the product's discount tiers; at each, the
 * tile's price skeletons while it updates, then lands in red with the
 * discount and the original struck.
 */
export function PriceCalcArt() {
  const reduced = useReducedMotion()
  const tile = useTile(CANVAS_PRODUCT_ID)
  const steps = [1, ...majorVolumeDiscountTiersForProduct(CANVAS_PRODUCT_ID).map(t => t.from)]
  const [i, setI] = useState(0)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (reduced) return setI(steps.length - 1)
    const timers: number[] = []
    const cycle = () => {
      steps.forEach((_, n) => {
        timers.push(
          window.setTimeout(() => {
            setI(n)
            setLoading(n > 0)
          }, n * PRICE_STEP_MS)
        )
        if (n > 0) {
          timers.push(
            window.setTimeout(() => setLoading(false), n * PRICE_STEP_MS + PRICE_LOADING_MS)
          )
        }
      })
      // A beat on the top tier before starting over.
      timers.push(window.setTimeout(cycle, (steps.length + 0.5) * PRICE_STEP_MS))
    }
    cycle()
    return () => timers.forEach(clearTimeout)
  }, [reduced, steps.length])

  const quantity = steps[Math.min(i, steps.length - 1)]
  const sale = tileSale(CANVAS_PRODUCT_ID, quantity)
  const pct = sale?.pct ?? 0

  return (
    <div className={`${ART} flex flex-col items-center justify-center gap-3`} aria-hidden="true">
      {/* The quantity field: minus, the number, plus. */}
      <div className="flex h-8 w-[140px] items-stretch border border-neutral-200 bg-white text-black shadow-xs">
        <span className="flex w-9 items-center justify-center border-r border-neutral-200">
          <ZoomGlyph d={ZOOM_ICON_PATH.minus} className="size-3" />
        </span>
        <span
          key={quantity}
          className="ho-art-tick flex flex-1 items-center justify-center text-[12px] font-bold tabular-nums"
        >
          {quantity}
        </span>
        <span className="flex w-9 items-center justify-center border-l border-neutral-200">
          <ZoomGlyph d={ZOOM_ICON_PATH.plus} className="size-3" />
        </span>
      </div>
      {/* The tile's price row and caption, as product-tile.tsx draws them —
          or their skeleton while the price updates. */}
      <div className="h-9 w-[140px] text-[11px] leading-tight text-black">
        {!tile ? null : loading ? (
          <>
            <div className="flex h-4 items-center">
              <div className="h-2.5 w-16 animate-pulse rounded bg-neutral-200" />
            </div>
            <div className="flex h-3.5 items-center">
              <div className="h-2 w-28 animate-pulse rounded bg-neutral-200" />
            </div>
          </>
        ) : (
          <>
            <p key={quantity} className="ho-art-tick m-0">
              <span className={`font-medium ${pct ? "text-red-600" : ""}`}>from </span>
              <span className={`font-bold ${pct ? "text-red-600" : ""}`}>
                {pct ? eur(discountedPrice(tile.priceValue, pct)) : tile.price}
              </span>
              {pct > 0 && (
                <span className="ml-1.5 font-medium text-neutral-700 line-through">{tile.price}</span>
              )}
            </p>
            {sale && <p className="m-0 text-[8px] text-neutral-600">{sale.caption}</p>}
          </>
        )}
      </div>
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
