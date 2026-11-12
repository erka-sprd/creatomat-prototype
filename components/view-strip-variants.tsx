"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"

import { ACTIVE_LABEL_GAP_PX, LABEL_SLIDE_MS, labelNotchMask } from "@/lib/view-strip-notch"

// TEMPORARY — five takes on the desktop views strip (MergedBottomRow's
// ViewStrip), side by side on /view-strip-variants to pick from. Each keeps
// the strip itself (56px white pill, 44px circle tiles, the label in its
// notch over the active view) and changes only how the active view is shown:
//
// - glide:    a grey disc slides from tile to tile, overshooting a little
// - pop:      the active thumbnail grows and bounces; the rest sit dimmed
// - squircle: the active tile morphs from a circle to a rounded square
// - ring:     a thin black ring draws itself round the active tile
// - dot:      a small dot under the tiles springs along; the thumbnail lifts

export type ViewStripVariantId = "glide" | "pop" | "squircle" | "ring" | "dot"

type View = { id: string; name: string; image: string; photo?: boolean }

const STRIP_PADDING_PX = 6
const TILE_PX = 56 - 2 * STRIP_PADDING_PX
const THUMB_PX = TILE_PX - 12
const TILE_GAP_PX = 2
// A spring with a little overshoot — the variants' playful touch.
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)"
const STRIP_SHADOW = "drop-shadow(0 1px 2px rgb(0 0 0 / 0.05))"
// The ring variant's ring: radius, and the length it draws along.
const RING_R = TILE_PX / 2 - 1
const RING_LENGTH = 2 * Math.PI * RING_R
const DOT_PX = 5

const KEYFRAMES = `
@keyframes vs-pop { 0% { scale: 1 } 35% { scale: 0.86 } 70% { scale: 1.16 } 100% { scale: 1.1 } }
@keyframes vs-ring { from { stroke-dashoffset: ${RING_LENGTH} } to { stroke-dashoffset: 0 } }
`

export function ViewStripVariant({
  variant,
  views,
  activeViewId,
  onSelect,
}: {
  variant: ViewStripVariantId
  views: View[]
  activeViewId: string | null
  onSelect: (id: string) => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const activeView = views.find(v => v.id === activeViewId)
  // The label's size, its centre over the active tile (from the strip's left
  // edge) and the active tile's left inside the scroller (for the glide disc
  // and the dot, which scroll with the tiles).
  const [labelSize, setLabelSize] = useState<{ w: number; h: number } | null>(null)
  const [labelX, setLabelX] = useState<number | null>(null)
  const [tileLeft, setTileLeft] = useState<number | null>(null)
  const measure = () => {
    const wrapper = wrapperRef.current
    const tile = wrapper?.querySelector<HTMLElement>(`[data-view-id="${activeViewId}"]`)
    const label = labelRef.current
    if (!wrapper || !tile) return
    const t = tile.getBoundingClientRect()
    setLabelX(t.left - wrapper.getBoundingClientRect().left + t.width / 2)
    setTileLeft(tile.offsetLeft)
    if (label) setLabelSize({ w: label.offsetWidth, h: label.offsetHeight })
  }
  useLayoutEffect(() => {
    measure()
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    if (labelRef.current) observer.observe(labelRef.current)
    return () => observer.disconnect()
  }, [activeViewId, views.length, variant])

  const notchMask =
    activeView && labelSize && labelX !== null ? labelNotchMask(labelSize, labelX, false) : undefined

  return (
    <div ref={wrapperRef} className="relative">
      <style>{KEYFRAMES}</style>
      {activeView && (
        <div
          ref={labelRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full z-10 -translate-x-1/2 rounded-full bg-white px-2.5 py-1 text-xs font-semibold tracking-[0.1em] whitespace-nowrap text-black uppercase"
          style={{
            marginBottom: ACTIVE_LABEL_GAP_PX,
            left: labelX ?? "50%",
            transition: `left ${LABEL_SLIDE_MS}ms ease-out`,
          }}
        >
          {activeView.name}
        </div>
      )}
      <div style={{ filter: STRIP_SHADOW }}>
        <div className="relative h-14 overflow-hidden rounded-full bg-white" style={notchMask}>
          <div
            ref={scrollerRef}
            onScroll={measure}
            className="no-scrollbar relative flex h-full overflow-x-auto scroll-smooth"
            style={{ padding: STRIP_PADDING_PX, gap: TILE_GAP_PX }}
          >
            {variant === "glide" && tileLeft !== null && (
              <span
                aria-hidden="true"
                className="absolute rounded-full bg-[var(--sprd-neutral-100)]"
                style={{
                  top: STRIP_PADDING_PX,
                  left: tileLeft,
                  width: TILE_PX,
                  height: TILE_PX,
                  transition: `left 450ms ${SPRING}`,
                }}
              />
            )}
            {variant === "dot" && tileLeft !== null && (
              <span
                aria-hidden="true"
                className="absolute rounded-full bg-black"
                style={{
                  bottom: 3,
                  left: tileLeft + TILE_PX / 2 - DOT_PX / 2,
                  width: DOT_PX,
                  height: DOT_PX,
                  transition: `left 450ms ${SPRING}`,
                }}
              />
            )}
            {views.map(view => (
              <Tile
                key={view.id}
                variant={variant}
                view={view}
                selected={view.id === activeViewId}
                onSelect={() => onSelect(view.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Tile({
  variant,
  view,
  selected,
  onSelect,
}: {
  variant: ViewStripVariantId
  view: View
  selected: boolean
  onSelect: () => void
}) {
  const { tileClass, tileStyle, thumbClass, thumbStyle } = tileLook(variant, selected)
  return (
    <button
      type="button"
      data-view-id={view.id}
      aria-label={view.name}
      aria-current={selected}
      onClick={onSelect}
      className={`group relative flex shrink-0 cursor-pointer items-center justify-center ${tileClass}`}
      style={{ width: TILE_PX, height: TILE_PX, ...tileStyle }}
    >
      {variant === "ring" && selected && (
        // Mounted only on the active tile, so it draws in on every pick.
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -rotate-90"
          viewBox={`0 0 ${TILE_PX} ${TILE_PX}`}
        >
          <circle
            cx={TILE_PX / 2}
            cy={TILE_PX / 2}
            r={RING_R}
            fill="none"
            stroke="black"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            style={{ animation: `vs-ring 500ms ease-out both` }}
          />
        </svg>
      )}
      <span
        className={`relative block ${view.photo ? "overflow-hidden rounded-full" : ""} ${thumbClass}`}
        style={{ width: THUMB_PX, height: THUMB_PX, ...thumbStyle }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={view.image} alt="" className="size-full object-contain" draggable={false} />
      </span>
    </button>
  )
}

// How a tile and its thumbnail look, selected or not, per variant.
function tileLook(
  variant: ViewStripVariantId,
  selected: boolean
): { tileClass: string; tileStyle?: CSSProperties; thumbClass?: string; thumbStyle?: CSSProperties } {
  const hover = "hover:bg-[var(--sprd-neutral-50)]"
  switch (variant) {
    case "glide":
      // The disc behind does the showing; the tile stays see-through.
      return { tileClass: `rounded-full ${selected ? "" : hover}` }
    case "pop":
      return {
        tileClass: `rounded-full ${selected ? "bg-[var(--sprd-neutral-100)]" : hover}`,
        thumbClass: selected ? "" : "opacity-60 transition-opacity group-hover:opacity-100",
        // The animation is set only while selected, so it plays on every pick.
        thumbStyle: selected
          ? { scale: 1.1, animation: `vs-pop 420ms ${SPRING} both` }
          : { scale: 1, transition: `scale 300ms ${SPRING}` },
      }
    case "squircle":
      return {
        tileClass: selected ? "border border-transparent" : `border border-transparent ${hover}`,
        tileStyle: {
          borderRadius: selected ? 14 : TILE_PX / 2,
          transition: `border-radius 400ms ${SPRING}`,
          ...(selected
            ? {
                background:
                  "linear-gradient(var(--sprd-neutral-100), var(--sprd-neutral-100)) padding-box, linear-gradient(to top, var(--sprd-neutral-300), white) border-box",
              }
            : {}),
        },
      }
    case "ring":
      return { tileClass: `rounded-full ${selected ? "bg-[var(--sprd-neutral-50)]" : hover}` }
    case "dot":
      return {
        tileClass: `rounded-full ${selected ? "" : hover}`,
        thumbStyle: {
          translate: selected ? "0 -3px" : "0 0",
          transition: `translate 400ms ${SPRING}`,
        },
      }
  }
}
