// A progressive blur along the top or bottom edge of the canvas — strongest
// at the edge, fading out toward the middle — under the controls that sit
// there: the editor bar, the canvas status badges and the Contact/Share pills
// at the top; the zoom pill, view switcher and dock at the bottom. Whatever of
// the product slides under them is softened, so the eye stays on the controls.
//
// One backdrop-filter can only blur uniformly, so the gradient is built from
// stacked layers: each blurs less than the one before, and its mask hands over
// to the next a little further in. Sits above the canvas scroll area (z-0)
// and under the controls (z-4/5); never takes pointer events.

// [blur px, mask stops]: opaque until `solid`, transparent from `end` (% of
// the band's height, from the edge).
const LAYERS: [number, number, number][] = [
  [24, 15, 40],
  [12, 30, 60],
  [6, 45, 80],
  [3, 60, 100],
]

// `compact` halves the band (80px mobile, 70px desktop) — for the top while
// nothing but the Contact/Share pills sits there. It grows back to full height
// when the editor bar or a canvas message arrives, on the same 300ms ease.
export function CanvasTopBlur({
  edge = "top",
  compact = false,
}: {
  edge?: "top" | "bottom"
  compact?: boolean
}) {
  const direction = edge === "top" ? "to bottom" : "to top"
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 z-[3] transition-[height] duration-300 ease-out ${
        compact ? "h-[80px] dlg:h-[70px]" : "h-[160px] dlg:h-[140px]"
      } ${edge === "top" ? "top-0" : "bottom-0"}`}
    >
      {LAYERS.map(([blur, solid, end]) => {
        const mask = `linear-gradient(${direction}, black ${solid}%, transparent ${end}%)`
        return (
          <div
            key={blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        )
      })}
    </div>
  )
}
