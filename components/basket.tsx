"use client"

import { useEffect, useState } from "react"

import QuantityStepper from "@/components/quantity-stepper"
import { discountedPrice, volumeDiscountPercentage } from "@/lib/volume-discount"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping"

export type BasketDesignText = {
  id: string
  content: string
  x: number
  y: number
  z?: number
  color: string
  fontSize: number
  fontFamily: string
  rotation?: number
}

export type BasketDesignGraphic = {
  id: string
  src: string
  x: number
  y: number
  z?: number
  width: number
  height: number
  rotation?: number
}

export type BasketDesign = {
  textElements: BasketDesignText[]
  graphicElements: BasketDesignGraphic[]
  printAreaOverlay: { left: number; top: number; width: number; height: number }
  displayWidth: number
  displayHeight: number
}

export type BasketItem = {
  id: string
  /** Product type id — decides which volume-discount scale prices this line. */
  productId?: string
  productName: string
  appearanceName: string
  image: string
  size: string
  /** Position of the size in the product's own size list, so the basket lists
      sizes in assortment order (XS before S) rather than order of adding. */
  sizeIndex?: number
  qty: number
  price: number // unit price
  design?: BasketDesign
}

type BasketProps = {
  open: boolean
  onClose: () => void
  items: BasketItem[]
  onQuantityChange: (id: string, qty: number) => void
  onRemove: (id: string) => void
}

const fmt = (n: number) => n.toFixed(2).replace(".", ",")

/**
 * One basket row per product/colour/design — the sizes of that product are
 * listed inside it, each with its own quantity stepper, instead of every size
 * getting a row of its own. Sizes stay separate items underneath so quantity
 * and removal keep working per size.
 */
type BasketGroup = {
  key: string
  items: BasketItem[]
}

/** Same product, same colour, same design, same price = same row. */
const groupKey = (item: BasketItem) =>
  [
    item.productName,
    item.appearanceName,
    item.image,
    item.price,
    item.design ? JSON.stringify(item.design) : "no-design",
  ].join("|")

/**
 * Adds newly configured sizes to the basket. A size that is already in the
 * basket for the same product/colour/design gains quantity instead of opening a
 * second line, so "add XS" twice reads as XS × 2 in one row.
 */
export function mergeIntoBasket(existing: BasketItem[], incoming: BasketItem[]): BasketItem[] {
  const merged = [...existing]
  for (const item of incoming) {
    const at = merged.findIndex(
      candidate => groupKey(candidate) === groupKey(item) && candidate.size === item.size
    )
    if (at === -1) {
      merged.push(item)
      continue
    }
    merged[at] = { ...merged[at], qty: merged[at].qty + item.qty }
  }
  return merged
}

function groupItems(items: BasketItem[]): BasketGroup[] {
  const groups: BasketGroup[] = []
  const byKey = new Map<string, BasketGroup>()
  for (const item of items) {
    const key = groupKey(item)
    const existing = byKey.get(key)
    if (existing) {
      existing.items.push(item)
      continue
    }
    // First size of this product decides where the row sits in the basket.
    const group: BasketGroup = { key, items: [item] }
    byKey.set(key, group)
    groups.push(group)
  }
  for (const group of groups) {
    group.items.sort((a, b) => (a.sizeIndex ?? 0) - (b.sizeIndex ?? 0))
  }
  return groups
}

/** Basket line thumbnail frame — portrait, product centred inside it. */
const THUMBNAIL_WIDTH = 160
const THUMBNAIL_HEIGHT = 210

export function Basket({ open, onClose, items, onQuantityChange, onRemove }: BasketProps) {
  // Keep the panel mounted long enough to play the slide-out animation.
  const [shouldRender, setShouldRender] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (open) {
      setShouldRender(true)
      const t = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(t)
    }
    setMounted(false)
    const t = setTimeout(() => setShouldRender(false), 300)
    return () => clearTimeout(t)
  }, [open])

  if (!shouldRender) return null

  // The QUANTITY is order-level — the tier comes from the total in the basket,
  // not per line — same as create-omat, which passes the order's totalQuantity
  // to useDiscount. So adding a second size can lift the discount on everything
  // already in the basket. The PERCENTAGE that quantity buys, though, is
  // per product type: at the same total a T-shirt and a tote sit on different
  // scales, which is exactly what the API's productTypeDiscountScales returns.
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0)
  const itemDiscountPct = (item: BasketItem) =>
    volumeDiscountPercentage(itemCount, item.productId)
  // Percentage for the order summary: with a single product type it is that
  // product's, and with a mixed basket the best one any line reaches (the
  // per-line prices below stay exact either way).
  const discountPct = items.reduce((best, item) => Math.max(best, itemDiscountPct(item)), 0)
  // create-omat discounts the UNIT price and multiplies out, so the row's
  // single-item figure and the total stay consistent (20,39 € × 10 = 203,90 €).
  // Discounting the line total instead would round differently.
  const lineOriginal = (item: BasketItem) => item.price * item.qty
  const lineDiscounted = (item: BasketItem) =>
    discountedPrice(item.price, itemDiscountPct(item)) * item.qty
  const originalSubtotal = items.reduce((sum, item) => sum + lineOriginal(item), 0)
  // Summed from the rounded unit prices so the rows always add up to the subtotal.
  const subtotal = items.reduce((sum, item) => sum + lineDiscounted(item), 0)
  const savings = originalSubtotal - subtotal
  // Free over the threshold, measured on what is actually being paid — so the
  // volume discount is applied first and a basket only crosses the line on its
  // discounted total. Same figure the designer's rail promises
  // (FREE_SHIPPING_THRESHOLD).
  const shippingCost = 7.99
  const shipping =
    items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : shippingCost
  const total = subtotal + shipping

  return (
    <>
      <div
        className={`fixed inset-0 z-[9998] bg-black/40 transition-opacity duration-200 max-dlg:bg-black/80 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      {/* Desktop: right side drawer. Below dlg: bottom sheet (top/left/width
          overrides + slide-up transform), matching the other mobile sheets. */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[9999] w-[560px] max-w-[90vw] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out max-dlg:top-auto max-dlg:left-0 max-dlg:h-[85dvh] max-dlg:w-full max-dlg:max-w-none max-dlg:rounded-t-2xl ${
          mounted
            ? "translate-x-0 max-dlg:translate-y-0"
            : "translate-x-full max-dlg:translate-x-0 max-dlg:translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          {/* Below dlg the sheet header matches the kit drawer type (16px medium). */}
          <h2 className="font-display text-[20px] font-bold text-black max-dlg:text-base max-dlg:font-medium">
            Your basket
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer"
          >
            <img src="/icons/icon-close-x.svg" alt="" className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-500">
              Your basket is empty
            </div>
          ) : (
            <>
              <div className="border-t border-neutral-200">
                {groupItems(items).map(group => (
                  <BasketItemRow
                    key={group.key}
                    group={group}
                    // Every size in a group is the same product, so the group's
                    // scale is the first item's.
                    discountPct={itemDiscountPct(group.items[0])}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemove}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
                <span className="text-sm font-medium text-black">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                <span className="flex items-baseline gap-2 text-sm font-medium">
                  {discountPct > 0 && (
                    <span className="leading-none text-[#6A6A6A] line-through">
                      {fmt(originalSubtotal)} €
                    </span>
                  )}
                  <span className={discountPct > 0 ? "text-[#DC2626]" : "text-black"}>
                    {fmt(subtotal)} €
                  </span>
                </span>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex-shrink-0">
            <div className="border-t border-neutral-200 px-6 py-4">
              {/* Per create-omat: the summary shows the FULL subtotal and then
                  subtracts the discount on its own line — no strikethrough
                  here, since the saving is already stated as a figure. */}
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span>{fmt(originalSubtotal)} €</span>
              </div>
              {discountPct > 0 && (
                <div className="flex items-center justify-between text-sm mt-2 text-[#DC2626]">
                  <span>Volume discount</span>
                  <span className="whitespace-nowrap">−{fmt(savings)} €</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm mt-2">
                <span>Shipping</span>
                <span>{fmt(shipping)} €</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold mt-3">
                <span>Total</span>
                <span>{fmt(total)} €</span>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                type="button"
                className="w-full h-12 bg-[#007D38] hover:bg-[#006E31] text-white font-semibold text-sm cursor-pointer transition-colors"
              >
                To checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.9945 3.85074C15.9182 2.81588 15.0544 2 14 2H10L9.85074 2.00549C8.81588 2.08183 8 2.94564 8 4V6H5.01169H4.99054H4L3.88338 6.00673C3.38604 6.06449 3 6.48716 3 7C3 7.55228 3.44772 8 4 8H4.07987L5.00345 19.083L5.00819 19.2507C5.09634 20.7511 6.40232 22 8 22H16L16.1763 21.9949C17.7511 21.9037 19 20.5977 19 19L19.9199 8H20L20.1166 7.99327C20.614 7.93551 21 7.51284 21 7C21 6.44772 20.5523 6 20 6H16V4L15.9945 3.85074ZM14 6V4H10V6H14ZM9 8H6.08649L7 19C7 19.5128 7.38604 19.9355 7.88338 19.9933L8 20H16C16.5155 20 16.9398 19.61 16.9969 19.0414L17.0035 18.917L17.9132 8H15H9ZM10 10C10.5128 10 10.9355 10.386 10.9933 10.8834L11 11V17C11 17.5523 10.5523 18 10 18C9.48716 18 9.06449 17.614 9.00673 17.1166L9 17V11C9 10.4477 9.44772 10 10 10ZM14.9933 10.8834C14.9355 10.386 14.5128 10 14 10C13.4477 10 13 10.4477 13 11V17L13.0067 17.1166C13.0645 17.614 13.4872 18 14 18C14.5523 18 15 17.5523 15 17V11L14.9933 10.8834Z"
        fill="currentColor"
      />
    </svg>
  )
}

function BasketItemRow({
  group,
  discountPct,
  onQuantityChange,
  onRemove,
}: {
  group: BasketGroup
  /** Volume discount for this group's product, at the order's total quantity. */
  discountPct: number
  onQuantityChange: (id: string, qty: number) => void
  onRemove: (id: string) => void
}) {
  // Every size in the row shares the product's unit price, so the row states it
  // once — per create-omat, it is the single-item price, not the line total.
  const item = group.items[0]
  const original = item.price
  const discounted = discountedPrice(original, discountPct)
  // The bin empties the whole row. Each call is a functional update on the
  // parent's state, so removing several ids in a loop is safe.
  const removeGroup = () => group.items.forEach(sizeItem => onRemove(sizeItem.id))
  return (
    <div className="flex gap-4 px-6 py-4 border-b border-neutral-200">
      <div
        className="flex-shrink-0 bg-[#f5f5f5] overflow-hidden relative flex items-center justify-center"
        style={{ width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT }}
      >
        <DesignThumbnail
          design={item.design}
          image={item.image}
          alt={item.productName}
          width={THUMBNAIL_WIDTH}
          height={THUMBNAIL_HEIGHT}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex items-baseline gap-2 text-sm font-semibold">
            {discountPct > 0 && (
              <span className="leading-none font-medium text-[#6A6A6A] line-through">
                {fmt(original)} €
              </span>
            )}
            <span className={discountPct > 0 ? "text-[#DC2626]" : "text-black"}>
              {fmt(discounted)} €
            </span>
          </div>
          <button
            type="button"
            aria-label="Remove item"
            onClick={removeGroup}
            className="cursor-pointer text-neutral-700 hover:text-black"
          >
            <TrashIcon />
          </button>
        </div>
        <div className="text-sm text-black mt-1">{item.productName}</div>
        <div className="text-sm text-neutral-500 capitalize">{item.appearanceName}</div>

        {group.items.map(sizeItem => (
          <SizeQuantityRow
            key={sizeItem.id}
            item={sizeItem}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  )
}

/** One size of a basket row: the size label and its own quantity stepper. */
function SizeQuantityRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: BasketItem
  onQuantityChange: (id: string, qty: number) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between mt-3">
      <span className="text-sm font-bold text-black">{item.size}</span>
      {/* Same control as the size selector: the quantity is typeable, not just
          steppable. min=1 with onDelete, so the minus turns into a bin at the
          last item rather than stepping the size down to zero. */}
      <QuantityStepper
        quantity={item.qty}
        onChange={qty => onQuantityChange(item.id, qty)}
        min={1}
        onDelete={() => onRemove(item.id)}
        inputAriaLabel={`${item.size} quantity`}
      />
    </div>
  )
}

/**
 * Product image with the placed design composited on top, exactly as the
 * canvas lays it out. Exported because the volume-discount calculator shows
 * the same preview — the price it quotes covers that design, so the thumbnail
 * has to be the designed product, not a blank garment.
 */
export function DesignThumbnail({
  design,
  image,
  alt = "",
  width,
  height,
}: {
  design?: BasketDesign
  image: string
  alt?: string
  width: number
  height: number
}) {
  const productName = alt
  if (!design || design.displayWidth <= 0 || design.displayHeight <= 0) {
    return (
      <img
        src={image}
        alt={productName}
        className="w-full h-full object-contain"
      />
    )
  }
  const { textElements, printAreaOverlay, displayWidth, displayHeight } = design
  const graphicElements = design.graphicElements ?? []
  // Fit the rendered design into the frame's actual box — the frame is no
  // longer square, so width and height constrain the scale independently.
  const scale = Math.min(width / displayWidth, height / displayHeight)
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: displayWidth,
        height: displayHeight,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      <img
        src={image}
        alt={productName}
        className="h-full w-full object-contain pointer-events-none select-none"
      />
      <div
        style={{
          position: "absolute",
          left: `${printAreaOverlay.left}%`,
          top: `${printAreaOverlay.top}%`,
          width: `${printAreaOverlay.width}%`,
          height: `${printAreaOverlay.height}%`,
        }}
      >
        {textElements.map(el => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              zIndex: el.z,
              left: `${el.x}%`,
              top: `${el.y}%`,
              color: el.color,
              fontSize: `${el.fontSize}px`,
              fontFamily: `"${el.fontFamily}"`,
              whiteSpace: "pre",
              lineHeight: 1,
              transform: `rotate(${el.rotation ?? 0}deg)`,
              transformOrigin: "center",
            }}
          >
            {el.content}
          </div>
        ))}
        {graphicElements.map(el => (
          <img
            key={el.id}
            src={el.src}
            alt=""
            className="pointer-events-none select-none"
            style={{
              position: "absolute",
              zIndex: el.z,
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.width}%`,
              height: `${el.height}%`,
              objectFit: "contain",
              transform: `rotate(${el.rotation ?? 0}deg)`,
              transformOrigin: "center",
            }}
          />
        ))}
      </div>
    </div>
  )
}
