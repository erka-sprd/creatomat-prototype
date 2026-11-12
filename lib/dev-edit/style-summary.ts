// The edit mode's hover card: an element's main styles as Tailwind classes.
// A class the element carries itself is shown as written; anything else
// (inherited text styles, or styles set another way) is read from the
// computed style and turned into the nearest class: a kit token for an exact
// colour match, a theme step for sizes, an arbitrary value otherwise.
import { colorClassesOf } from "@/lib/dev-edit/color-tokens"

export type StyleRow = {
  label: string
  value: string
  // The class is on the element itself (vs. computed or inherited).
  own: boolean
  // A colour row's swatch.
  swatch?: string
}

type Token = { name: string; value: string }

const FONT_SIZES: Record<number, string> = {
  12: "xs",
  14: "sm",
  16: "base",
  18: "lg",
  20: "xl",
  24: "2xl",
  30: "3xl",
  36: "4xl",
  48: "5xl",
}
const FONT_WEIGHTS: Record<number, string> = {
  100: "thin",
  200: "extralight",
  300: "light",
  400: "normal",
  500: "medium",
  600: "semibold",
  700: "bold",
  800: "extrabold",
  900: "black",
}
const SIZE_CLASS_RE = /^text-(xs|sm|base|lg|[2-9]?xl|\[\d+(\.\d+)?(px|rem)\])$/
const WEIGHT_CLASS_RE = /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[\d+\])$/
const RADIUS_CLASS_RE = /^rounded(-(none|xs|sm|md|lg|[2-4]?xl|full|\[[^\]]+\]))?$/
const PADDING_CLASS_RE = /^p[xytrbl]?-(\d+(\.5)?|px|\[[^\]]+\])$/

// Any CSS colour (rgb, oklch, …) as sRGB hex, alpha 0–1 — by painting a pixel.
let ctx: CanvasRenderingContext2D | null = null
function toHex(css: string): { hex: string; alpha: number } | null {
  ctx ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  const hex = "#" + [r, g, b].map(n => n.toString(16).padStart(2, "0")).join("")
  return { hex, alpha: a / 255 }
}

function colorClass(prefix: string, css: string, tokens: Token[]): string | null {
  const color = toHex(css)
  if (!color || color.alpha === 0) return null
  const opacity = color.alpha < 0.99 ? `/${Math.round(color.alpha * 100)}` : ""
  const token = tokens.find(t => t.value.toLowerCase() === color.hex)
  if (token) return `${prefix}-sprd-${token.name}${opacity}`
  if (color.hex === "#ffffff") return `${prefix}-white${opacity}`
  if (color.hex === "#000000") return `${prefix}-black${opacity}`
  return `${prefix}-[${color.hex}]${opacity}`
}

// px on the 4px spacing scale: 8 → "2", 6 → "1.5", 5 → "[5px]".
function spacingStep(px: number): string {
  const step = px / 4
  return Number.isInteger(step * 2) ? String(step) : `[${px}px]`
}

function paddingClass(style: CSSStyleDeclaration): string | null {
  const [t, r, b, l] = ["Top", "Right", "Bottom", "Left"].map(side =>
    Math.round(parseFloat(style.getPropertyValue(`padding-${side.toLowerCase()}`)) || 0)
  )
  if (t + r + b + l === 0) return null
  if (t === r && r === b && b === l) return `p-${spacingStep(t)}`
  if (l === r && t === b) return `px-${spacingStep(l)} py-${spacingStep(t)}`
  return [`pt-${spacingStep(t)}`, `pr-${spacingStep(r)}`, `pb-${spacingStep(b)}`, `pl-${spacingStep(l)}`].join(" ")
}

function radiusClass(style: CSSStyleDeclaration): string | null {
  const px = Math.round(parseFloat(style.borderTopLeftRadius) || 0)
  if (px === 0) return null
  return px >= 9999 ? "rounded-full" : `rounded-[${px}px]`
}

// Whether the element shows text of its own (a direct text node), so the
// text rows mean something.
function hasOwnText(el: HTMLElement): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true
  return [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
}

/** The element's main styles, own classes first, the rest computed. */
export function styleSummary(el: HTMLElement, tokens: Token[]): StyleRow[] {
  const classes = (el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean)
  const style = getComputedStyle(el)
  const rows: StyleRow[] = []
  const add = (label: string, own: string | undefined, computed: string | null, swatch?: string) => {
    const value = own ?? computed
    if (value) rows.push({ label, value, own: own !== undefined, swatch })
  }

  if (hasOwnText(el)) {
    add("Text", colorClassesOf(classes, "text")[0], colorClass("text", style.color, tokens), style.color)
    const px = Math.round(parseFloat(style.fontSize))
    add("Size", classes.find(c => SIZE_CLASS_RE.test(c)), `text-${FONT_SIZES[px] ?? `[${px}px]`}`)
    const weight = Number(style.fontWeight)
    add("Weight", classes.find(c => WEIGHT_CLASS_RE.test(c)), `font-${FONT_WEIGHTS[weight] ?? `[${weight}]`}`)
  }
  add("Bg", colorClassesOf(classes, "bg")[0], colorClass("bg", style.backgroundColor, tokens), style.backgroundColor)
  if (parseFloat(style.borderTopWidth) > 0) {
    add("Border", colorClassesOf(classes, "border")[0], colorClass("border", style.borderTopColor, tokens), style.borderTopColor)
  }
  add("Radius", classes.find(c => RADIUS_CLASS_RE.test(c)), radiusClass(style))
  const ownPadding = classes.filter(c => PADDING_CLASS_RE.test(c))
  add("Padding", ownPadding.length ? ownPadding.join(" ") : undefined, paddingClass(style))
  return rows
}
