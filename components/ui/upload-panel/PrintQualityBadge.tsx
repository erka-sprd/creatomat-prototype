"use client"

import { useEffect, useRef, useState } from "react"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { BEST_PRINT_SIDE_PX, pixelSizeLabel, type PrintQualityRank } from "@/lib/print-quality"
import { cn } from "@/lib/utils"

// An upload tile's print-quality badge: its rank in the rank's colour, and on
// hover a popover with the image's pixels against the size that prints best.

// How long the hover popover waits after the pointer leaves before closing.
const INFO_CLOSE_DELAY_MS = 150

// Each rank's words and colour (the warning orange, amber, the green of a good
// embroidery size): `ink` for the badge's text and chevron,
// `tone` for the badge's border — always on; hover only turns the chevron.
const RANKS: Record<PrintQualityRank, { label: string; ink: string; tone: string }> = {
    low: { label: "Low print quality", ink: "text-[#EA580C]", tone: "border-[#EA580C]" },
    moderate: {
        label: "Moderate print quality",
        ink: "text-[#CA8A04]",
        tone: "border-[#CA8A04]",
    },
    good: { label: "Good print quality", ink: "text-[#16A34A]", tone: "border-[#16A34A]" },
}

// The explanation's two facts, laid out as the size & quantity panel's
// volume-discount list (designer.tsx, the "Add … more" hint): label left,
// figure right, rows split by a hairline — in the lighter label / darker
// figure type the facts had before.
function PrintQualityFacts({ size }: { size: { w: number; h: number } | null }) {
    const rows = [
        { label: "This image", value: size ? pixelSizeLabel(size) : "…" },
        {
            label: "Best for printing",
            value: `${BEST_PRINT_SIDE_PX} × ${BEST_PRINT_SIDE_PX} px`,
        },
    ]
    return (
        <>
            {rows.map(row => (
                <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 border-b border-neutral-200 px-3 py-2 text-[13px] whitespace-nowrap last:border-b-0"
                >
                    <span className="text-neutral-600">{row.label}</span>
                    <span className="font-semibold text-black">{row.value}</span>
                </div>
            ))}
        </>
    )
}

export function PrintQualityBadge({
    rank,
    size,
    panel,
    className,
    style,
    onHoverChange,
}: {
    rank: PrintQualityRank
    size: { w: number; h: number } | null
    // The panel box the popover has to stay inside.
    panel: HTMLElement | null
    // Where the tile puts it, and any extra look (the "See details" mark).
    className?: string
    style?: React.CSSProperties
    // Pointer on the badge or off it — the tile's own hover stands down meanwhile.
    onHoverChange: (hovered: boolean) => void
}) {
    const [open, setOpen] = useState(false)
    // Opens on hover; closes INFO_CLOSE_DELAY_MS after the pointer leaves both
    // badge and popover — long enough to cross the gap between them.
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const cancelClose = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current)
        closeTimer.current = null
    }
    const openNow = () => {
        cancelClose()
        setOpen(true)
    }
    const closeSoon = () => {
        cancelClose()
        closeTimer.current = setTimeout(() => setOpen(false), INFO_CLOSE_DELAY_MS)
    }
    useEffect(() => cancelClose, [])
    const { label, ink, tone } = RANKS[rank]
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    style={style}
                    // Hover drives it, so a click neither toggles it
                    // (preventDefault stops Radix) nor reaches the tile, whose
                    // click places the image.
                    onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    onMouseEnter={() => {
                        onHoverChange(true)
                        openNow()
                    }}
                    onMouseLeave={() => {
                        onHoverChange(false)
                        closeSoon()
                    }}
                    className={cn(
                        "group/quality z-[3] flex cursor-pointer items-center gap-1 rounded-full border bg-white py-1 pr-1 pl-2 transition-[border-color]",
                        ink,
                        tone,
                        className
                    )}
                >
                    <span className="min-w-0 truncate text-xs leading-4 font-semibold">{label}</span>
                    {/* The kit's chevron, as on the volume-discount hint: down,
                        turning to point up while the popover is open —
                        `rotate`, since Tailwind v4 compiles rotate-180 to that
                        standalone property. */}
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="ml-auto shrink-0 transition-[rotate] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-data-[state=open]/quality:rotate-180"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5.29289 8.29289C5.65338 7.93241 6.22061 7.90468 6.6129 8.2097L6.70711 8.29289L12 13.585L17.2929 8.29289C17.6534 7.93241 18.2206 7.90468 18.6129 8.2097L18.7071 8.29289C19.0676 8.65338 19.0953 9.22061 18.7903 9.6129L18.7071 9.70711L12.7071 15.7071C12.3466 16.0676 11.7794 16.0953 11.3871 15.7903L11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="end"
                sideOffset={8}
                // Kept inside the panel: shifted along its edge, or flipped
                // below the badge when there's no room above, and narrowed to
                // the space Radix reports inside it.
                collisionBoundary={panel ?? undefined}
                collisionPadding={8}
                // The volume-discount list's card (designer.tsx): 12px radius,
                // 8px in, shadow, no border and no arrow — fading in and out
                // over 150ms, without the shared popover's zoom and slide.
                className="z-[100] w-max max-w-[var(--radix-popover-content-available-width)] overflow-hidden rounded-[12px] border-0 bg-white p-2 text-black shadow-lg duration-150 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 data-[side=bottom]:slide-in-from-top-0 data-[side=top]:slide-in-from-bottom-0"
                onClick={e => e.stopPropagation()}
                onMouseEnter={openNow}
                onMouseLeave={closeSoon}
                // Opened by hover, it doesn't take focus (nor hand it back to
                // the badge on close).
                onOpenAutoFocus={e => e.preventDefault()}
                onCloseAutoFocus={e => e.preventDefault()}
            >
                {/* No close button: hover drives it — leaving closes it, as
                    does a click outside. */}
                <PrintQualityFacts size={size} />
            </PopoverContent>
        </Popover>
    )
}
