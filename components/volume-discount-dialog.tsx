"use client"

import { useState } from "react"

import { QuantityField } from "@/components/product-type/volume-discount-panel"
import {
  ScopedDialog,
  ScopedDialogClose,
  ScopedDialogTitle,
} from "@/components/ui/scoped-dialog"

import {
  discountedPrice,
  majorVolumeDiscountTiers,
  volumeDiscountPercentage,
} from "@/lib/volume-discount"

// The real scale is 11 tiers deep, so — like create-omat's
// VolumeDiscountContent — show the five major thresholds rather than all of them.
const TIERS = majorVolumeDiscountTiers()

const fmt = (n: number) => n.toFixed(2).replace(".", ",")

export default function VolumeDiscountDialog({
  open,
  onOpenChange,
  unitPrice,
  container,
  productName,
  productImage,
  printingCost,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Single-item price of the product on the canvas. When given, the dialog
   * grows a second column with a quantity calculator that resolves the entered
   * quantity to live per-item and total prices. Omitted where no product is in
   * scope (e.g. the landing-page price calculator) — the dialog stays a single
   * tier-table column.
   */
  unitPrice?: number
  /** Scopes the modal (and its overlay) to this element — the designer frame. */
  container?: HTMLElement | null
  /** Product on the canvas — shown atop the calculator, so the numbers have a subject. */
  productName?: string
  productImage?: string
  /**
   * Print-area costs already contained in `unitPrice`. Subtracted here: like
   * create-omat's panel, the calculator prices the blank garment — the
   * "Excluding printing cost" note below the totals states this.
   */
  printingCost?: number
}) {
  const [quantity, setQuantity] = useState(1)
  const withCalculator = unitPrice != null
  // No "Update prices" step here: every stepper click recalculates directly.
  const pct = volumeDiscountPercentage(quantity)
  const effectiveUnit = unitPrice != null ? unitPrice - (printingCost ?? 0) : 0
  // Unit is discounted and multiplied out (create-omat/basket rounding), so
  // per-item × quantity always reconciles with the total shown below it.
  const discountedUnit = discountedPrice(effectiveUnit, pct)
  // The table row the entered quantity currently lands in (majors only — the
  // row's range runs to the next major threshold).
  const activeTierIndex = TIERS.reduce(
    (active, t, i) => (quantity >= t.from ? i : active),
    -1
  )

  return (
    <ScopedDialog
      open={open}
      onOpenChange={onOpenChange}
      container={container}
      overlayClassName="rounded-[12px]"
      className={`flex max-h-[80%] max-w-[90%] flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-xl ${
        // 700, not 760: narrowing the dialog takes the 60px off the calculator
        // column (the table track is fixed at 300px) without leaving dead
        // space inside the grid.
        withCalculator ? "w-[700px]" : "w-[480px]"
      }`}
    >
      <div className="flex items-start justify-between gap-4 p-[24px] pb-[24px]">
        <ScopedDialogTitle className="font-display min-w-0 text-[18px] leading-tight font-[800] text-black">
          Calculate volume discount
        </ScopedDialogTitle>
        <ScopedDialogClose
          aria-label="Close"
          className="shrink-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
        >
          <img src="/icons/icon-close-x.svg" alt="" className="h-6 w-6" />
        </ScopedDialogClose>
      </div>

      <div
        className={`overflow-y-auto px-[24px] pb-[24px] ${
          // Explicit widths, so each column is exactly as wide as its content
          // needs and the visible separation is only ever the 16px gap.
          // items-stretch, so the taller column sets the height and the other
          // fills it.
          withCalculator ? "grid grid-cols-[300px_1fr] items-stretch gap-4" : ""
        }`}
      >
        {/* Tier table — thresholds left, percentages right, 12px gutters. The
            row the entered quantity falls into highlights in the calculator's
            gray, tying the two columns together. */}
        {/* flex-col + flex-1 rows: when the calculator is the taller column,
            the spare height is shared evenly by the tiers instead of leaving
            dead space under the last one. */}
        <div className="flex flex-col border border-neutral-200">
          {TIERS.map((t, i) => (
            /* Clicking a tier prices its threshold: the calculator jumps to
               the row's minimum quantity. Only meaningful (and only rendered
               as a button) when the calculator column exists. */
            <button
              key={t.from}
              type="button"
              disabled={!withCalculator}
              onClick={() => setQuantity(t.from)}
              className={`flex w-full flex-1 items-center justify-between border-b border-neutral-200 px-3 py-4 text-base transition-colors duration-300 last:border-b-0 ${
                withCalculator && i === activeTierIndex ? "bg-neutral-50" : "bg-white"
              } ${withCalculator ? "cursor-pointer hover:bg-neutral-50" : ""}`}
            >
              <span className="font-normal text-black">{t.from}+ products</span>
              <span className="font-normal text-[#DC2626]">−{t.percentage}% off</span>
            </button>
          ))}
        </div>

        {withCalculator && (
          /* Calculator — quiet gray on the same border as the tier table; the
             table beside it already carries the discount red. */
          <div className="border border-neutral-200 bg-neutral-50 p-6">
            <div className="flex min-w-0 flex-col gap-4">
              {/* What is being priced: thumbnail above the name, both left
                  aligned. mb-2 on top of the column's 16px gap = 24px clear
                  below the name. */}
              {(productImage || productName) && (
                <div className="mb-2 flex flex-col gap-2">
                  {productImage && (
                    <img src={productImage} alt="" className="w-[50px] object-contain" />
                  )}
                </div>
              )}
              <div className="flex flex-col">
                <label
                  htmlFor="volume-discount-modal-quantity"
                  className="mb-2 text-sm font-semibold text-black"
                >
                  How many products?
                </label>
                <QuantityField
                  id="volume-discount-modal-quantity"
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                />
              </div>
              {/* Live result, styled like the size sheet's footer: per-item line
                  with the undiscounted value struck through, then the total. */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-[14px] text-black">
                  <span>Per item</span>
                  <span className="flex items-baseline gap-2 whitespace-nowrap">
                    {pct > 0 && (
                      <span className="text-[14px] leading-none text-[#6A6A6A] line-through">
                        {fmt(effectiveUnit)}
                      </span>
                    )}
                    <span>{fmt(discountedUnit)} €</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] text-black">Total</span>
                  {/* nowrap: a five-figure total must not break across lines. */}
                  <span className="flex items-baseline gap-2 whitespace-nowrap">
                    {pct > 0 && (
                      <span className="text-[16px] leading-none text-[#6A6A6A] line-through">
                        {fmt(effectiveUnit * quantity)}
                      </span>
                    )}
                    <span className="text-[24px] leading-7 font-medium text-black">
                      {fmt(discountedUnit * quantity)} €
                    </span>
                  </span>
                </div>
              </div>
              <p className="text-right text-[12px] text-[#6A6A6A]">Excluding printing cost</p>
            </div>
          </div>
        )}
      </div>
    </ScopedDialog>
  )
}
