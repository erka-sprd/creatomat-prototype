"use client"

// Replicas of create-omat's mobile colour swatches
// (src/components/ui/mobile-edit/ColorBubbles.tsx): the 32px bubble with its
// tone-aware active ring and check, and the rainbow bubble that opens the
// custom picker, remembering the last custom colour as its centre dot.
// create-omat wraps these in kit tooltips — hover-only, so nothing is lost on
// a touch surface and they are left off here.

// create-omat's mobile text palette (COLOR_PALETTE in src/lib/Constants.ts),
// verbatim: four rows light → dark, laid out by an 8-column grid.
export const COLOR_PALETTE = [
    // Row 1: Lightest shades
    "#FFFFFF",
    "#B8C9FF",
    "#FFBBE2",
    "#FFBABB",
    "#FFE3BD",
    "#FAECBC",
    "#D7F4D0",
    "#AEF1FA",
    // Row 2: Medium-light shades
    "#E3E3E3",
    "#88A6FC",
    "#FF94D2",
    "#FF9495",
    "#FFD299",
    "#FFE899",
    "#B6F2AB",
    "#1BE5FF",
    // Row 3: Medium-dark shades
    "#9C9C9C",
    "#3669F8",
    "#FF5EB9",
    "#FF4E50",
    "#FFB55A",
    "#FFD95E",
    "#85DC77",
    "#1EC5DB",
    // Row 4: Darkest shades
    "#000000",
    "#0027BF",
    "#B5095E",
    "#BD060B",
    "#CF6F1E",
    "#B28217",
    "#298C27",
]

/** create-omat's isColorDarkTone, on hex: perceived luminance under half. */
export function isDarkTone(hex: string): boolean {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
    if (!m) return false
    const n = parseInt(m[1], 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return 0.299 * r + 0.587 * g + 0.114 * b < 128
}

function CheckIcon({ className = "" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}

export function ColorBubble({
    color,
    isActive,
    onClick,
}: {
    color: string
    isActive: boolean
    onClick: () => void
}) {
    const dark = isDarkTone(color)
    return (
        <button
            type="button"
            aria-label={`Color ${color}`}
            onClick={onClick}
            className={
                "relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/20 transition-all " +
                (isActive
                    ? `outline outline-offset-[-2px] ${dark ? "outline-white" : "outline-black"}`
                    : "outline outline-offset-[-1px] outline-black/10")
            }
            style={{ background: color }}
        >
            {isActive && <CheckIcon className={dark ? "text-white" : "text-black"} />}
        </button>
    )
}

export function RainbowBubble({
    lastCustomColor,
    onClick,
}: {
    lastCustomColor: string | null
    onClick: () => void
}) {
    return (
        <button
            type="button"
            aria-label="Choose custom color"
            onClick={onClick}
            className="relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all"
            style={{
                background:
                    "conic-gradient(from 90deg, rgba(43, 113, 247, 1) 0deg, rgba(254, 48, 195, 1) 83.07deg, rgba(254, 28, 31, 1) 157.5deg, rgba(244, 245, 71, 1) 240.57deg, rgba(1, 241, 87, 1) 294.23deg, rgba(102, 102, 102, 1) 360deg)",
            }}
        >
            <div
                className={
                    "rounded-full " +
                    (lastCustomColor ? "size-6 border-[3px] border-white" : "size-4 bg-white")
                }
                style={{ backgroundColor: lastCustomColor ?? "white" }}
            />
        </button>
    )
}
