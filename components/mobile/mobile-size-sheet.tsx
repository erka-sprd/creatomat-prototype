"use client"

import { MinusIcon, PlusIcon } from "@/components/mobile/icons"
import MobileDrawer from "@/components/mobile/mobile-drawer"

// Mobile size/quantity sheet — replica of create-omat's SizeSelectionDialog:
// opened by the dock's Finish button. Size-guide row on top, one quantity row
// per size, and a pinned pricing footer with the Add-to-basket CTA. State is
// the same sizeQuantities record the desktop right panel uses.

type MobileSizeSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    sizes: string[]
    quantities: Record<string, number>
    outOfStock: string[]
    onQuantityChange: (size: string, qty: number) => void
    totalSelected: number
    discountHint: string
    discountPercent: number
    formattedOriginalPrice: string
    formattedDiscountedPrice: string
    addingToBasket: boolean
    onAddToBasket: () => void
}

export default function MobileSizeSheet({
    open,
    onOpenChange,
    sizes,
    quantities,
    outOfStock,
    onQuantityChange,
    totalSelected,
    discountHint,
    discountPercent,
    formattedOriginalPrice,
    formattedDiscountedPrice,
    addingToBasket,
    onAddToBasket,
}: MobileSizeSheetProps) {
    return (
        <MobileDrawer
            open={open}
            onOpenChange={onOpenChange}
            title="Select size and quantity"
            heightClassName="h-full max-h-[calc(100%-24px)]"
        >
                    {/* Size guide row */}
                    <div className="flex shrink-0 items-center justify-end border-b border-neutral-200 px-6 py-3">
                        <button
                            type="button"
                            className="cursor-pointer text-sm text-black underline underline-offset-4"
                            onClick={e => e.preventDefault()}
                        >
                            Size guide
                        </button>
                    </div>

                    {/* Quantity rows */}
                    <div
                        className={
                            "flex-1 overflow-y-auto " +
                            (addingToBasket ? "pointer-events-none opacity-50" : "")
                        }
                    >
                        {sizes.map(label => {
                            const isOOS = outOfStock.includes(label)
                            const qty = quantities[label] ?? 0
                            return (
                                <div
                                    key={label}
                                    className="flex items-center justify-between gap-2 border-b border-neutral-200 px-6 py-3"
                                >
                                    <span
                                        className={
                                            "text-md font-bold text-black " +
                                            (isOOS ? "opacity-30" : "")
                                        }
                                    >
                                        {label}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        {isOOS && (
                                            <span className="text-sm text-[var(--sprd-neutral-700)]">
                                                Out of stock
                                            </span>
                                        )}
                                        <div
                                            className={
                                                "flex w-fit items-center border border-neutral-200 " +
                                                (isOOS ? "pointer-events-none opacity-60" : "")
                                            }
                                        >
                                            <button
                                                type="button"
                                                aria-label={`Decrease ${label} quantity`}
                                                disabled={qty <= 0}
                                                onClick={() => onQuantityChange(label, qty - 1)}
                                                className="cursor-pointer border-r border-neutral-200 p-2 active:bg-neutral-100 disabled:pointer-events-none disabled:opacity-50"
                                            >
                                                <MinusIcon className="size-5" />
                                            </button>
                                            <span className="w-12 text-center text-sm font-semibold text-black tabular-nums">
                                                {qty}
                                            </span>
                                            <button
                                                type="button"
                                                aria-label={`Increase ${label} quantity`}
                                                onClick={() => onQuantityChange(label, qty + 1)}
                                                className="cursor-pointer border-l border-neutral-200 p-2 active:bg-neutral-100"
                                            >
                                                <PlusIcon className="size-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Pricing footer */}
                    <div className="shrink-0 border-t border-neutral-200 px-6 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
                        <div className="mb-2 text-[13px] font-medium text-[#DC2626]">
                            {discountHint}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                {totalSelected >= 5 && discountPercent > 0 && (
                                    <span className="text-[12px] font-medium text-[#6A6A6A] line-through">
                                        {formattedOriginalPrice} €
                                    </span>
                                )}
                                <span
                                    className={
                                        "text-[22px] leading-7 font-medium " +
                                        (totalSelected >= 5 && discountPercent > 0
                                            ? "text-[#DC2626]"
                                            : "text-black")
                                    }
                                >
                                    {formattedDiscountedPrice} €
                                </span>
                                <span className="text-[12px] text-neutral-500">
                                    {totalSelected > 1 ? `${totalSelected} items` : "incl. VAT"}
                                </span>
                            </div>
                            <button
                                type="button"
                                disabled={addingToBasket}
                                onClick={onAddToBasket}
                                className={
                                    "flex h-12 flex-1 items-center justify-center px-6 font-sans text-[14px] font-semibold text-white transition-colors " +
                                    (addingToBasket
                                        ? "cursor-not-allowed bg-black"
                                        : totalSelected === 0
                                          ? "cursor-not-allowed bg-[#999]"
                                          : "cursor-pointer bg-black active:bg-[#333]")
                                }
                            >
                                {addingToBasket ? "Adding…" : "Add to basket"}
                            </button>
                        </div>
                    </div>
        </MobileDrawer>
    )
}
