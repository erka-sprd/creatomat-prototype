"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { QuantityField } from "@/components/product-type/volume-discount-panel"
import { ScopedDialogTitle } from "@/components/ui/scoped-dialog"
import { WedgeSlider, thumbCentreX } from "@/components/ui/editor-bar/WedgeSlider"
import {
  discountedPrice,
  volumeDiscountPercentage,
  volumeDiscountTiers,
} from "@/lib/volume-discount"

// Body of the "Calculate volume discount" popover in the designer's right rail
// — the popover sibling of the price-details breakdown, anchored to the red
// link rather than opened as a modal.
//
// Differences from the old modal (components/volume-discount-dialog.tsx, still
// used by the landing-page calculator):
//   * quantity is driven by a HORIZONTAL slider marked with the same five major
//     thresholds the modal listed, percentages under the marks, rather than a
//     column of tier buttons;
//   * no product preview — the rail's canvas already shows it;
//   * the price list carries the same rows as the price-details breakdown:
//     base price, then one line per decorated print area.

const fmt = (n: number) => n.toFixed(2).replace(".", ",")

// Fallback until the wrapper has been measured — the dialog is 820px wide, less
// 24px of band padding and 12px of track margin either side.
const DEFAULT_TRACK_WIDTH = 748

// The travelled part of the track, up to the handle.
const TRACK_FILL = "#000000"

export type PrintAreaCost = { id: string; name: string; price: number }

type Props = {
  /** Product type id — decides which discount scale applies. */
  productId?: string
  /** Single-item price incl. printing, i.e. basePrice + print areas. */
  unitPrice: number
  /** Undecorated product price, listed as its own row. */
  basePrice: number
  /** One entry per decorated print area — Front, Back, … with their cost. */
  printAreas?: PrintAreaCost[]
  /** Noun for a print-area row, matching the chosen technique. */
  printAreaCostLabel?: string
  /** A paid design earns its own row; free ones are not listed. 0 hides it. */
  designCost?: number
  /** Closes the popover from the X in its top-right corner. */
  onClose?: () => void
}

/**
 * Marks on the track: quantity 1 (nothing off yet) plus EVERY tier of the
 * product's own scale — not the five majors create-omat's dialog condenses to.
 * Across the shop's 388 product types a scale averages 8.3 tiers (median 9,
 * up to 16), so showing five hid three to eleven real thresholds; here the
 * track is the scale.
 *
 * Stops are spaced EVENLY along the track rather than by quantity: the top
 * threshold is 50–500 depending on the product, so a linear axis would bunch
 * every early tier into the first tenth of it.
 */
const sliderStops = (productId?: string) => [
  { from: 1, percentage: 0 },
  ...volumeDiscountTiers(productId).map(t => ({
    from: t.from,
    percentage: t.percentage,
  })),
]

export default function VolumeDiscountPopoverContent({
  productId,
  unitPrice,
  basePrice,
  printAreas = [],
  printAreaCostLabel = "printing cost",
  designCost = 0,
  onClose,
}: Props) {
  const [quantity, setQuantity] = useState(1)
  // WedgeSlider is sized in pixels (it draws an SVG track), so the wrapper's
  // width is measured and handed to it — the popover can be narrowed by Radix
  // when the rail is tight.
  const trackRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(DEFAULT_TRACK_WIDTH)
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => setTrackWidth(el.clientWidth || DEFAULT_TRACK_WIDTH)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Scroll shadow over the sticky total, mirroring the size sheet: while there
  // is more panel below, the row casts the kit's shadow-up-xs; once the end is
  // reached the shadow gives way to a plain rule (never both). Same mechanic as
  // the sheet's — an IntersectionObserver on a sentinel just above the row,
  // wired through a callback ref because Radix mounts the popover's content in a
  // later commit than the one that flips `open`.
  // A panel that fits gets neither: with nothing to scroll past, a rule above
  // the total would be a boundary to nowhere — so `scrollable` gates both.
  const [atEnd, setAtEnd] = useState(true)
  const [scrollable, setScrollable] = useState(false)
  const endObserver = useRef<IntersectionObserver | null>(null)
  const sizeObserver = useRef<ResizeObserver | null>(null)
  const setEndSentinel = useCallback((node: HTMLDivElement | null) => {
    endObserver.current?.disconnect()
    endObserver.current = null
    sizeObserver.current?.disconnect()
    sizeObserver.current = null
    // The popover's own Content is the scroll container (see designer.tsx).
    const root = node?.closest<HTMLElement>("[data-discount-scroll]")
    if (!node || !root) {
      setAtEnd(true)
      setScrollable(false)
      return
    }
    const io = new IntersectionObserver(entries => setAtEnd(entries[0].isIntersecting), { root })
    io.observe(node)
    endObserver.current = io
    // Overflow can appear or vanish without the sentinel moving — a shorter
    // rail, a scale with more marks — so the box is measured, not assumed.
    const measure = () => setScrollable(root.scrollHeight - root.clientHeight > 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    if (root.firstElementChild) ro.observe(root.firstElementChild)
    sizeObserver.current = ro
  }, [])
  useEffect(
    () => () => {
      endObserver.current?.disconnect()
      sizeObserver.current?.disconnect()
    },
    []
  )

  const stops = sliderStops(productId)
  const lastIndex = stops.length - 1
  const maxQuantity = stops[lastIndex].from

  // Track position (0…lastIndex, fractional) <-> quantity, piecewise-linear
  // between neighbouring stops so every segment is the same width on screen.
  const positionForQuantity = (q: number) => {
    if (q >= maxQuantity) return lastIndex
    const i = stops.findIndex((s, idx) => idx < lastIndex && q < stops[idx + 1].from)
    if (i < 0) return lastIndex
    const span = stops[i + 1].from - stops[i].from
    return i + (span > 0 ? (q - stops[i].from) / span : 0)
  }
  const quantityForPosition = (pos: number) => {
    const i = Math.min(lastIndex - 1, Math.max(0, Math.floor(pos)))
    const frac = pos - i
    return Math.round(stops[i].from + frac * (stops[i + 1].from - stops[i].from))
  }

  const pct = volumeDiscountPercentage(quantity, productId)
  // Unit is discounted and multiplied out (create-omat/basket rounding), so
  // per-item × quantity always reconciles with the total below it.
  const discountedUnit = discountedPrice(unitPrice, pct)
  // Quantities above the top tier can be typed in the stepper; the thumb then
  // rests on the end of the track.
  const position = positionForQuantity(quantity)
  // Dot, handle and label all share the handle's travel, so landing on a stop
  // puts the circle exactly over its dot and the number exactly under both.
  const markLeft = (i: number) => thumbCentreX(lastIndex > 0 ? i / lastIndex : 0, trackWidth)
  // A badge is live only when its percentage is the one ACTUALLY applied —
  // every tier is marked, so that is always exactly one of them. Below the
  // first tier (pct 0) nothing is claimed yet, so they all stay live as an
  // offer.
  const badgeIsLive = (percentage: number) => pct === 0 || percentage === pct

  return (
    // Three bands inside the popover's fixed height: header at the top, the
    // price list pinned to the bottom, and the quantity controls filling
    // whatever is left — centred in it rather than sitting under the header.
    // flex-1 without min-h-0: the bands fill the popover when there is room to
    // spare, and push past it when there is not — so the whole panel scrolls,
    // header and prices included, rather than only the middle band.
    <div className="flex flex-1 flex-col">
      <div className="flex flex-shrink-0 items-start justify-between gap-4 px-6">
        {/* The dialog's Radix title, not a bare <p>: DialogContent warns (and
            screen readers get nothing) without one. */}
        <ScopedDialogTitle className="font-display min-w-0 text-[16px] leading-tight font-[800] text-black">
          Calculate volume discount
        </ScopedDialogTitle>
        {onClose && (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
          >
            <img src="/icons/icon-close-x.svg" alt="" className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Quantity — the stepper takes an exact figure (and anything past the
          top tier), the slider below it sweeps the tiers. 24px of clearance on
          every side, whatever height the band ends up with. */}
      <div className="flex flex-1 flex-col justify-center gap-3 p-6">
        <span className="text-center text-sm font-semibold text-black">Choose quantity</span>

        {/* Capped at 200px and centred rather than stretching the full width of
            the dialog. */}
        <div className="mx-auto mb-1 h-10 w-full max-w-[200px]">
          <QuantityField
            id="volume-discount-popover-quantity"
            quantity={quantity}
            onQuantityChange={setQuantity}
          />
        </div>

        {/* Same slider as the canvas zoom dock (WedgeSlider: ringed white
            handle, drag-relative with jump-on-track-click) — horizontal instead
            of rotated -90°, on a track that rakes from 6px on the left to 16px
            on the right, filled black up to the handle.
            It takes a pixel width, so the wrapper is measured and the marks are
            positioned in the same pixel space as the thumb. */}
        {/* 12px in from the band's own padding on each side — the measured
            width follows, so ticks and labels stay on the handle. */}
        <div ref={trackRef} className="mx-3 w-auto">
          {/* The stops are drawn INSIDE the track (white dots punched into it,
              2px clear of its edges) rather than as separate ticks crossing it,
              so the marks taper with the rail. Every tier is marked, so the
              labels below already say what is being chosen — no readout rides
              along with the handle. */}
          <WedgeSlider
            min={0}
            max={lastIndex}
            value={position}
            width={trackWidth}
            track="taper"
            trackFill={TRACK_FILL}
            marks={stops.map((_, i) => (lastIndex > 0 ? i / lastIndex : 0))}
            jumpOnTrackClick
            onChange={v => setQuantity(quantityForPosition(v))}
            onJump={v => setQuantity(quantityForPosition(v))}
          />
          {/* Labels under each tick: the quantity, then the percentage it
              unlocks. The first stop is quantity 1, where nothing is off yet.
              Clicking one jumps the slider to it. */}
          <div className="relative mt-3 h-8" style={{ width: trackWidth }}>
            {stops.map((stop, i) => {
              const active = quantity >= stop.from
              return (
                <button
                  key={stop.from}
                  type="button"
                  onClick={() => setQuantity(stop.from)}
                  aria-label={
                    stop.percentage > 0
                      ? `${stop.from} products, ${stop.percentage}% off`
                      : `${stop.from} product`
                  }
                  style={{ left: markLeft(i) }}
                  className="group absolute top-0 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 outline-none"
                >
                  {/* The chosen quantity's number swells to 22px, so it is the
                      largest figure on the track however it was picked.
                      Hovering one previews the same growth, since clicking it
                      is what selects that quantity. Quantity 1 is exempt from
                      both: it is the resting position, not a tier worth
                      announcing. */}
                  <span
                    className={`leading-none transition-[font-size,color] duration-150 ${
                      active ? "text-black" : "text-[var(--sprd-neutral-600)]"
                    } ${quantity === stop.from && stop.from !== 1 ? "text-[22px]" : "text-[14px]"} ${
                      stop.from !== 1 ? "group-hover:text-[22px]" : ""
                    }`}
                  >
                    {stop.from}
                  </span>
                  {/* A badge rather than bare text — the lightest red ground
                      (--sprd-red-50) under red type, 4px of padding all round.
                      Kept present but invisible on the first stop, where
                      nothing is off yet, so every label block is the same
                      height. Once a tier is actually reached only that one
                      keeps its colour: the rest are offers not taken, so they
                      drop to grey rather than competing with the live figure. */}
                  <span
                    className={`rounded-[2px] p-1 text-[14px] leading-none font-semibold transition-colors duration-150 ${
                      stop.percentage === 0
                        ? "invisible"
                        : badgeIsLive(stop.percentage)
                          ? "bg-[var(--sprd-red-50)] text-[var(--sprd-red-600)]"
                          : "bg-[var(--sprd-neutral-100)] text-[var(--sprd-neutral-600)]"
                    }`}
                  >
                    %{stop.percentage}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Price list — the same rows as the price-details breakdown, so the two
          panels in this rail explain the figure the same way. Its rule sits
          36px below the controls: the middle band's own 24px of padding plus
          12px here. */}
      <div className="mt-3 flex flex-shrink-0 flex-col gap-2 border-t border-neutral-200 px-6 pt-4">
        {/* Only worth a row when something is printed on top of it: with a
            blank product the base price IS the per-item price below. */}
        {printAreas.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Product base price</span>
              <span>{fmt(basePrice)} €</span>
            </div>
            {/* One self-explaining row per area — "Front printing cost" —
                rather than a heading with the view names indented under it. */}
            {printAreas.map(area => (
              <div key={area.id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {area.name} {printAreaCostLabel}
                </span>
                <span>{area.price === 0 ? "Free" : `${fmt(area.price)} €`}</span>
              </div>
            ))}
            {/* Only what carries a price — a free upload or text is not listed. */}
            {designCost > 0 && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Exclusive design cost</span>
                <span>{fmt(designCost)} €</span>
              </div>
            )}
          </>
        )}
        {/* Always shown, at every quantity — the panel's height then never
            changes as the stepper passes 1. The rule only separates it from the
            rows above it: with a blank product there are none, so it would
            float alone under the header. */}
        <div
          className={`flex items-center justify-between gap-3 text-[14px] font-medium text-[#6A6A6A] ${
            printAreas.length > 0 ? "mt-1 border-t border-neutral-200 pt-3" : ""
          }`}
        >
          <span>Per item</span>
          <span className="flex items-baseline gap-2 whitespace-nowrap">
            {pct > 0 && (
              <span className="text-[14px] leading-none text-[#6A6A6A] line-through">{fmt(unitPrice)}</span>
            )}
            <span className={`font-semibold ${pct > 0 ? "text-red-600" : "text-black"}`}>
              {fmt(discountedUnit)} €
            </span>
          </span>
        </div>
      </div>

      {/* The order total stays in view while the panel scrolls, so it is a
          child of the panel ROOT rather than of the price list: a sticky box
          can only travel inside its own parent, and pinned inside the list it
          scrolled away with it as soon as the popover got short.
          The border is kept present-but-transparent so toggling it never
          shifts layout. Until the panel actually scrolls it reads as an
          ordinary row — no rule, and only the list's own 8px above it. */}
      <div
        className={`sticky bottom-0 flex flex-shrink-0 items-center justify-between gap-3 border-t bg-white px-6 pb-6 ${
          // As a footer it is padded evenly, 24px top and bottom, on the
          // panel's own edge grid.
          scrollable ? "pt-6" : "pt-2"
        } ${scrollable && atEnd ? "border-neutral-200" : "border-transparent"}`}
      >
        {/* The scroll shadow itself: the very gradient .sizes-scroll paints at
            the size list's bottom edge — 6px of --black-alpha-50 fading to
            clear — so this edge weighs exactly what that one does. Drawn as a
            strip above the row rather than a box-shadow, which Firefox renders
            so faintly on a sticky box that it reads as absent. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full left-0 h-1.5 w-full transition-opacity duration-150"
          style={{
            background: "linear-gradient(to top, var(--black-alpha-50), #25211f00)",
            opacity: scrollable && !atEnd ? 1 : 0,
          }}
        />
        {/* Capitalised as in the size sheet's footer, which labels the same
            figure the same way — and, like it, bare: the quantity is already
            set right above. */}
        <span className="text-[14px] font-medium text-[var(--sprd-neutral-600)] uppercase">
          Total
        </span>
        {/* nowrap: a five-figure total must not break across lines. */}
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          {pct > 0 && (
            <span className="text-[14px] leading-none text-[#6A6A6A] line-through">
              {fmt(unitPrice * quantity)}
            </span>
          )}
          <span
            className={`text-[24px] leading-7 font-medium ${
              pct > 0 ? "text-red-600" : "text-black"
            }`}
          >
            {fmt(discountedUnit * quantity)} €
          </span>
        </span>
      </div>
      {/* End-of-panel sentinel — see the IntersectionObserver above. It has to
          be the LAST thing in the scrolled content, AFTER the sticky footer:
          placed before it, it came into view a footer-height early, so a panel
          with less than that left to scroll reported "at the end" from the
          start and the shadow never appeared. */}
      <div ref={setEndSentinel} aria-hidden className="h-px w-full flex-shrink-0" />
    </div>
  )
}
