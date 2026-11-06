"use client"

/**
 * The embroidery handoff's scene engine: one rule, played on the designer's
 * canvas. A scene is an "If → Then" list and a script of beats; each beat
 * sets the stage and lights the step it shows.
 *
 * Real: the bottom row (MergedBottomRow), every dock in its place (warning,
 * green message, "Creating preview", the AI loader, the zoom tip), the
 * solutions, the stitched preview, the selection's handles, the trash button
 * and the AI's in-browser simplify / thicken. Faked: the script itself —
 * moves and resizes are CSS-tweened, not dragged — and a design's box is its
 * image's, where the designer measures its ink.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  EMBROIDERY_MIN_LOADER_MS,
  HOOP_GUIDE_BLUR_TRANSITION,
  HOOP_GUIDE_CONTENT_BLUR_PX,
  HOOP_RESIZE_FIT_TOLERANCE,
  MAX_ZOOM,
  SELECTION_FRAME_TRANSITION,
  SELECTION_TONE,
  SelectionBottomHandles,
  TRASH_BUTTON_CLASS,
  TRASH_BUTTON_SIZE,
  TRASH_OFFSET,
  TrashIcon,
  ZOOM_HINT_TEXT,
} from "@/components/designer"
import {
  EmbroideryIssueDock,
  EmbroideryMaxSizeBadge,
  EmbroideryPreviewDock,
  EmbroiderySimplifyDock,
  EmbroideryZoomTipDock,
  SWAP_DELAY_MS,
  type EmbroideryDesignIssue,
  type EmbroiderySizeStatus,
} from "@/components/embroidery-label"
import { EmbroideryPreview } from "@/components/embroidery-preview"
import { EmbroiderySolutions } from "@/components/embroidery-solutions"
import {
  AutoPlay,
  CORNERS,
  DemoCursor,
  HoopGuide,
  useAspects,
  useLoop,
  type CanvasProduct,
  type Corner,
} from "@/components/handoff/embroidery-canvas"
import { KitButton } from "@/components/kit-button"
import { MergedBottomRow } from "@/components/merged-bottom-row"
import { printAreaTotal } from "@/lib/print-area-pricing"
import { simplifyImage, thickenLines } from "@/lib/simplify-image"

/** The product shot's box (px) — the canvas zoomed in a little, so designs read. */
const PRODUCT_PX = 720
/** Where the print area's centre sits, px from the stage's top. */
const FOCUS_Y = 200
const STAGE_HEIGHT_PX = 480
const HANDLE_POS: Record<Corner, string> = {
  nw: "-top-[7.5px] -left-[7.5px]",
  ne: "-top-[7.5px] -right-[7.5px]",
  sw: "-bottom-[7.5px] -left-[7.5px]",
  se: "-bottom-[7.5px] -right-[7.5px]",
}
const DEFAULT_MOTION_MS = 500
const EASE = "cubic-bezier(0.4,0,0.2,1)"
// Fit to best size's small overshoot (designer.tsx's easeOutBack, c1 = 1.2).
const EASE_BOUNCE = "cubic-bezier(0.34,1.45,0.64,1)"

/** What the solutions' print card saves, as the designer words it — one decorated area. */
const PRINT_SAVING = printAreaTotal(["front"], "embroidery") - printAreaTotal(["front"], "standard")
const PRINT_SAVING_LABEL =
  PRINT_SAVING > 0 ? `${PRINT_SAVING.toFixed(2).replace(".", ",")} € cheaper than embroidery` : null

type Tone = keyof typeof SELECTION_TONE

/* ------------------------------------------------------------------ state */

export type SceneDesign = {
  id: string
  src: string
  /** Centre in the print area (0–1 of its width and height). */
  cx: number
  cy: number
  /** 1 = exactly the hoop frame's size. */
  size: number
  /**
   * Resized by a corner drag: the opposite corner (`corner`) stays where it
   * is at `size` — centred on cx, cy at that size — as the design shrinks or
   * grows. Without it a resize is about the centre (Fit to best size).
   */
  pin?: { corner: Corner; size: number }
  selected?: boolean
  tone?: Tone
  /** The hoop guide and arrow, from this corner — while it's past the frame. */
  guide?: Corner | null
  /** The handle under the pointer, filled as on hover. */
  hot?: Corner | null
  /** The corner and rotate/move handles (default: shown while selected). */
  handles?: boolean
  /** Held by this corner: only its handle stays, as in the designer. */
  resizing?: Corner | null
  /** Being dragged: no handles at all. */
  dragging?: boolean
  stitched?: boolean
  /** Removed: fades out. */
  gone?: boolean
  /** Simplify / Fix with AI's result, up for review, showing this side. */
  review?: "before" | "after" | null
  /** The AI's result, shown from review on (and after accepting). */
  ai?: EmbroideryDesignIssue | null
  /** The original kept on show — review's "Before", or not accepted yet. */
  original?: boolean
  /** The trash over it — "warning" in the orange it takes beside a design issue. */
  trash?: boolean | "warning"
  minNotice?: boolean
  /** How long its moves and resizes take, and whether they overshoot. */
  motionMs?: number
  bounce?: boolean
}

export type Aim =
  | { design: string; at: Corner | "c" }
  | { button: string }
  | { label: string }
  | { demo: string }
  /** A share of the stage's width and height. */
  | { x: number; y: number }

export type SceneState = {
  designs: SceneDesign[]
  /** A frame round all the designs — the combination's. */
  group: Tone | null
  zoom: number
  row: boolean
  zoomOnly: boolean
  technique: "standard" | "embroidery"
  issue: EmbroiderySizeStatus | null
  combination: boolean
  fit: boolean
  green: "good" | "print-switched" | null
  loader: boolean
  ai: EmbroideryDesignIssue | null
  zoomTip: boolean
  solutions: EmbroideryDesignIssue | null
  shake: number
  flash: number
  cursor: Aim | null
  pressed: boolean
  cursorMs: number
  step: number
}

export const BASE_STATE: SceneState = {
  designs: [],
  group: null,
  zoom: 1,
  row: true,
  zoomOnly: false,
  technique: "embroidery",
  issue: null,
  combination: false,
  fit: false,
  green: null,
  loader: false,
  ai: null,
  zoomTip: false,
  solutions: null,
  shake: 0,
  flash: 0,
  cursor: null,
  pressed: false,
  cursorMs: DEFAULT_MOTION_MS,
  step: 0,
}

type Update = Partial<SceneState> | ((s: SceneState) => SceneState)
export type Beat = { at: number; set: Update }
export type Step = { when: string; then: string }

/** An update to one design. */
export const design =
  (id: string, patch: Partial<SceneDesign>) =>
  (s: SceneState): SceneState => ({
    ...s,
    designs: s.designs.map(d => (d.id === id ? { ...d, ...patch } : d)),
  })
/** Several updates, one after the other. */
export const all =
  (...updates: Update[]) =>
  (s: SceneState): SceneState =>
    updates.reduce<SceneState>((acc, u) => (typeof u === "function" ? u(acc) : { ...acc, ...u }), s)

/** A text as an image, so it's placed, sized and stitched like a graphic. */
export function useTextImage(text: string) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const font = "800 160px system-ui, sans-serif"
    ctx.font = font
    const w = Math.ceil(ctx.measureText(text).width) + 16
    canvas.width = w
    canvas.height = 200
    ctx.font = font
    ctx.fillStyle = "#111111"
    ctx.textBaseline = "middle"
    ctx.fillText(text, 8, 104)
    setSrc(canvas.toDataURL("image/png"))
  }, [text])
  return src
}

/** The AI's result for `src` (Fix with AI thickens, Simplify simplifies), once made. */
function useAiResults(designs: SceneDesign[]) {
  const [results, setResults] = useState<Record<string, string>>({})
  const wanted = designs.filter(d => d.ai).map(d => `${d.ai}|${d.src}`)
  const key = [...new Set(wanted)].join("•")
  useEffect(() => {
    let live = true
    for (const k of key ? key.split("•") : []) {
      const [issue, src] = k.split("|")
      const make = issue === "thin-line" ? thickenLines : simplifyImage
      make(src)
        .then(out => live && setResults(r => ({ ...r, [k]: out })))
        .catch(() => {})
    }
    return () => {
      live = false
    }
  }, [key])
  return (d: SceneDesign) => (d.ai && !d.original ? results[`${d.ai}|${d.src}`] : undefined)
}

/* --------------------------------------------------------------- geometry */

type Geo = { left: number; top: number; width: number; height: number }

function useStageWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

/** The print area on the stage, px. */
function areaGeo(product: CanvasProduct, stageW: number) {
  const { area } = product
  // Centred across like the designer's canvas (the print area needn't sit
  // mid-shirt); placed down so the print area sits at FOCUS_Y.
  const productLeft = (stageW - PRODUCT_PX) / 2
  const productTop = FOCUS_Y - (PRODUCT_PX * (area.top + area.height / 2)) / 100
  return {
    productLeft,
    productTop,
    left: productLeft + (PRODUCT_PX * area.left) / 100,
    top: productTop + (PRODUCT_PX * area.top) / 100,
    width: (PRODUCT_PX * area.width) / 100,
    height: (PRODUCT_PX * area.height) / 100,
  }
}

/** A design's box in the print area, px. */
function designGeo(d: SceneDesign, aspect: number, product: CanvasProduct, area: Geo): Geo {
  const fitW = Math.min(product.hoop * area.width, (product.hoop * area.height) / aspect)
  const width = fitW * d.size
  const height = width * aspect
  if (d.pin) {
    // The pinned corner, where it sits at the pin's size.
    const w0 = fitW * d.pin.size
    const h0 = w0 * aspect
    const east = d.pin.corner.endsWith("e")
    const south = d.pin.corner.startsWith("s")
    const px = d.cx * area.width + (east ? w0 / 2 : -w0 / 2)
    const py = d.cy * area.height + (south ? h0 / 2 : -h0 / 2)
    return { left: east ? px - width : px, top: south ? py - height : py, width, height }
  }
  return { left: d.cx * area.width - width / 2, top: d.cy * area.height - height / 2, width, height }
}

/* ----------------------------------------------------------------- pieces */

/** A design on the print area as the designer draws it, with whatever it carries right now. */
function DesignView({
  d,
  geo,
  shownSrc,
  instant,
}: {
  d: SceneDesign
  geo: Geo
  shownSrc: string
  instant: boolean
}) {
  const ms = instant ? 0 : (d.motionMs ?? DEFAULT_MOTION_MS)
  const ease = d.bounce ? EASE_BOUNCE : EASE
  const tone = d.tone ?? "blue"
  const guided = !!d.guide && d.selected && d.size > 1 + HOOP_RESIZE_FIT_TOLERANCE
  const handles = d.selected && d.handles !== false && !d.dragging
  const corners = d.resizing ? CORNERS.filter(c => c === d.resizing) : CORNERS
  return (
    <div
      className="absolute"
      style={{
        ...geo,
        opacity: d.gone ? 0 : 1,
        transition: ["left", "top", "width", "height"]
          .map(p => `${p} ${ms}ms ${ease}`)
          .concat("opacity 300ms ease-out")
          .join(", "),
      }}
    >
      <img
        src={shownSrc}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-contain"
        style={{
          filter: guided ? `blur(${HOOP_GUIDE_CONTENT_BLUR_PX}px)` : "blur(0px)",
          opacity: d.stitched ? 0 : 1,
          transition: `${HOOP_GUIDE_BLUR_TRANSITION}, opacity 300ms ease-out`,
        }}
      />
      {d.stitched && (
        <EmbroideryPreview
          src={shownSrc}
          maxSize={PRODUCT_PX}
          className="animate-in fade-in absolute inset-0 size-full duration-300"
        />
      )}
      {d.selected && (
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
          {guided && <HoopGuide id={d.id} corner={d.guide!} ratio={1 / d.size} />}
          {handles &&
            corners.map(corner => (
              <span
                key={corner}
                className={`absolute ${HANDLE_POS[corner]} z-30 block size-[15px] rounded-full border-2 ${SELECTION_TONE[tone].handle} bg-white transition-colors duration-300 ease-out`}
                style={d.hot === corner ? { backgroundColor: SELECTION_TONE[tone].hex } : undefined}
              />
            ))}
          {handles && !d.resizing && (
            <SelectionBottomHandles onRotateStart={() => {}} onMoveStart={() => {}} />
          )}
        </>
      )}
      {d.minNotice && (
        // In the rotate/move handles' spot, which a resize clears.
        <div className="absolute top-full left-1/2 mt-5 -translate-x-1/2">
          <EmbroideryMaxSizeBadge show label="Min. size for embroidery" />
        </div>
      )}
      {d.trash && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 ${TRASH_BUTTON_CLASS} ${
            d.trash === "warning"
              ? "border-[#EA580C] text-[#EA580C]"
              : "border-[#d01c00] text-[#d01c00]"
          }`}
          style={{
            width: TRASH_BUTTON_SIZE,
            height: TRASH_BUTTON_SIZE,
            top: -TRASH_OFFSET - TRASH_BUTTON_SIZE,
          }}
          data-demo={`trash-${d.id}`}
        >
          <TrashIcon />
        </span>
      )}
      {d.review && <ReviewControls before={d.review === "before"} />}
    </div>
  )
}

/** Simplify / Fix with AI's result up for review: designer.tsx's controls round the design. */
function ReviewControls({ before }: { before: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ boxShadow: `0 0 0 1px ${SELECTION_TONE.blue.hex}` }}
      />
      <div
        role="radiogroup"
        aria-label="Compare with the original"
        className="absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 rounded-full bg-white p-1 whitespace-nowrap shadow-xs"
      >
        {[
          { label: "Before", before: true },
          { label: "After", before: false },
        ].map(option => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={before === option.before}
            className={`min-h-8 cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors ${
              before === option.before ? "bg-neutral-200 text-black" : "text-black hover:bg-neutral-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="absolute top-full left-1/2 mt-1 flex -translate-x-1/2 gap-2 whitespace-nowrap">
        <KitButton variant="ghost" size="m" className="bg-white">
          Cancel
        </KitButton>
        <KitButton size="m">Accept</KitButton>
      </div>
    </>
  )
}

// How much of the neighbouring steps shows above and below the lit one.
const STEP_PEEK_PX = 34

/**
 * The scene's "If → Then" list, the step on the stage lit — in a window of
 * one fixed height, whatever the count: the tallest step plus a glimpse of a
 * neighbour above and below. The list glides so the lit step sits in the
 * middle; the others are faded, slightly blurred, and cut by the window's
 * soft edges.
 */
function StepList({ steps, active }: { steps: Step[]; active: number }) {
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const [box, setBox] = useState({ centre: 0, tallest: 0 })
  useLayoutEffect(() => {
    const measure = () => {
      const row = rows.current[active]
      const tallest = Math.max(0, ...rows.current.map(r => r?.offsetHeight ?? 0))
      if (row) setBox({ centre: row.offsetTop + row.offsetHeight / 2, tallest })
    }
    measure()
    const ro = new ResizeObserver(measure)
    rows.current.forEach(r => r && ro.observe(r))
    return () => ro.disconnect()
  }, [active, steps])
  const windowH = box.tallest + STEP_PEEK_PX * 2

  return (
    <div
      className="overflow-hidden"
      style={{
        height: windowH || undefined,
        maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
      }}
    >
    <ol
      className="m-0 flex list-none flex-col gap-1 p-0 transition-[translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ translate: `0 ${windowH / 2 - box.centre}px` }}
    >
      {steps.map((s, i) => (
        <li
          key={s.when}
          ref={el => {
            rows.current[i] = el
          }}
          // The lit step: the lightest purple, black text, and a dashed
          // outline two steps darker marching round it (.ho-march) — an SVG,
          // so the dashes follow the rounded corners and take no room.
          className={`relative grid grid-cols-[22px_minmax(0,1fr)_minmax(0,1.25fr)] items-start gap-3 rounded-[10px] px-3 py-2 text-[13.5px] leading-snug transition-[color,background-color,filter,opacity] duration-300 ${
            i === active ? "bg-purple-50 text-black" : "text-[var(--ho-muted)] opacity-70 blur-[1px]"
          }`}
        >
          {i === active && (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full overflow-visible text-purple-400"
            >
              <rect
                width="100%"
                height="100%"
                rx="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="ho-march"
              />
            </svg>
          )}
          <span
            className={`flex size-[20px] items-center justify-center rounded-full font-[family-name:var(--ho-mono)] text-[11px] transition-colors duration-300 ${
              i === active ? "bg-purple-200 text-black" : "bg-[var(--ho-ground)]"
            }`}
          >
            {i + 1}
          </span>
          <span>
            <b className="mr-1 font-[family-name:var(--ho-mono)] text-[11px] font-normal tracking-[0.08em] uppercase">
              If
            </b>
            {s.when}
          </span>
          <span>
            <b className="mr-1 font-[family-name:var(--ho-mono)] text-[11px] font-normal tracking-[0.08em] uppercase">
              Then
            </b>
            {s.then}
          </span>
        </li>
      ))}
    </ol>
    </div>
  )
}

/** Whether `ref` is (mostly) on screen — scenes play only then, from the top. */
function useInView(ref: React.RefObject<HTMLDivElement | null>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return inView
}

/* ------------------------------------------------------------------ scene */

/**
 * One rule played on the canvas: `steps` listed above, the stage below,
 * `beats` setting it on a loop of `cycleMs` from `initial`.
 */
export function Scene({
  product,
  steps,
  initial,
  beats,
  cycleMs,
  showSteps = true,
}: {
  product: CanvasProduct | null
  steps: Step[]
  initial: Partial<SceneState>
  beats: Beat[]
  cycleMs: number
  /** Off where the canvas alone is the point (the way-of-work page). */
  showSteps?: boolean
}) {
  const start = useMemo(() => ({ ...BASE_STATE, ...initial }), [initial])
  const [state, setState] = useState<SceneState>(start)
  const [instant, setInstant] = useState(true)
  const [autoPlay, setAutoPlay] = useState(true)
  const boxRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const inView = useInView(boxRef)
  const stageW = useStageWidth(stageRef)
  const aspects = useAspects(state.designs.map(d => d.src))
  const aiResult = useAiResults(state.designs)

  useLoop(
    autoPlay && inView,
    [
      {
        at: 0,
        run: () => {
          // Back to the top without animating there.
          setInstant(true)
          setState(start)
          window.setTimeout(() => setInstant(false), 60)
        },
      },
      ...beats.map(b => ({
        at: b.at,
        run: () => setState(s => (typeof b.set === "function" ? b.set(s) : { ...s, ...b.set })),
      })),
    ],
    cycleMs
  )

  const area = product && stageW ? areaGeo(product, stageW) : null
  const geoOf = (d: SceneDesign) =>
    product && area && aspects[d.src] ? designGeo(d, aspects[d.src], product, area) : null

  // The cursor: on a design's corner or centre (from the script's geometry,
  // so it rides a resize), or on a button in a dock (measured once there).
  const [measured, setMeasured] = useState<{ x: number; y: number } | null>(null)
  const aim = state.cursor
  const aimKey = JSON.stringify(aim)
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || !aim || ("design" in aim) || ("x" in aim)) return
    const s = stage.getBoundingClientRect()
    const target =
      "label" in aim
        ? stage.querySelector<HTMLElement>(`[aria-label="${aim.label}"]`)
        : "demo" in aim
          ? stage.querySelector<HTMLElement>(`[data-demo="${aim.demo}"]`)
          : [...stage.querySelectorAll<HTMLElement>("button")].find(
              b => b.textContent?.trim() === aim.button
            )
    if (!target) return
    const r = target.getBoundingClientRect()
    setMeasured({ x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 })
    // aimKey stands for the aim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aimKey])
  let cursorAt: { x: number; y: number } | null = null
  if (aim && "x" in aim) cursorAt = { x: aim.x * stageW, y: aim.y * STAGE_HEIGHT_PX }
  else if (aim && "design" in aim && area) {
    const d = state.designs.find(x => x.id === aim.design)
    const g = d && geoOf(d)
    if (g) {
      const fx = aim.at === "c" ? 0.5 : aim.at.endsWith("e") ? 1 : 0
      const fy = aim.at === "c" ? 0.5 : aim.at.startsWith("s") ? 1 : 0
      cursorAt = { x: area.left + g.left + fx * g.width, y: area.top + g.top + fy * g.height }
    }
  } else if (aim) cursorAt = measured

  const shown = state.designs.filter(d => !d.gone)
  const boxes = shown.map(geoOf).filter((g): g is Geo => g !== null)
  const groupBox =
    state.group && boxes.length > 1
      ? (() => {
          const l = Math.min(...boxes.map(b => b.left))
          const t = Math.min(...boxes.map(b => b.top))
          const r = Math.max(...boxes.map(b => b.left + b.width))
          const b = Math.max(...boxes.map(x => x.top + x.height))
          return { left: l, top: t, width: r - l, height: b - t }
        })()
      : null
  const groupMs = Math.max(0, ...state.designs.map(d => d.motionMs ?? DEFAULT_MOTION_MS))
  const issueDesign = state.designs.find(d => d.selected) ?? state.designs[0]

  return (
    <div ref={boxRef} className="flex flex-col gap-3">
      {showSteps && <StepList steps={steps} active={state.step} />}
      <div
        ref={stageRef}
        className="relative w-full min-w-[560px] overflow-hidden rounded-[12px] bg-[#F4F4F4] [&_*]:pointer-events-none"
        style={{ height: STAGE_HEIGHT_PX }}
      >
        {product && area && (
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${state.zoom})`,
              transformOrigin: `${stageW / 2}px ${FOCUS_Y}px`,
              transition: instant ? "none" : "transform 500ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <img
              src={product.image}
              alt=""
              draggable={false}
              // max-w-none: wider than the stage, it would otherwise be
              // squeezed to it (preflight's img max-width) and sit off-centre.
              className="absolute max-w-none"
              style={{
                left: area.productLeft,
                top: area.productTop,
                width: PRODUCT_PX,
                height: PRODUCT_PX,
              }}
            />
            <div
              className="absolute"
              style={{ left: area.left, top: area.top, width: area.width, height: area.height }}
            >
              {state.designs.map(d => {
                const g = geoOf(d)
                return (
                  g && (
                    <DesignView
                      key={d.id}
                      d={d}
                      geo={g}
                      shownSrc={aiResult(d) ?? d.src}
                      instant={instant}
                    />
                  )
                )
              })}
              {groupBox && (
                <div
                  aria-hidden="true"
                  className="absolute"
                  style={{
                    ...groupBox,
                    boxShadow: `0 0 0 1px ${SELECTION_TONE[state.group!].hex}`,
                    transition: ["left", "top", "width", "height"]
                      .map(p => `${p} ${instant ? 0 : groupMs}ms ${EASE}`)
                      .join(", "),
                  }}
                />
              )}
            </div>
          </div>
        )}
        {product && (
          <MergedBottomRow
            zoom={state.zoom}
            maxZoom={MAX_ZOOM}
            onZoomStep={() => {}}
            onZoomChange={() => {}}
            onZoomJump={() => {}}
            views={[
              {
                id: "front",
                name: "Front",
                thumb: size => (
                  <img
                    src={product.image}
                    alt=""
                    className="object-contain"
                    style={{ width: size, height: size }}
                  />
                ),
              },
            ]}
            activeViewId="front"
            onSelectView={() => {}}
            printTechnique={state.technique}
            onPrintTechnique={() => {}}
            embroiderySupported
            hidden={!state.row}
            zoomOnly={state.zoomOnly}
            swapDelayMs={SWAP_DELAY_MS}
          />
        )}
        <EmbroideryIssueDock
          status={state.issue}
          combination={state.combination}
          shakeSignal={state.shake}
          onSeeOptions={() => {}}
          onFitToSize={state.fit ? () => {} : undefined}
        />
        <EmbroideryIssueDock status={state.green} onSeeOptions={() => {}} />
        <EmbroideryPreviewDock loading={state.loader} durationMs={EMBROIDERY_MIN_LOADER_MS} />
        <EmbroiderySimplifyDock issue={state.ai} />
        <EmbroideryZoomTipDock text={state.zoomTip ? ZOOM_HINT_TEXT : null} onZoomIn={() => {}} />
        {state.solutions && (
          // ThinLineHelpPopover's panel, docked over the warning — a plain
          // panel here, so the drawn cursor sits above it.
          <div className="animate-in fade-in slide-in-from-bottom-3 absolute inset-x-4 bottom-6 z-[50] mx-auto flex max-w-[640px] flex-col rounded-2xl bg-white p-6 shadow-xl duration-300">
            <EmbroiderySolutions
              issue={state.solutions}
              designSrc={issueDesign?.src ?? null}
              printSavingLabel={PRINT_SAVING_LABEL}
              onClose={() => {}}
              onSimplifyWithAI={() => {}}
              onSwitchToPrint={() => {}}
            />
          </div>
        )}
        {state.flash > 0 && (
          <div
            key={`flash-${state.flash}`}
            aria-hidden="true"
            className="canvas-alert-border pointer-events-none absolute inset-0 rounded-[inherit]"
          />
        )}
        <DemoCursor
          x={cursorAt?.x ?? stageW / 2}
          y={cursorAt?.y ?? STAGE_HEIGHT_PX}
          shown={!!cursorAt}
          pressed={state.pressed}
          moveMs={instant ? 0 : state.cursorMs}
        />
      </div>
      <div className="flex justify-center">
        <AutoPlay on={autoPlay} onChange={setAutoPlay} />
      </div>
    </div>
  )
}
