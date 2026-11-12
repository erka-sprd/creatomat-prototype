"use client"

/**
 * The embroidery handoff's shared pieces: the catalogue product its scenes
 * sit on, the green hoop guide lifted from components/designer.tsx, the drawn
 * cursor, the Auto play switch and the beat loop. The scenes themselves are in
 * embroidery-scene.tsx (the engine) and embroidery-scripts.tsx (the scripts).
 */

import { useEffect, useRef, useState } from "react"
import { getPrintAreaOverlay, getProductType } from "product-catalog-client"
import { HOOP_ARROW_MIN_RATIO_GAP, isLightProductColor } from "@/lib/designer-constants"
import { CursorHand } from "@/components/handoff/rail-replica"
import KitSwitch from "@/components/kit-switch"
import { loadCatalog } from "@/lib/catalog"
import { embroideryHoopFrameFraction } from "@/lib/embroidery-limits"

export const TSHIRT_ID = "812" // Men's Premium Organic T-Shirt — the designer's default
const PRODUCT_COLOR = "white"

export type Corner = "nw" | "ne" | "sw" | "se"
export const CORNERS: Corner[] = ["nw", "ne", "sw", "se"]

/* ------------------------------------------------------------------- data */

export type CanvasProduct = {
  image: string
  /** The print area on the product shot, percent of it. */
  area: { left: number; top: number; width: number; height: number }
  /** The print area's real width, mm. */
  widthMm: number
  /** The hoop frame's share of the print area's width and height. */
  hoop: number
  /** White / near-white: its image gets the designer's light-product shadow. */
  light: boolean
  /** Its colour, as the catalogue names it and paints its swatch. */
  colorName: string
  colorHex: string
}

/**
 * The designer's default product in `color` (a catalogue colour name; white
 * unless a handoff asks otherwise), its front print area and its hoop frame;
 * null until loaded.
 */
export function useCanvasProduct(id = TSHIRT_ID, color = PRODUCT_COLOR): CanvasProduct | null {
  const [product, setProduct] = useState<CanvasProduct | null>(null)
  useEffect(() => {
    let live = true
    loadCatalog()
      .then(catalog => {
        const p = getProductType(catalog.products, id)
        const view = p?.views[0]
        if (!p || !view) return
        const appearance =
          p.appearances.find(a => a.name.trim().toLowerCase() === color) ?? p.appearances[0]
        const image = appearance?.views.find(v => v.id === view.id)?.image
        const area = getPrintAreaOverlay(p, view.id)
        // The view's print area, found as getPrintAreaOverlay finds it.
        const printAreaId = view.viewMaps[0]?.printAreaId
        const widthMm = p.printAreas.find(pa => pa.id === printAreaId)?.boundary.width
        const hoop = embroideryHoopFrameFraction(p.name)
        const light = isLightProductColor(appearance?.color)
        if (live && appearance && image && area && widthMm && hoop !== null) {
          setProduct({
            image,
            area,
            widthMm,
            hoop,
            light,
            colorName: appearance.name.trim(),
            colorHex: appearance.color,
          })
        }
      })
      // A document should degrade, not break: the demos just stay empty.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [id, color])
  return product
}

/** Each image's height over its width, once loaded (missing until then). */
export function useAspects(srcs: string[]) {
  const [aspects, setAspects] = useState<Record<string, number>>({})
  const key = srcs.join("|")
  useEffect(() => {
    let live = true
    for (const src of new Set(srcs)) {
      const img = new Image()
      img.onload = () => {
        if (live) setAspects(a => ({ ...a, [src]: img.naturalHeight / img.naturalWidth }))
      }
      img.src = src
    }
    return () => {
      live = false
    }
    // `key` stands for the list's contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return aspects
}

/* ------------------------------------------------------------------ pieces */

/**
 * The striped guide at the hoop-frame size, `ratio` of the design's own box,
 * pinned to the corner opposite `corner` — and the arrow from the dragged
 * corner to the guide's matching one. designer.tsx's hoopGuideShapes, for a
 * guide drawn in the design's whole box.
 */
export function HoopGuide({ corner, ratio, id }: { corner: Corner; ratio: number; id: string }) {
  const dx = corner.endsWith("e") ? 1 : 0
  const dy = corner.startsWith("s") ? 1 : 0
  const a = { x: 1 - dx, y: 1 - dy }
  const g = { x: a.x + ratio * (dx - a.x), y: a.y + ratio * (dy - a.y) }
  const pct = (v: number) => `${v * 100}%`
  const marker = `ho-hoop-arrow-${id}-${corner}`
  return (
    <>
      <span
        aria-hidden="true"
        className="hoop-guide-stripes pointer-events-none absolute z-20 border border-[#16A34A]"
        style={{
          left: pct(Math.min(a.x, g.x)),
          top: pct(Math.min(a.y, g.y)),
          width: pct(Math.abs(g.x - a.x)),
          height: pct(Math.abs(g.y - a.y)),
        }}
      />
      {ratio < 1 - HOOP_ARROW_MIN_RATIO_GAP && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
        >
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10 z" fill="#15803D" />
            </marker>
          </defs>
          <line
            x1={pct(dx)}
            y1={pct(dy)}
            x2={pct(g.x)}
            y2={pct(g.y)}
            stroke="#15803D"
            strokeWidth={2}
            strokeLinecap="round"
            markerEnd={`url(#${marker})`}
          />
        </svg>
      )}
    </>
  )
}

/** The drawn hand: its fingertip (11,3 in the glyph's box) lands on (x, y). */
export function DemoCursor({
  x,
  y,
  shown,
  pressed,
  moveMs,
}: {
  x: number
  y: number
  shown: boolean
  pressed: boolean
  /** How long it takes to get there — a drag's own length while dragging. */
  moveMs: number
}) {
  return (
    <div
      aria-hidden
      className={`absolute top-0 left-0 z-[60] transition-[translate,opacity] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      style={{ translate: `${x - 11}px ${y - 3}px`, transitionDuration: `${moveMs}ms, 300ms` }}
    >
      <div
        className={`origin-[11px_3px] transition-[scale] duration-150 ${pressed ? "scale-[0.82]" : "scale-100"}`}
      >
        <CursorHand />
      </div>
    </div>
  )
}

/** The kit switch that pauses a walkthrough where it stands. */
export function AutoPlay({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="rounded-full bg-[var(--ho-tint)] py-2 pr-2 pl-4">
      <KitSwitch checked={on} onChange={onChange} label="Auto play" size="m" className="gap-4" />
    </div>
  )
}

/** Plays a scene again from the top — beside Auto play, in its shape and height. */
export function StartOver({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-full border border-[var(--ho-line)] bg-white px-4 text-base font-semibold text-black transition-colors hover:bg-[var(--ho-tint)]"
    >
      Start over
    </button>
  )
}

/**
 * Under a scene: `leading` on the left (the Desktop / Mobile switch, where a
 * rule has both), Auto play and Start over on the right — or, alone, centred.
 */
export function SceneControls({
  leading,
  autoPlay,
  onAutoPlay,
  onStartOver,
}: {
  leading?: React.ReactNode
  autoPlay: boolean
  onAutoPlay: (on: boolean) => void
  onStartOver: () => void
}) {
  return (
    <div className={`flex items-stretch gap-2 ${leading ? "justify-between" : "justify-center"}`}>
      {leading}
      <div className="flex items-stretch gap-2">
        <AutoPlay on={autoPlay} onChange={onAutoPlay} />
        <StartOver onClick={onStartOver} />
      </div>
    </div>
  )
}

/**
 * Runs `beats` on a loop while `on`; each beat's `at` is ms from the top.
 * A new `restart` value starts it over from the top.
 */
export function useLoop(
  on: boolean,
  beats: { at: number; run: () => void }[],
  cycleMs: number,
  restart = 0
) {
  const beatsRef = useRef(beats)
  beatsRef.current = beats
  useEffect(() => {
    if (!on) return
    const timers: number[] = []
    // Each beat runs its latest closure, so it acts on the stage as it is now.
    const cycle = () => {
      beatsRef.current.forEach((beat, i) =>
        timers.push(window.setTimeout(() => beatsRef.current[i]?.run(), beat.at))
      )
      timers.push(window.setTimeout(cycle, cycleMs))
    }
    cycle()
    return () => timers.forEach(clearTimeout)
  }, [on, cycleMs, restart])
}
