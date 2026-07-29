"use client"

import MobileDrawer from "@/components/mobile/mobile-drawer"

// Mobile product-color drawer — replica of create-omat's mobile appearance
// panel: a full-height bottom sheet with a centered 4-column swatch grid
// (AppearanceGridBase grid-cols-4). Picking a color applies it and closes.

export type MobileColorOption = {
    id: string
    name: string
    color: string
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
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            onSelect(index)
                                            onOpenChange(false)
                                        }}
                                        className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg p-2 active:bg-neutral-100"
                                    >
                                        <span
                                            className={
                                                "inline-block size-10 rounded-full border border-black/10 " +
                                                (active
                                                    ? "ring-2 ring-black ring-offset-2"
                                                    : "")
                                            }
                                            style={{ backgroundColor: option.color }}
                                            aria-hidden
                                        />
                                        <span className="w-full truncate text-center text-[11px] leading-tight text-neutral-700 capitalize">
                                            {option.name}
                                        </span>
                                    </button>
                                )
                            })}
                </div>
            </div>
        </MobileDrawer>
    )
}
