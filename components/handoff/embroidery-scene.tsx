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
  LIGHT_PRODUCT_IMAGE_SHADOW,
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
  StartOver,
  CORNERS,
  DemoCursor,
  HoopGuide,
  useAspects,
  useLoop,
  type CanvasProduct,
  type Corner,
} from "@/components/handoff/embroidery-canvas"
import { StepList } from "@/components/handoff/step-list"
import { useTweenedSizes } from "@/components/handoff/tweened-sizes"
import { KitButton } from "@/components/kit-button"
import { MergedBottomRow } from "@/components/merged-bottom-row"
import { printAreaTotal } from "@/lib/print-area-pricing"
import { simplifyImage, thickenLines } from "@/lib/simplify-image"

/** The product shot's box (px) — the canvas zoomed in a little, so designs read. */
export const PRODUCT_PX = 720
/** Where the print area's centre sits, px from the stage's top. */
const FOCUS_Y = 200
export const STAGE_HEIGHT_PX = 420
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
  /** Removed: fades out — or, `cut`, goes at once (a typed text's frames). */
  gone?: boolean
  cut?: boolean
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
  /** The technique dropdown, open — for a scripted switch. */
  techniqueMenu: boolean
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
  techniqueMenu: false,
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

/**
 * A text being typed, as images — placed, sized and stitched like a graphic:
 * one per letter typed (with the caret), then the whole text without it. All
 * on the full text's width, so the box holds still while the letters come.
 */
export function useTypedText(text: string, color: string) {
  const [frames, setFrames] = useState<string[] | null>(null)
  useEffect(() => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const font = "800 160px system-ui, sans-serif"
    ctx.font = font
    canvas.width = Math.ceil(ctx.measureText(text).width) + 40
    canvas.height = 200
    const draw = (typed: string, caret: boolean) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = font
      ctx.fillStyle = color
      ctx.textBaseline = "middle"
      ctx.fillText(typed, 8, 104)
      if (caret) ctx.fillRect(14 + ctx.measureText(typed).width, 30, 8, 148)
      return canvas.toDataURL("image/png")
    }
    const typing = Array.from({ length: text.length + 1 }, (_, n) => draw(text.slice(0, n), true))
    setFrames([...typing, draw(text, false)])
  }, [text, color])
  return frames
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

export type Geo = { left: number; top: number; width: number; height: number }

export function useStageWidth(ref: React.RefObject<HTMLDivElement | null>) {
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
export function areaGeo(product: CanvasProduct, stageW: number) {
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
export function designGeo(d: SceneDesign, aspect: number, product: CanvasProduct, area: Geo): Geo {
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
  // Held by a corner, its size is played frame by frame (useTweenedSizes) —
  // the box follows that, with no CSS tween of its own.
  const ms = instant || d.resizing ? 0 : (d.motionMs ?? DEFAULT_MOTION_MS)
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
          .concat(`opacity ${d.cut ? 0 : 300}ms ease-out`)
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
  const [restart, setRestart] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const inView = useInView(boxRef)
  const stageW = useStageWidth(stageRef)
  const aspects = useAspects(state.designs.map(d => d.src))
  const aiResult = useAiResults(state.designs)
  // The designs as they are this frame: a corner resize played out live.
  const designs = useTweenedSizes(state.designs, instant)

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
    cycleMs,
    restart
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
    const d = designs.find(x => x.id === aim.design)
    const g = d && geoOf(d)
    if (g) {
      const fx = aim.at === "c" ? 0.5 : aim.at.endsWith("e") ? 1 : 0
      const fy = aim.at === "c" ? 0.5 : aim.at.startsWith("s") ? 1 : 0
      cursorAt = { x: area.left + g.left + fx * g.width, y: area.top + g.top + fy * g.height }
    }
  } else if (aim) cursorAt = measured

  const shown = designs.filter(d => !d.gone)
  const aimResizing = !!aim && "design" in aim && !!designs.find(x => x.id === aim.design)?.resizing
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
              {designs.map(d => {
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
                    style={{ width: size, height: size, filter: product.light ? LIGHT_PRODUCT_IMAGE_SHADOW : undefined }}
                  />
                ),
              },
            ]}
            activeViewId="front"
            onSelectView={() => {}}
            printTechnique={state.technique}
            onPrintTechnique={() => {}}
            techniqueMenuOpen={state.techniqueMenu}
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
          // At the bottom, the same 16px from the sides and the bottom; as tall
          // as its content, so the space above is whatever is left.
          <div className="animate-in fade-in slide-in-from-bottom-3 absolute inset-x-4 bottom-4 z-[50] mx-auto flex max-w-[640px] flex-col rounded-2xl bg-white p-5 shadow-xl duration-300">
            <EmbroiderySolutions
              compact
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
          // On a corner being resized it rides the live size, frame by frame.
          moveMs={instant || aimResizing ? 0 : state.cursorMs}
        />
      </div>
      <div className="flex items-stretch justify-center gap-2">
        <AutoPlay on={autoPlay} onChange={setAutoPlay} />
        <StartOver
          onClick={() => {
            setAutoPlay(true)
            setRestart(n => n + 1)
          }}
        />
      </div>
    </div>
  )
}
