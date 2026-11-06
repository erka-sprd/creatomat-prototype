"use client"

/**
 * The embroidery handoff's scenes, one per rule: the "If → Then" steps a
 * developer scans, and the script that plays them on the canvas
 * (embroidery-scene.tsx). Timings come from the designer wherever it has
 * them; the rest are beats long enough to follow.
 */

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
  useTextImage,
  type SceneDesign,
  type SceneState,
  type Step,
} from "@/components/handoff/embroidery-scene"

const MUSHROOM = "/img/graphics/graphics5.png"
const ROSE = "/img/graphics/graphics11.png"
/** Its own minimum (DESIGN_MIN_MM) — the one design that has one. */
const BEAVER = "/img/graphics/graphics9.png"
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
const selectedTooLarge: Partial<SceneDesign> = { selected: true, tone: "orange", guide: "se" }

type SceneProps = { product: CanvasProduct | null; showSteps?: boolean }

/* ---------------------------------------------------------- §1 the check */

const CHECK_STEPS: Step[] = [
  {
    when: "embroidery is on and a design (upload or graphic) is added",
    then: "it's placed unselected and checked at once — “Creating preview” takes the bottom row's place",
  },
  { when: "the check passes", then: "the stitched preview replaces the design" },
  {
    when: "it's the session's first stitched preview, and the user hasn't zoomed in yet",
    then: "the green “Preview is done…” holds the row's place — no ×, only “Zoom in”",
  },
  {
    when: "“Zoom in” is clicked (or the user zooms any other way)",
    then: "one zoom step; the message slides out, the row slides back — never again this session",
  },
  {
    when: "a later preview is made",
    then: "no message — the row comes straight back",
  },
]
const CHECK_START: Partial<SceneState> = { designs: [] }
const CHECK = timeline(
  [
    800,
    {
      step: 0,
      row: false,
      loader: true,
      designs: [{ id: "a", src: MUSHROOM, cx: 0.5, cy: 0.38, size: 0.85 }],
    },
  ],
  [EMBROIDERY_MIN_LOADER_MS, all({ step: 1, loader: false, zoomTip: true }, design("a", { stitched: true }))],
  [1800, { step: 2 }],
  ...click({ button: "Zoom in" }, { step: 3, zoomTip: false, zoom: ZOOM_STOPS[1], row: true }, 1200),
  ...click({ label: "Zoom out" }, { zoom: 1 }, 2200),
  ...click({ design: "a", at: "c" }, all({ row: true }, design("a", { selected: true, stitched: false })), 600),
  ...click(OUTSIDE, all({ step: 4, row: false, loader: true }, design("a", { selected: false })), 900),
  [EMBROIDERY_MIN_LOADER_MS, all({ loader: false, row: true, cursor: null }, design("a", { stitched: true }))]
)

export function CheckScene({ product, showSteps }: SceneProps) {
  return <Scene product={product} steps={CHECK_STEPS} initial={CHECK_START} showSteps={showSteps} {...CHECK} />
}

/* --------------------------------------------------------------- §2 text */

const TEXT_STEPS: Step[] = [
  {
    when: "a text is added in embroidery",
    then: "it's selected straight away (desktop: ready to type), as in standard print — and not checked yet",
  },
  { when: "it's deselected", then: "now it's checked — “Creating preview”" },
  { when: "the check passes", then: "stitched, like any design" },
]
const TEXT = timeline(
  [800, all({ step: 0 }, design("t", { gone: false, selected: true }))],
  ...click(OUTSIDE, all({ step: 1, row: false, loader: true }, design("t", { selected: false })), 1800),
  [EMBROIDERY_MIN_LOADER_MS, all({ step: 2, loader: false, row: true, cursor: null }, design("t", { stitched: true }))]
)

export function TextScene({ product, showSteps }: SceneProps) {
  const src = useTextImage("Hello")
  if (!src) return null
  return (
    <Scene
      product={product}
      steps={TEXT_STEPS}
      initial={{ designs: [{ id: "t", src, cx: 0.5, cy: 0.36, size: 0.9, gone: true }] }}
      showSteps={showSteps}
      {...TEXT}
    />
  )
}

/* ------------------------------------------------- §3 selected mid-check */

const MID_CHECK_STEPS: Step[] = [
  {
    when: "the design is selected while “Creating preview” runs",
    then: "the check carries on in the background; its result is held back — no loader, preview or warning while selected",
  },
  { when: "it's only moved meanwhile", then: "the running check still stands — a move isn't a change" },
  {
    when: "it's deselected and the check has finished",
    then: "the result shows at once (not finished yet: the loader comes back for the rest only — no restart)",
  },
  {
    when: "it was changed while selected — resized, edited, recoloured",
    then: "the old result is stale: a fresh check on deselect",
  },
]
const MID_CHECK_START: Partial<SceneState> = {
  designs: [{ id: "a", src: MUSHROOM, cx: 0.45, cy: 0.38, size: 0.8 }],
}
const MID_CHECK = timeline(
  [700, { row: false, loader: true }],
  ...click({ design: "a", at: "c" }, all({ step: 0, loader: false, row: true }, design("a", { selected: true })), 700),
  [700, { pressed: true }],
  [200, all({ step: 1 }, drag("a", "c", { cx: 0.56 }, 1000))],
  [1100, release],
  ...click(OUTSIDE, all({ step: 2 }, design("a", { selected: false, stitched: true })), 600),
  ...click({ design: "a", at: "c" }, design("a", { selected: true, stitched: false }), 1800),
  [600, { cursor: { design: "a", at: "se" }, cursorMs: 500 }],
  [600, { pressed: true }],
  [
    200,
    all(
      { step: 3 },
      design("a", { pin: { corner: "nw", size: 0.8 } }),
      drag("a", "se", { size: 0.62 }, 900)
    ),
  ],
  [1000, release],
  ...click(OUTSIDE, all({ row: false, loader: true }, design("a", { selected: false })), 700),
  [EMBROIDERY_MIN_LOADER_MS, all({ loader: false, row: true, cursor: null }, design("a", { stitched: true }))]
)

export function MidCheckScene({ product }: SceneProps) {
  return <Scene product={product} steps={MID_CHECK_STEPS} initial={MID_CHECK_START} {...MID_CHECK} />
}

/* ------------------------------------------------- §4 switched too large */

const SWITCH_ON_STEPS: Step[] = [
  {
    when: "embroidery is switched on while a design is past the hoop frame",
    then: "no preview and no check — warning, selection, hoop guide + arrow and the blur all arrive in one frame",
  },
  {
    when: "the user clicks outside to deselect",
    then: "ignored — it stays selected until it fits (move, resize, rotate and trash all still work)",
  },
]
const SWITCH_ON_START: Partial<SceneState> = {
  technique: "standard",
  designs: [{ id: "a", src: MUSHROOM, cx: 0.5, cy: 0.4, size: 1.6 }],
}
const SWITCH_ON = timeline(
  ...click(
    { label: "Print technique: Standard print" },
    all({ step: 0, technique: "embroidery", ...TOO_LARGE }, design("a", selectedTooLarge)),
    1000
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
    when: "a corner handle is hovered",
    then: "the guide and arrow re-anchor to that corner at once, and stay there",
  },
  {
    when: "it's resized down past the hoop size",
    then: "free both ways, no cap — it snaps onto the hoop size: frame and handles green, the orange message slides out and a green “Good design size” slides up, handle still held",
  },
  { when: "it's pulled past the frame again", then: "it swaps back, as live" },
  {
    when: "it's released inside",
    then: `the green holds ${RECOVERED_GOOD_SIZE_MS / 1000} s, the frame eases back to blue; deselected, it's checked`,
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
  [900, { cursor: { design: "a", at: "nw" }, cursorMs: 600 }],
  [700, all({ step: 0 }, design("a", { hot: "nw", guide: "nw" }))],
  [1500, { cursor: { design: "a", at: "se" }, cursorMs: 600 }],
  [700, design("a", { hot: "se", guide: "se" })],
  [900, { pressed: true }],
  [200, all({ step: 1 }, drag("a", "se", { size: 1 }, 1400))],
  [1400, goodSize],
  [1500, all({ step: 2 }, drag("a", "se", { size: 1.3 }, 800))],
  [250, tooLarge],
  [1500, drag("a", "se", { size: 1 }, 800)],
  [800, goodSize],
  [900, all({ step: 3 }, release, design("a", { hot: null }))],
  [RECOVERED_GOOD_SIZE_MS, all({ green: null }, design("a", { tone: "blue" }))],
  ...click(OUTSIDE, all({ loader: true }, design("a", { selected: false })), 600),
  [EMBROIDERY_MIN_LOADER_MS, all({ loader: false, row: true, cursor: null }, design("a", { stitched: true }))]
)

export function ResizeScene({ product }: SceneProps) {
  return <Scene product={product} steps={RESIZE_STEPS} initial={RESIZE_START} {...RESIZE} />
}

/* -------------------------------------------------------------- §6 moving */

const MOVE_STEPS: Step[] = [
  {
    when: "a design past the frame is moved (dragged by itself)",
    then: "guide, arrow, blur and orange go — blue frame, no handles, no editor bar; the message stays",
  },
  { when: "it's released", then: "all of it comes back" },
]
const MOVE_START: Partial<SceneState> = {
  ...TOO_LARGE,
  designs: [{ id: "a", src: MUSHROOM, cx: 0.44, cy: 0.42, size: 1.5, ...selectedTooLarge }],
}
const MOVE = timeline(
  [900, { cursor: { design: "a", at: "c" }, cursorMs: 600 }],
  [800, { pressed: true }],
  [
    200,
    all({ step: 0 }, design("a", { tone: "blue", guide: null, handles: false }), drag("a", "c", { cx: 0.6 }, 1300)),
  ],
  [1700, all({ step: 1 }, release, design("a", { ...selectedTooLarge, handles: true }))]
)

export function MoveScene({ product }: SceneProps) {
  return <Scene product={product} steps={MOVE_STEPS} initial={MOVE_START} {...MOVE} />
}

/* ------------------------------------------------------- §7 fit (single) */

const FIT_STEPS: Step[] = [
  {
    when: "a single design is past the frame — however it got there (a check, the user's own resize)",
    then: "it's selected for you, and “Fit to best size” sits under the message (still there while it's moved or resized)",
  },
  {
    when: "“Fit to best size” is clicked",
    then: "it shrinks about its centre to exactly the hoop size, with a small bounce — the overshoot goes smaller, never past",
  },
  {
    when: "it lands",
    then: `as after a resize: green frame + “Good design size” for ${RECOVERED_GOOD_SIZE_MS / 1000} s, then it's checked`,
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
  [RECOVERED_GOOD_SIZE_MS, all({ green: null, loader: true }, design("a", { tone: "blue", selected: false }))],
  [EMBROIDERY_MIN_LOADER_MS, all({ loader: false, row: true }, design("a", { stitched: true }))]
)

export function FitScene({ product, showSteps }: SceneProps) {
  return <Scene product={product} steps={FIT_STEPS} initial={FIT_START} showSteps={showSteps} {...FIT} />
}

/* ---------------------------------------------------------- §8 min size */

const MIN_STEPS: Step[] = [
  {
    when: "a design is shrunk to its own minimum (set per design — here 4 cm)",
    then: "the resize stops there with a small bounce and “Min. size for embroidery”",
  },
  {
    when: "it's grown instead",
    then: "free — there's no maximum; the hoop frame only warns (§4–§7)",
  },
]
const MIN_START: Partial<SceneState> = {
  designs: [
    { id: "a", src: BEAVER, cx: 0.5, cy: 0.4, size: 0.9, pin: { corner: "nw", size: 0.9 }, selected: true },
  ],
}
const MIN = timeline(
  [900, { cursor: { design: "a", at: "se" }, cursorMs: 600 }],
  [800, { pressed: true }],
  [200, drag("a", "se", { size: 0.55 }, 1100)],
  [1100, all({ step: 0 }, design("a", { size: 0.51, motionMs: 140, minNotice: true }))],
  [140, design("a", { size: 0.55, motionMs: 220 })],
  [1600, all(release, design("a", { minNotice: false }))],
  [900, { pressed: true }],
  [200, all({ step: 1 }, drag("a", "se", { size: 1.25 }, 1400))],
  [1500, all(release, design("a", { tone: "orange", guide: "se" }), { issue: "too-large", row: false })]
)

export function MinSizeScene({ product }: SceneProps) {
  return <Scene product={product} steps={MIN_STEPS} initial={MIN_START} {...MIN} />
}

/* ------------------------------------------------------ §9 combinations */

const GROUP_STEPS: Step[] = [
  {
    when: "a 2nd (or 3rd) design is added",
    then: "it's placed inside the frame beside the others — no green message — and checked as usual",
  },
  {
    when: "a move takes the group past the frame",
    then: "orange group frame + “Combination of designs too large” replace the check — live, mid-move — and no check on release",
  },
  {
    when: "it's brought back within",
    then: "green group frame + “Good design size”, then the check runs again",
  },
]
const GROUP_START: Partial<SceneState> = {
  designs: [
    { id: "a", src: MUSHROOM, cx: 0.41, cy: 0.38, size: 0.45, stitched: true },
    { id: "b", src: ROSE, cx: 0.59, cy: 0.38, size: 0.4, gone: true },
  ],
}
const GROUP = timeline(
  [900, all({ step: 0, row: false, loader: true }, design("a", { stitched: false }), design("b", { gone: false }))],
  [EMBROIDERY_MIN_LOADER_MS, all({ loader: false, row: true }, design("a", { stitched: true }), design("b", { stitched: true }))],
  ...click({ design: "b", at: "c" }, design("b", { selected: true, stitched: false }), 1000),
  [300, all({ step: 1, pressed: true }, design("a", { stitched: false }))],
  [200, all({ group: "blue" }, drag("b", "c", { cx: 0.84 }, 1400))],
  [700, { group: "orange", issue: "too-large", combination: true, row: false }],
  [1300, release],
  [1800, { pressed: true }],
  [200, all({ step: 2 }, drag("b", "c", { cx: 0.6 }, 1200))],
  [700, { group: "green", issue: null, green: "good" }],
  [900, release],
  [
    RECOVERED_GOOD_SIZE_MS,
    all({ group: null, green: null, loader: true, cursor: null }, design("b", { selected: false })),
  ],
  [
    EMBROIDERY_MIN_LOADER_MS,
    all({ loader: false, row: true }, design("a", { stitched: true }), design("b", { stitched: true })),
  ]
)

export function GroupScene({ product }: SceneProps) {
  return <Scene product={product} steps={GROUP_STEPS} initial={GROUP_START} {...GROUP} />
}

/* --------------------------------------------------- §10 fit (combination) */

const GROUP_FIT_STEPS: Step[] = [
  {
    when: "“Fit to best size” is clicked under the combination warning",
    then: "the designs first draw together towards the group's centre — only as far as needed",
  },
  {
    when: "even stacked on each other they don't fit",
    then: "they then shrink about that same centre to the hoop size, with the small bounce (the first step doesn't bounce: they never cross)",
  },
  { when: "they fit", then: "green, and the check runs as after a manual move" },
]
const GROUP_FIT_START: Partial<SceneState> = {
  ...TOO_LARGE,
  combination: true,
  group: "orange",
  designs: [
    { id: "a", src: MUSHROOM, cx: 0.3, cy: 0.4, size: 1.3 },
    { id: "b", src: ROSE, cx: 0.74, cy: 0.42, size: 1.2 },
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
  [800, { step: 2, group: "green", issue: null, green: "good" }],
  [RECOVERED_GOOD_SIZE_MS, { group: null, green: null, loader: true }],
  [
    EMBROIDERY_MIN_LOADER_MS,
    all({ loader: false, row: true }, design("a", { stitched: true }), design("b", { stitched: true })),
  ]
)

export function GroupFitScene({ product }: SceneProps) {
  return <Scene product={product} steps={GROUP_FIT_STEPS} initial={GROUP_FIT_START} {...GROUP_FIT} />
}

/* ------------------------------------------------- §11 a design issue */

const ISSUE_STEPS: Step[] = [
  {
    when: "the check finds lines too thin (or too much detail)",
    then: "no stitched preview — the design stays as it is, under the named warning and its “See solutions”",
  },
  {
    when: "the design is selected",
    then: "frame and (orange) trash only — no resize, rotate or move handles: resizing doesn't solve it",
  },
  { when: "it's dragged by the design itself", then: "it moves as usual" },
]
const ISSUE_START: Partial<SceneState> = {
  designs: [{ id: "a", src: CAT, cx: 0.45, cy: 0.4, size: 0.85 }],
}
const ISSUE = timeline(
  [700, { row: false, loader: true }],
  [EMBROIDERY_MIN_LOADER_MS, { step: 0, loader: false, issue: "thin-line" }],
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
    when: "“See solutions” is clicked",
    then: "two ways out: Fix with AI (thin lines — thickens them; too complex: Simplify with AI) or Switch to print",
  },
  {
    when: "“Fix now” is clicked",
    then: "no AI panel — it runs at once: the design lets go, “Fixing thin lines…” takes the row's place, the trash stays over it",
  },
  {
    when: "the result is in",
    then: "up for review on the canvas — Before / After, Cancel / Accept — the row shows only the zoom, centred",
  },
  {
    when: "Accept is clicked (Cancel: the warning comes back)",
    then: "the zoom slides out, the result is checked (“Creating preview”), then the whole row slides back",
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
  { when: "Fix / Simplify with AI is running", then: "the trash sits over the design" },
  { when: "the trash is clicked", then: "the design goes and the run stops — no result, no review; the row comes back" },
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
    when: "“Switch to print” is clicked in the solutions",
    then: "the warning slides out; only a green “Switched to standard print” slides up",
  },
  {
    when: `${RECOVERED_GOOD_SIZE_MS / 1000} s later`,
    then: "it slides out and the row comes back — already on Standard print",
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
    when: "add to basket is clicked while any warning is up (too large, thin lines, too complex)",
    then: "refused — the warning shakes and the canvas edge flashes orange; the size sheet doesn't even open",
  },
]
const BASKET_START: Partial<SceneState> = {
  issue: "too-complex",
  row: false,
  designs: [{ id: "a", src: BOY, cx: 0.5, cy: 0.4, size: 0.85 }],
}
const refuse = (s: SceneState) => ({ ...s, shake: s.shake + 1, flash: s.flash + 1 })
const BASKET = timeline([1200, refuse], [3200, refuse])

export function BasketScene({ product }: SceneProps) {
  return <Scene product={product} steps={BASKET_STEPS} initial={BASKET_START} {...BASKET} />
}
