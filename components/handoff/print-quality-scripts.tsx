"use client"

/**
 * The print-quality handoff's scenes: each rule's "If → Then" steps and the
 * script that plays them (the engine is print-quality-scene.tsx), for desktop
 * and for a phone. A phone has no hover and no cursor at rest, so its scripts
 * drop those beats and its steps the rules that only a pointer has.
 */

import type { CanvasProduct } from "@/components/handoff/embroidery-canvas"
import type { SceneDevice, Step } from "@/components/handoff/embroidery-scene"
import {
  QualityScene,
  SIZE_MESSAGE,
  type Aim,
  type QualityState,
  type QualityUpdate,
} from "@/components/handoff/print-quality-scene"
import {
  PANEL_SLIDE_MS,
  PRINT_MAX_SIZE_ACTION,
  PRINT_MAX_SIZE_KEEP,
  PRINT_MAX_SIZE_LABEL,
  PRINT_MAX_SIZE_LINGER_MS,
} from "@/lib/designer-constants"

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
/** How long the pointer takes to get somewhere. */
const TRAVEL_MS = 600
/** Somewhere on the empty canvas, clear of the upload and the panel. */
const CANVAS: Aim = { x: 0.9, y: 0.82 }
/** How far the pointer pulls past the handle once the upload has stopped, px. */
const PULL_PAST = { dx: 46, dy: 32 }
/** How far below its stop the resize scene places the upload, as a share of it. */
const PLACED_SMALLER = 0.6
const seconds = (ms: number) => `${ms / 1000} seconds`

/** Beats from waits: each entry runs `wait` ms after the one before. */
function timeline(...entries: [number, QualityUpdate][]) {
  let t = 0
  const beats = entries.map(([wait, set]) => ({ at: (t += wait), set }))
  return { beats, cycleMs: t + END_HOLD_MS }
}

/** The pointer out of the way: off to the empty canvas, or — a finger — lifted. */
const rest = (mobile: boolean): Partial<QualityState> =>
  mobile ? { cursor: null } : { cursor: CANVAS, cursorMs: TRAVEL_MS, hand: false }

/** The upload runs into its stop: the pointer pulls on past the handle, it bounces, the message shows. */
const hitStop = (s: QualityState): QualityState => ({
  ...s,
  cursor: { corner: true, ...PULL_PAST },
  cursorMs: 450,
  bounce: s.bounce + 1,
  notice: true,
})

/* ------------------------------------------------------- §1 the resize stop */

const RESIZE_STEPS: Step[] = [
  { when: "a raster image is placed", then: "no larger than it prints sharp" },
  { when: "it's enlarged", then: "it grows freely up to that size" },
  {
    when: "the resize pushes past that size",
    then: `it stops with a small bounce — “${PRINT_MAX_SIZE_LABEL}”, the image's pixels, “${PRINT_MAX_SIZE_KEEP}” and “${PRINT_MAX_SIZE_ACTION}”`,
  },
]
// Placed below its stop, so the enlarging has room to show.
const RESIZE_INITIAL: Partial<QualityState> = { placed: false, size: PLACED_SMALLER }
/** How long the pointer stays on the held handle at the stop before the loop starts over. */
const RESIZE_HOLD_MS = 2000
// The pointer stays on the handle, held, at the stop — and the loop starts
// over from there, with no end hold of its own.
const RESIZE = (() => {
  const { beats, cycleMs } = timeline(
    [900, { placed: true }],
    [1800, { cursor: { corner: true }, cursorMs: TRAVEL_MS }],
    [POINT_MS, { pressed: true, resizing: true, step: 1 }],
    [200, { size: 1, motionMs: 1100, cursorMs: 1100 }],
    [1100, s => ({ ...hitStop(s), cursor: { corner: true }, step: 2 })]
  )
  return { beats, cycleMs: cycleMs - END_HOLD_MS + RESIZE_HOLD_MS }
})()

export function ResizeStopScene({ product, device }: SceneProps) {
  return (
    <QualityScene
      product={product}
      steps={RESIZE_STEPS}
      initial={RESIZE_INITIAL}
      device={device}
      {...RESIZE}
    />
  )
}

/* ------------------------------------------------------- §2 made smaller */

const SMALLER_STEPS: Step[] = [
  { when: "the resize runs into the maximum, handle held", then: "the message shows" },
  { when: "it's made smaller, still held", then: "the message disappears at once" },
]
const SMALLER_INITIAL: Partial<QualityState> = { placed: true }
/** How far below its stop the upload is taken back, as a share of it. */
const MADE_SMALLER = 0.8
const smallerTimeline = () => {
  const { beats, cycleMs } = timeline(
    [900, { cursor: { corner: true }, cursorMs: TRAVEL_MS }],
    [POINT_MS, { pressed: true, resizing: true }],
    // At the stop, the pointer on the handle as in §1.
    [300, s => ({ ...hitStop(s), cursor: { corner: true }, step: 0 })],
    [1800, { size: MADE_SMALLER, motionMs: 600, cursorMs: 600, notice: false, step: 1 }],
    [600, {}]
  )
  return { beats, cycleMs: cycleMs - END_HOLD_MS + RESIZE_HOLD_MS }
}
const SMALLER = smallerTimeline()

export function MadeSmallerScene({ product, device }: SceneProps) {
  return (
    <QualityScene
      product={product}
      steps={SMALLER_STEPS}
      initial={SMALLER_INITIAL}
      device={device}
      {...SMALLER}
    />
  )
}

/* ---------------------------------------------------- §3 how long it stays */

const LINGER_STEPS: Step[] = [
  { when: "the resize runs into the maximum", then: "the message shows" },
  {
    when: "the handle is released",
    then: `it stays ${seconds(PRINT_MAX_SIZE_LINGER_MS)}, then disappears`,
  },
]
const LINGER_INITIAL: Partial<QualityState> = { placed: true }
/** The resize runs into the stop and is let go of straight away: the countdown starts. */
const hitAndRelease = (mobile: boolean): [number, QualityUpdate][] => [
  [900, { cursor: { corner: true }, cursorMs: TRAVEL_MS }],
  [POINT_MS, { pressed: true, resizing: true }],
  [300, s => ({ ...hitStop(s), step: 0 })],
  [600, { pressed: false, resizing: false, step: 1, ...rest(mobile) }],
]
const lingerTimeline = (mobile: boolean) =>
  timeline(...hitAndRelease(mobile), [PRINT_MAX_SIZE_LINGER_MS, { notice: false }])
const LINGER = { desktop: lingerTimeline(false), mobile: lingerTimeline(true) }

export function LingerScene({ product, device }: SceneProps) {
  return (
    <QualityScene
      product={product}
      steps={LINGER_STEPS}
      initial={LINGER_INITIAL}
      device={device}
      {...LINGER[device?.mobile ? "mobile" : "desktop"]}
    />
  )
}

/* ------------------------------------------------- §4 the pointer on it */

// Desktop only: a phone has no pointer to rest on the message.
const HOVER_STEPS: Step[] = [
  {
    when: "the message shows, the handle released",
    then: `its ${seconds(PRINT_MAX_SIZE_LINGER_MS)} countdown runs`,
  },
  {
    when: "the pointer rests on the message",
    then: "the countdown stops — the message stays as long as the pointer does",
  },
]
const HOVER_INITIAL: Partial<QualityState> = { placed: true }
// Onto the message well inside its countdown, and on it for longer than the
// countdown: it only stays because of the pointer.
const HOVER = timeline(
  [900, { cursor: { corner: true }, cursorMs: TRAVEL_MS }],
  [POINT_MS, { pressed: true, resizing: true }],
  [300, hitStop],
  [600, { pressed: false, resizing: false }],
  [1000, { cursor: { sel: SIZE_MESSAGE, fx: 0.3, fy: 0.25 }, hand: false, cursorMs: TRAVEL_MS }],
  [TRAVEL_MS, { step: 1 }],
  [PRINT_MAX_SIZE_LINGER_MS + 2000, {}]
)

export function HoverScene({ product }: SceneProps) {
  return (
    <QualityScene
      product={product}
      steps={HOVER_STEPS}
      initial={HOVER_INITIAL}
      {...HOVER}
    />
  )
}

/* -------------------------------------------------- §5 a click outside it */

const outsideSteps = (mobile: boolean): Step[] => [
  { when: "the resize runs into the maximum", then: "the message shows" },
  {
    when: mobile
      ? "a tap lands anywhere outside it — here, on “Done”"
      : "a click lands anywhere outside it",
    then: "it goes at once, whatever is left of its countdown",
  },
]
const OUTSIDE_STEPS = { desktop: outsideSteps(false), mobile: outsideSteps(true) }
const OUTSIDE_INITIAL: Partial<QualityState> = { placed: true }
/** On the empty canvas, a short way right of the message's edge. */
const JUST_OUTSIDE: Aim = { sel: SIZE_MESSAGE, fx: 1, fy: 0.5, dx: 50 }
const outsideTimeline = (mobile: boolean) =>
  timeline(
    [900, { cursor: { corner: true }, cursorMs: TRAVEL_MS }],
    [POINT_MS, { pressed: true, resizing: true }],
    [300, s => ({ ...hitStop(s), step: 0 })],
    [1400, { pressed: false, resizing: false }],
    // Well inside its countdown: the click, not the timer, ends it — and,
    // landing on the empty canvas just beside the message (a phone: on the
    // dock's Done), lets the upload go.
    [900, { cursor: mobile ? { button: "Done" } : JUST_OUTSIDE, cursorMs: TRAVEL_MS, hand: false }],
    [TRAVEL_MS + 300, { pressed: true, notice: false, selected: false, step: 1 }],
    [PRESS_MS, { pressed: false }]
  )
const OUTSIDE = { desktop: outsideTimeline(false), mobile: outsideTimeline(true) }

export function ClickOutsideScene({ product, device }: SceneProps) {
  const key = device?.mobile ? "mobile" : "desktop"
  return (
    <QualityScene
      product={product}
      steps={OUTSIDE_STEPS[key]}
      initial={OUTSIDE_INITIAL}
      device={device}
      {...OUTSIDE[key]}
    />
  )
}

/* -------------------------------------------------------- §6 keep this size */

const keep = (mobile: boolean): Step[] => [
  {
    when: `“${PRINT_MAX_SIZE_LABEL}” shows`,
    then: `it offers “${PRINT_MAX_SIZE_KEEP}” and “${PRINT_MAX_SIZE_ACTION}”`,
  },
  {
    when: `“${PRINT_MAX_SIZE_KEEP}” is ${mobile ? "tapped" : "clicked"}`,
    then: "the message goes — the image stays at its maximum, still selected",
  },
]
const KEEP_STEPS = { desktop: keep(false), mobile: keep(true) }
// Already at its stop, the message up.
const KEEP_INITIAL: Partial<QualityState> = { notice: true }
const keepTimeline = (mobile: boolean) =>
  timeline(
    [1600, { cursor: { button: PRINT_MAX_SIZE_KEEP }, cursorMs: TRAVEL_MS }],
    [POINT_MS, { pressed: true }],
    [PRESS_MS, { pressed: false, notice: false, step: 1 }],
    [900, rest(mobile)],
    [1800, {}]
  )
const KEEP = { desktop: keepTimeline(false), mobile: keepTimeline(true) }

export function KeepSizeScene({ product, device }: SceneProps) {
  const key = device?.mobile ? "mobile" : "desktop"
  return (
    <QualityScene
      product={product}
      steps={KEEP_STEPS[key]}
      initial={KEEP_INITIAL}
      device={device}
      {...KEEP[key]}
    />
  )
}

/* -------------------------------------------------------- §7 upload larger */

const larger = (mobile: boolean): Step[] => [
  {
    when: `“${PRINT_MAX_SIZE_LABEL}” shows`,
    then: `it offers “${PRINT_MAX_SIZE_KEEP}” and “${PRINT_MAX_SIZE_ACTION}”`,
  },
  {
    when: `“${PRINT_MAX_SIZE_ACTION}” is ${mobile ? "tapped" : "clicked"}`,
    then: `the Uploads ${mobile ? "drawer" : "panel"} opens`,
  },
]
const LARGER_STEPS = { desktop: larger(false), mobile: larger(true) }
// Already at its stop, the message up, and the upload already in the panel —
// so it opens on it. Just the one upload: the rule is the button, not the list.
const LARGER_INITIAL: Partial<QualityState> = { notice: true, uploaded: true }
/** How much taller than the other scenes this stage is, so the opened panel shows its tiles. */
const LARGER_EXTRA_HEIGHT_PX = 200
const largerTimeline = (mobile: boolean) =>
  timeline(
    [1600, { cursor: { button: PRINT_MAX_SIZE_ACTION }, cursorMs: TRAVEL_MS }],
    [POINT_MS, { pressed: true }],
    [PRESS_MS, { pressed: false, notice: false, panel: true, step: 1 }],
    [PANEL_SLIDE_MS + 600, rest(mobile)],
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
  resize: ResizeStopScene,
  smaller: MadeSmallerScene,
  linger: LingerScene,
  outside: ClickOutsideScene,
  keep: KeepSizeScene,
  larger: UploadLargerScene,
} as const
export type QualityMobileSceneKey = keyof typeof QUALITY_MOBILE_SCENES
