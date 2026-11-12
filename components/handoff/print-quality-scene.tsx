"use client"

/**
 * The print-quality handoff's scene engine: one rule, played on the designer's
 * canvas and its Uploads panel. A scene is an "If → Then" list and a script of
 * beats; each beat sets the stage and lights the step it shows.
 *
 * Real: the size message (EmbroideryMaxSizeBadge), the selection's handles,
 * the Uploads panel with its tiles, and every
 * number — the stop is the designer's own, from the image's pixels and the
 * print area's millimetres. Faked: the script (the resize is CSS-tweened, not
 * dragged; hovers are dispatched, not pointed), the canvas shown zoomed in on
 * the chest without its bottom row, and the files — two images from /public,
 * handed to the panel's own file input rather than picked from disk.
 *
 * `device.mobile`: the same rule on a phone screen — the designer's mobile
 * header, dots and dock around the canvas, the Uploads panel in its bottom
 * drawer, a fingertip for the cursor (print-quality-mobile.tsx).
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { SelectionBottomHandles } from "@/components/designer"
import {
  EMBROIDERY_MIN_BOUNCE_MS,
  PRINT_MAX_BOUNCE_SCALE,
  PRINT_MAX_SIZE_ACTION,
  PRINT_MAX_SIZE_KEEP,
  PRINT_MAX_SIZE_LABEL,
  SELECTION_TONE,
  printMaxSizeDetail,
} from "@/lib/designer-constants"
import { EmbroideryMaxSizeBadge } from "@/components/embroidery-label"
import {
  CORNERS,
  SceneControls,
  useLoop,
  type CanvasProduct,
} from "@/components/handoff/embroidery-canvas"
import {
  HANDLE_POS,
  MOBILE_STAGE_H,
  useInView,
  useStageWidth,
  type SceneDevice,
  type Step,
} from "@/components/handoff/embroidery-scene"
import { PhoneFrame } from "@/components/handoff/phone-frame"
import { QualityMobileChrome } from "@/components/handoff/print-quality-mobile"
import { CursorArrow, CursorHand } from "@/components/handoff/rail-replica"
import { StepList } from "@/components/handoff/step-list"
import SiteHeader from "@/components/site-header"
import { UploadPanel } from "@/components/ui/upload-panel/UploadPanel"
import { printMaxWidthMm } from "@/lib/print-quality"

/** The upload every scene plays with: a small raster image. */
export const UPLOAD_SRC = "/img/handoff/low-res-upload.png"
const UPLOAD_NAME = "low-res-upload.png"
// Uploaded with it, so the panel holds two and places neither by itself.
export const SECOND_UPLOAD_SRC = "/img/graphics/graphics5.png"
const SECOND_UPLOAD = { src: SECOND_UPLOAD_SRC, name: "mushroom.png" }

/** What the scripts aim at, as the panel and the message mark them up. */
export const TILE = `img[alt="${UPLOAD_NAME}"]`
export const SIZE_MESSAGE = '[role="status"]'

// How wide the upload is on the stage at its stop — the canvas is zoomed in
// until it is, so a few centimetres of print read at all.
const STOP_WIDTH_PX = 104
// Where the upload's centre sits: down the print area (a share of its
// height, so the collar shows above it), and px from the stage's top.
const DESIGN_AREA_Y = 0.17
const DESIGN_STAGE_Y = 170
// On a phone: lower, clear of the action header, the message above the dots.
const MOBILE_DESIGN_STAGE_Y = 190
// With the panel the stage is no taller: the tile then starts below the
// panel's fold, as it does in the designer once a few uploads are in — so the
// scroll to it has somewhere to go.
const STAGE_HEIGHT_PX = 420
// The designer's desktop add panel: its width and its inset from the canvas.
const PANEL_WIDTH_PX = 375
const PANEL_INSET_PX = 4
// The least gap between the size message and the stage's right edge.
const MESSAGE_EDGE_GAP_PX = 16
const DEFAULT_MOTION_MS = 500
const EASE = "cubic-bezier(0.4,0,0.2,1)"

/* ------------------------------------------------------------------ state */

export type Aim =
  /** The upload's bottom-right handle — `dx`, `dy` px past it. */
  | { corner: true; dx?: number; dy?: number }
  /** A button, by its text. */
  | { button: string }
  /**
   * An element, `fx`, `fy` of the way across and down it (default: its
   * middle), then `dx`, `dy` px on from there.
   */
  | { sel: string; fx?: number; fy?: number; dx?: number; dy?: number }
  /** A share of the stage's width and height. */
  | { x: number; y: number }

export type QualityState = {
  /** The upload is on the canvas. */
  placed: boolean
  /** It's selected: its frame and handles show. A click outside lets it go. */
  selected: boolean
  /** Its width, as a share of the widest it prints sharp (1 = the stop). */
  size: number
  /** Held by its bottom-right handle: only that handle stays. */
  resizing: boolean
  /** Each new value plays the stop's bounce. */
  bounce: number
  /** The size message under it. */
  notice: boolean
  /** The Uploads panel, open. */
  panel: boolean
  /** The two files, handed to the panel's file input. */
  uploaded: boolean
  /** What the pointer is on, in the panel. */
  hover: "tile" | null
  cursor: Aim | null
  /** The hand, over what the product gives `cursor: pointer`; else the arrow. */
  hand: boolean
  pressed: boolean
  cursorMs: number
  /** How long the upload's resize takes. */
  motionMs: number
  step: number
}

export const BASE_QUALITY_STATE: QualityState = {
  placed: true,
  selected: true,
  size: 1,
  resizing: false,
  bounce: 0,
  notice: false,
  panel: false,
  uploaded: false,
  hover: null,
  cursor: null,
  hand: true,
  pressed: false,
  cursorMs: DEFAULT_MOTION_MS,
  motionMs: DEFAULT_MOTION_MS,
  step: 0,
}

export type QualityUpdate = Partial<QualityState> | ((s: QualityState) => QualityState)
export type QualityBeat = { at: number; set: QualityUpdate }


/* ------------------------------------------------------------------ pieces */

/** An image's own pixel size, once loaded. */
export function useImageSize(src: string) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    let live = true
    const img = new Image()
    img.onload = () => {
      if (live) setSize({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = src
    return () => {
      live = false
    }
  }, [src])
  return size
}

/**
 * The drawn pointer, its tip on (x, y): the hand's fingertip sits at (11,3)
 * in its glyph's box, the arrow's tip at (4,2).
 */
function SceneCursor({
  x,
  y,
  shown,
  hand,
  pressed,
  moveMs,
}: {
  x: number
  y: number
  shown: boolean
  hand: boolean
  pressed: boolean
  moveMs: number
}) {
  const tip = hand ? { x: 11, y: 3 } : { x: 4, y: 2 }
  return (
    <div
      aria-hidden
      className={`absolute top-0 left-0 z-[60] transition-[translate,opacity] ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      style={{
        translate: `${x - tip.x}px ${y - tip.y}px`,
        transitionDuration: `${moveMs}ms, 300ms`,
        transitionTimingFunction: EASE,
      }}
    >
      <div
        className={`transition-[scale] duration-150 ${pressed ? "scale-[0.82]" : "scale-100"}`}
        style={{ transformOrigin: `${tip.x}px ${tip.y}px` }}
      >
        {hand ? <CursorHand /> : <CursorArrow />}
      </div>
    </div>
  )
}

/**
 * The pointer moving from `from` to `to`, as React hears it: one mouseout
 * naming where it went covers both the leave and the enter; from nowhere,
 * a mouseover.
 */
function movePointer(from: Element | null, to: Element | null) {
  if (from?.isConnected) {
    from.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: to }))
  } else if (to) {
    to.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }))
  }
}

/* ------------------------------------------------------------------ scene */

/**
 * One rule played on the canvas: `steps` listed above, the stage below,
 * `beats` setting it on a loop of `cycleMs` from `initial`. `withPanel`: the
 * Uploads panel is part of it — the upload sits in what's left of the canvas
 * beside it, and `atTile` starts the panel's list scrolled to the tile.
 * The panel's files arrive by its own file input, once `uploaded` is set.
 */
export function QualityScene({
  product,
  steps,
  initial,
  beats,
  cycleMs,
  withPanel = false,
  atTile = false,
  extraHeightPx = 0,
  singleUpload = false,
  device = {},
}: {
  product: CanvasProduct | null
  steps: Step[]
  initial: Partial<QualityState>
  beats: QualityBeat[]
  cycleMs: number
  withPanel?: boolean
  atTile?: boolean
  /** Desktop: this much taller than the usual stage (a phone's screen is fixed). */
  extraHeightPx?: number
  /** Only the upload itself goes in the panel, not the second image beside it. */
  singleUpload?: boolean
  device?: SceneDevice
}) {
  const { mobile = false } = device
  const start = useMemo(() => ({ ...BASE_QUALITY_STATE, ...initial }), [initial])
  const [state, setState] = useState<QualityState>(start)
  const [instant, setInstant] = useState(true)
  const [ownAutoPlay, setAutoPlay] = useState(true)
  const [ownRestart, setRestart] = useState(0)
  // Driven from outside when given (the mobile frame, from its page's bar).
  const autoPlay = device.autoPlay ?? ownAutoPlay
  const restart = ownRestart + (device.restartSignal ?? 0)
  // Each run of the loop mounts the panel anew: its popover and hovers go.
  const [run, setRun] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const designRef = useRef<HTMLDivElement>(null)
  const hovered = useRef<Element | null>(null)
  // The url the panel gave the upload (a blob: url), once it's in the list.
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const inView = useInView(boxRef)
  const stageW = useStageWidth(stageRef)
  const pixels = useImageSize(UPLOAD_SRC)
  const stageH = mobile ? MOBILE_STAGE_H : STAGE_HEIGHT_PX + extraHeightPx
  // Beside the desktop panel the upload sits in what's left of the canvas; a
  // phone's drawer covers the canvas instead.
  const besidePanel = withPanel && !mobile
  const designY = mobile ? MOBILE_DESIGN_STAGE_Y : DESIGN_STAGE_Y

  useLoop(
    autoPlay && inView,
    [
      {
        at: 0,
        run: () => {
          // Back to the top without animating there.
          setInstant(true)
          setState(start)
          setRun(n => n + 1)
          setUploadUrl(null)
          hovered.current = null
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

  // The size message's width, measured once it's on the stage (mounted even
  // while hidden, so it's there from the first frame on).
  const [messageW, setMessageW] = useState(0)
  useLayoutEffect(() => {
    const message = stageRef.current?.querySelector<HTMLElement>(SIZE_MESSAGE)
    if (message && message.offsetWidth !== messageW) setMessageW(message.offsetWidth)
  })

  // The upload at its stop, px: as wide as its pixels print sharp, on a canvas
  // zoomed in until that is STOP_WIDTH_PX. Resized, its top-left corner stays.
  const geo = useMemo(() => {
    if (!product || !pixels || !stageW) return null
    const stopShare = printMaxWidthMm(pixels.w) / product.widthMm
    const productPx = STOP_WIDTH_PX / ((product.area.width / 100) * stopShare)
    // Beside the panel: in the middle of what's left of the canvas — but no
    // further right than lets the message under it fit, whole, on the stage.
    const centreX = besidePanel
      ? Math.min(
          PANEL_INSET_PX + PANEL_WIDTH_PX + (stageW - PANEL_INSET_PX - PANEL_WIDTH_PX) / 2,
          stageW - messageW / 2 - MESSAGE_EDGE_GAP_PX
        )
      : stageW / 2
    const stopH = (STOP_WIDTH_PX * pixels.h) / pixels.w
    return {
      productPx,
      productLeft: centreX - (productPx * (product.area.left + product.area.width / 2)) / 100,
      productTop:
        designY - (productPx * (product.area.top + product.area.height * DESIGN_AREA_Y)) / 100,
      left: centreX - STOP_WIDTH_PX / 2,
      top: designY - stopH / 2,
      stopH,
    }
  }, [product, pixels, stageW, besidePanel, designY, messageW])
  const width = STOP_WIDTH_PX * state.size
  const height = (geo?.stopH ?? 0) * state.size

  // Running into the stop, the upload gives a little — past it and back.
  useEffect(() => {
    if (!state.bounce) return
    designRef.current?.animate(
      [{ scale: "1" }, { scale: String(PRINT_MAX_BOUNCE_SCALE) }, { scale: "1" }],
      { duration: EMBROIDERY_MIN_BOUNCE_MS, easing: "ease-out" }
    )
  }, [state.bounce])

  // The panel's hover, told to the real tile.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const to = state.hover === "tile" ? stage.querySelector(TILE) : null
    if (to === hovered.current) return
    movePointer(hovered.current, to)
    hovered.current = to
  }, [state.hover])

  // The files, put in the panel's own file input as a picker would.
  useEffect(() => {
    if (!state.uploaded) return
    let live = true
    const files = [{ src: UPLOAD_SRC, name: UPLOAD_NAME }, ...(singleUpload ? [] : [SECOND_UPLOAD])]
    Promise.all(
      files.map(async ({ src, name }) => {
        const blob = await (await fetch(src)).blob()
        return new File([blob], name, { type: blob.type })
      })
    )
      .then(files => {
        const input = stageRef.current?.querySelector<HTMLInputElement>('input[type="file"]')
        if (!live || !input) return
        const transfer = new DataTransfer()
        files.forEach(file => transfer.items.add(file))
        input.files = transfer.files
        input.dispatchEvent(new Event("change", { bubbles: true }))
        // Its tile, once the panel has rendered it.
        window.setTimeout(() => {
          const tile = stageRef.current?.querySelector<HTMLImageElement>(TILE)
          if (live && tile) setUploadUrl(tile.src)
        }, 50)
      })
      // A document should degrade, not break: the panel just stays empty.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [state.uploaded, run, singleUpload])

  // `atTile`: the list starts scrolled down to the tile, once it's in the list.
  useEffect(() => {
    if (!atTile || !uploadUrl) return
    const list = stageRef.current?.querySelector(TILE)?.closest(".overflow-y-auto")
    if (list) list.scrollTop = list.scrollHeight
  }, [atTile, uploadUrl])

  // The cursor: on the upload's handle (from the script's geometry, so it
  // rides the resize), or on something in the stage, measured once it's aimed at.
  const [measured, setMeasured] = useState<{ x: number; y: number } | null>(null)
  const aim = state.cursor
  const aimKey = JSON.stringify(aim)
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || !aim || "corner" in aim || "x" in aim) return
    const target =
      "button" in aim
        ? [...stage.querySelectorAll<HTMLElement>("button")].find(
            b => b.textContent?.trim() === aim.button
          )
        : stage.querySelector<HTMLElement>(aim.sel)
    if (!target) return
    const s = stage.getBoundingClientRect()
    const r = target.getBoundingClientRect()
    const at: { fx?: number; fy?: number; dx?: number; dy?: number } = "sel" in aim ? aim : {}
    setMeasured({
      x: r.left - s.left + r.width * (at.fx ?? 0.5) + (at.dx ?? 0),
      y: r.top - s.top + r.height * (at.fy ?? 0.5) + (at.dy ?? 0),
    })
    // aimKey stands for the aim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aimKey])
  let cursorAt: { x: number; y: number } | null = null
  if (aim && "corner" in aim) {
    if (geo) {
      cursorAt = { x: geo.left + width + (aim.dx ?? 0), y: geo.top + height + (aim.dy ?? 0) }
    }
  } else if (aim && "x" in aim) cursorAt = { x: aim.x * stageW, y: aim.y * stageH }
  else if (aim) cursorAt = measured

  const corners = state.resizing ? CORNERS.filter(c => c === "se") : CORNERS
  const motionMs = instant ? 0 : state.motionMs

  const cursorMs = instant ? 0 : state.cursorMs
  const uploads = <UploadPanel key={run} onPlaceImage={() => {}} />

  return (
    <div ref={boxRef} className="flex flex-col gap-3">
      <StepList steps={steps} active={state.step} />
      {/* A phone: the site's header over the canvas. */}
      <PhoneFrame on={mobile}>
      {mobile && <SiteHeader />}
      <div
        ref={stageRef}
        className={`relative w-full overflow-hidden [&_*]:pointer-events-none ${
          mobile
            ? // The canvas, under the header. The transform makes it the
              // containing block of the dock's position: fixed, as on a phone.
              "bg-[var(--sprd-neutral-200)] [container-type:inline-size] [transform:translateZ(0)]"
            : // Beside the panel the canvas still has to hold the size message.
              `rounded-[12px] bg-[#F4F4F4] ${withPanel ? "min-w-[640px]" : "min-w-[560px]"}`
        }`}
        style={{ height: stageH }}
      >
        {product && geo && (
          <>
            <img
              src={product.image}
              alt=""
              draggable={false}
              // max-w-none: far wider than the stage, it would otherwise be
              // squeezed to it (preflight's img max-width).
              className="absolute max-w-none"
              style={{
                left: geo.productLeft,
                top: geo.productTop,
                width: geo.productPx,
                height: geo.productPx,
              }}
            />
            <div
              ref={designRef}
              className="absolute"
              style={{
                left: geo.left,
                top: geo.top,
                width,
                height,
                opacity: state.placed ? 1 : 0,
                transition: `width ${motionMs}ms ${EASE}, height ${motionMs}ms ${EASE}, opacity ${
                  instant ? 0 : 300
                }ms ease-out`,
              }}
            >
              <img
                src={UPLOAD_SRC}
                alt=""
                draggable={false}
                className="absolute inset-0 size-full object-contain"
              />
              {state.selected && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ boxShadow: `0 0 0 1px ${SELECTION_TONE.blue.hex}` }}
                  />
                  {corners.map(corner => (
                    <span
                      key={corner}
                      className={`absolute ${HANDLE_POS[corner]} z-30 block size-[15px] rounded-full border-2 ${SELECTION_TONE.blue.handle} bg-white`}
                      style={
                        state.resizing ? { backgroundColor: SELECTION_TONE.blue.hex } : undefined
                      }
                    />
                  ))}
                  {!state.resizing && (
                    <SelectionBottomHandles onRotateStart={() => {}} onMoveStart={() => {}} />
                  )}
                </>
              )}
              {/* In the rotate/move handles' spot, over them once they're back. */}
              <div className="absolute top-full left-1/2 z-40 mt-5 -translate-x-1/2">
                <EmbroideryMaxSizeBadge
                  show={state.notice}
                  label={PRINT_MAX_SIZE_LABEL}
                  icon={null}
                  tone="brand"
                  detail={pixels ? printMaxSizeDetail(pixels) : undefined}
                  learnMoreLabel={PRINT_MAX_SIZE_ACTION}
                  onLearnMore={() => {}}
                  dismissLabel={PRINT_MAX_SIZE_KEEP}
                  onDismiss={() => {}}
                  onHoverChange={() => {}}
                />
              </div>
            </div>
          </>
        )}
        {besidePanel && (
          // The designer's desktop add panel, as it wraps its Uploads panel.
          <div
            className={`absolute inset-y-[4px] left-[4px] z-30 flex w-[375px] flex-col rounded-[12px] bg-white shadow-[32px_0px_50px_0px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-out ${
              state.panel ? "translate-x-0" : "-translate-x-[calc(100%+100px)]"
            }`}
            style={instant ? { transition: "none" } : undefined}
          >
            <h2 className="font-display flex-shrink-0 px-6 pt-6 pb-4 text-[18px] font-medium text-black capitalize">
              uploads
            </h2>
            {uploads}
          </div>
        )}
        {!mobile ? (
          <SceneCursor
            x={cursorAt?.x ?? stageW / 2}
            y={cursorAt?.y ?? stageH}
            shown={!!cursorAt}
            hand={state.hand}
            pressed={state.pressed}
            moveMs={cursorMs}
          />
        ) : (
          product && (
          <QualityMobileChrome
            color={{ name: product.colorName, hex: product.colorHex }}
            selected={state.placed && state.selected}
            drawer={withPanel ? uploads : null}
            drawerOpen={state.panel}
            instant={instant}
            tap={cursorAt}
            pressed={state.pressed}
            // On the handle being resized it rides the resize, as the cursor does.
            moveMs={cursorMs}
          />
          )
        )}
      </div>
      </PhoneFrame>
      {!device.hideControls && (
        <SceneControls
          leading={device.controlsLeading}
          autoPlay={autoPlay}
          onAutoPlay={setAutoPlay}
          onStartOver={() => {
            setAutoPlay(true)
            setRestart(n => n + 1)
          }}
        />
      )}
    </div>
  )
}
