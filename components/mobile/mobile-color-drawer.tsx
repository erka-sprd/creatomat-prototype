"use client"

import MobileDrawer from "@/components/mobile/mobile-drawer"
import SoldOutStrike from "@/components/sold-out-strike"

// Mobile product-color drawer — replica of create-omat's mobile appearance
// panel: a full-height bottom sheet with a centered 4-column swatch grid
// (AppearanceGridBase grid-cols-4). Picking a color applies it and closes.

export type MobileColorOption = {
    id: string
    name: string
    color: string
    /** Every size in this colour is gone — not selectable, struck through. */
    soldOut?: boolean
}

type MobileColorDrawerProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    options: MobileColorOption[]
    activeIndex: number
    onSelect: (index: number) => void
}

export default function MobileColorDrawer({
    open,
    onOpenChange,
    options,
    activeIndex,
    onSelect,
}: MobileColorDrawerProps) {
    return (
        <MobileDrawer
            open={open}
            onOpenChange={onOpenChange}
            title="Product color"
            heightClassName="h-full"
        >
            <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-[env(safe-area-inset-bottom)]">
                        <div className="grid w-full max-w-[500px] grid-cols-4 justify-center gap-3">
                            {options.map((option, index) => {
                                const active = index === activeIndex
                                const soldOut = option.soldOut === true
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        disabled={soldOut}
                                        // The dimming and the strike mean nothing to a screen
                                        // reader, which is otherwise only told the button is
                                        // disabled — so the reason goes in the label.
                                        aria-label={
                                            soldOut
                                                ? `${option.name}, out of stock`
                                                : option.name
                                        }
                                        onClick={() => {
                                            onSelect(index)
                                            onOpenChange(false)
                                        }}
                                        className={
                                            "relative flex flex-col items-center gap-1.5 rounded-lg p-2 " +
                                            // A disabled button still matches :active, so without
                                            // this guard an unselectable swatch kept the pointer
                                            // cursor and the press highlight — reading as available.
                                            (soldOut
                                                ? "cursor-not-allowed"
                                                : "cursor-pointer active:bg-neutral-100")
                                        }
                                    >
                                        <span
                                            className={
                                                "inline-block size-10 rounded-full border border-black/10 " +
                                                (active
                                                    ? "ring-2 ring-black ring-offset-2 "
                                                    : "") +
                                                // Only the swatch itself is faded, so the frame and
                                                // the strike stay crisp.
                                                (soldOut ? "opacity-60" : "")
                                            }
                                            style={{ backgroundColor: option.color }}
                                            aria-hidden
                                        />
                                        <span
                                            className={
                                                "w-full truncate text-center text-[11px] leading-tight capitalize " +
                                                (soldOut
                                                    ? "text-neutral-500"
                                                    : "text-neutral-700")
                                            }
                                        >
                                            {option.name}
                                        </span>
                                        {soldOut && <SoldOutStrike />}
                                    </button>
                                )
                            })}
                </div>
            </div>
        </MobileDrawer>
    )
}
