import { cn } from "@/lib/utils"

// Sold-out swatch treatment, ported from create-omat's AppearanceItem: a thin
// neutral frame around the swatch with a hairline diagonal struck across it.
//
// Spans the whole padding box of the (position: relative) swatch button, so on
// mobile the strike crosses the colour and its name label together. Absolute,
// so it costs no layout: a sold-out swatch is exactly the size of an available
// one.
//
// `to bottom right` is load-bearing: for corner keywords CSS angles the
// gradient so its 50% band passes through the *other* two corners, which puts
// the hairline on the top-right/bottom-left diagonal at any aspect ratio —
// needed because a swatch tile with a name label is taller than it is wide.
// Swap the keyword and the strike flips direction.
export default function SoldOutStrike({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[8px] border border-neutral-300 text-neutral-400",
        "bg-[linear-gradient(to_bottom_right,transparent_calc(50%_-_0.5px),currentColor_calc(50%_-_0.5px),currentColor_calc(50%_+_0.5px),transparent_calc(50%_+_0.5px))]",
        className
      )}
    />
  )
}
