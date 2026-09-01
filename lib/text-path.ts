/**
 * Text on a path — the prototype's stand-in for CE.SDK's text-on-path feature.
 *
 * The engine's model (@cesdk/engine 1.80.0, BlockAPI):
 *
 *   setTextOnPath(id, svgPath | null)   // the baseline, a single-subpath SVG
 *                                       // path in the block's local space;
 *                                       // null restores straight layout
 *   setTextOnPathOffset(id, offset)     // start offset as a PROPORTION of path
 *                                       // length, clamped to [-1, 1]
 *   setTextOnPathFlipped(id, flipped)   // text on the underside, read reversed
 *
 * plus the reflected properties `text/path`, `text/pathOffset` and
 * `text/pathFlipped`. Which curve is active is identified by the path value
 * itself — CE.SDK compares getTextOnPath() against each preset's `text/path`,
 * which is exactly what curveIdForPath does below.
 *
 * The prototype does not run the engine, so this mirrors that model instead of
 * wrapping it: the same three shipped presets (their real path data, lifted
 * from the CE.SDK bundle), the same [-1, 1] offset, the same identify-by-path.
 * Flipped is not modelled — the panel does not offer it.
 */

export type TextCurveId = "arch" | "wave" | "elevate"

export type TextCurve = {
  id: TextCurveId
  /** CE.SDK's own label for this preset (property.textOnPath.curve.*). */
  label: string
  /** The baseline path, verbatim from CE.SDK's preset table. */
  path: string
  /**
   * What the panel's tab draws, when that should differ from the baseline the
   * preset actually applies. Falls back to `path`.
   */
  iconPath?: string
  /** Per-preset override of PATH_SLACK — how much path the run is given. */
  slack?: number
  /**
   * Set when `path` describes a full circle. A closed path has no end for the
   * run to fall off, so the offset must not slide the text towards one — the
   * same circle is re-emitted starting at a different angle instead, leaving
   * the text permanently centred on its own baseline. See circlePathFrom.
   */
  circle?: { cx: number; cy: number; r: number }
}

export const TEXT_CURVES: TextCurve[] = [
  {
    id: "arch",
    label: "Arch",
    // CE.SDK's CIRCLE preset, shown to shoppers as "Arch". A closed loop bends
    // far harder than CE.SDK's own open arch arc — and the offset then rotates
    // the run around the circle instead of running off the end of a segment.
    // The tab keeps the arch curve as its icon, which is the shape people
    // recognise; the label and the icon are the product, the path is the
    // implementation.
    path: "M 60,119.5 A 59.5,59.5 0 1,1 60.01,119.5 Z",
    iconPath: "M 0,60 A 60,60 0 0,1 120,60",
    // The circle that path draws: centre (60,60), r 59.5, starting at the
    // bottom (60,119.5) and sweeping clockwise. Its rendered size comes from
    // CIRCLE_RADIUS_EM, not from `slack` — see there.
    circle: { cx: 60, cy: 60, r: 59.5 },
  },
  {
    id: "wave",
    label: "Wave",
    path: "M0 12.0918C12.9043 -2.97537 37.6076 -5.05242 54.3124 12.0918C71.0172 29.236 97.392 29.0683 110.711 12.0918",
  },
  {
    id: "elevate",
    label: "Elevate",
    path: "M0 118.777C0 118.777 0.99638 97.3573 16.1221 83.5172C25.5824 74.8611 44.53 59.7505 82.2446 59.3886C119.959 59.0267 144.113 42.2993 155.245 27.5426C166.378 12.7859 164.49 0 164.49 0",
  },
]

/** The preset CE.SDK opens with. */
export const DEFAULT_TEXT_CURVE: TextCurveId = "arch"

export const textCurve = (id: TextCurveId): TextCurve =>
  TEXT_CURVES.find(c => c.id === id) ?? TEXT_CURVES[0]

/**
 * Which preset a stored path belongs to — CE.SDK identifies the active curve by
 * comparing the path value against each entry's, so this does the same. Returns
 * null for no path, or for a path no preset owns.
 */
export function curveIdForPath(path: string | null | undefined): TextCurveId | null {
  if (!path) return null
  return TEXT_CURVES.find(c => c.path === path)?.id ?? null
}

/** CE.SDK clamps the offset to [-1, 1]. */
export const clampOffset = (offset: number) => Math.max(-1, Math.min(1, offset))

/**
 * The same circle, re-emitted so its parameterisation STARTS at `angle`
 * (radians, screen space: y down, 90° = bottom). Geometrically identical — same
 * centre, same radius, same clockwise sweep — but the run laid on it lands
 * somewhere else, which is how the offset moves text around a closed path
 * without ever pushing it past an end.
 *
 * The arc stops a hair short of a full turn, as a 360° arc between two
 * identical points is degenerate and renders as nothing. CE.SDK's own circle
 * preset uses the same trick (its 60 → 60.01 endpoints).
 */
export function circlePathFrom(
  { cx, cy, r }: { cx: number; cy: number; r: number },
  angle: number
): string {
  const gap = 0.01 / r
  const sx = cx + r * Math.cos(angle)
  const sy = cy + r * Math.sin(angle)
  const ex = cx + r * Math.cos(angle - gap)
  const ey = cy + r * Math.sin(angle - gap)
  const n = (v: number) => Number(v.toFixed(3))
  return `M ${n(sx)},${n(sy)} A ${r},${r} 0 1,1 ${n(ex)},${n(ey)}`
}

// --- geometry ---------------------------------------------------------------

export type PathMetrics = {
  length: number
  x: number
  y: number
  width: number
  height: number
}

// The presets are a fixed set of constant strings, so each one is measured once
// and remembered. Measuring needs a laid-out SVG element; there is no
// closed-form length for a cubic bezier.
const metricsCache = new Map<string, PathMetrics>()

const EMPTY: PathMetrics = { length: 0, x: 0, y: 0, width: 0, height: 0 }

/** Length and bounding box of an SVG path, in its own user units. */
export function pathMetrics(d: string): PathMetrics {
  const cached = metricsCache.get(d)
  if (cached) return cached
  if (typeof document === "undefined") return EMPTY

  const ns = "http://www.w3.org/2000/svg"
  const svg = document.createElementNS(ns, "svg")
  svg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden")
  const path = document.createElementNS(ns, "path")
  path.setAttribute("d", d)
  svg.appendChild(path)
  document.body.appendChild(svg)
  const box = path.getBBox()
  const m: PathMetrics = {
    length: path.getTotalLength(),
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  }
  document.body.removeChild(svg)

  // Rotating the circle mints a fresh path string per offset value, so this
  // cannot be treated as the fixed-size table it was when only presets landed
  // here.
  if (metricsCache.size > 300) metricsCache.clear()
  metricsCache.set(d, m)
  return m
}

// One shared 2D context for all text measurement — creating a canvas per call
// made caret moves and selection drags visibly laggy.
let measureCtx: CanvasRenderingContext2D | null = null
function ctx2d(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d")
  return measureCtx
}

/** Width of a run of text at a given size, measured on a 2D canvas. */
export function measureTextWidth(text: string, fontSize: number, fontFamily: string): number {
  const ctx = ctx2d()
  if (!ctx) return 0
  ctx.font = `${fontSize}px "${fontFamily}"`
  return ctx.measureText(text || " ").width
}

// Prefix widths per caret boundary, memoized: the caret, the selection band and
// pointer hit-testing all ask for "width of the text up to index i" many times
// per frame, so it is computed once per (text, size, family).
const boundaryCache = new Map<string, number[]>()

/**
 * widths[i] = width of text.slice(0, i) in CSS px, for i in 0..text.length —
 * one entry per caret boundary, including both ends.
 */
export function textBoundaryWidths(
  text: string,
  fontSize: number,
  fontFamily: string
): number[] {
  const key = `${fontSize}|${fontFamily}|${text}`
  const cached = boundaryCache.get(key)
  if (cached) return cached
  const ctx = ctx2d()
  if (!ctx) return [0]
  ctx.font = `${fontSize}px "${fontFamily}"`
  const widths: number[] = [0]
  for (let i = 1; i <= text.length; i++) {
    widths.push(ctx.measureText(text.slice(0, i)).width)
  }
  // Every keystroke mints a new key; keep the cache from growing unbounded.
  if (boundaryCache.size > 200) boundaryCache.clear()
  boundaryCache.set(key, widths)
  return widths
}

/**
 * How much longer than the text its baseline is drawn, for the OPEN curves.
 * CE.SDK sizes the block to the path and lets long text overrun it; here the
 * path is scaled to the text instead, with this much slack so the offset has
 * somewhere to travel.
 */
export const PATH_SLACK = 1.6

/**
 * The circle's radius as a multiple of the font size.
 *
 * The closed circle is sized from the TEXT SIZE alone, never from the text's
 * length: it is the track the text rides on, so it must hold still while
 * someone types — only the arc the run covers changes. (CE.SDK's circle preset
 * is likewise a fixed path; it is the block, not the string, that sizes it.)
 *
 * 3.5 puts the circumference at ~22em, so a fourteen-character line covers
 * roughly a third of it — an arch — while a short word bends gently.
 */
export const CIRCLE_RADIUS_EM = 3.5

// --- shared layout ------------------------------------------------------------

export type CurvedLayout = {
  metrics: PathMetrics
  /** user units → CSS px. */
  scale: number
  /** The element's font size expressed in the path's user units. */
  fontSizeUser: number
  /** viewBox origin, in user units (headroom for ascenders included). */
  viewX: number
  viewY: number
  /** Rendered size, in CSS px. */
  width: number
  height: number
  /** Where the text run begins, as a distance along the path in CSS px. */
  runStartPx: number
  /** The measured text width, CSS px. */
  textWidth: number
  /**
   * The baseline actually drawn and measured against. Equals the preset's path
   * for open curves; for the closed circle it is that circle re-emitted from a
   * different start angle, which is how the offset moves the text.
   */
  renderPath: string
  /** Fraction of renderPath where the middle of the run sits (textAnchor=middle). */
  startOffset: number
  /**
   * CSS px to shift the element by so its PATH, rather than its box, stays put.
   *
   * The box tracks the glyphs, so it moves and resizes as the offset slides the
   * run along the baseline. Pinning the box would drag the whole curve around
   * with it; adding these to the element's position instead pins the path's own
   * bounding box, so the track holds still and only the text travels — which is
   * what CE.SDK does.
   */
  anchorDX: number
  anchorDY: number
}

/**
 * The one geometry both the renderer and the edit caret share, so the caret can
 * never drift from the glyphs it sits between. The path is scaled so its length
 * is textWidth × PATH_SLACK; textAnchor="middle" pins the middle of the run at
 * (0.5 + offset/2) of the path.
 */
export function curvedLayout(
  text: string,
  path: string,
  offset: number,
  fontSize: number,
  fontFamily: string
): CurvedLayout | null {
  const preset = TEXT_CURVES.find(c => c.path === path)
  // Slack is per-preset where a curve needs its own (the closed circle behind
  // "Arch"), falling back to the shared constant.
  const slack = preset?.slack ?? PATH_SLACK

  // On a closed circle the offset ROTATES the baseline instead of sliding the
  // run along it: the text then always sits at the middle of its own path and
  // can never be clipped off an end, and since ±1 is half a turn each way, both
  // extremes land on the same place — the behaviour CE.SDK shows. Open curves
  // keep the plain start-offset, where running off an end is correct.
  const eff = clampOffset(offset)
  const renderPath = preset?.circle
    ? circlePathFrom(preset.circle, Math.PI / 2 + eff * Math.PI)
    : path
  const runOffset = preset?.circle ? 0 : eff

  const metrics = pathMetrics(renderPath)
  const textWidth = measureTextWidth(text, fontSize, fontFamily)
  if (!metrics.length || !textWidth) return null

  // A closed circle is sized from the font, so it never grows or shrinks as the
  // text is typed; an open curve is still scaled to the run it carries.
  const scale = preset?.circle
    ? (fontSize * CIRCLE_RADIUS_EM) / preset.circle.r
    : (textWidth * slack) / metrics.length
  const pathLengthPx = metrics.length * scale
  const fontSizeUser = fontSize / scale
  // Room for ascenders above the baseline and descenders below it — the path
  // IS the baseline, so without this the glyphs fall outside the box. Padded on
  // every side, not just vertically: on a closed path (the circle behind
  // "Arch") the run wraps around and its ascenders point outward in every
  // direction, so a box padded only at the top would cut the sides off.
  const above = fontSizeUser * 1.15
  const below = fontSizeUser * 0.32
  const runStartPx = pathLengthPx * (0.5 + runOffset / 2) - textWidth / 2

  // The box wraps the GLYPHS, not the path. Walking the run's own stretch of
  // baseline and expanding each sample along its normal — ascent outward,
  // descent inward — gives the run's true extent. Padding a baseline box
  // uniformly instead would overshoot badly wherever the curve turns, and using
  // the path's own bounding box would size every text to the whole circle
  // behind "Arch", most of it empty.
  const SAMPLES = 64
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const swallow = (x: number, y: number) => {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  for (let i = 0; i <= SAMPLES; i++) {
    const p = pointAtLength(renderPath, (runStartPx + (textWidth * i) / SAMPLES) / scale)
    if (!p) continue
    // Text's "up" is the tangent turned a quarter left; in SVG's y-down space
    // that is (sin a, -cos a).
    const rad = (p.angle * Math.PI) / 180
    const ux = Math.sin(rad)
    const uy = -Math.cos(rad)
    swallow(p.x + ux * above, p.y + uy * above)
    swallow(p.x - ux * below, p.y - uy * below)
  }
  // No DOM to measure against (SSR): fall back to the path's own box.
  const runBox = Number.isFinite(minX)
    ? { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    : { x: metrics.x, y: metrics.y, width: metrics.width, height: metrics.height }

  return {
    metrics,
    scale,
    fontSizeUser,
    viewX: runBox.x,
    viewY: runBox.y,
    width: runBox.width * scale,
    height: runBox.height * scale,
    runStartPx,
    textWidth,
    renderPath,
    startOffset: 0.5 + runOffset / 2,
    // Offset-dependent, because runBox is: together they cancel out, leaving
    // the path's bounding box at a fixed place on the artwork.
    anchorDX: (runBox.x - metrics.x) * scale,
    anchorDY: (runBox.y - metrics.y) * scale,
  }
}

// --- points on a path -----------------------------------------------------------

// getPointAtLength needs a live SVGPathElement; one hidden <svg> holds a cached
// element per path string, so caret moves don't re-parse the path every frame.
const pathElCache = new Map<string, SVGPathElement>()
let hiddenSvg: SVGSVGElement | null = null

function pathEl(d: string): SVGPathElement | null {
  if (typeof document === "undefined") return null
  const cached = pathElCache.get(d)
  if (cached) return cached
  const ns = "http://www.w3.org/2000/svg"
  if (!hiddenSvg) {
    hiddenSvg = document.createElementNS(ns, "svg")
    hiddenSvg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden")
    hiddenSvg.setAttribute("aria-hidden", "true")
    document.body.appendChild(hiddenSvg)
  }
  // Same reason as metricsCache: one entry per offset value once a circle is
  // being rotated. Drop the DOM nodes with the map, not just the references.
  if (pathElCache.size > 300) {
    hiddenSvg.replaceChildren()
    pathElCache.clear()
  }
  const el = document.createElementNS(ns, "path")
  el.setAttribute("d", d)
  hiddenSvg.appendChild(el)
  pathElCache.set(d, el)
  return el
}

/**
 * Point and tangent angle at a distance along the path, in the path's own user
 * units. Distance clamps to [0, length]; the angle comes from a short chord
 * around the point, in degrees, ready for a CSS rotate.
 */
export function pointAtLength(
  d: string,
  length: number
): { x: number; y: number; angle: number } | null {
  const el = pathEl(d)
  if (!el) return null
  const total = el.getTotalLength()
  if (!total) return null
  const at = Math.max(0, Math.min(total, length))
  const p = el.getPointAtLength(at)
  const before = el.getPointAtLength(Math.max(0, at - 0.5))
  const after = el.getPointAtLength(Math.min(total, at + 0.5))
  return {
    x: p.x,
    y: p.y,
    angle: (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI,
  }
}
