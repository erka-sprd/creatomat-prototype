"use client"

import { useCallback, useEffect, useRef, useState, type DependencyList } from "react"

// A row that scrolls sideways when it doesn't fit, with a chevron at whichever
// end still has content behind it — 120px a click, smooth. Both chevrons go
// once there's room. First built for the editor bar (EditorBarShell); shared
// so every overflowing row in the designer behaves the same.

/** Step a chevron click scrolls by. */
export const SCROLL_STEP_PX = 120

/**
 * Overflow state for a horizontal scroller. Put `ref` and `onScroll` on the
 * scrolling element; `deps` are what can change its content (re-checked then,
 * as well as on window resize).
 */
export function useHorizontalOverflow(deps: DependencyList = [], step = SCROLL_STEP_PX) {
  const ref = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  // Re-check when the items change, not only on mount: a row gains and loses
  // items, and that alone can make it overflow.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(onScroll, [onScroll, ...deps])

  useEffect(() => {
    window.addEventListener("resize", onScroll)
    return () => window.removeEventListener("resize", onScroll)
  }, [onScroll])

  const scrollBy = useCallback(
    (dir: "left" | "right") => {
      ref.current?.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" })
    },
    [step]
  )

  return { ref, onScroll, canScrollLeft, canScrollRight, scrollBy }
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.29289 8.29289C5.65338 7.93241 6.22061 7.90468 6.6129 8.2097L6.70711 8.29289L12 13.585L17.2929 8.29289C17.6534 7.93241 18.2206 7.90468 18.6129 8.2097L18.7071 8.29289C19.0676 8.65338 19.0953 9.22061 18.7903 9.6129L18.7071 9.70711L12.7071 15.7071C12.3466 16.0676 11.7794 16.0953 11.3871 15.7903L11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * The chevron at one end of the row: absolute, full height, white, with a
 * hairline between it and the content. `rounded` is the end's corner rounding
 * — the editor bar is a pill, other rows square off less.
 */
export function ScrollChevron({
  dir,
  onClick,
  rounded = "rounded-full",
}: {
  dir: "left" | "right"
  onClick: () => void
  rounded?: string
}) {
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      className={
        "absolute top-0 z-10 flex h-full flex-shrink-0 cursor-pointer items-center bg-white hover:bg-neutral-100 " +
        (dir === "left"
          ? `-left-0.5 border-r border-neutral-200 ${rounded.replace(/rounded-/g, "rounded-l-")}`
          : `-right-0.5 border-l border-neutral-200 ${rounded.replace(/rounded-/g, "rounded-r-")}`)
      }
    >
      <span className="p-2">
        <Chevron className={dir === "left" ? "rotate-90" : "-rotate-90"} />
      </span>
    </button>
  )
}

// The product colour row's style (designer.tsx, #color-buttons-row): a round
// white chevron button centred on the row's end, half outside it, over a
// fade from the row's background at that end. Place both in a `relative`
// wrapper around the scroller — outside anything that clips.

/** Step the colour row's chevrons scroll by. */
export const COLOR_ROW_SCROLL_STEP_PX = 100

export function FloatingScrollChevron({
  dir,
  onClick,
  offsetPx = -16,
}: {
  dir: "left" | "right"
  onClick: () => void
  /**
   * From the row's end: -16 (the colour row) hangs it half outside; a row
   * with neighbours close by sets it inside, over its fade.
   */
  offsetPx?: number
}) {
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      className="absolute top-1/2 z-[20] flex h-[32px] w-[32px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#DEDEDE] bg-white shadow-sm"
      style={dir === "left" ? { left: offsetPx } : { right: offsetPx }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d={dir === "left" ? "M8.75 3.5L5.25 7L8.75 10.5" : "M5.25 3.5L8.75 7L5.25 10.5"}
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/**
 * A blur at one end instead of a fade: what scrolls under the last `widthPx`
 * is blurred, fully at the edge and easing off inward (a gradient mask on a
 * backdrop blur).
 */
export function ScrollBlur({
  dir,
  widthPx = 64,
  blurPx = 4,
}: {
  dir: "left" | "right"
  widthPx?: number
  blurPx?: number
}) {
  const mask = `linear-gradient(to ${dir === "left" ? "right" : "left"}, #000, transparent)`
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-0 z-[10] h-full ${dir === "left" ? "left-0" : "right-0"}`}
      style={{
        width: widthPx,
        backdropFilter: `blur(${blurPx}px)`,
        WebkitBackdropFilter: `blur(${blurPx}px)`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  )
}

/** The fade at one end, 64px, from `color` (the row's background) to clear. */
export function ScrollFade({
  dir,
  color,
  className = "",
}: {
  dir: "left" | "right"
  color: string
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-0 z-[10] h-full w-[64px] ${
        dir === "left" ? "left-0" : "right-0"
      } ${className}`}
      style={{
        background: `linear-gradient(to ${dir === "left" ? "left" : "right"}, transparent, ${color})`,
      }}
    />
  )
}
