"use client"

import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { KitButton } from "@/components/kit-button"
import { VOLUME_DISCOUNT_MAX_QUANTITY } from "@/lib/volume-discount"

// Replica of create-omat's DesktopVolumeDiscountPanel + VolumeDiscountQuantityField
// (size m): light-purple brand-blue-contrast box with headline, quantity
// stepper and an "Update prices" kit button. The live stepper value only takes
// effect when the button is pressed, like production.

const QUANTITY_FIELD_ID = "volume-discount-order-quantity"
const MIN_QUANTITY = 1

// kit --brand-blue-contrast
const PANEL_BG = "#bfb9fd"

type QuantityFieldProps = {
  id?: string
  quantity: number
  onQuantityChange: (value: number) => void
}

function QuantityField({ id, quantity, onQuantityChange }: QuantityFieldProps) {
  const handleInputChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "")
    // Empty/0 snaps to the minimum; a pasted huge number clamps to the maximum.
    const next = Math.min(VOLUME_DISCOUNT_MAX_QUANTITY, Math.max(MIN_QUANTITY, Number(digits)))
    onQuantityChange(next)
  }

  const stepButton = (dir: -1 | 1) => (
    <button
      type="button"
      onClick={() =>
        onQuantityChange(
          Math.min(VOLUME_DISCOUNT_MAX_QUANTITY, Math.max(MIN_QUANTITY, quantity + dir))
        )
      }
      disabled={dir === -1 ? quantity <= MIN_QUANTITY : quantity >= VOLUME_DISCOUNT_MAX_QUANTITY}
      aria-label={dir === -1 ? "Decrease quantity" : "Increase quantity"}
      className={cn(
        "flex h-full w-12 cursor-pointer items-center justify-center hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40",
        dir === -1 ? "border-r border-neutral-200" : "border-l border-neutral-200"
      )}
    >
      {dir === -1 ? <Minus className="size-4" /> : <Plus className="size-4" />}
    </button>
  )

  return (
    <div className="flex h-10 w-full items-stretch border border-neutral-200 bg-white">
      {stepButton(-1)}
      <div className="flex flex-1 items-stretch border-2 border-transparent focus-within:border-black">
        <input
          id={id}
          name={id}
          type="text"
          inputMode="numeric"
          value={quantity}
          onChange={e => handleInputChange(e.target.value)}
          aria-label="Order quantity"
          className="w-full min-w-0 border-0 bg-transparent px-2 text-center font-bold focus:outline-none"
        />
      </div>
      {stepButton(1)}
    </div>
  )
}

type VolumeDiscountPanelProps = {
  quantity: number
  onQuantityChange: (value: number) => void
  maxDiscountPercentage: number
  onUpdatePrices: () => void
  isUpdating?: boolean
}

export default function VolumeDiscountPanel({
  quantity,
  onQuantityChange,
  maxDiscountPercentage,
  onUpdatePrices,
  isUpdating = false,
}: VolumeDiscountPanelProps) {
  return (
    <div
      className="flex flex-col border p-6"
      style={{
        backgroundColor: `color-mix(in srgb, ${PANEL_BG} 30%, transparent)`,
        borderColor: PANEL_BG,
      }}
    >
      <div className="mb-3">
        <p className="font-display text-2xl font-bold">Up to {maxDiscountPercentage}%</p>
        <p className="font-display text-lg font-medium">Volume discounts</p>
      </div>
      <div className="mb-3 flex flex-col">
        <label htmlFor={QUANTITY_FIELD_ID} className="mb-2 text-sm">
          Order quantity
        </label>
        <QuantityField
          id={QUANTITY_FIELD_ID}
          quantity={quantity}
          onQuantityChange={onQuantityChange}
        />
      </div>
      <KitButton
        size="l"
        className="w-full font-semibold"
        onClick={onUpdatePrices}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <span className="flex items-center justify-center">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
          </span>
        ) : (
          "Update prices"
        )}
      </KitButton>
      <p className="mt-4 text-xs font-medium">
        Prices are per item for an order of {quantity} {quantity === 1 ? "product" : "products"}.
        Excl. printing.
      </p>
    </div>
  )
}
