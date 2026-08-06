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

// Volume-discount red, matching every other discount surface in the proto
// (the rail banner, the size sheet's tier line, the basket). Was the kit's
// --brand-blue-contrast purple (#bfb9fd), which read as unrelated to the
// discount it announces. Ground only — the type on it stays black.
const PANEL_BG = "#FFEEEB"

type QuantityFieldProps = {
  id?: string
  quantity: number
  onQuantityChange: (value: number) => void
  /** kit sizes: m = h-10/w-12 buttons (desktop panel), l = h-12/w-18 (mobile drawer) */
  size?: "m" | "l"
}

// The field's borders are neutral on both surfaces — the red frame around the
// desktop panel is the discount signal, the control inside it reads as an
// ordinary input.
const FIELD_BORDER = "border-neutral-200"

export function QuantityField({ id, quantity, onQuantityChange, size = "m" }: QuantityFieldProps) {
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
        "flex h-full cursor-pointer items-center justify-center hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40",
        size === "m" ? "w-12" : "w-18",
        dir === -1 ? "border-r" : "border-l",
        FIELD_BORDER
      )}
    >
      {dir === -1 ? <Minus className="size-4" /> : <Plus className="size-4" />}
    </button>
  )

  return (
    <div
      className={cn(
        "flex w-full items-stretch border bg-white",
        FIELD_BORDER,
        size === "m" ? "h-10" : "h-12"
      )}
    >
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
  onUpdatePrices: () => void
  isUpdating?: boolean
}

export default function VolumeDiscountPanel({
  quantity,
  onQuantityChange,
  onUpdatePrices,
  isUpdating = false,
}: VolumeDiscountPanelProps) {
  return (
    <div
      // #F8C6C4 is #DC2626 at 20% already composited over the #FFEEEB ground.
      // Using the flat value rather than an alpha keeps the frame and the
      // stepper identical — with alpha the stepper blends into its white fill
      // instead and renders visibly lighter.
      className="flex flex-col border border-[#F8C6C4] p-6"
      style={{
        // #FFEEEB is already the light tint, so it is used as-is rather than
        // mixed down the way the purple was.
        backgroundColor: PANEL_BG,
      }}
    >
      {/* Headline stays black — the red ground already carries the discount
          signal, so red type on it read as over-emphasis. */}
      {/* Both lines share one type treatment — the smaller/lighter of the two
          (18px medium) — so the block reads as a single headline. */}
      <div className="font-display mb-3 text-xl font-bold text-black">
        <p>Calculate</p>
        <p>volume discounts</p>
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
