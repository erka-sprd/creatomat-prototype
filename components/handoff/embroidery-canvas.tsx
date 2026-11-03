"use client"

/**
 * The designer's canvas for the embroidery handoff: a catalogue product on the
 * #F4F4F4 canvas, its real print area, and a design on it with the selection
 * frame, corner handles and green hoop guide lifted from components/designer.tsx.
 *
 * Faked: the designer measures a design on its ink; here it is the image's box.
 * And the resize is scripted, so it cannot snap — it is tweened onto the hoop
 * size instead, where the real one snaps within HOOP_SNAP_PX.
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { getPrintAreaOverlay, getProductType } from "product-catalog-client"
import { EmbroideryPreview } from "@/components/embroidery-preview"
import {
  EMBROIDERY_MIN_LOADER_MS,
  HOOP_ARROW_MIN_RATIO_GAP,
  HOOP_GUIDE_BLUR_TRANSITION,
  HOOP_GUIDE_CONTENT_BLUR_PX,
  HOOP_RESIZE_FIT_TOLERANCE,
  RECOVERED_GOOD_SIZE_MS,
  SELECTION_FRAME_TRANSITION,
  SELECTION_TONE,
} from "@/components/designer"
import EmbroideryLabel, {
  EmbroideryPreviewStatus,
  SizeBadgePill,
  type EmbroiderySizeStatus,
} from "@/components/embroidery-label"
import { CursorHand } from "@/components/handoff/rail-replica"
import KitSwitch from "@/components/kit-switch"
import { loadCatalog } from "@/lib/catalog"
import { embroideryHoopFrameFraction } from "@/lib/embroidery-limits"

export const TSHIRT_ID = "812" // Men's Premium Organic T-Shirt — the designer's default
const PRODUCT_COLOR = "white"
/** The design the size demos are about: the mushroom, from the Graphics panel. */
export const SIZE_DESIGN_SRC = "/img/graphics/graphics5.png"

/** The product shot's box on the canvas (px). */
const PRODUCT_PX = 400
/** How far down the print area the design starts, as a share of its height. */
const DESIGN_TOP_SHARE = 0.06
/** How far past the hoop frame the oversized design starts (a demo choice). */
const OVERSIZE = 1.6
/** The design in §1, comfortably inside the hoop frame. */
const FITTING = 0.85

type Corner = "nw" | "ne" | "sw" | "se"
type Tone = keyof typeof SELECTION_TONE
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"]
const HANDLE_POS: Record<Corner, string> = {
  nw: "-top-[7.5px] -left-[7.5px]",
  ne: "-top-[7.5px] -right-[7.5px]",
  sw: "-bottom-[7.5px] -left-[7.5px]",
  se: "-bottom-[7.5px] -right-[7.5px]",
}

/* ------------------------------------------------------------------- data */

export type CanvasProduct = {
  image: string
  /** The print area on the product shot, percent of it. */
  area: { left: number; top: number; width: number; height: number }
  /** The hoop frame's share of the print area's width and height. */
  hoop: number
}

/** The designer's default product, its front print area and its hoop frame; null until loaded. */
export function useCanvasProduct(id = TSHIRT_ID): CanvasProduct | null {
  const [product, setProduct] = useState<CanvasProduct | null>(null)
  useEffect(() => {
    let live = true
    loadCatalog()
      .then(catalog => {
        const p = getProductType(catalog.products, id)
        const view = p?.views[0]
        if (!p || !view) return
        const appearance =
          p.appearances.find(a => a.name.trim().toLowerCase() === PRODUCT_COLOR) ??
          p.appearances[0]
        const image = appearance?.views.find(v => v.id === view.id)?.image
        const area = getPrintAreaOverlay(p, view.id)
        const hoop = embroideryHoopFrameFraction(p.name)
        if (live && image && area && hoop !== null) setProduct({ image, area, hoop })
      })
      // A document should degrade, not break: the demos just stay empty.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [id])
  return product
}

/** An image's height over its width, once it has loaded; null until then. */
function useAspect(src: string) {
  const [aspect, setAspect] = useState<number | null>(null)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setAspect(img.naturalHeight / img.naturalWidth)
    img.src = src
  }, [src])
  return aspect
}

/**
 * Where a design of `size` (1 = the largest that fits the hoop frame) sits in
 * the print area, px — pinned by its top-left corner, so a bottom-right drag
 * shrinks it towards it.
 */
function designGeometry(product: CanvasProduct, aspect: number, size: number, startSize: number) {
  const areaW = (product.area.width / 100) * PRODUCT_PX
  const areaH = (product.area.height / 100) * PRODUCT_PX
  const fitW = Math.min(product.hoop * areaW, (product.hoop * areaH) / aspect)
  return {
    left: (areaW - fitW * startSize) / 2,
    top: areaH * DESIGN_TOP_SHARE,
    width: fitW * size,
    height: fitW * size * aspect,
  }
}

/* ------------------------------------------------------------------ pieces */

/** The canvas, the product shot on it and its print area; `children` go in the print area. */
export function Stage({
  product,
  children,
  overlay,
}: {
  product: CanvasProduct | null
  children?: ReactNode
  /** On the canvas itself, over the product — the bottom dock, the cursor. */
  overlay?: ReactNode
}) {
  return (
    <div className="relative h-[460px] w-full min-w-[560px] overflow-hidden rounded-[12px] bg-[#F4F4F4]">
      {product && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2"
          style={{ width: PRODUCT_PX, height: PRODUCT_PX }}
        >
          <img src={product.image} alt="" draggable={false} className="size-full object-contain" />
          <div
            className="absolute"
            style={{
              left: `${product.area.left}%`,
              top: `${product.area.top}%`,
              width: `${product.area.width}%`,
              height: `${product.area.height}%`,
            }}
          >
            {children}
          </div>
        </div>
      )}
      <EmbroideryLabel show />
      {overlay}
    </div>
  )
}

/**
 * The striped guide at the hoop-frame size, `ratio` of the design's own box,
 * pinned to the corner opposite `corner` — and the arrow from the dragged
 * corner to the guide's matching one. designer.tsx's hoopGuideShapes, for a
 * guide drawn in the design's whole box.
 */
function HoopGuide({ corner, ratio }: { corner: Corner; ratio: number }) {
  const dx = corner.endsWith("e") ? 1 : 0
  const dy = corner.startsWith("s") ? 1 : 0
  const a = { x: 1 - dx, y: 1 - dy }
  const g = { x: a.x + ratio * (dx - a.x), y: a.y + ratio * (dy - a.y) }
  const pct = (v: number) => `${v * 100}%`
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
              id={`ho-hoop-arrow-${corner}`}
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
            markerEnd={`url(#ho-hoop-arrow-${corner})`}
          />
        </svg>
      )}
    </>
  )
}

/** A design on the print area, selected or not, with its hoop guide while it is too large. */
function Design({
  geo,
  src,
  selected,
  tone = "blue",
  guide = null,
  hot = null,
  covered = false,
  children,
}: {
  geo: ReturnType<typeof designGeometry>
  src: string
  selected: boolean
  tone?: Tone
  /** The guide's corner and its size relative to the design, or none. */
  guide?: { corner: Corner; ratio: number } | null
  /** The handle under the pointer — filled, as on hover. */
  hot?: Corner | null
  /** The design itself hidden — `children` stand in for it. */
  covered?: boolean
  /** Drawn in place of the design — the stitched preview. */
  children?: ReactNode
}) {
  const guided = !!guide && guide.ratio < 1 - HOOP_RESIZE_FIT_TOLERANCE
  return (
    <div
      className="absolute"
      style={{
        left: geo.left,
        top: geo.top,
        width: geo.width,
        height: geo.height,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-contain"
        style={{
          filter: guided ? `blur(${HOOP_GUIDE_CONTENT_BLUR_PX}px)` : "blur(0px)",
          opacity: covered ? 0 : 1,
          transition: `${HOOP_GUIDE_BLUR_TRANSITION}, opacity 300ms ease-out`,
        }}
      />
      {children}
      {selected && (
        <>
          {/* --selection-tone doesn't inherit (globals.css), so it's set on the ring itself. */}
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              ["--selection-tone" as string]: SELECTION_TONE[tone].hex,
              transition: SELECTION_FRAME_TRANSITION,
              boxShadow: "0 0 0 1px var(--selection-tone)",
            }}
          />
          {guided && <HoopGuide corner={guide.corner} ratio={guide.ratio} />}
          {CORNERS.map(corner => (
            <span
              key={corner}
              data-demo={`handle-${corner}`}
              className={`absolute ${HANDLE_POS[corner]} z-30 block size-[15px] rounded-full border-2 ${SELECTION_TONE[tone].handle} bg-white transition-colors duration-300 ease-out`}
              style={hot === corner ? { backgroundColor: SELECTION_TONE[tone].hex } : undefined}
            />
          ))}
        </>
      )}
    </div>
  )
}

/** A warning or the good-size badge in the bottom row's place, keeping its last message as it goes. */
function BottomDock({ status }: { status: EmbroiderySizeStatus | null }) {
  const [shown, setShown] = useState<EmbroiderySizeStatus>(status ?? "too-large")
  if (status && status !== shown) setShown(status)
  return (
    <div className="absolute bottom-6 left-1/2 z-[5] -translate-x-1/2">
      <SizeBadgePill status={shown} hidden={!status} docked />
    </div>
  )
}

type Cursor = { x: number; y: number; shown: boolean }

/** The drawn hand: its fingertip (11,3 in the glyph's box) lands on the target. */
function DemoCursor({
  cursor,
  pressed,
  instant,
}: {
  cursor: Cursor
  pressed: boolean
  /** Following a drag: no easing, it moves with the handle. */
  instant: boolean
}) {
  return (
    <div
      aria-hidden
      className={`absolute top-0 left-0 z-[60] transition-[translate,opacity] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        instant ? "duration-0" : "duration-500"
      } ${cursor.shown ? "opacity-100" : "opacity-0"}`}
      style={{ translate: `${cursor.x - 11}px ${cursor.y - 3}px` }}
    >
      <div
        className={`origin-[11px_3px] transition-[scale] duration-150 ${pressed ? "scale-[0.82]" : "scale-100"}`}
      >
        <CursorHand />
      </div>
    </div>
  )
}

/** The kit switch that pauses a walkthrough where it stands, above it. */
function AutoPlay({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="mb-8 rounded-full bg-[var(--ho-ground)] py-2 pr-2 pl-4">
      <KitSwitch checked={on} onChange={onChange} label="Auto play" size="m" className="gap-4" />
    </div>
  )
}

/** Runs `beats` on a loop while `on`; each beat's `at` is ms from the top. */
function useLoop(on: boolean, beats: { at: number; run: () => void }[], cycleMs: number) {
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
  }, [on, cycleMs])
}

/* ------------------------------------------------------------ walkthroughs */

// §1: when the check starts, and how long the pill holds the spot.
const CHECK_START_MS = 1000
const STITCHED_HOLD_MS = 3000
const CHECK_CYCLE_MS = CHECK_START_MS + EMBROIDERY_MIN_LOADER_MS + STITCHED_HOLD_MS

/** §1 — embroidery on: "Creating preview" at once, then the stitched preview in the design's place. */
export function CheckWalkthrough({ product }: { product: CanvasProduct | null }) {
  const [autoPlay, setAutoPlay] = useState(true)
  const aspect = useAspect(SIZE_DESIGN_SRC)
  const [loading, setLoading] = useState(false)
  const [stitched, setStitched] = useState(false)
  useLoop(
    autoPlay,
    [
      {
        at: 0,
        run: () => {
          setLoading(false)
          setStitched(false)
        },
      },
      { at: CHECK_START_MS, run: () => setLoading(true) },
      {
        at: CHECK_START_MS + EMBROIDERY_MIN_LOADER_MS,
        run: () => {
          setLoading(false)
          setStitched(true)
        },
      },
    ],
    CHECK_CYCLE_MS
  )
  const geo = product && aspect ? designGeometry(product, aspect, FITTING, FITTING) : null
  return (
    <div className="flex flex-col items-center">
      <AutoPlay on={autoPlay} onChange={setAutoPlay} />
      <div className="w-full [&_*]:pointer-events-none">
        <Stage
          product={product}
          overlay={
            <div className="absolute bottom-9 left-1/2 z-[5] -translate-x-1/2">
              <EmbroideryPreviewStatus docked loading={loading} durationMs={EMBROIDERY_MIN_LOADER_MS} />
            </div>
          }
        >
          {geo && (
            <Design geo={geo} src={SIZE_DESIGN_SRC} selected={false} covered={stitched}>
              <EmbroideryPreview
                src={SIZE_DESIGN_SRC}
                maxSize={PRODUCT_PX}
                className={`absolute inset-0 size-full transition-opacity duration-300 ${
                  stitched ? "opacity-100" : "opacity-0"
                }`}
              />
            </Design>
          )}
        </Stage>
      </div>
    </div>
  )
}

// §3's beats, ms from the top: hover the top-left handle, then the
// bottom-right one, press it, drag down to the hoop size, release.
const SIZE_BEATS = {
  pointNw: 1500,
  hoverNw: 2000,
  pointSe: 3500,
  hoverSe: 4000,
  press: 5000,
  drag: 5200,
} as const
const DRAG_MS = 1600
const RELEASE_AFTER_SNAP_MS = 600
const SNAP_AT = SIZE_BEATS.drag + DRAG_MS
const SIZE_CYCLE_MS = SNAP_AT + RECOVERED_GOOD_SIZE_MS + 2500

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/**
 * §3 — too large at rest, then resized: the guide follows the hovered handle,
 * the drag brings the design down onto the hoop size, it turns green with the
 * good-size badge, and both ease back once the badge goes.
 */
export function SizeWalkthrough({ product }: { product: CanvasProduct | null }) {
  const [autoPlay, setAutoPlay] = useState(true)
  const aspect = useAspect(SIZE_DESIGN_SRC)
  const stageRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(OVERSIZE)
  const [corner, setCorner] = useState<Corner>("se")
  const [hot, setHot] = useState<Corner | null>(null)
  const [tone, setTone] = useState<Tone>("orange")
  const [badge, setBadge] = useState<EmbroiderySizeStatus | null>("too-large")
  const [cursor, setCursor] = useState<Cursor>({ x: 0, y: 0, shown: false })
  const [pressed, setPressed] = useState(false)
  const [following, setFollowing] = useState(false)
  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // The cursor's targets, measured where they are now.
  const handleAt = (c: Corner): Cursor | null => {
    const stage = stageRef.current
    const handle = stage?.querySelector<HTMLElement>(`[data-demo="handle-${c}"]`)
    if (!stage || !handle) return null
    const s = stage.getBoundingClientRect()
    const r = handle.getBoundingClientRect()
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2, shown: true }
  }
  const pointAt = (c: Corner) => {
    const at = handleAt(c)
    if (at) setCursor(at)
  }
  // While dragging, the hand rides the handle.
  useLayoutEffect(() => {
    if (following) pointAt("se")
    // pointAt only reads the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, following])

  const drag = () => {
    const start = performance.now()
    setFollowing(true)
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DRAG_MS)
      setSize(OVERSIZE + (1 - OVERSIZE) * easeInOut(t))
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else {
        setTone("green")
        setBadge("good")
      }
    }
    raf.current = requestAnimationFrame(tick)
  }

  useLoop(
    autoPlay,
    [
      {
        at: 0,
        run: () => {
          cancelAnimationFrame(raf.current)
          setSize(OVERSIZE)
          setCorner("se")
          setHot(null)
          setTone("orange")
          setBadge("too-large")
          setPressed(false)
          setFollowing(false)
          setCursor(c => ({ ...c, shown: false }))
        },
      },
      { at: SIZE_BEATS.pointNw, run: () => pointAt("nw") },
      {
        at: SIZE_BEATS.hoverNw,
        run: () => {
          setHot("nw")
          setCorner("nw")
        },
      },
      { at: SIZE_BEATS.pointSe, run: () => pointAt("se") },
      {
        at: SIZE_BEATS.hoverSe,
        run: () => {
          setHot("se")
          setCorner("se")
        },
      },
      { at: SIZE_BEATS.press, run: () => setPressed(true) },
      { at: SIZE_BEATS.drag, run: drag },
      {
        at: SNAP_AT + RELEASE_AFTER_SNAP_MS,
        run: () => {
          setPressed(false)
          setFollowing(false)
          setHot(null)
        },
      },
      {
        at: SNAP_AT + RECOVERED_GOOD_SIZE_MS,
        run: () => {
          setBadge(null)
          setTone("blue")
          setCursor(c => ({ ...c, shown: false }))
        },
      },
    ],
    SIZE_CYCLE_MS
  )

  const geo = product && aspect ? designGeometry(product, aspect, size, OVERSIZE) : null
  return (
    <div className="flex flex-col items-center">
      <AutoPlay on={autoPlay} onChange={setAutoPlay} />
      <div ref={stageRef} className="relative w-full [&_*]:pointer-events-none">
        <Stage
          product={product}
          overlay={
            <>
              <BottomDock status={badge} />
              <DemoCursor cursor={cursor} pressed={pressed} instant={following} />
            </>
          }
        >
          {geo && (
            <Design
              geo={geo}
              src={SIZE_DESIGN_SRC}
              selected
              tone={tone}
              guide={{ corner, ratio: 1 / size }}
              hot={hot}
            />
          )}
        </Stage>
      </div>
    </div>
  )
}
