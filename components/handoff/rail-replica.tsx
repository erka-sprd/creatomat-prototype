"use client"

/**
 * Live pieces of the designer's right rail, for the handoff pages.
 *
 * These are not drawings of the rail — the markup, the class names and the
 * glyphs are lifted verbatim out of components/designer.tsx, the product comes
 * from the real catalogue, and the money is computed by the app's own pricing
 * code (lib/print-area-pricing.ts, lib/volume-discount.ts). If a token moves in
 * the product, it moves here too, and the spec goes stale visibly rather than
 * silently.
 *
 * What is faked, and only this: the selection state (nothing is really in a
 * basket) and latte's sold-out sizes — the deployed catalogue has not published
 * them yet, so §3's example is stated here rather than read.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react"
import * as Popover from "@radix-ui/react-popover"
import { DiscountIcon } from "@/components/kit-icons"
import KitSwitch from "@/components/kit-switch"
import VolumeDiscountPopoverContent from "@/components/volume-discount-popover-content"
import QuantityStepper from "@/components/quantity-stepper"
import { ScopedDialog } from "@/components/ui/scoped-dialog"
import { IMAGE_SERVER_BASE, loadCatalog } from "@/lib/catalog"
import { formatDeliveryWindow } from "@/lib/delivery"
import { printAreaCosts, printAreaTotal } from "@/lib/print-area-pricing"
import {
  SIZE_MEASURE_LABELS,
  formatMeasure,
  sizeMeasure,
  sizeMeasureColumns,
  type SizeEntry,
} from "@/lib/size-guide"
import {
  discountedPrice,
  majorVolumeDiscountTiersForProduct,
  nextVolumeDiscountTier,
  volumeDiscountPercentage,
} from "@/lib/volume-discount"

/** The blur the rail's own dropdowns cast on everything behind them. */
const BLUR_PX = 6

/** The polo the whole handoff is shown on, and the colour with modelled stock. */
export const POLO_ID = "2116"
export const LATTE_ID = "1224"
/** Latte's gone sizes — see the note above. */
export const LATTE_OUT_OF_STOCK = ["XL", "XXL", "3XL"]

const formatEUR = (n: number) => n.toFixed(2).replace(".", ",")

/* ------------------------------------------------------------------- data */

type Appearance = { id: string; name: string; color: string; image?: string }
type Polo = {
  id: string
  name: string
  price: number
  sizes: string[]
  appearances: Appearance[]
  latte?: Appearance
  /** Print-area ids in billing order — the front one is decorated in the demo. */
  printAreaIds: string[]
  /** Published body measurements, for the sheet's size-guide panel. */
  sizeGuide: SizeEntry[]
}

// Enough of the catalogue to render before (or without) the fetch: the page is
// a document and must never show a broken rail because a catalogue host is
// unreachable. Real images replace the flat colours as soon as they land.
const FALLBACK: Polo = {
  id: POLO_ID,
  name: "Stanley/Stella Unisex Organic Polo Shirt PREPSTER",
  price: 29.99,
  sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  printAreaIds: ["6322"],
  sizeGuide: [],
  appearances: [
    { id: "655", name: "heather white", color: "#EBEBEB" },
    { id: "741", name: "burgundy", color: "#761F32" },
    { id: "742", name: "anthracite", color: "#5F5F5F" },
    { id: "947", name: "soft Ecru", color: "#EFE9D7" },
    { id: "950", name: "majorelle blue", color: "#254E98" },
    { id: "1188", name: "khaki", color: "#635840" },
    { id: "1189", name: "stargazer", color: "#48646B" },
    { id: "1224", name: "latte", color: "#A1764B" },
    { id: "1485", name: "glazed green", color: "#13413E" },
    { id: "1486", name: "bubble pink", color: "#DE8AAC" },
    { id: "1", name: "white", color: "#FFFFFF" },
    { id: "2", name: "black", color: "#000000" },
    { id: "196", name: "red", color: "#D41C28" },
    { id: "348", name: "navy", color: "#353D56" },
    { id: "231", name: "heather grey", color: "#BEBEBE" },
    { id: "63", name: "sky blue", color: "#BAD0E4" },
  ],
}

/** The real product from the catalogue, falling back to the sketch above. */
export function useProduct(id: string = POLO_ID): Polo {
  const [polo, setPolo] = useState<Polo>(FALLBACK)
  useEffect(() => {
    let live = true
    loadCatalog()
      .then(catalog => {
        const p = catalog.products.find(x => x.id === id)
        if (!p || !live) return
        const appearances: Appearance[] = p.appearances.map(a => ({
          id: a.id,
          name: a.name,
          color: a.color,
          image: a.image ?? undefined,
        }))
        setPolo({
          id: p.id,
          name: p.name,
          price: p.price,
          sizes: p.sizes ?? FALLBACK.sizes,
          appearances,
          latte: appearances.find(a => a.id === LATTE_ID),
          printAreaIds: (p.printAreas ?? []).map(a => a.id).slice(0, 1),
          sizeGuide: p.sizeGuide ?? [],
        })
      })
      // A document should degrade, not break: the fallback stays on screen.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [id])
  return polo
}

/** The polo the document is mostly shown on. */
export const usePolo = () => useProduct(POLO_ID)

/**
 * The example order the money sections are shown on. Every figure is derived,
 * never typed in. `decorated` is what separates the two states the rail has:
 * a blank product is billed at its base price alone — print areas only cost
 * once something is on them.
 */
export function useExamplePrice(
  polo: Polo,
  quantity: number,
  decorated = true,
  areaIds?: string[],
  designCost = 0
) {
  return useMemo(() => {
    const ids = decorated ? (areaIds ?? polo.printAreaIds) : []
    const areas = printAreaCosts(ids, "standard")
    const unit = polo.price + printAreaTotal(ids, "standard") + designCost
    const original = unit * Math.max(1, quantity)
    const percent = volumeDiscountPercentage(quantity, POLO_ID)
    return {
      areas,
      unit,
      unitDiscounted: discountedPrice(unit, percent),
      original,
      total: discountedPrice(original, percent),
      percent,
      designCost,
    }
  }, [polo, quantity, decorated, areaIds, designCost])
}

/** Both print areas, for the demos that price a front-and-back job. */
export const BOTH_PRINT_AREAS = ["6322", "6323"]
/**
 * Illustrative. The prototype prices no designs — this row is the proposal §5
 * compares against create-omat, not something the code can be asked for.
 */
export const EXCLUSIVE_DESIGN_PRICE = 3.99
/** Stand-in artwork for the paid-design row. */
export const DESIGN_THUMBNAIL = "/images/example-graphic.png"

/* ------------------------------------------------------------------ glyphs */

/** Ruler — the same glyph the size sheet's guide toggle uses. */
export const RulerIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
    aria-hidden="true"
  >
    <path
      d="M19 3C20.0543 3 20.9177 3.81581 20.9941 4.85059L21 5V10C21 11.0543 20.1842 11.9177 19.1494 11.9941L19 12H12V19C12 20.0543 11.1842 20.9177 10.1494 20.9941L10 21H5C3.9457 21 3.0823 20.1842 3.00586 19.1494L3 19V5C3 3.9457 3.81581 3.08229 4.85059 3.00586L5 3H19ZM5 7H6C6.55228 7 7 7.44772 7 8C7 8.51284 6.61355 8.9354 6.11621 8.99316L6 9H5V11H7C7.55228 11 8 11.4477 8 12C8 12.5128 7.61355 12.9354 7.11621 12.9932L7 13H5V15H6C6.55228 15 7 15.4477 7 16C7 16.5128 6.61355 16.9354 6.11621 16.9932L6 17H5V19H10V12C10 10.9457 10.8158 10.0823 11.8506 10.0059L12 10H19V5H17V6C17 6.55228 16.5523 7 16 7C15.4872 7 15.0646 6.61355 15.0068 6.11621L15 6V5H13V7C13 7.55228 12.5523 8 12 8C11.4872 8 11.0646 7.61355 11.0068 7.11621L11 7V5H9V6C9 6.55228 8.55228 7 8 7C7.48716 7 7.0646 6.61355 7.00684 6.11621L7 6V5H5V7Z"
      fill="currentColor"
    />
  </svg>
)

/** Shopping Cart Plus — the basket CTA's glyph. */
export const CartPlusIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
    aria-hidden="true"
  >
    <path
      d="M6 2C6.51284 2 6.9354 2.38645 6.99316 2.88379L7 3V4.06836L12.0762 4.43164C12.6269 4.47101 13.0421 4.94927 13.0029 5.5C12.9664 6.01143 12.5509 6.40544 12.0508 6.42773L11.9336 6.42676L7 6.07324V12H18.1328L18.1533 11.8604C18.2261 11.3527 18.6684 10.9886 19.1689 11.002L19.2852 11.0117C19.7926 11.0846 20.1559 11.527 20.1426 12.0273L20.1328 12.1436L19.9902 13.1416C19.9251 13.5962 19.5602 13.9425 19.1133 13.9932L19 14H7V16H17C18.6569 16 20 17.3431 20 19C20 20.6569 18.6569 22 17 22C15.3431 22 14 20.6569 14 19C14 18.649 14.0631 18.3131 14.1738 18H8.82617C8.93694 18.3131 9 18.649 9 19C9 20.6569 7.65685 22 6 22C4.34315 22 3 20.6569 3 19C3 17.6941 3.83532 16.5859 5 16.1738V4H4C3.48716 4 3.0646 3.61355 3.00684 3.11621L3 3C3 2.48716 3.38645 2.0646 3.88379 2.00684L4 2H6ZM6 18C5.44772 18 5 18.4477 5 19C5 19.5523 5.44772 20 6 20C6.55228 20 7 19.5523 7 19C7 18.4477 6.55228 18 6 18ZM17 18C16.4477 18 16 18.4477 16 19C16 19.5523 16.4477 20 17 20C17.5523 20 18 19.5523 18 19C18 18.4477 17.5523 18 17 18ZM18 2C18.5128 2 18.9354 2.38645 18.9932 2.88379L19 3V5H21C21.5523 5 22 5.44772 22 6C22 6.51284 21.6135 6.9354 21.1162 6.99316L21 7H19V9C19 9.55228 18.5523 10 18 10C17.4872 10 17.0646 9.61355 17.0068 9.11621L17 9V7H15C14.4477 7 14 6.55228 14 6C14 5.48716 14.3865 5.0646 14.8838 5.00684L15 5H17V3C17 2.44772 17.4477 2 18 2Z"
      fill="currentColor"
    />
  </svg>
)

/** Kit v2 Chevron, on the price-details chip. */
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`transition-[rotate] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      open ? "rotate-180" : ""
    }`}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.29289 8.29289C5.65338 7.93241 6.22061 7.90468 6.6129 8.2097L6.70711 8.29289L12 13.585L17.2929 8.29289C17.6534 7.93241 18.2206 7.90468 18.6129 8.2097L18.7071 8.29289C19.0676 8.65338 19.0953 9.22061 18.7903 9.6129L18.7071 9.70711L12.7071 15.7071C12.3466 16.0676 11.7794 16.0953 11.3871 15.7903L11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
      fill="currentColor"
    />
  </svg>
)

/* ------------------------------------------------------------------ pieces */

/** The rail's own ground: #F4F4F4, 12px radius, 24px inset. */
export function RailFrame({
  children,
  className = "",
  padding = "p-[24px]",
  style,
  ref,
}: {
  children: ReactNode
  className?: string
  padding?: string
  style?: CSSProperties
  /** Hand this to PriceRow so the breakdown collides with the rail, as it does in the product. */
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <div ref={ref} style={style} className={`rounded-[12px] bg-[#F4F4F4] ${padding} ${className}`}>
      {children}
    </div>
  )
}

/**
 * §1 — one line, faded at the edge, sliding on hover. Overflow is measured
 * exactly as the designer measures it, including the re-measure once MADE Outer
 * Sans is in (it is wider than the fallback, so first paint lies).
 */
export function RailTitle({ name }: { name: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  const [overflowPx, setOverflowPx] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setOverflowPx(Math.max(0, el.scrollWidth - el.clientWidth))
    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [name])

  return (
    <h1
      ref={ref}
      className="group/title font-display relative mb-[8px] min-w-0 overflow-hidden text-[20px] leading-tight font-[800] whitespace-nowrap text-black"
      style={
        {
          "--title-shift": `-${overflowPx}px`,
          "--title-slide": `${Math.max(300, overflowPx * 12)}ms`,
        } as CSSProperties
      }
    >
      <span className="inline-block transition-[translate] duration-[var(--title-slide)] ease-in-out group-hover/title:translate-x-[var(--title-shift)]">
        {name}
      </span>
      {overflowPx > 0 && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[48px] bg-gradient-to-r from-[#F4F4F4] to-transparent opacity-0 transition-opacity duration-[450ms] ease-out [transition-delay:var(--title-slide)] group-hover/title:opacity-100 group-hover/title:[transition-delay:0ms]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-[48px] bg-gradient-to-l from-[#F4F4F4] to-transparent opacity-100 transition-opacity duration-[450ms] ease-out [transition-delay:0ms] group-hover/title:opacity-0 group-hover/title:[transition-delay:var(--title-slide)]"
          />
        </>
      )}
    </h1>
  )
}

/**
 * §1 — the same title, played back instead of hovered: a pointer arrives, the
 * name slides to its end, holds, the pointer leaves, the name returns. Timing
 * and distance come from handoff.css, driven by the measured overflow, so the
 * loop lands exactly where a real hover would.
 */
export function TitleSlideDemo() {
  const polo = usePolo()
  const ref = useRef<HTMLHeadingElement>(null)
  const [overflowPx, setOverflowPx] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setOverflowPx(Math.max(0, el.scrollWidth - el.clientWidth))
    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [polo.name])

  return (
    <div className="relative shrink-0" style={{ width: RAIL_WIDTH_PX }}>
      <RailFrame>
        <h1
          ref={ref}
          className="ho-title-demo font-display relative min-w-0 overflow-hidden text-[20px] leading-tight font-[800] whitespace-nowrap text-black"
          style={{ "--ho-title-shift": `-${overflowPx}px` } as CSSProperties}
        >
          <span className="ho-slide inline-block">{polo.name}</span>
          {overflowPx > 0 && (
            <>
              <span
                aria-hidden
                className="ho-fade-l pointer-events-none absolute inset-y-0 left-0 w-[48px] bg-gradient-to-r from-[#F4F4F4] to-transparent opacity-0"
              />
              <span
                aria-hidden
                className="ho-fade-r pointer-events-none absolute inset-y-0 right-0 w-[48px] bg-gradient-to-l from-[#F4F4F4] to-transparent"
              />
            </>
          )}
        </h1>
      </RailFrame>
      {/* Stand-in pointer: it only ever rests on the name — the name is what
          moves, exactly as it does under a real one. The arrow, not the hand:
          the title reacts to hover, it is not something you click. */}
      <span
        aria-hidden
        className="ho-title-cursor pointer-events-none absolute top-[24px] left-[62%] block"
      >
        <CursorArrow />
      </span>
    </div>
  )
}

/** §2 — the details link, ruler glyph and all. */
export function DetailsLink() {
  return (
    <span className="inline-flex cursor-default items-center gap-2 text-[14px] text-black outline-none">
      <RulerIcon />
      <span className="underline underline-offset-4">See product details</span>
    </span>
  )
}

/** §3 — colour name, sold-out sizes behind a middot, tooltip above. */
export function ColorRow({
  color,
  sizes,
  gone,
  pinned = false,
  className = "mt-6 mb-[12px]",
}: {
  color: string
  sizes: string[]
  gone: string[]
  /**
   * Hold the tooltip open — the spec needs it legible without a hover. Doing so
   * also parks a cursor on the list, since a still tooltip otherwise reads as
   * something that is simply always there.
   */
  pinned?: boolean
  className?: string
}) {
  const available = sizes.filter(size => !gone.includes(size))
  return (
    <div className={`flex w-full items-baseline ${className}`}>
      <span className="shrink-0 text-left text-[12px] font-bold tracking-[0.08em] whitespace-nowrap text-[#6A6A6A] uppercase">
        COLOR: <span className="text-[#000000]">{color.toUpperCase()}</span>
      </span>
      <span
        className={`group/oos relative flex min-w-0 items-baseline text-[14px] font-medium text-[var(--sprd-neutral-700)] ${
          gone.length > 0 ? "" : "invisible"
        }`}
      >
        <span aria-hidden className="mx-4 shrink-0 text-[16px]">
          ·
        </span>
        <span className="min-w-0 truncate">
          {gone.map((size, i) => (
            <span key={size}>
              {i > 0 ? ", " : ""}
              <span className="line-through">{size}</span>
            </span>
          ))}
        </span>
        <span
          className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 flex-col gap-1 rounded-md bg-neutral-900 p-3 text-sm whitespace-nowrap text-neutral-100 shadow-sm transition-opacity after:absolute after:top-full after:left-1/2 after:h-0 after:w-0 after:-translate-x-1/2 after:border-x-[4px] after:border-x-transparent after:border-t-[4px] after:border-t-neutral-900 after:content-[''] ${
            pinned ? "opacity-100" : "opacity-0 group-hover/oos:opacity-100"
          }`}
        >
          <span>{gone.join(", ")} out of stock</span>
          {available.length > 0 && (
            <span className="text-[12px] text-[var(--sprd-green-300)]">
              {available.join(", ")} available
            </span>
          )}
        </span>
        {/* Tip on the struck sizes themselves. The list sits at cursor:default
            in the rail — arrow, not hand. */}
        {pinned && <ParkedCursor className="top-[11px] left-[64%]" />}
      </span>
    </div>
  )
}

/** The colour swatches, on the catalogue's own product renders. */
export function Swatches({
  appearances,
  selectedId,
  onSelect,
}: {
  appearances: Appearance[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-8 gap-[6px]">
      {appearances.map(a => {
        const on = a.id === selectedId
        return (
          <button
            key={a.id}
            type="button"
            title={a.name}
            aria-label={a.name + (on ? ", selected" : "")}
            onClick={() => onSelect(a.id)}
            className={
              "relative box-border flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-[8px] border p-[6px] select-none " +
              (on
                ? "border-black bg-white"
                : "border-transparent bg-transparent hover:bg-[#E9E9E9]")
            }
          >
            {a.image ? (
              <img src={a.image} alt="" className="block max-h-full max-w-full object-contain" />
            ) : (
              // No catalogue reachable — the colour itself still reads.
              <span
                className="block size-7 rounded-full border border-black/10"
                style={{ background: a.color }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

/** §5 — the money band: discount link left, price (and its breakdown) right. */
export function PriceRow({
  polo,
  quantity,
  interactive = true,
  decorated = true,
  areaIds,
  designCost = 0,
  detailsOpen,
  onDiscountClick,
  highlightDiscount = false,
  boundaryRef,
}: {
  polo: Polo
  /** 0 = nothing chosen yet, so the figure is the per-item price. */
  quantity: number
  interactive?: boolean
  /** False for the blank product: base price only, no print area billed. */
  decorated?: boolean
  areaIds?: string[]
  designCost?: number
  /** Hold the breakdown open, for a section that is about the breakdown. */
  detailsOpen?: boolean
  /** Makes the red link a working trigger instead of a still. */
  onDiscountClick?: () => void
  /** Blink the link, for a section that wants it clicked. */
  highlightDiscount?: boolean
  /** The rail. Read at open time, when the element exists. */
  boundaryRef?: RefObject<HTMLDivElement | null>
}) {
  const [ownOpen, setOwnOpen] = useState(false)
  const open = detailsOpen ?? ownOpen
  const setOpen = detailsOpen === undefined ? setOwnOpen : () => {}
  const money = useExamplePrice(polo, quantity, decorated, areaIds, designCost)
  const figure = quantity > 0 ? money.total : money.unitDiscounted

  return (
    <div className="flex items-end justify-between gap-3">
      {onDiscountClick ? (
        <button
          type="button"
          onClick={onDiscountClick}
          className={`flex min-w-0 cursor-pointer items-center gap-2 text-left text-[14px] text-red-600 outline-none ${
            highlightDiscount ? "ho-blink" : ""
          }`}
        >
          <DiscountIcon className="size-5 shrink-0" />
          <span className="font-medium underline">Calculate volume discount</span>
        </button>
      ) : (
        <span className="flex min-w-0 cursor-default items-center gap-2 text-left text-[14px] text-red-600 outline-none">
          <DiscountIcon className="size-5 shrink-0" />
          <span className="font-medium underline">Calculate volume discount</span>
        </span>
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div className="relative flex shrink-0 flex-col items-end gap-0.5">
            {quantity > 0 && (
              <span className="text-[12px] leading-none font-semibold text-[var(--sprd-neutral-700)] uppercase">
                Total
              </span>
            )}
            <div className="flex items-center gap-2">
              {interactive && (
                <span className="relative flex">
                  <Popover.Trigger asChild>
                    <button
                      type="button"
                      aria-label="See price details"
                      className="flex cursor-pointer items-center justify-center rounded-full bg-neutral-200 p-1 text-black outline-none"
                    >
                      <ChevronIcon open={open} />
                    </button>
                  </Popover.Trigger>
                  {/* Held open for a spec, so the click that opened it is drawn
                      in. The chip is a button at cursor:pointer — the hand. */}
                  {detailsOpen && <ParkedCursor hand className="top-1/2 left-1/2" />}
                </span>
              )}
              <span
                className={`text-[24px] leading-7 font-medium ${
                  money.percent > 0 ? "text-[#DC2626]" : "text-black"
                }`}
              >
                {formatEUR(figure)} €
              </span>
            </div>
            {/* Pinned open for a spec, the breakdown is drawn in place rather
                than portalled. Radix positions a popper with JS on every scroll
                frame, which reads as the panel juddering against the page as it
                moves; a panel positioned inside the rail scrolls with it
                natively and cannot drift. Width mirrors the popover's own cap —
                452px, capped again by the rail's 422px content box, which
                clips. */}
            {detailsOpen !== undefined ? (
              <div className="absolute right-0 bottom-full z-40 mb-2 flex max-h-[460px] w-[452px] max-w-[422px] flex-col overflow-hidden rounded-2xl bg-white pt-6 shadow-lg">
                <PriceDetails
                  polo={polo}
                  quantity={quantity}
                  decorated={decorated}
                  areaIds={areaIds}
                  designCost={designCost}
                />
              </div>
            ) : null}
          </div>
        </Popover.Anchor>
        {/* Only when it is not already drawn in place above — otherwise both
            panels mount, and the portalled one chases the scroll. */}
        {detailsOpen === undefined && (
          <Popover.Portal>
            <Popover.Content
              side="top"
              align="end"
              sideOffset={8}
              collisionPadding={12}
              collisionBoundary={boundaryRef?.current ? [boundaryRef.current] : undefined}
              className="z-[9999] flex max-h-[460px] w-[452px] max-w-[var(--radix-popper-available-width)] flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 pt-6 shadow-lg outline-none"
            >
              <PriceDetails
                polo={polo}
                quantity={quantity}
                decorated={decorated}
                areaIds={areaIds}
                designCost={designCost}
              />
            </Popover.Content>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  )
}

/** The breakdown itself — the designer's priceDetailsContent, same rows. */
export function PriceDetails({
  polo,
  quantity,
  decorated = true,
  areaIds,
  designCost = 0,
}: {
  polo: Polo
  quantity: number
  decorated?: boolean
  /** Override which print areas are billed — both, for a front-and-back job. */
  areaIds?: string[]
  /** A paid design earns a row; free ones no longer do. 0 renders nothing. */
  designCost?: number
}) {
  const money = useExamplePrice(polo, quantity, decorated, areaIds, designCost)
  const thumb = polo.latte?.image
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-neutral-200">
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {thumb && (
                  <span className="shrink-0 rounded-sm bg-[var(--sprd-neutral-100)] p-1">
                    <img src={thumb} alt="" className="w-9 object-contain" />
                  </span>
                )}
                <p className="font-regular text-sm">Product base price</p>
              </div>
              <span className="text-sm">{formatEUR(polo.price)} €</span>
            </div>
          </div>
        </div>
        {/* One row per DECORATED print area, named after the view it sits on.
            A blank product has none, and the block goes with them. */}
        {money.areas.length > 0 && (
          <div className="border-b border-neutral-200 px-6 py-4">
            {/* One self-explaining row per area — "Front printing cost" —
                rather than a heading with the view names under it. Every area
                is priced the same way, so every row carries the help "?". */}
            <div className="space-y-1">
              {money.areas.map((area, i) => (
                <div key={area.id} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    {i === 0 ? "Front" : "Back"} printing cost
                    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--sprd-neutral-100)] text-[12px] leading-none font-semibold text-[var(--sprd-neutral-700)]">
                      ?
                    </span>
                  </span>
                  <span className="text-sm">
                    {area.price === 0 ? "Free" : `${formatEUR(area.price)} €`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {designCost > 0 && (
          <div className="border-b border-neutral-200 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3 text-sm">
                {/* The design itself, as create-omat's Design Prices rows carry
                    it — on the same neutral chip the product thumbnail above it
                    uses, rather than create-omat's blue one. */}
                <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-[var(--sprd-neutral-100)] p-0.5">
                  <img
                    src={DESIGN_THUMBNAIL}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </span>
                Exclusive design cost
              </span>
              <span className="text-sm">{formatEUR(designCost)} €</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-shrink-0 flex-col gap-2.5 px-6 py-6">
        {quantity > 1 && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="text-[14px] font-medium text-[var(--sprd-neutral-600)]">Per item</p>
            <div className="flex items-center gap-2">
              {money.percent > 0 && (
                <span className="text-[14px] leading-none text-[#6A6A6A] line-through">{formatEUR(money.unit)} €</span>
              )}
              {/* Red exactly while the struck original is beside it. */}
              <span
                className={`pr-1 ${money.percent > 0 ? "font-semibold text-red-600" : ""}`}
              >
                {formatEUR(money.unitDiscounted)} €
              </span>
            </div>
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] font-medium text-[var(--sprd-neutral-600)]">
            {quantity > 1 ? `TOTAL (${quantity} items)` : "Per item"}
          </p>
          <span className="flex flex-col items-end gap-1">
            {money.percent > 0 && quantity > 0 ? (
              <>
                <span className="flex items-center gap-2">
                  {/* Matched to the per-item row's struck price above it. */}
                  <span className="text-[14px] leading-none text-[#6A6A6A] line-through">
                    {formatEUR(money.original)} €
                  </span>
                  <span className="pr-1 text-lg font-semibold text-red-600">
                    {formatEUR(money.total)} €
                  </span>
                </span>
                <span className="rounded-xs bg-red-600 px-1 py-0.5 text-sm text-white">
                  %{money.percent}
                </span>
              </>
            ) : (
              // With no discount the figure is still the ORDER total — the unit
              // price alone would contradict the "(n items)" label beside it.
              <span className="text-lg font-bold">
                {formatEUR(quantity > 0 ? money.total : money.unit)} €
              </span>
            )}
          </span>
        </div>
      </div>
    </>
  )
}

/** The trigger's own classes, shared by the static demo and the live one. */
const SIZE_TRIGGER_CLASS =
  "inline-flex h-12 w-full min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 border-2 border-[var(--sprd-neutral-700)] bg-transparent px-3 font-sans text-sm font-semibold text-black outline-none transition-colors hover:border-black focus:border-black focus-visible:border-black active:border-black data-[state=open]:border-black data-[state=open]:bg-white"

/** The trigger. Its label never changes — the CTA's count reports the selection. */
function SizeTrigger({ open = false, ...props }: { open?: boolean } & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      data-demo="trigger"
      // The open look comes from data-[state=open] under Radix; §4's scripted
      // trigger has no Radix state, so `open` states it directly.
      className={`${SIZE_TRIGGER_CLASS} ${open ? "border-black bg-white" : ""}`}
      {...props}
    >
      <span className="min-w-0 truncate">Select size &amp; quantity</span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className={`size-5 flex-shrink-0 ${open ? "rotate-180" : "rotate-0"}`}
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/** Icon-only until something is chosen; then it grows a label and a count. */
function BasketCta({ picked, onClick }: { picked: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label="Add to basket"
      title="Add to basket"
      data-keeps-sizes-open="true"
      onClick={onClick}
      className="flex h-12 shrink-0 cursor-pointer items-center justify-center bg-black px-4 text-white transition-colors hover:bg-[#333]"
    >
      <CartPlusIcon />
      <span
        aria-hidden={picked === 0}
        className={`grid transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          picked > 0 ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
        }`}
      >
        <span
          className={`flex min-w-0 items-center overflow-hidden whitespace-nowrap transition-opacity duration-200 ${
            picked > 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="pl-3 text-[14px] font-semibold">Add to basket</span>
          <span className="ml-3 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#007D38] px-1.5 text-[14px] font-semibold text-white tabular-nums">
            {picked}
          </span>
        </span>
      </span>
    </button>
  )
}

/** §4 — the 48px row: size trigger, then the CTA that grows once sizes exist. */
export function BuyRow({ picked, open = false }: { picked: number; open?: boolean }) {
  return (
    <div className="relative flex items-stretch gap-2">
      <SizeTrigger open={open} />
      <BasketCta picked={picked} />
    </div>
  )
}

/* ----------------------------------------------------- the size sheet, live */

/** Watches for the end-of-list sentinel so the footer's top rule can stand in
 *  for the scroll shadow once there is nothing left to scroll to. */
function useListAtEnd() {
  const [atEnd, setAtEnd] = useState(false)
  const root = useRef<HTMLDivElement | null>(null)
  const end = useRef<HTMLDivElement | null>(null)
  const observer = useRef<IntersectionObserver | null>(null)
  // Both refs are attached in separate commits, so wire on each — an effect
  // keyed to `open` would run while one of them is still null and never retry.
  const wire = useCallback(() => {
    observer.current?.disconnect()
    observer.current = null
    if (!root.current || !end.current) {
      setAtEnd(false)
      return
    }
    const io = new IntersectionObserver(entries => setAtEnd(entries[0].isIntersecting), {
      root: root.current,
    })
    io.observe(end.current)
    observer.current = io
  }, [])
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node
      wire()
    },
    [wire]
  )
  const setEnd = useCallback(
    (node: HTMLDivElement | null) => {
      end.current = node
      wire()
    },
    [wire]
  )
  return { atEnd, setRoot, setEnd }
}

/** The companion size guide, opening to the left of the sheet. */
function SizeGuidePanel({ polo, onClose }: { polo: Polo; onClose: () => void }) {
  const columns = useMemo(() => sizeMeasureColumns(polo.sizeGuide), [polo.sizeGuide])
  return (
    <div className="animate-in fade-in-0 zoom-in-95 absolute top-0 right-full mr-2 flex max-h-full w-[460px] flex-col overflow-hidden rounded-[12px] bg-white shadow-lg duration-150">
      <div className="flex flex-shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-2">
        <span className="font-display text-[18px] leading-tight font-[800] text-black">
          Size guide
        </span>
        <button
          type="button"
          aria-label="Close size guide"
          onClick={onClose}
          className="shrink-0 cursor-pointer outline-none"
        >
          <img src="/icons/icon-close-x.svg" alt="" className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <p className="mt-4 text-sm text-black">
          <span>Find the right size:</span>
          <br />
          Compare the measurements with a product you already have at home. It&rsquo;s best to lay
          clothing flat on the floor when measuring.
        </p>
        <div className="mt-1.5 flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <img
              src={`${IMAGE_SERVER_BASE}/productTypes/${polo.id}/variants/size.webp`}
              alt="Size Image"
              className="w-[170px]"
              onError={e => {
                e.currentTarget.style.display = "none"
              }}
            />
            {columns.length > 0 && (
              <ul className="self-start text-sm font-medium">
                {columns.map(name => (
                  <li key={name}>
                    {name} - {SIZE_MEASURE_LABELS[name] ?? name} in cm
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex-1">
            <table className="min-w-full">
              <thead className="border-b border-neutral-300">
                <tr className="even:bg-neutral-100">
                  <th className="p-2 text-start">Size</th>
                  {columns.map(name => (
                    <th key={name} className="p-2">
                      {name} (cm)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {polo.sizes.map(label => (
                  <tr key={label} className="text-sm even:bg-neutral-100">
                    <td className="p-2">{label}</td>
                    {columns.map(name => {
                      const mm = sizeMeasure(polo.sizeGuide, label, name)
                      return (
                        <td key={name} className="p-2 text-center">
                          {mm === null ? "—" : formatMeasure(mm)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The footer's discount line: how far the next threshold is, and the condensed
 * tier list the chevron previews on hover. Both come from the polo's real scale,
 * so the promise always matches the figure below it.
 */
export function TierHint({
  quantity,
  productId = POLO_ID,
  pinned = false,
  preview = true,
}: {
  quantity: number
  /** Scales differ per product type — take it from whatever is on screen. */
  productId?: string
  /** Hold the tier list open, for the spec's sake. */
  pinned?: boolean
  /** Off where the line is shown only for its wording — the chip stays, inert. */
  preview?: boolean
}) {
  const next = nextVolumeDiscountTier(quantity, productId)
  const text = next
    ? `Add ${next.from - quantity} more for %${next.percentage} off`
    : `%${volumeDiscountPercentage(quantity, productId)} off applied`

  return (
    <div className="flex items-center justify-end gap-1.5 text-[14px] font-medium text-red-600">
      <span>{text}</span>
      <span className="group/tiers relative flex">
        {/* Hover-only affordance: not a button and not focusable, so a click
            neither opens anything nor pins the preview open. */}
        <span
          aria-label="Volume discount tiers"
          className="flex items-center justify-center rounded-full bg-[#FFEEEB] p-1 outline-none"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`transition-[rotate] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              pinned ? "rotate-180" : preview ? "group-hover/tiers:rotate-180" : ""
            }`}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M5.29289 8.29289C5.65338 7.93241 6.22061 7.90468 6.6129 8.2097L6.70711 8.29289L12 13.585L17.2929 8.29289C17.6534 7.93241 18.2206 7.90468 18.6129 8.2097L18.7071 8.29289C19.0676 8.65338 19.0953 9.22061 18.7903 9.6129L18.7071 9.70711L12.7071 15.7071C12.3466 16.0676 11.7794 16.0953 11.3871 15.7903L11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
              fill="currentColor"
            />
          </svg>
        </span>
        {/* The five condensed thresholds, exactly as create-omat's
            VolumeDiscountContent renders them (getMajorThresholds). The line
            above names the next REAL tier, so it can mention a percentage that
            is not one of these five — production behaves the same way. */}
        {(pinned || preview) && (
        <div
          className={`pointer-events-none absolute right-0 bottom-full z-50 mb-2 w-52 overflow-hidden rounded-[12px] bg-white p-2 shadow-lg transition-opacity duration-150 ${
            pinned ? "opacity-100" : "opacity-0 group-hover/tiers:opacity-100"
          }`}
        >
          {majorVolumeDiscountTiersForProduct(productId).map(t => (
            <div
              key={t.from}
              className="flex items-center justify-between gap-3 border-b border-neutral-200 px-3 py-2 text-[13px] last:border-b-0"
            >
              <span className="font-normal text-black">{t.from}+ products</span>
              <span className="font-bold text-[#DC2626]">−{t.percentage}% off</span>
            </div>
          ))}
        </div>
        )}
        {/* The chip is a span, not a button — the rail leaves it at
            cursor:default, so the arrow is what a reader would really see. */}
        {pinned && <ParkedCursor className="top-1/2 left-1/2" />}
      </span>
    </div>
  )
}

/**
 * The sheet's contents — header, size rows, sticky footer. Shared by the live
 * sheet (inside a Radix popover) and §4's scripted walkthrough (a plain panel),
 * so the two can never drift apart.
 */
function SizeSheetBody({
  polo,
  gone,
  quantities,
  setQuantity,
  onClose,
  listRef,
  endRef,
  atEnd,
  pinTiers = false,
  guideOpen: guideOpenProp,
}: {
  polo: Polo
  gone: string[]
  quantities: Record<string, number>
  setQuantity: (size: string, value: number) => void
  onClose: () => void
  listRef?: (node: HTMLDivElement | null) => void
  endRef?: (node: HTMLDivElement | null) => void
  /** Nothing left to scroll to — the footer's rule stands in for the shadow. */
  atEnd: boolean
  /** Hold the tier list open, for the spec's sake. */
  pinTiers?: boolean
  /** Drive the guide from outside, for a scripted walkthrough. */
  guideOpen?: boolean
}) {
  const [ownGuideOpen, setOwnGuideOpen] = useState(false)
  const external = guideOpenProp !== undefined
  const guideOpen = external ? guideOpenProp : ownGuideOpen
  const setGuideOpen = external ? () => {} : setOwnGuideOpen
  const total = Object.values(quantities).reduce((sum, n) => sum + n, 0)
  // Blank product here, so an item costs the base price alone.
  const unit = polo.price
  const percent = volumeDiscountPercentage(total, polo.id)

  return (
    <>
    {guideOpen && <SizeGuidePanel polo={polo} onClose={() => setGuideOpen(false)} />}

    <div className="relative z-10 flex flex-shrink-0 items-center justify-between rounded-t-[12px] bg-white px-6 pt-5 pb-4">
      <button
        type="button"
        data-demo="guide"
        onClick={() => setGuideOpen(o => !o)}
        className="inline-flex min-w-0 cursor-pointer items-center gap-2 text-[14px] text-black outline-none"
      >
        <span className="shrink-0 [&>svg]:size-[22px]">
          <RulerIcon />
        </span>
        <span className="underline underline-offset-4">
          {guideOpen ? "Hide size guide" : "View size guide"}
        </span>
      </button>
      <button
            type="button"
            aria-label="Close"
            data-demo="close"
            onClick={onClose}
            className="cursor-pointer outline-none"
          >
        <img src="/icons/icon-close-x.svg" alt="" className="h-6 w-6" />
      </button>
    </div>

    {/* Scroll affordance is CSS-only (.sizes-scroll, in globals.css):
        shadow layers pinned to the box, white covers that scroll away. */}
    <div ref={listRef} className="sizes-scroll min-h-0 flex-1 overflow-y-auto">
      {polo.sizes.map(label => {
        const isOOS = gone.includes(label)
        return (
          <div
            key={label}
            // How §4's scripted pointer finds a row to aim at.
            data-demo-row={label}
            // Dividers on the TOP of each row but the first: the list
            // ends with a sentinel, so :last-child would leave a stray
            // line under the final size.
            className="flex items-center justify-between gap-2 border-t border-neutral-200 px-6 py-2.5 first:border-t-0"
          >
            <span
              className={`text-base font-bold ${isOOS ? "text-neutral-400" : "text-black"}`}
            >
              {label}
            </span>
            <div className="flex items-center gap-4">
              {isOOS && (
                <span className="text-sm font-medium text-neutral-400">Out of stock</span>
              )}
              <QuantityStepper
                quantity={quantities[label] ?? 0}
                onChange={value => setQuantity(label, value)}
                min={0}
                size="lg"
                disabled={isOOS}
                inputAriaLabel={`${label} quantity`}
              />
            </div>
          </div>
        )
      })}
      <div ref={endRef} aria-hidden className="h-px w-full" />
    </div>

    {/* The open sheet covers the rail, so it carries the same three
        facts in the same screen position: next tier, per item, total. */}
    <div
      className={`flex flex-shrink-0 flex-col gap-3 border-t bg-white p-6 pt-[18px] pb-[14px] ${
        atEnd ? "border-neutral-200" : "border-transparent"
      }`}
    >
      <TierHint quantity={total} productId={polo.id} pinned={pinTiers} />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-[14px] text-black">
          <span className="text-[14px] font-medium text-[var(--sprd-neutral-600)]">
            Per item
          </span>
          <span className="flex items-baseline gap-2">
            {percent > 0 && (
              <span className="text-[14px] leading-none text-[#6A6A6A] line-through">
                {formatEUR(unit)}
              </span>
            )}
            <span
              className={`font-semibold ${percent > 0 ? "text-[#DC2626]" : "text-black"}`}
            >
              {formatEUR(discountedPrice(unit, percent))} €
            </span>
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <span className="text-[14px] font-medium text-[var(--sprd-neutral-600)]">
            TOTAL
          </span>
          <span className="flex items-baseline gap-2">
            {percent > 0 && total > 0 && (
              <span className="text-[14px] leading-none text-[#6A6A6A] line-through">
                {formatEUR(unit * total)}
              </span>
            )}
            <span
              className={`text-[24px] leading-7 font-medium ${
                percent > 0 && total > 0 ? "text-[#DC2626]" : "text-black"
              }`}
            >
              {formatEUR(total > 0 ? discountedPrice(unit * total, percent) : 0)} €
            </span>
          </span>
        </div>
        <p className="text-right text-[12px] text-[#6A6A6A]">
          Excl. shipping, incl. printing costs
        </p>
      </div>
    </div>
    </>
  )
}

/**
 * §4, live — the selector row with the real size sheet behind it. The sheet is
 * the product's: same anchor trick (an absolute anchor spanning the row, so the
 * panel's width does not move as the CTA grows), same collision boundary, same
 * "height = Radix's available height, capped" rule, same sticky footer.
 */
export function LiveBuyRow({
  polo,
  gone,
  open,
  onOpenChange,
  quantities,
  setQuantity,
  boundaryRef,
}: {
  polo: Polo
  /** Sizes sold out in the selected colour — their rows are disabled. */
  gone: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  quantities: Record<string, number>
  setQuantity: (size: string, value: number) => void
  boundaryRef: RefObject<HTMLDivElement | null>
}) {
  const { atEnd, setRoot, setEnd } = useListAtEnd()
  const total = Object.values(quantities).reduce((sum, n) => sum + n, 0)

  return (
    <div className="relative flex items-stretch gap-2">
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        {/* Position against the whole row, not the trigger: the trigger narrows
            as the CTA grows, and the sheet takes its width from the anchor. */}
        <Popover.Anchor aria-hidden className="pointer-events-none absolute inset-0" />
        <Popover.Trigger asChild>
          <SizeTrigger open={open} />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="top"
            sideOffset={4}
            align="start"
            collisionPadding={12}
            collisionBoundary={boundaryRef.current ? [boundaryRef.current] : undefined}
            // Focus stays on the trigger so the rail below stays operable.
            onOpenAutoFocus={e => e.preventDefault()}
            onInteractOutside={e => {
              // The purchase controls sit below the sheet and are never covered;
              // clicking them must not count as an outside click.
              if ((e.target as HTMLElement | null)?.closest?.("[data-keeps-sizes-open]"))
                e.preventDefault()
            }}
            className="relative z-50 flex flex-col overflow-visible rounded-t-[12px] bg-white shadow-lg outline-none"
            style={{
              width: "var(--radix-popover-trigger-width)",
              // Always open at the tallest it can be — capped at 620px — so the
              // list's height doesn't jump between products and the scroll
              // affordance is meaningful from the start.
              height: "min(620px, var(--radix-popover-content-available-height))",
              maxHeight: "min(620px, var(--radix-popover-content-available-height))",
            }}
          >
            <SizeSheetBody
              polo={polo}
              gone={gone}
              quantities={quantities}
              setQuantity={setQuantity}
              onClose={() => onOpenChange(false)}
              listRef={setRoot}
              endRef={setEnd}
              atEnd={atEnd}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {/* Nothing chosen → opens the sheet, rather than flashing red. */}
      <BasketCta picked={total} onClick={() => total === 0 && onOpenChange(true)} />
    </div>
  )
}

/** Delivery + returns, the rail's closing line. */
export function MetaRow() {
  const window_ = useMemo(() => formatDeliveryWindow(new Date()), [])
  return (
    <>
      <div className="mt-3 mb-3 h-px w-full bg-[#E9E9E9]" />
      <div className="flex flex-row items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 rounded-xs py-0.5 text-left text-[14px] font-medium text-black">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.66602 2.66699C9.00787 2.66699 9.28957 2.92435 9.32812 3.25586L9.33301 3.33398H12C12.2048 3.33408 12.3961 3.42801 12.5215 3.58594L12.5713 3.65723L14.5713 6.99023L14.5957 7.03516L14.624 7.10059L14.6504 7.18848L14.6631 7.2666L14.666 7.33398V11.334C14.6659 11.6757 14.4086 11.9576 14.0771 11.9961L14 12H13.2168C12.9421 12.7766 12.2036 13.334 11.333 13.334C10.4624 13.334 9.72391 12.7766 9.44922 12H6.5498C6.27509 12.7765 5.53662 13.334 4.66602 13.334C3.79548 13.3338 3.05685 12.7765 2.78223 12H2C1.65811 12 1.3764 11.7427 1.33789 11.4111L1.33301 11.334V4C1.33318 3.29739 1.87682 2.722 2.56641 2.6709L2.66602 2.66699H8.66602ZM4.66602 10.667C4.30015 10.6672 4.00252 10.9621 3.99902 11.3271L4 11.334C4 11.3356 3.99904 11.3372 3.99902 11.3389C4.00182 11.7046 4.29971 12.0008 4.66602 12.001C5.0341 12.001 5.33283 11.702 5.33301 11.334C5.33301 10.9658 5.03421 10.667 4.66602 10.667ZM11.333 10.667C10.9648 10.667 10.666 10.9658 10.666 11.334C10.6662 11.702 10.9649 12.001 11.333 12.001C11.7011 12.001 11.9998 11.702 12 11.334C12 10.9658 11.7012 10.667 11.333 10.667ZM9.33301 10.667H9.44922C9.72399 9.89059 10.4625 9.33398 11.333 9.33398C12.2035 9.33398 12.942 9.89059 13.2168 10.667H13.333V8H9.33301V10.667ZM2.66602 10.667H2.78223C3.05693 9.89064 3.79559 9.33412 4.66602 9.33398C5.53651 9.33398 6.275 9.89065 6.5498 10.667H8V4H2.66602V10.667ZM9.33301 6.66699H12.8223L11.6221 4.66699H9.33301V6.66699Z"
              fill="#000000"
            />
          </svg>
          <span suppressHydrationWarning>{window_} or</span>
          <span className="font-regular px-0 py-0 text-[14px] text-black underline">faster</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-xs py-0.5 text-left text-[14px] font-medium text-black">
          <img src="/icons/icon-refresh.svg" alt="" className="h-5 w-5" />
          30-Day easy returns
        </span>
      </div>
    </>
  )
}

/* --------------------------------------------------------------- composites */

/** The column's real width in the designer, and the height this page pins it to. */
export const RAIL_WIDTH_PX = 470
export const RAIL_HEIGHT_PX = 600

/**
 * The whole rail, as it stands on /add-to-basket-new-1 with latte selected —
 * at the column's real 470px width, so the swatch grid resolves to exactly the
 * cell size it has in the product. Height is pinned rather than stretched to a
 * viewport: the column is `h-full` in the designer, and the two halves are held
 * apart by the same `mt-auto` on the bottom one.
 */
export function LiveRail({
  onDiscountClick,
  highlightDiscount = false,
  decorated = false,
  areaIds,
  designCost = 0,
  detailsOpen,
  initialQuantities,
}: {
  /** §8 uses the rail as the way in to the calculator. */
  onDiscountClick?: () => void
  highlightDiscount?: boolean
  /** Front print area in play, so the price carries a printing cost. */
  decorated?: boolean
  areaIds?: string[]
  designCost?: number
  /** Hold the breakdown open, for a section that is about the breakdown. */
  detailsOpen?: boolean
  /** Start with an order already chosen, so a discount is in play. */
  initialQuantities?: Record<string, number>
} = {}) {
  const polo = usePolo()
  const railRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState(LATTE_ID)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities ?? {})
  const selected = polo.appearances.find(a => a.id === selectedId) ?? polo.appearances[0]
  // Only latte has published stock; every other colour reads as fully stocked.
  const gone = selectedId === LATTE_ID ? LATTE_OUT_OF_STOCK : []
  const total = Object.values(quantities).reduce((sum, n) => sum + n, 0)

  const setQuantity = useCallback(
    (size: string, value: number) =>
      setQuantities(prev => ({ ...prev, [size]: Math.max(0, value) })),
    []
  )
  // Sizes gone in the newly picked colour can't stay in the order.
  useEffect(() => {
    setQuantities(prev => {
      if (!gone.some(size => (prev[size] ?? 0) > 0)) return prev
      const next = { ...prev }
      for (const size of gone) delete next[size]
      return next
    })
  }, [gone])

  const dim = sheetOpen
  const blur: CSSProperties = {
    transition: "filter 0.3s ease",
    filter: dim ? `blur(${BLUR_PX}px)` : "none",
  }

  return (
    // The ground is its own layer so it can blur with the design while the
    // controls on top of it stay sharp — a filter on the column itself would
    // take its children with it.
    <div
      className="relative shrink-0"
      style={{ width: RAIL_WIDTH_PX, height: RAIL_HEIGHT_PX }}
    >
      <div aria-hidden className="absolute inset-0 rounded-[12px] bg-[#F4F4F4]" style={blur} />
      <div
        ref={railRef}
        className="relative flex h-full flex-col overflow-y-auto rounded-[12px] p-[24px] pb-3"
      >
        {/* Title, details link and swatches are out of play while the sheet is
            open — dimmed with the ground, leaving the purchase controls sharp. */}
        <div className={`flex-shrink-0 ${dim ? "pointer-events-none" : ""}`} style={blur}>
          <RailTitle name={polo.name} />
          <DetailsLink />
          <ColorRow color={selected?.name ?? "latte"} sizes={polo.sizes} gone={gone} />
          <Swatches
            appearances={polo.appearances}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="mt-auto flex-shrink-0 pt-6">
          <div className="mb-[18px]">
            {/* The breakdown is offered once there is something to break down:
                a decorated print area, or more than one item. On a blank single
                item the price IS the base price. */}
            <PriceRow
              polo={polo}
              quantity={total}
              interactive={decorated || total > 1}
              decorated={decorated}
              areaIds={areaIds}
              designCost={designCost}
              detailsOpen={detailsOpen}
              onDiscountClick={onDiscountClick}
              highlightDiscount={highlightDiscount}
              boundaryRef={railRef}
            />
          </div>
          <LiveBuyRow
            polo={polo}
            gone={gone}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            quantities={quantities}
            setQuantity={setQuantity}
            boundaryRef={railRef}
          />
          <MetaRow />
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- drawn cursors */

/** The default pointer, for anything that only reacts to hover. */
export const CursorArrow = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
    <path
      d="M4 2 18 10.5 11.8 11.7 14.9 17.8 12 19.2 8.9 13 4 17Z"
      fill="#ffffff"
      stroke="#111111"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
)

/** What the cursor becomes over a button — `cursor: pointer`, drawn. */
export const CursorHand = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
    <path
      d="M9.6 12.4V3.6a1.6 1.6 0 0 1 3.2 0v5.6h.9V6.9a1.6 1.6 0 0 1 3.2 0v2.7h.9V8.3a1.6 1.6 0 0 1 3.2 0v6.6c0 3.6-2.4 6.5-6 6.5h-1.3c-1.7 0-3.3-.7-4.5-1.9l-3.4-3.4a1.55 1.55 0 0 1 2.2-2.2l1.6 1.6Z"
      fill="#ffffff"
      stroke="#111111"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
)

/**
 * A cursor parked on the thing a pinned hover state belongs to. Not animated —
 * it is there to say "this opens on hover", which a still frame cannot.
 *
 * `hand` mirrors what the product actually does: the arrow for anything the
 * rail leaves at cursor:default, the hand only where it sets cursor:pointer.
 * Check the source before choosing.
 */
export function ParkedCursor({ hand = false, className = "" }: { hand?: boolean; className?: string }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute z-[60] block ${className}`}>
      {/* The caller positions the TIP, not the glyph's box, so the cursor lands
          ON the element rather than beside it: the arrow's tip sits at (4,2)
          inside its 24px box, the hand's fingertip near (11,3). */}
      <span
        className={`block ${
          hand ? "-translate-x-[11px] -translate-y-[3px]" : "-translate-x-[4px] -translate-y-[2px]"
        }`}
      >
        {hand ? <CursorHand /> : <CursorArrow />}
      </span>
    </span>
  )
}

/* ------------------------------------------------- §4, as a walkthrough */

/** One beat of the §4 playback. */
type Beat = { at: number; act: string }

// ~11s, with a beat or two of stillness between each move so a reader can
// follow: point at the trigger, open, point at M's plus, add one, point at the
// close, shut it, leave.
const WALKTHROUGH: Beat[] = [
  { at: 0, act: "reset" },
  { at: 900, act: "point:trigger" },
  { at: 2200, act: "click" },
  { at: 2400, act: "open" },
  { at: 4000, act: "point:plus" },
  { at: 5300, act: "click" },
  { at: 5500, act: "add" },
  { at: 7100, act: "point:close" },
  { at: 8400, act: "click" },
  { at: 8600, act: "close" },
  { at: 10000, act: "leave" },
]
const WALKTHROUGH_CYCLE = 11500
/** The size the walkthrough adds — one M, nothing else. */
const WALKTHROUGH_SIZE = "M"

/**
 * The rail, held in a chosen state: sheet open or shut, these quantities, and
 * an optional drawn cursor. Nothing in it is operable — §4 drives it from a
 * script, §5 pins it to one frame.
 */
function StagedRail({
  polo,
  open,
  quantities,
  sheetHeight = 430,
  railHeight = RAIL_HEIGHT_PX,
  sheetNote,
  listAtEnd = false,
  gone = LATTE_OUT_OF_STOCK,
  appearanceId = LATTE_ID,
  pinTiers = false,
  guideOpen,
  cursor,
  clicking = false,
  ref,
}: {
  polo: Polo
  open: boolean
  quantities: Record<string, number>
  /** Hold the tier list open, for the spec's sake. */
  pinTiers?: boolean
  /** Taller when the point is to read further down the list. */
  sheetHeight?: number
  /** Taller than the designer's column when the point is the sheet's own height. */
  railHeight?: number
  /** Dimension label drawn against the sheet's right edge, e.g. "620px min". */
  sheetNote?: string
  /**
   * True when the size list has nothing left to scroll to — a one-size product,
   * say. The footer's top rule stands in for the scroll shadow there, so a
   * still that does not scroll must state it or the boundary goes missing.
   */
  listAtEnd?: boolean
  /** Sold-out sizes and the selected colour — latte on the polo by default. */
  gone?: string[]
  appearanceId?: string
  /** Drive the sheet's size guide from outside — see SizeSheetBody. */
  guideOpen?: boolean
  cursor?: { x: number; y: number; shown: boolean; hand: boolean }
  clicking?: boolean
  ref?: Ref<HTMLDivElement>
}) {
  const total = Object.values(quantities).reduce((sum, n) => sum + n, 0)
  const blur: CSSProperties = {
    transition: "filter 0.3s ease",
    filter: open ? `blur(${BLUR_PX}px)` : "none",
  }

  return (
    <div
      ref={ref}
      // Nothing in here is operable: the point is to read it, and a half-driven
      // sheet that also accepted clicks would fight whatever is staging it.
      className="relative shrink-0 select-none [&_*]:pointer-events-none"
      style={{ width: RAIL_WIDTH_PX, height: railHeight }}
    >
      <div aria-hidden className="absolute inset-0 rounded-[12px] bg-[#F4F4F4]" style={blur} />
      <div className="relative flex h-full flex-col rounded-[12px] p-[24px] pb-3">
        <div className="flex-shrink-0" style={blur}>
          <RailTitle name={polo.name} />
          <DetailsLink />
          <ColorRow
            color={polo.appearances.find(a => a.id === appearanceId)?.name ?? ""}
            sizes={polo.sizes}
            gone={gone}
          />
          <Swatches appearances={polo.appearances} selectedId={appearanceId} onSelect={() => {}} />
        </div>
        <div className="mt-auto flex-shrink-0 pt-6">
          {/* Sharp, like the rest of the bottom part — only the top half dims. */}
          <div className="mb-[18px]">
            <PriceRow polo={polo} quantity={total} interactive={false} decorated={false} />
          </div>
          <div className="relative">
            {/* 4px above the row, the row's own width — the same two numbers the
                live sheet gets from its anchor. */}
            <div
              className={`absolute right-0 bottom-full left-0 mb-1 flex flex-col rounded-t-[12px] bg-white shadow-lg transition-opacity duration-150 ${
                open ? "opacity-100" : "opacity-0"
              }`}
              style={{ height: sheetHeight }}
            >
              <SizeSheetBody
                polo={polo}
                gone={gone}
                quantities={quantities}
                setQuantity={() => {}}
                onClose={() => {}}
                atEnd={listAtEnd}
                pinTiers={pinTiers}
                guideOpen={guideOpen}
              />
            </div>
            {/* Same `bottom-full mb-1` and height as the panel above, so the
                measure is taken off the sheet itself rather than computed. */}
            {sheetNote && open && (
              <div
                aria-hidden
                className="absolute bottom-full left-full mb-1 ml-4 flex w-8 flex-col items-center text-[var(--ho-thread-ink)]"
                style={{ height: sheetHeight }}
              >
                <span className="h-0.5 w-3 shrink-0 bg-current" />
                <span className="w-0.5 flex-1 bg-current" />
                {/* mt/mb, not my: `my-*` is margin-BLOCK, and vertical writing mode
                    turns the block axis sideways — the gap would land left and
                    right of the label instead of above and below it. */}
                <span className="mt-3 mb-3 font-[family-name:var(--ho-mono)] text-[12px] font-bold whitespace-nowrap [writing-mode:vertical-rl]">
                  {sheetNote}
                </span>
                <span className="w-0.5 flex-1 bg-current" />
                <span className="h-0.5 w-3 shrink-0 bg-current" />
              </div>
            )}
            <BuyRow picked={total} open={open} />
          </div>
          <MetaRow />
        </div>
      </div>

      {/* The drawn pointer. Its tip lands wherever it was sent, and it turns
          into the pointing hand over anything clickable — the same swap a real
          cursor makes. */}
      {cursor && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-[60] transition-[translate,opacity] duration-700 ease-in-out"
          style={{ translate: `${cursor.x}px ${cursor.y}px`, opacity: cursor.shown ? 1 : 0 }}
        >
          {clicking && (
            <span className="absolute top-0 left-0 size-6 animate-ping rounded-full bg-black/25" />
          )}
          {/* The hand's fingertip sits mid-glyph rather than at its corner, so
              it is nudged left to land where the arrow's tip would. */}
          <span className={`block ${cursor.hand ? "-translate-x-[9px]" : ""}`}>
            {cursor.hand ? <CursorHand /> : <CursorArrow />}
          </span>
        </span>
      )}
    </div>
  )
}

/**
 * §4 — the same rail and the same sheet, played back rather than operated:
 * the pointer opens the sheet, adds one M, and closes it again. Nothing here
 * responds to input; the sheet is a plain panel rather than a Radix popover so
 * the drawn pointer can sit above it without a portal to fight.
 */
export function SizeSheetDemo() {
  const polo = usePolo()
  const boxRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [cursor, setCursor] = useState({ x: 0, y: 0, shown: false, hand: false })
  const [clicking, setClicking] = useState(false)

  useEffect(() => {
    const timers: number[] = []
    // Measured, not hardcoded: the sheet's rows sit wherever the layout puts
    // them, and a nudged padding value must not send the pointer somewhere else.
    // Anything the walkthrough aims at is a button, so the glyph becomes the
    // pointing hand a real cursor turns into over one.
    const pointAt = (selector: string, xRatio = 0.5) => {
      const box = boxRef.current
      const el = box?.querySelector(selector)
      if (!box || !el) return
      const b = box.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      setCursor({
        x: r.left - b.left + r.width * xRatio,
        y: r.top - b.top + r.height / 2,
        shown: true,
        hand: !!el.closest("button"),
      })
    }
    const act = (name: string) => {
      switch (name) {
        case "reset":
          setOpen(false)
          setQuantities({})
          setCursor(c => ({ ...c, shown: false }))
          break
        case "point:trigger":
          pointAt('[data-demo="trigger"]', 0.16)
          break
        case "point:plus":
          pointAt(`[data-demo-row="${WALKTHROUGH_SIZE}"] [aria-label="Increase"]`)
          break
        case "point:close":
          pointAt('[data-demo="close"]')
          break
        case "click":
          setClicking(true)
          timers.push(window.setTimeout(() => setClicking(false), 320))
          break
        case "open":
          setOpen(true)
          break
        case "add":
          setQuantities({ [WALKTHROUGH_SIZE]: 1 })
          break
        case "close":
          setOpen(false)
          break
        case "leave":
          setCursor(c => ({ ...c, shown: false }))
          break
      }
    }
    const cycle = () => {
      for (const beat of WALKTHROUGH) timers.push(window.setTimeout(() => act(beat.act), beat.at))
      timers.push(window.setTimeout(cycle, WALKTHROUGH_CYCLE))
    }
    cycle()
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <StagedRail
      ref={boxRef}
      polo={polo}
      open={open}
      quantities={quantities}
      cursor={cursor}
      clicking={clicking}
    />
  )
}

/** §5 — one frame: the sheet open on an order that has crossed a tier. */
export function PriceStateDemo({ quantities }: { quantities: Record<string, number> }) {
  const polo = usePolo()
  // Taller than §4's, so every size carrying a quantity is readable at once.
  return <StagedRail polo={polo} open quantities={quantities} sheetHeight={480} />
}

/** §6 — the tier list, held open the way a hover would. */
export function TierListDemo({ quantities }: { quantities: Record<string, number> }) {
  const polo = usePolo()
  return <StagedRail polo={polo} open quantities={quantities} sheetHeight={480} pinTiers />
}

/* --------------------------------------------------- §7, as a walkthrough */

// ~10s. The guide is the thing to read, so it holds open for three and a half
// seconds before the pointer closes it again.
const GUIDE_WALKTHROUGH: Beat[] = [
  { at: 0, act: "reset" },
  { at: 900, act: "point:guide" },
  { at: 2100, act: "click" },
  { at: 2300, act: "open" },
  { at: 5800, act: "point:close" },
  { at: 7000, act: "click" },
  { at: 7200, act: "close" },
  { at: 8600, act: "leave" },
]
const GUIDE_CYCLE = 10000

/**
 * §7 — the size guide, opened the way a reader would open it. The panel keeps
 * its real place (hung off the sheet's left edge), so it overflows the demo's
 * frame exactly as the rail's own panels do.
 */
export function SizeGuideDemo() {
  const polo = usePolo()
  const boxRef = useRef<HTMLDivElement>(null)
  const [autoPlay, setAutoPlay] = useState(true)
  const [guideOpen, setGuideOpen] = useState(false)
  const [cursor, setCursor] = useState({ x: 0, y: 0, shown: false, hand: false })
  const [clicking, setClicking] = useState(false)

  useEffect(() => {
    // Switched off, the loop simply stops where it is — a reader who paused to
    // study the open panel should keep looking at it, not watch it reset.
    if (!autoPlay) return
    const timers: number[] = []
    const pointAt = (selector: string, xRatio = 0.5) => {
      const box = boxRef.current
      const el = box?.querySelector(selector)
      if (!box || !el) return
      const b = box.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      setCursor({
        x: r.left - b.left + r.width * xRatio,
        y: r.top - b.top + r.height / 2,
        shown: true,
        hand: !!el.closest("button"),
      })
    }
    const act = (name: string) => {
      switch (name) {
        case "reset":
          setGuideOpen(false)
          setCursor(c => ({ ...c, shown: false }))
          break
        case "point:guide":
          pointAt('[data-demo="guide"]', 0.7)
          break
        case "point:close":
          pointAt('[aria-label="Close size guide"]')
          break
        case "click":
          setClicking(true)
          timers.push(window.setTimeout(() => setClicking(false), 320))
          break
        case "open":
          setGuideOpen(true)
          break
        case "close":
          setGuideOpen(false)
          break
        case "leave":
          setCursor(c => ({ ...c, shown: false }))
          break
      }
    }
    const cycle = () => {
      for (const beat of GUIDE_WALKTHROUGH)
        timers.push(window.setTimeout(() => act(beat.act), beat.at))
      timers.push(window.setTimeout(cycle, GUIDE_CYCLE))
    }
    cycle()
    return () => timers.forEach(clearTimeout)
  }, [autoPlay])

  return (
    <div className="flex flex-col items-center">
      {/* The one control on the page a reader operates, so it uses the kit's
          own switch rather than document chrome. Above the demo: it has to be
          reachable before the thing it governs has scrolled past. */}
      <div className="mb-8 rounded-full bg-[var(--ho-ground)] py-2 pr-2 pl-4">
        <KitSwitch
          checked={autoPlay}
          onChange={setAutoPlay}
          label="Auto play"
          size="m"
          className="gap-4"
        />
      </div>
      <StagedRail
        ref={boxRef}
        polo={polo}
        open
        quantities={{}}
        sheetHeight={480}
        guideOpen={guideOpen}
        cursor={cursor}
        clicking={clicking}
      />
    </div>
  )
}

/** A one-size product, for showing what the sheet's height rule does. */
export const ONE_SIZE_PRODUCT_ID = "15"
/**
 * The height the sheet always opens at. The designer sets `height`, not just
 * `max-height`, to `min(620px, available)` — so a one-size product does not get
 * a short panel: 620px is the floor, and only a cramped viewport takes it lower.
 */
export const SHEET_MIN_HEIGHT = 620

/**
 * §4's second still — the sheet on a one-size product. The list has a single
 * row and the panel is still full height: the height is set, not fitted, so the
 * layout does not jump between a 1-size and a 9-size product.
 */
export function MinHeightDemo() {
  const product = useProduct(ONE_SIZE_PRODUCT_ID)
  // The column is stretched past the designer's 600px on purpose: only with the
  // room for it does the sheet actually reach the height it always opens at.
  return (
    <StagedRail
      polo={product}
      open
      quantities={{}}
      sheetHeight={SHEET_MIN_HEIGHT}
      railHeight={SHEET_MIN_HEIGHT + 140}
      sheetNote={`${SHEET_MIN_HEIGHT}px min`}
      // One row in a 620px panel — there is nothing below to scroll to.
      listAtEnd
      gone={[]}
      appearanceId={product.appearances[0]?.id ?? ""}
    />
  )
}

/* ------------------------------------------------- §8, the calculator modal */

/**
 * §8 — the calculator, reached the way a shopper reaches it: the whole right
 * column, with the red link blinking, and the modal opening over the page on
 * its own overlay. Radix's modal mode is left on, so it behaves as the real
 * dialog does — Escape and the overlay close it.
 */
export function VolumeDiscountDemo() {
  const polo = usePolo()
  const [open, setOpen] = useState(false)

  // Front print area decorated plus one paid design, so the modal's list and
  // the rail behind it quote the same figure.
  const money = useExamplePrice(polo, 1, true, undefined, EXCLUSIVE_DESIGN_PRICE)
  const printAreas = money.areas.map((area, i) => ({
    id: area.id,
    name: i === 0 ? "Front" : "Back",
    price: area.price,
  }))

  return (
    <>
      <LiveRail
        onDiscountClick={() => setOpen(true)}
        highlightDiscount={!open}
        decorated
        designCost={EXCLUSIVE_DESIGN_PRICE}
      />
      <ScopedDialog
        open={open}
        onOpenChange={setOpen}
        overlayClassName=""
        data-discount-scroll="true"
        // Wide enough for a full scale on the track: a typical one marks 9
        // tiers, the deepest 16, each with a quantity and a percentage under it.
        className="flex max-h-[80%] w-[820px] max-w-[90%] flex-col overflow-y-auto rounded-2xl bg-white p-0 pt-6 shadow-xl"
        // 500px whatever the scale's row count, so the panel does not resize as
        // products are switched.
        style={{ minHeight: "min(500px, 80%)" }}
      >
        <VolumeDiscountPopoverContent
          productId={polo.id}
          unitPrice={money.unit}
          basePrice={polo.price}
          printAreas={printAreas}
          printAreaCostLabel="printing cost"
          designCost={EXCLUSIVE_DESIGN_PRICE}
          onClose={() => setOpen(false)}
        />
      </ScopedDialog>
    </>
  )
}
