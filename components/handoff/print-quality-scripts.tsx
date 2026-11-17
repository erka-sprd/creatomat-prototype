"use client"

/**
 * The print-quality handoff's scenes: each rule's "If → Then" steps and the
 * script that plays them, for desktop and for a phone. An upload past the
 * size it prints sharp at behaves as a design past embroidery's hoop frame
 * does, so the rules play on that handoff's engine (embroidery-scene.tsx) —
 * its "hoop" set to the upload's sharp size; only "Upload larger", which
 * needs the Uploads panel, plays on print-quality-scene.tsx.
 */

import { useMemo } from "react"
import type { CanvasProduct } from "@/components/handoff/embroidery-canvas"
import {
  Scene,
  all,
  design,
  type SceneDesign,
  type SceneDevice,
  type SceneState,
  type Step,
} from "@/components/handoff/embroidery-scene"
import {
  QualityScene,
  SHARP_WIDTH_PX,
  UPLOAD_SRC,
  useImageSize,
  type QualityState,
  type QualityUpdate,
} from "@/components/handoff/print-quality-scene"
import {
  PANEL_SLIDE_MS,
  PRINT_FIT_LABEL,
  PRINT_TOO_LARGE_LABEL,
  PRINT_UPLOAD_LARGER_LABEL,
  RECOVERED_GOOD_SIZE_MS,
} from "@/lib/designer-constants"
import { printMaxWidthMm } from "@/lib/print-quality"

/**
 * The T-shirt's colour in these scenes, by its catalogue name: the upload they
 * play with is a white rabbit, which a white shirt would swallow.
 */
export const QUALITY_PRODUCT_COLOR = "beige"

// `device`: the scene's mobile version, or its controls driven from outside
// (the handoff's Desktop / Mobile switch, the mobile frame's page).
type SceneProps = { product: CanvasProduct | null; device?: SceneDevice }

/** How long the stage holds its last beat before the loop starts over. */
const END_HOLD_MS = 2600
const PRESS_MS = 150
const POINT_MS = 700
const seconds = (ms: number) => `${ms / 1000} seconds`

type Update = Partial<SceneState> | ((s: SceneState) => SceneState)

/** Beats from waits: each entry runs `wait` ms after the one before. */
function timeline<U>(...entries: [number, U][]) {
  let t = 0
  const beats = entries.map(([wait, set]) => ({ at: (t += wait), set }))
  return { beats, cycleMs: t + END_HOLD_MS }
}

/** Point at `aim`, press, and on release do `then`. */
function click(aim: SceneState["cursor"], then: Update, wait = 1000): [number, Update][] {
  return [
    [wait, { cursor: aim, cursorMs: 500 }],
    [POINT_MS, { pressed: true }],
    [PRESS_MS, all({ pressed: false }, then)],
  ]
}

/** A resize of the upload by its bottom-right handle — upload and hand travel together over `ms`. */
const resize = (size: number, ms: number) =>
  all(
    { cursor: { design: "a", at: "se" }, cursorMs: ms },
    design("a", { size, motionMs: ms, bounce: false, resizing: "se" })
  )

/** The pointer let go: the upload drops its resize, the green area goes. */
const release = (s: SceneState): SceneState => ({
  ...s,
  pressed: false,
  designs: s.designs.map(d => ({ ...d, resizing: null, hot: null, guide: null })),
})

/* ------------------------------------------------------------- the stage */

// Where the upload's centre sits: down the print area (a share of its
// height, so the collar shows above it), and px from the stage's top — on a
// phone lower, clear of the editor bar. High enough on desktop that its
// rotate/move handles stay clear of the message at the bottom.
const UPLOAD_AREA_Y = 0.17
const UPLOAD_STAGE_Y = { desktop: 135, mobile: 230 }
/** How far past its sharp size the scenes take the upload, as a multiple of it. */
const TOO_LARGE_SIZE = 1.5
/** Where the scenes that enlarge it start it, below its sharp size. */
const GOOD_SIZE = 0.75

/**
 * The stage for a scene: the product with its "hoop" set to the size the
 * upload prints sharp at — so a size of 1 is that size, and the green area
 * marks it — zoomed in until that size is SHARP_WIDTH_PX wide. null until
 * both are loaded.
 */
function usePrintStage(product: CanvasProduct | null, mobile: boolean) {
  const pixels = useImageSize(UPLOAD_SRC)
  return useMemo(() => {
    if (!product || !pixels) return null
    const sharpShare = printMaxWidthMm(pixels.w) / product.widthMm
    const productPx = SHARP_WIDTH_PX / ((product.area.width / 100) * sharpShare)
    const areaH = (productPx * product.area.height) / 100
    return {
      product: { ...product, hoop: sharpShare },
      layout: {
        productPx,
        focusY: UPLOAD_STAGE_Y[mobile ? "mobile" : "desktop"] + (0.5 - UPLOAD_AREA_Y) * areaH,
      },
    }
  }, [product, pixels, mobile])
}

/** The upload, selected, at `size` — resized, its top-left corner stays where it is at that size. */
const upload = (size: number, patch: Partial<SceneDesign> = {}): SceneDesign => ({
  id: "a",
  src: UPLOAD_SRC,
  cx: 0.5,
  cy: UPLOAD_AREA_Y,
  size,
  pin: { corner: "nw", size },
  selected: true,
  ...patch,
})

// Past its sharp size: the message in the bottom row's place, the frame orange.
const tooLarge = all(
  { issue: "print-too-large", fit: true, row: false, editorBar: false, green: null },
  design("a", { tone: "orange" })
)
// Back at it: the green message for RECOVERED_GOOD_SIZE_MS, the frame green.
const goodSize = all({ issue: null, green: "print-good" }, design("a", { tone: "green" }))
// And then as any selected upload: blue, its editor bar and the bottom row back.
const settled = all({ green: null, row: true, editorBar: true }, design("a", { tone: "blue" }))

const TOO_LARGE_START: Partial<SceneState> = {
  technique: "standard",
  issue: "print-too-large",
  fit: true,
  row: false,
  designs: [upload(TOO_LARGE_SIZE, { tone: "orange" })],
}
const GOOD_START: Partial<SceneState> = {
  technique: "standard",
  editorBar: true,
  designs: [upload(GOOD_SIZE)],
}

/** One rule on the canvas, from `initial`, on the print stage. */
function PrintScene({
  product,
  device,
  steps,
  initial,
  script,
}: SceneProps & {
  steps: Step[]
  initial: Partial<SceneState>
  script: { beats: { at: number; set: Update }[]; cycleMs: number }
}) {
  const stage = usePrintStage(product, !!device?.mobile)
  if (!stage) return null
  return (
    <Scene
      product={stage.product}
      layout={stage.layout}
      steps={steps}
      initial={initial}
      device={device}
      {...script}
    />
  )
}

/* ------------------------------------------------------------ §1 too large */

const RESIZE_STEPS: Step[] = [
  { when: "an upload is enlarged", then: "it grows freely" },
  { when: "it passes its sharp size", then: "orange, green area, the message" },
  { when: "the handle is released", then: "the message stays while too large" },
]
const GROW_MS = 1600
// When the resize — played linear, as a hand drags — passes the sharp size.
const PASSES_AT_MS = Math.round((GROW_MS * (1 - GOOD_SIZE)) / (TOO_LARGE_SIZE - GOOD_SIZE))
const RESIZE = timeline<Update>(
  [900, { cursor: { design: "a", at: "se" }, cursorMs: 600 }],
  [POINT_MS, all({ pressed: true }, design("a", { hot: "se", guide: "se" }))],
  [400, resize(TOO_LARGE_SIZE, GROW_MS)],
  [PASSES_AT_MS, all({ step: 1 }, tooLarge)],
  [GROW_MS - PASSES_AT_MS + 1600, all({ step: 2 }, release)],
  [900, { cursor: null }]
)

export function TooLargeScene(props: SceneProps) {
  return <PrintScene {...props} steps={RESIZE_STEPS} initial={GOOD_START} script={RESIZE} />
}

/* -------------------------------------------------------- §2 stays selected */

const selectedSteps = (mobile: boolean): Step[] => [
  { when: "an upload is too large", then: "selected, in orange" },
  { when: mobile ? "tapped outside" : "clicked outside", then: "stays selected until it fits" },
]
const SELECTED_STEPS = { desktop: selectedSteps(false), mobile: selectedSteps(true) }
// Two spots on the empty canvas, either side of the upload.
const SELECTED = timeline<Update>(
  ...click({ x: 0.14, y: 0.32 }, { step: 1 }, 1600),
  ...click({ x: 0.84, y: 0.24 }, {}, 1100),
  [900, { cursor: null }]
)

export function StaysSelectedScene(props: SceneProps) {
  const key = props.device?.mobile ? "mobile" : "desktop"
  return (
    <PrintScene {...props} steps={SELECTED_STEPS[key]} initial={TOO_LARGE_START} script={SELECTED} />
  )
}

/* ---------------------------------------------------------- §3 no editor bar */

const barSteps = (mobile: boolean): Step[] => [
  { when: "a good-size upload is selected", then: "its editor bar shows" },
  { when: "enlarged past its sharp size", then: "the editor bar goes" },
  {
    when: `“${PRINT_FIT_LABEL}” is ${mobile ? "tapped" : "clicked"}`,
    then: "the editor bar returns",
  },
]
const BAR_STEPS = { desktop: barSteps(false), mobile: barSteps(true) }
const FIT_MS = 500
const BAR = timeline<Update>(
  [1400, { cursor: { design: "a", at: "se" }, cursorMs: 600 }],
  [POINT_MS, all({ pressed: true }, design("a", { hot: "se", guide: "se" }))],
  [400, resize(TOO_LARGE_SIZE, GROW_MS)],
  [PASSES_AT_MS, all({ step: 1 }, tooLarge)],
  [GROW_MS - PASSES_AT_MS + 900, release],
  ...click(
    { button: PRINT_FIT_LABEL },
    all({ cursor: null }, design("a", { size: 1, motionMs: FIT_MS, bounce: true })),
    1400
  ),
  [FIT_MS, all({ step: 2, editorBar: true }, goodSize)],
  [RECOVERED_GOOD_SIZE_MS, settled]
)

export function EditorBarScene(props: SceneProps) {
  const key = props.device?.mobile ? "mobile" : "desktop"
  return <PrintScene {...props} steps={BAR_STEPS[key]} initial={GOOD_START} script={BAR} />
}

/* ---------------------------------------------------------- §4 add to basket */

const BASKET_STEPS: Step[] = [
  { when: "add to basket, message up", then: "refused — the message shakes" },
]
// The basket button is off the canvas: its click is told by the shake and the flash.
const refuse = (s: SceneState): SceneState => ({ ...s, shake: s.shake + 1, flash: s.flash + 1 })
const BASKET = timeline<Update>([2000, refuse], [3000, refuse])

export function BasketScene(props: SceneProps) {
  return <PrintScene {...props} steps={BASKET_STEPS} initial={TOO_LARGE_START} script={BASKET} />
}

/* ------------------------------------------------------ §5 back to a good size */

const BACK_STEPS: Step[] = [
  { when: "a corner handle is held", then: "the green area shows its sharp size" },
  { when: "resized down to it", then: "snaps, turns green" },
  { when: "the handle is released", then: `green for ${seconds(RECOVERED_GOOD_SIZE_MS)}` },
]
const SHRINK_MS = 1400
const BACK = timeline<Update>(
  [900, { cursor: { design: "a", at: "se" }, cursorMs: 600 }],
  [POINT_MS, all({ pressed: true }, design("a", { hot: "se", guide: "se" }))],
  [1600, all({ step: 1 }, resize(1, SHRINK_MS))],
  [SHRINK_MS, goodSize],
  [1200, all({ step: 2, editorBar: true }, release)],
  [RECOVERED_GOOD_SIZE_MS, settled],
  [600, { cursor: null }]
)

export function BackToGoodSizeScene(props: SceneProps) {
  return <PrintScene {...props} steps={BACK_STEPS} initial={TOO_LARGE_START} script={BACK} />
}

/* --------------------------------------------------------- §6 fit to good size */

const fitSteps = (mobile: boolean): Step[] => [
  {
    when: `“${PRINT_FIT_LABEL}” is ${mobile ? "tapped" : "clicked"}`,
    then: "shrinks to its sharp size, small bounce",
  },
  { when: "it's there", then: `green for ${seconds(RECOVERED_GOOD_SIZE_MS)}` },
]
const FIT_STEPS = { desktop: fitSteps(false), mobile: fitSteps(true) }
// About its centre: no pinned corner.
const FIT_START: Partial<SceneState> = {
  ...TOO_LARGE_START,
  designs: [upload(TOO_LARGE_SIZE, { tone: "orange", pin: undefined })],
}
const FIT = timeline<Update>(
  ...click(
    { button: PRINT_FIT_LABEL },
    all({ cursor: null }, design("a", { size: 1, motionMs: FIT_MS, bounce: true })),
    1800
  ),
  [FIT_MS, all({ step: 1, editorBar: true }, goodSize)],
  [RECOVERED_GOOD_SIZE_MS, settled]
)

export function FitScene(props: SceneProps) {
  const key = props.device?.mobile ? "mobile" : "desktop"
  return <PrintScene {...props} steps={FIT_STEPS[key]} initial={FIT_START} script={FIT} />
}

/* ------------------------------------------------------------ §7 upload larger */

const larger = (mobile: boolean): Step[] => [
  {
    when: `“${PRINT_TOO_LARGE_LABEL}” shows`,
    then: `it offers “${PRINT_FIT_LABEL}” and “${PRINT_UPLOAD_LARGER_LABEL}”`,
  },
  {
    when: `“${PRINT_UPLOAD_LARGER_LABEL}” is ${mobile ? "tapped" : "clicked"}`,
    then: `the Uploads ${mobile ? "drawer" : "panel"} opens`,
  },
]
const LARGER_STEPS = { desktop: larger(false), mobile: larger(true) }
// Too large, the message up, and the upload already in the panel — so it
// opens on it. Just the one upload: the rule is the button, not the list.
const LARGER_INITIAL: Partial<QualityState> = {
  size: TOO_LARGE_SIZE,
  notice: true,
  uploaded: true,
}
/** How much taller than the other scenes this stage is, so the opened panel shows its tiles. */
const LARGER_EXTRA_HEIGHT_PX = 200
const largerTimeline = (mobile: boolean) =>
  timeline<QualityUpdate>(
    [1600, { cursor: { button: PRINT_UPLOAD_LARGER_LABEL }, cursorMs: 600 }],
    [POINT_MS, { pressed: true }],
    [PRESS_MS, { pressed: false, panel: true, step: 1 }],
    [PANEL_SLIDE_MS + 600, mobile ? { cursor: null } : { cursor: { x: 0.9, y: 0.3 }, hand: false }],
    [1800, {}]
  )
const LARGER = { desktop: largerTimeline(false), mobile: largerTimeline(true) }

export function UploadLargerScene({ product, device }: SceneProps) {
  const key = device?.mobile ? "mobile" : "desktop"
  return (
    <QualityScene
      product={product}
      steps={LARGER_STEPS[key]}
      initial={LARGER_INITIAL}
      device={device}
      withPanel
      singleUpload
      extraHeightPx={LARGER_EXTRA_HEIGHT_PX}
      {...LARGER[key]}
    />
  )
}

/** The scenes with a mobile version, by the key the mobile frame page is opened with. */
export const QUALITY_MOBILE_SCENES = {
  resize: TooLargeScene,
  selected: StaysSelectedScene,
  bar: EditorBarScene,
  back: BackToGoodSizeScene,
  fit: FitScene,
  larger: UploadLargerScene,
} as const
export type QualityMobileSceneKey = keyof typeof QUALITY_MOBILE_SCENES
