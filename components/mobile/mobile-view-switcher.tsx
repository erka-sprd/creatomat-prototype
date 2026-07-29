"use client"

// Mobile view switcher — exact replica of create-omat's ProductAreasMobileView
// (src/components/designer/ProductAreas.tsx): kit Chevron 28px rotated ±90°
// as prev/next, 4px black dots that grow to a 12px black-ring/white-fill dot
// when active, and the active view's label (Front/Back/…) centred underneath.

export type MobileViewOption = {
    id: string
    name: string
}

type MobileViewSwitcherProps = {
    views: MobileViewOption[]
    activeIndex: number
    onSelect: (index: number) => void
}

// The component kit's v2 Chevron glyph (points down; rotated for prev/next),
// inlined like the other kit icons in this proto.
const ChevronIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" className={className} aria-hidden>
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.29289 8.29289C5.65338 7.93241 6.22061 7.90468 6.6129 8.2097L6.70711 8.29289L12 13.585L17.2929 8.29289C17.6534 7.93241 18.2206 7.90468 18.6129 8.2097L18.7071 8.29289C19.0676 8.65338 19.0953 9.22061 18.7903 9.6129L18.7071 9.70711L12.7071 15.7071C12.3466 16.0676 11.7794 16.0953 11.3871 15.7903L11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
            fill="currentColor"
        />
    </svg>
)

export default function MobileViewSwitcher({
    views,
    activeIndex,
    onSelect,
}: MobileViewSwitcherProps) {
    if (views.length < 2) return null

    return (
        <div className="dlg:hidden absolute bottom-25 left-1/2 z-[13] flex -translate-x-1/2">
            <div className="flex items-center gap-9">
                <button
                    type="button"
                    aria-label="Previous view"
                    onClick={() => onSelect(activeIndex - 1)}
                    disabled={activeIndex <= 0}
                    className={
                        "transition-opacity " +
                        (activeIndex <= 0 ? "cursor-not-allowed opacity-50" : "opacity-100")
                    }
                >
                    <ChevronIcon className="rotate-90" />
                </button>

                <div className="flex items-start gap-1.5 pt-1">
                    {views.map((view, index) => {
                        const active = index === activeIndex
                        return (
                            <div className="flex flex-col items-start" key={view.id}>
                                <div className="group inline-flex max-w-3 min-w-1 cursor-pointer flex-col items-center gap-1">
                                    <div
                                        onClick={() => onSelect(index)}
                                        className={
                                            active
                                                ? "box-border h-3 w-3 flex-none rounded-full border-2 border-black bg-white"
                                                : "mt-1 box-border h-1 w-1 flex-none rounded-full border-2 border-transparent bg-black group-hover:border-[var(--sprd-neutral-200)]"
                                        }
                                    ></div>
                                    {active && (
                                        <p className="w-50 text-center text-xs font-semibold text-black opacity-100">
                                            {view.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <button
                    type="button"
                    aria-label="Next view"
                    onClick={() => onSelect(activeIndex + 1)}
                    disabled={activeIndex >= views.length - 1}
                    className={
                        "transition-opacity " +
                        (activeIndex >= views.length - 1
                            ? "cursor-not-allowed opacity-50"
                            : "opacity-100")
                    }
                >
                    <ChevronIcon className="-rotate-90" />
                </button>
            </div>
        </div>
    )
}
