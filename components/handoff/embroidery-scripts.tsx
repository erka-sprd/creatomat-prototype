"use client"

/**
 * The embroidery handoff's scenes, one per rule: the "If → Then" steps a
 * developer scans, and the script that plays them on the canvas
 * (embroidery-scene.tsx). Timings come from the designer wherever it has
 * them; the rest are beats long enough to follow.
 */

import { useMemo } from "react"
import {
  COMPLEX_GRAPHIC_SRCS,
  EMBROIDERY_MIN_LOADER_MS,
  RECOVERED_GOOD_SIZE_MS,
  SIMPLIFY_RUN_MS,
  THIN_LINE_GRAPHIC_SRC,
  ZOOM_STOPS,
} from "@/components/designer"
import type { CanvasProduct } from "@/components/handoff/embroidery-canvas"
import {
  Scene,
  all,
  design,
  PRODUCT_PX,
  TYPED_TEXT_H,
  useTypedText,
  type SceneDesign,
  type SceneState,
  type Step,
} from "@/components/handoff/embroidery-scene"

const MUSHROOM = "/img/graphics/graphics5.png"
const ROSE = "/img/graphics/graphics11.png"
const CAT = THIN_LINE_GRAPHIC_SRC
const BOY = COMPLEX_GRAPHIC_SRCS[1]

/** How long the stage holds its last beat before the loop starts over. */
const END_HOLD_MS = 2600
const PRESS_MS = 150
const POINT_MS = 700
/** Somewhere on the empty canvas, to click away from a design. */
const OUTSIDE = { x: 0.14, y: 0.3 }

type Update = Partial<SceneState> | ((s: SceneState) => SceneState)

/** Beats from waits: each entry runs `wait` ms after the one before. */
function timeline(...entries: [number, Update][]) {
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

/**
 * A drag of `id`'s centre (a move: its handles go) or corner (a resize: only
 * that handle stays) — design and hand travel together over `ms`.
 */
const drag = (id: string, at: "c" | "se", patch: Partial<SceneDesign>, ms: number) =>
  all(
    { cursor: { design: id, at }, cursorMs: ms },
    design(id, {
      ...patch,
      motionMs: ms,
      bounce: false,
      ...(at === "c" ? { dragging: true } : { resizing: at }),
    })
  )

/** The pointer let go: whatever was held drops its drag. */
const release = (s: SceneState): SceneState => ({
  ...s,
  pressed: false,
  designs: s.designs.map(d => ({ ...d, dragging: false, resizing: null })),
})

const TOO_LARGE: Partial<SceneState> = { issue: "too-large", fit: true, row: false }
// Too large at rest: selected, orange — the hoop guide comes only once a
// corner handle is held, as in any resize.
const selectedTooLarge: Partial<SceneDesign> = { selected: true, tone: "orange" }

type SceneProps = { product: CanvasProduct | null; showSteps?: boolean }

/* ---------------------------------------------------------- §1 the check */

const CHECK_STEPS: Step[] = [
  { when: "a design is added", then: "selected, as in standard print" },
  { when: "it's let go", then: "checked" },
  { when: "the check passes", then: "stitched preview" },
]
const CHECK_START: Partial<SceneState> = {
  zoomTip: false,
  designs: [{ id: "a", src: MUSHROOM, cx: 0.5, cy: 0.38, size: 0.85, gone: true }],
}
const CHECK = timeline(
  [800, all({ step: 0 }, design("a", { gone: false, selected: true }))],
  ...click(OUTSIDE, all({ step: 1, row: false, loader: true }, design("a", { selected: false })), 1800),
  [EMBROIDERY_MIN_LOADER_MS, all({ step: 2, loader: false, row: true, cursor: null }, design("a", { stitched: true }))]
)

export function CheckScene({ product, showSteps }: SceneProps) {
  return <Scene product={product} steps={CHECK_STEPS} initial={CHECK_START} showSteps={showSteps} {...CHECK} />
}

/* ------------------------------------------------------------- zoom tip */

const ZOOM_TIP_STEPS: Step[] = [
  {
    when: "first stitched preview of the session",
    then: "“Zoom in” is the only way on",
  },
  {
    when: "“Zoom in” is clicked, or any zoom",
    then: "one zoom step — never again this session",
  },
]
const ZOOM_TIP_START: Partial<SceneState> = {
  designs: [{ id: "a", src: MUSHROOM, cx: 0.5, cy: 0.38, size: 0.85, selected: true }],
}
const ZOOM_TIP = timeline(
  ...click(OUTSIDE, all({ row: false, loader: true }, design("a", { selected: false })), 1200),
  [
    EMBROIDERY_MIN_LOADER_MS,
    all({ step: 0, loader: false, zoomTip: true, cursor: null }, design("a", { stitched: true })),
  ],
  ...click({ button: "Zoom in" }, { step: 1, zoomTip: false, zoom: ZOOM_STOPS[1], row: true, cursor: null }, 2200)
)

export function ZoomTipScene({ product, showSteps }: SceneProps) {
  return (
    <Scene product={product} steps={ZOOM_TIP_STEPS} initial={ZOOM_TIP_START} showSteps={showSteps} {...ZOOM_TIP} />
  )
}

/* --------------------------------------------------------------- §2 text */

const TEXT_STEPS: Step[] = [
  {
    when: "a text is added",
    then: "selected for typing, not checked yet",
  },
  { when: "it's deselected", then: "checked" },
  { when: "the check passes", then: "stitched" },
]
const TEXT_WORD = "Hello"
/** Light purple, so the typed text stands apart from the shirt and the UI. */
const TEXT_COLOR = "#C084FC"
/** One letter per beat while typing. */
const TYPE_MS = 220

// One design per typing frame (useTypedText): each beat shows the next and
// hides the last. The last frame is the text without its caret, deselected
// and checked. Frames differ in width, so each gets its own size and centre:
// the letters keep one scale and the box's left edge holds, growing rightward.
const TEXT_SIZE = 0.9
const TEXT_CENTRE = { cx: 0.5, cy: 0.36 }
const textDesigns = (frames: { src: string; w: number }[], product: CanvasProduct): SceneDesign[] => {
  const areaW = (PRODUCT_PX * product.area.width) / 100
  const areaH = (PRODUCT_PX * product.area.height) / 100
  // designGeo's fit width for an image `w` wide (TYPED_TEXT_H tall).
  const fitW = (w: number) => Math.min(product.hoop * areaW, (product.hoop * areaH * w) / TYPED_TEXT_H)
  const full = frames[frames.length - 1].w
  const scale = (fitW(full) * TEXT_SIZE) / full // px on screen per image px
  const left = TEXT_CENTRE.cx * areaW - (full * scale) / 2
  return frames.map(({ src, w }, i) => ({
    id: `t${i}`,
    src,
    cx: (left + (w * scale) / 2) / areaW,
    cy: TEXT_CENTRE.cy,
    size: (w * scale) / fitW(w),
    gone: true,
    cut: true,
    selected: i < frames.length - 1,
  }))
}
const textTimeline = (frames: unknown[]) => {
  const last = frames.length - 1
  const typing: [number, Update][] = frames
    .slice(1, last)
    .map((_, n) => [TYPE_MS, all(design(`t${n}`, { gone: true }), design(`t${n + 1}`, { gone: false }))])
  return timeline(
    [800, all({ step: 0 }, design("t0", { gone: false }))],
    ...typing,
    ...click(
      OUTSIDE,
      all(
        { step: 1, row: false, loader: true },
        design(`t${last - 1}`, { gone: true }),
        design(`t${last}`, { gone: false })
      ),
      1400
    ),
    [EMBROIDERY_MIN_LOADER_MS, all({ step: 2, loader: false, row: true, cursor: null }, design(`t${last}`, { stitched: true }))]
  )
}

export function TextScene({ product, showSteps }: SceneProps) {
  const frames = useTypedText(TEXT_WORD, TEXT_COLOR)
  const script = useMemo(() => frames && textTimeline(frames), [frames])
  const initial = useMemo(
    () => ({ designs: frames && product ? textDesigns(frames, product) : [] }),
    [frames, product]
  )
  if (!frames || !script || !product) return null
  return (
    <Scene product={product} steps={TEXT_STEPS} initial={initial} showSteps={showSteps} {...script} />
  )
}

/* ------------------------------------------------- §4 switched too large */

const SWITCH_ON_STEPS: Step[] = [
  {
    when: "embroidery switched on, design too large",
    then: "no check — the warning at once",
  },
  {
    when: "clicked outside",
    then: "stays selected until it fits",
  },
]
const SWITCH_ON_START: Partial<SceneState> = {
  technique: "standard",
  designs: [{ id: "a", src: MUSHROOM, cx: 0.5, cy: 0.4, size: 1.6 }],
}
const SWITCH_ON = timeline(
  // The technique pill opens its menu; Embroidery is picked from it.
  ...click({ label: "Print technique: Standard print" }, { techniqueMenu: true }, 1000),
  ...click(
    { button: "Embroidery" },
    all({ step: 0, technique: "embroidery", techniqueMenu: false, ...TOO_LARGE }, design("a", selectedTooLarge)),
    900
  ),
  [1200, { cursor: null }],
  ...click(OUTSIDE, { step: 1 }, 1600),
  ...click({ x: 0.82, y: 0.25 }, {}, 900)
)

export function SwitchOnScene({ product }: SceneProps) {
  return <Scene product={product} steps={SWITCH_ON_STEPS} initial={SWITCH_ON_START} {...SWITCH_ON} />
}

/* ----------------------------------------------------------- §5 resizing */

const RESIZE_STEPS: Step[] = [
  {
    when: "a corner handle is held",
    then: "the guide shows the size that fits",
  },
  {
    when: "resized to the hoop size",
    then: "snaps, turns green",
  },
  { when: "pulled past again", then: "orange again, live" },
  {
    when: "released inside",
    then: `green for ${RECOVERED_GOOD_SIZE_MS / 1000} s, checked on deselect`,
  },
]
const RESIZE_START: Partial<SceneState> = {
  ...TOO_LARGE,
  designs: [
    {
      id: "a",
      src: MUSHROOM,
      cx: 0.5,
      cy: 0.42,
      size: 1.6,
      pin: { corner: "nw", size: 1.6 },
      ...selectedTooLarge,
    },
  ],
}
const goodSize = all({ issue: null, green: "good" }, design("a", { tone: "green" }))
const tooLarge = all({ issue: "too-large", green: null }, design("a", { tone: "orange" }))
const RESIZE = timeline(
  [900, { cursor: { design: "a", at: "se" }, cursorMs: 600 }],
  [800, all({ step: 0, pressed: true }, design("a", { hot: "se", guide: "se" }))],
  [1600, all({ step: 1 }, drag("a", "se", { size: 1 }, 1400))],
  [1400, goodSize],
  [1500, all({ step: 2 }, drag("a", "se", { size: 1.3 }, 800))],
  [250, tooLarge],
  [1500, drag("a", "se", { size: 1 }, 800)],
  [800, goodSize],
  [900, all({ step: 3 }, release, design("a", { hot: null, guide: null }))],
  [RECOVERED_GOOD_SIZE_MS, all({ green: null }, design("a", { tone: "blue" }))],
  ...click(OUTSIDE, all({ loader: true }, design("a", { selected: false })), 600),
  [EMBROIDERY_MIN_LOADER_MS, all({ loader: false, row: true, cursor: null }, design("a", { stitched: true }))]
)

export function ResizeScene({ product }: SceneProps) {
  return <Scene product={product} steps={RESIZE_STEPS} initial={RESIZE_START} {...RESIZE} />
}

/* ------------------------------------------------------- §7 fit (single) */

const FIT_STEPS: Step[] = [
  {
    when: "a design is too large",
    then: "selected, with “Fit to best size”",
  },
  {
    when: "“Fit to best size” clicked",
    then: "shrinks to the hoop size, small bounce",
  },
  {
    when: "it fits",
    then: `green for ${RECOVERED_GOOD_SIZE_MS / 1000} s; checked once let go`,
  },
]
const FIT_START: Partial<SceneState> = {
  designs: [{ id: "a", src: MUSHROOM, cx: 0.5, cy: 0.42, size: 1.7 }],
}
const FIT = timeline(
  [900, all({ step: 0, ...TOO_LARGE }, design("a", selectedTooLarge))],
  ...click(
    { button: "Fit to best size" },
    all({ step: 1, cursor: null }, design("a", { size: 1, motionMs: 500, bounce: true, guide: null })),
    1800
  ),
  [700, all({ step: 2 }, goodSize)],
  [RECOVERED_GOOD_SIZE_MS, all({ green: null }, design("a", { tone: "blue" }))],
  ...click(OUTSIDE, all({ loader: true }, design("a", { selected: false })), 600),
  [EMBROIDERY_MIN_LOADER_MS, all({ loader: false, row: true, cursor: null }, design("a", { stitched: true }))]
)

export function FitScene({ product, showSteps }: SceneProps) {
  return <Scene product={product} steps={FIT_STEPS} initial={FIT_START} showSteps={showSteps} {...FIT} />
}

/* ------------------------------------------------------ §9 combinations */

const GROUP_STEPS: Step[] = [
  {
    when: "a 2nd design is added",
    then: "placed inside the frame, selected",
  },
  {
    when: "the group moved past the frame",
    then: "combination warning, live — no check",
  },
  {
    when: "back within",
    then: "green; checked once let go",
  },
]
const GROUP_START: Partial<SceneState> = {
  designs: [
    { id: "a", src: MUSHROOM, cx: 0.41, cy: 0.38, size: 0.45, stitched: true },
    { id: "b", src: ROSE, cx: 0.59, cy: 0.38, size: 0.4, gone: true },
  ],
}
const GROUP = timeline(
  [900, all({ step: 0 }, design("a", { stitched: false }), design("b", { gone: false, selected: true }))],
  [1600, { cursor: { design: "b", at: "c" }, cursorMs: 500 }],
  [700, all({ step: 1, pressed: true })],
  [200, all({ group: "blue" }, drag("b", "c", { cx: 0.84 }, 1400))],
  [700, { group: "orange", issue: "too-large", combination: true, row: false }],
  [1300, release],
  [1800, { pressed: true }],
  [200, all({ step: 2 }, drag("b", "c", { cx: 0.6 }, 1200))],
  [700, { group: "green", issue: null, green: "good" }],
  [900, release],
  [RECOVERED_GOOD_SIZE_MS, { group: null, green: null }],
  ...click(OUTSIDE, all({ loader: true }, design("b", { selected: false })), 600),
  [
    EMBROIDERY_MIN_LOADER_MS,
    all({ loader: false, row: true, cursor: null }, design("a", { stitched: true }), design("b", { stitched: true })),
  ]
)

export function GroupScene({ product }: SceneProps) {
  return <Scene product={product} steps={GROUP_STEPS} initial={GROUP_START} {...GROUP} />
}

/* --------------------------------------------------- §10 fit (combination) */

const GROUP_FIT_STEPS: Step[] = [
  {
    when: "“Fit to best size” on a combination",
    then: "they draw together first",
  },
  {
    when: "still too large",
    then: "then they shrink",
  },
  { when: "they fit", then: "green; checked once let go" },
]
const GROUP_FIT_START: Partial<SceneState> = {
  ...TOO_LARGE,
  combination: true,
  group: "orange",
  designs: [
    { id: "a", src: MUSHROOM, cx: 0.3, cy: 0.4, size: 1.3 },
    { id: "b", src: ROSE, cx: 0.74, cy: 0.42, size: 1.2, selected: true, tone: "orange" },
  ],
}
const GROUP_FIT = timeline(
  ...click(
    { button: "Fit to best size" },
    all(
      { step: 0, cursor: null },
      design("a", { cx: 0.5, cy: 0.41, motionMs: 800 }),
      design("b", { cx: 0.5, cy: 0.41, motionMs: 800 })
    ),
    1400
  ),
  [1100, all({ step: 1 }, design("a", { size: 1, motionMs: 500, bounce: true }), design("b", { size: 0.92, motionMs: 500, bounce: true }))],
  [800, all({ step: 2, group: "green", issue: null, green: "good" }, design("b", { tone: "green" }))],
  [RECOVERED_GOOD_SIZE_MS, all({ group: null, green: null }, design("b", { tone: "blue" }))],
  ...click(OUTSIDE, all({ loader: true }, design("b", { selected: false })), 600),
  [
    EMBROIDERY_MIN_LOADER_MS,
    all({ loader: false, row: true, cursor: null }, design("a", { stitched: true }), design("b", { stitched: true })),
  ]
)

export function GroupFitScene({ product }: SceneProps) {
  return <Scene product={product} steps={GROUP_FIT_STEPS} initial={GROUP_FIT_START} {...GROUP_FIT} />
}

/* ------------------------------------------------- §11 a design issue */

const ISSUE_STEPS: Step[] = [
  {
    when: "lines too thin, or too complex",
    then: "no preview — the warning names it",
  },
  {
    when: "selected",
    then: "no handles — resizing won't fix it",
  },
  { when: "dragged", then: "moves as usual" },
]
const ISSUE_START: Partial<SceneState> = {
  designs: [{ id: "a", src: CAT, cx: 0.45, cy: 0.4, size: 0.85, selected: true }],
}
const ISSUE = timeline(
  ...click(OUTSIDE, all({ row: false, loader: true }, design("a", { selected: false })), 900),
  [EMBROIDERY_MIN_LOADER_MS, { step: 0, loader: false, issue: "thin-line", cursor: null }],
  ...click(
    { design: "a", at: "c" },
    all({ step: 1 }, design("a", { selected: true, handles: false, trash: "warning" })),
    1800
  ),
  [1500, { pressed: true }],
  [200, all({ step: 2 }, drag("a", "c", { cx: 0.58 }, 1100))],
  [1300, release]
)

export function IssueScene({ product, showSteps }: SceneProps) {
  return <Scene product={product} steps={ISSUE_STEPS} initial={ISSUE_START} showSteps={showSteps} {...ISSUE} />
}

/* --------------------------------------------- §12 solutions + AI fix */

const AI_STEPS: Step[] = [
  {
    when: "“See solutions”",
    then: "fix with AI, or switch to print",
  },
  {
    when: "“Fix now”",
    then: "runs at once, no AI panel",
  },
  {
    when: "the result is in",
    then: "reviewed on the canvas",
  },
  {
    when: "accepted",
    then: "checked again",
  },
]
const AI_START: Partial<SceneState> = {
  issue: "thin-line",
  row: false,
  designs: [{ id: "a", src: CAT, cx: 0.5, cy: 0.38, size: 0.85 }],
}
const AI = timeline(
  ...click({ button: "See solutions" }, { step: 0, solutions: "thin-line" }, 1000),
  ...click(
    { button: "Fix now" },
    all({ step: 1, solutions: null, issue: null, ai: "thin-line", cursor: null }, design("a", { trash: true })),
    2600
  ),
  [
    SIMPLIFY_RUN_MS,
    all(
      { step: 2, ai: null, row: true, zoomOnly: true },
      design("a", { trash: false, ai: "thin-line", review: "after" })
    ),
  ],
  ...click({ button: "Before" }, design("a", { review: "before", original: true }), 1400),
  ...click({ button: "After" }, design("a", { review: "after", original: false }), 1200),
  ...click(
    { button: "Accept" },
    all({ step: 3, row: false, zoomOnly: false, loader: true, cursor: null }, design("a", { review: null })),
    1400
  ),
  [EMBROIDERY_MIN_LOADER_MS, all({ loader: false, row: true }, design("a", { stitched: true }))]
)

export function AiScene({ product, showSteps }: SceneProps) {
  return <Scene product={product} steps={AI_STEPS} initial={AI_START} showSteps={showSteps} {...AI} />
}

/* ------------------------------------------ §13 removed while the AI runs */

const AI_TRASH_STEPS: Step[] = [
  { when: "the AI is running", then: "the trash stays" },
  { when: "trash clicked", then: "design and run gone" },
]
const AI_TRASH_START: Partial<SceneState> = {
  ai: "too-complex",
  row: false,
  designs: [{ id: "a", src: BOY, cx: 0.5, cy: 0.42, size: 0.85, trash: true }],
}
const AI_TRASH = timeline(
  [600, { step: 0 }],
  ...click(
    { demo: "trash-a" },
    all({ step: 1, ai: null, row: true, cursor: null }, design("a", { gone: true, trash: false })),
    1800
  )
)

export function AiTrashScene({ product }: SceneProps) {
  return <Scene product={product} steps={AI_TRASH_STEPS} initial={AI_TRASH_START} {...AI_TRASH} />
}

/* -------------------------------------------------- §14 switch to print */

const PRINT_STEPS: Step[] = [
  {
    when: "“Switch to print”",
    then: "a green confirmation",
  },
  {
    when: `${RECOVERED_GOOD_SIZE_MS / 1000} s later`,
    then: "the row is back, on Standard print",
  },
]
const PRINT_START: Partial<SceneState> = {
  issue: "too-complex",
  row: false,
  designs: [{ id: "a", src: BOY, cx: 0.5, cy: 0.4, size: 0.85 }],
}
const PRINT = timeline(
  ...click({ button: "See solutions" }, { solutions: "too-complex" }, 1000),
  ...click(
    { button: "Switch to print" },
    { step: 0, solutions: null, issue: null, green: "print-switched", technique: "standard", cursor: null },
    2400
  ),
  [RECOVERED_GOOD_SIZE_MS, { step: 1, green: null, row: true }]
)

export function PrintScene({ product }: SceneProps) {
  return <Scene product={product} steps={PRINT_STEPS} initial={PRINT_START} {...PRINT} />
}

/* -------------------------------------------------- §15 add to basket */

const BASKET_STEPS: Step[] = [
  {
    when: "add to basket, design not checked yet",
    then: "the canvas flashes orange; let go and checked",
  },
  {
    when: "add to basket with a warning up",
    then: "refused — the warning shakes",
  },
]
const BASKET_START: Partial<SceneState> = {
  designs: [{ id: "a", src: BOY, cx: 0.5, cy: 0.4, size: 0.85, selected: true }],
}
const refuse = (s: SceneState) => ({ ...s, shake: s.shake + 1, flash: s.flash + 1 })
// The basket button is off the canvas: its click is told by the flash alone.
const checkFirst = (s: SceneState): SceneState => ({
  ...s,
  step: 0,
  flash: s.flash + 1,
  row: false,
  loader: true,
  designs: s.designs.map(d => ({ ...d, selected: false })),
})
const BASKET = timeline(
  [1600, checkFirst],
  [EMBROIDERY_MIN_LOADER_MS, { loader: false, issue: "too-complex" }],
  [2200, all({ step: 1 }, refuse)],
  [3000, refuse]
)

export function BasketScene({ product }: SceneProps) {
  return <Scene product={product} steps={BASKET_STEPS} initial={BASKET_START} {...BASKET} />
}
