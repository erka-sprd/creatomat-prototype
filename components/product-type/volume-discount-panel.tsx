"use client"

import { useEffect, useState } from "react"

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

// Entrance of the split panel, 500ms end to end, in two steps: the artwork
// column starts at zero width with the calculator using the full panel and
// expands to its half, pushing the calculator across; only once that has landed
// does the illustration scale up, with a slight bounce.
const PUSH_MS = 300
const ART_MS = 200

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
  // What the user is typing, while they are typing. null means "show the
  // committed quantity". Without this the field could never be cleared: every
  // keystroke was clamped to the minimum, so deleting "1" put "1" straight
  // back and typing "30" was impossible.
  const [draft, setDraft] = useState<string | null>(null)

  const handleInputChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "")
    if (digits === "") {
      // Allowed to stand empty while editing; blur decides what it means.
      setDraft("")
      return
    }
    const next = Math.min(VOLUME_DISCOUNT_MAX_QUANTITY, Number(digits))
    setDraft(String(next))
    // 0 is only ever an intermediate state (e.g. before typing "0" + "5"), so
    // it is not committed — blur resolves it.
    if (next >= MIN_QUANTITY) onQuantityChange(next)
  }

  // Empty or 0 on the way out reverts to the minimum; anything else is already
  // committed.
  const handleBlur = () => {
    if (draft !== null && (draft === "" || Number(draft) < MIN_QUANTITY)) {
      onQuantityChange(MIN_QUANTITY)
    }
    setDraft(null)
  }

  const stepButton = (dir: -1 | 1) => (
    <button
      type="button"
      onClick={() => {
        // Stepping abandons whatever was half-typed.
        setDraft(null)
        onQuantityChange(
          Math.min(VOLUME_DISCOUNT_MAX_QUANTITY, Math.max(MIN_QUANTITY, quantity + dir))
        )
      }}
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
          value={draft ?? String(quantity)}
          onChange={e => handleInputChange(e.target.value)}
          onBlur={handleBlur}
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
  /** override when the panel renders twice on one screen — ids must stay unique */
  fieldId?: string
  /** two-column layout for the wide in-grid copy: illustration in one half,
      title and calculator together in the other */
  split?: boolean
  className?: string
}

export default function VolumeDiscountPanel({
  quantity,
  onQuantityChange,
  onUpdatePrices,
  isUpdating = false,
  fieldId = QUANTITY_FIELD_ID,
  split = false,
  className,
}: VolumeDiscountPanelProps) {
  // The split panel mounts with the artwork column collapsed and expands it on
  // the next frame, so the drawer opening plays the reveal. Two frames, because
  // the collapsed state has to be painted before the transition can run from it.
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    if (!split) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setRevealed(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [split])

  // Headline stays black — the red ground already carries the discount
  // signal, so red type on it read as over-emphasis. Both lines share one
  // type treatment so the block reads as a single headline.
  const headline = (
    // Split gives the title 12px more air below it than the narrow sidebar copy,
    // which sits directly above its calculator.
    <div className={cn("font-display text-xl font-bold text-black", split ? "mb-6" : "mb-3")}>
      <p>Calculate</p>
      <p>volume discounts</p>
    </div>
  )

  const calculator = (
    <>
      <div className="mb-3 flex flex-col">
        <label htmlFor={fieldId} className="mb-2 text-sm">
          Order quantity
        </label>
        <QuantityField
          id={fieldId}
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
    </>
  )

  return (
    <div
      // #F8C6C4 is #DC2626 at 20% already composited over the #FFEEEB ground.
      // Using the flat value rather than an alpha keeps the frame and the
      // stepper identical — with alpha the stepper blends into its white fill
      // instead and renders visibly lighter.
      className={cn(
        "flex border border-[#F8C6C4]",
        // Split: both columns stretch to the panel height so the calculator can
        // centre. No left padding — the artwork column runs to the panel edge,
        // so the padding lives on the other three sides only.
        split ? "flex-row items-stretch py-6 pr-6" : "flex-col p-6",
        className
      )}
      style={{
        // #FFEEEB is already the light tint, so it is used as-is rather than
        // mixed down the way the purple was.
        backgroundColor: PANEL_BG,
      }}
    >
      {split ? (
        <>
          {/* Artwork column: the illustration sits centred in both axes and is
              capped so it never outgrows the column or the panel height. It
              carries its own 24px side padding — the panel drops its left
              padding for this column, and keeping the inset symmetric here
              leaves the image centred. Width and padding animate together, so
              the collapsed column takes up no space at all on the way in. */}
          <div
            className={cn(
              "flex shrink-0 items-center justify-center transition-[width,padding] ease-out motion-reduce:transition-none",
              revealed ? "w-1/2 px-8" : "w-0 px-0"
            )}
            style={{ transitionDuration: `${PUSH_MS}ms` }}
          >
            {/* Scales up only after the push has landed, so the overshoot plays
                against a column that has stopped moving and stays inside its
                padding — the bounce never laps the calculator. */}
            <img
              src="/images/volume-discount-illustration.png"
              alt=""
              className={cn(
                // Tailwind v4's scale-* utilities set the standalone `scale`
                // property, not `transform` — transition-transform would never
                // fire on them.
                "max-h-full max-w-full object-contain transition-[scale] motion-reduce:transition-none",
                revealed ? "scale-100" : "scale-0"
              )}
              style={{
                transitionDuration: `${ART_MS}ms`,
                transitionDelay: `${PUSH_MS}ms`,
                transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
              }}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            {headline}
            {calculator}
          </div>
        </>
      ) : (
        <>
          {headline}
          {calculator}
        </>
      )}
    </div>
  )
}
