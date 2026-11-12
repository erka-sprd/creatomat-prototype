// The plain values components/designer.tsx shares — with the handoff pages
// and others — kept out of it so that file exports components only: Next's
// Fast Refresh then swaps an edit to it in place instead of reloading the
// whole page.

import { pixelSizeLabel } from "@/lib/print-quality"

// Shortest time the embroidery "Creating preview" loader stays up for a changed
// design, so a fast render doesn't flash it by unseen.
export const EMBROIDERY_MIN_LOADER_MS = 3500

// Upper bound for every zoom path — slider, +/- stops, wheel, mobile pinch.
// 1 = fit-to-canvas.
export const MAX_ZOOM = 15
// The +/- stops: create-omat's 0/10/50/100 % of the range (1× → 2.4× → 8× → 15×).
export const ZOOM_STOPS = [0, 10, 50, 100].map(percent => 1 + (percent / 100) * (MAX_ZOOM - 1))

// The zoom buttons' − and +, on a 20×20 viewBox (components/merged-bottom-row.tsx).
export const ZOOM_ICON_PATH = {
  plus: "M10.8277 4.06952C10.7796 3.65507 10.4273 3.33337 9.99998 3.33337C9.53974 3.33337 9.16665 3.70647 9.16665 4.16671V9.16671H4.16665L4.06946 9.17231C3.65501 9.22045 3.33331 9.57268 3.33331 10C3.33331 10.4603 3.70641 10.8334 4.16665 10.8334H9.16665V15.8334L9.17225 15.9306C9.22039 16.345 9.57262 16.6667 9.99998 16.6667C10.4602 16.6667 10.8333 16.2936 10.8333 15.8334V10.8334H15.8333L15.9305 10.8278C16.3449 10.7796 16.6666 10.4274 16.6666 10C16.6666 9.5398 16.2935 9.16671 15.8333 9.16671H10.8333V4.16671L10.8277 4.06952Z",
  minus:
    "M15.8333 9.16663C16.2935 9.16663 16.6666 9.53972 16.6666 9.99996C16.6666 10.4273 16.3449 10.7795 15.9305 10.8277L15.8333 10.8333H4.16665C3.70641 10.8333 3.33331 10.4602 3.33331 9.99996C3.33331 9.5726 3.65501 9.22037 4.06946 9.17223L4.16665 9.16663H15.8333Z",
} as const

// Floating delete button above the selected object — port of create-omat's
// TrashCanPlugin (28px circle, 20px gap from the object's screen bounding box).
export const TRASH_BUTTON_SIZE = 28
export const TRASH_OFFSET = 20
// The button's look, bar its colours (red, or the warning orange).
export const TRASH_BUTTON_CLASS =
  "flex cursor-pointer items-center justify-center rounded-full border-2 bg-[#f4f4f4] shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-colors duration-300 ease-out"

// White / near-white products blend into the light (#F4F4F4) tile, so only they
// get a drop shadow to lift the product image off the background.
export const isLightProductColor = (hex?: string): boolean => {
  if (!hex) return false
  const h = hex.replace("#", "")
  if (h.length !== 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return false
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 225
}

// Shadow for white/near-white product images. Sharp and tight: small blur (low
// "spread"), a small vertical offset, and a touch more opacity so it stays
// visible on the light (#F4F4F4) tile. Tweak the values here.
// `scale` is for an image drawn inside a scaled-down box (ViewDesignThumb): the
// blur is scaled up by the inverse so it still lands at 1px on screen.
// Same subtle shadow on the colour swatches and the view thumbnails.
export const lightProductImageShadow = (scale = 1) =>
  `drop-shadow(0px 0px ${1 / scale}px rgba(0, 0, 0, 0.35))`
export const LIGHT_PRODUCT_IMAGE_SHADOW = lightProductImageShadow()

// The mocked design-issue warnings: thin lines to the pink cat (the handoff's
// example) and the marketplace designs in THIN_LINE_GRAPHIC_SRCS, too complex
// to the mountain lake, the boy with the fish and the rest of
// COMPLEX_GRAPHIC_SRCS. Everything else in the panel stitches without a verdict.
export const THIN_LINE_GRAPHIC_SRC = "/img/graphics/graphics1.png"
// Marketplace designs drawn with hairline strokes — pen outlines, engraved
// feathers, script tails, dashed rays — that a needle can't follow.
export const THIN_LINE_GRAPHIC_SRCS = [
  THIN_LINE_GRAPHIC_SRC,
  "/img/marketplace/136609547.png", // card symbols — hairline crossing lines
  "/img/marketplace/584243.png", // Palms and Car — palm fronds, chrome details
  "/img/marketplace/135816734.png", // racing car — single-stroke outline, wheel spokes
  "/img/marketplace/16646016.png", // Hand drawn Arrow — ornate pen line
  "/img/marketplace/631560.png", // Surfer — spray lines off the wave
  "/img/marketplace/6273337.png", // White waveforms — hairline audio spikes
  "/img/marketplace/1621193.png", // Gemini — fine engraved figures
  "/img/marketplace/137633023.png", // wings — thin feather barbs
  "/img/marketplace/16644940.png", // Moto Skull with Wings — thin feather barbs
  "/img/marketplace/425445.png", // Mom with Flower — pen-outline rose
  "/img/marketplace/2124148.png", // wolf — scratchy fur outline
  "/img/marketplace/16645900.png", // Hand drawn light Circle — thin dashed rays
  "/img/marketplace/135461518.png", // Teddy — thin sketch outline
  "/img/marketplace/16647063.png", // Amerindian Symbol — thin arrow shafts
  "/img/marketplace/136038370.png", // ornament — calligraphic hairline tails
  "/img/marketplace/140859068.png", // Dream Team — script connectors thin out
  "/img/marketplace/135706569.png", // frame — hand-drawn thin strokes
]
// How long the technique switcher's green tick holds in its icon's place
// (TechniqueSwitcher's `confirmed`) — shown on the handoff.
export const SWITCH_CONFIRM_MS = 2000
// How long "Simplifying design for embroidery" runs before the result is
// offered for review.
export const SIMPLIFY_RUN_MS = 4000
// The tip over the zoom-in button on the session's first stitched preview.
export const ZOOM_HINT_TEXT = "Preview is done. Zoom in to check the stitch details"
// Too complex: the mountain lake, and the boy with the fish (8th in the
// Graphics panel) — the one to try "Simplify with AI" on (the handoff relies
// on it being second here) — then the marketplace designs with watercolour
// shading, photographic detail, engraving hatching or dense tiny pieces that
// no stitch count resolves.
export const COMPLEX_GRAPHIC_SRCS = [
  "/img/graphics/graphics2.png",
  "/img/graphics/graphics8.png",
  "/img/marketplace/136195447.png", // Tribal — dense interlocking dragons
  "/img/marketplace/137454017.png", // Vintage Camera — sketch hatching
  "/img/marketplace/306567432.png", // Orange Marmelade — speckle texture, script
  "/img/marketplace/330660490.png", // Tiny Adventures Moon — watercolour
  "/img/marketplace/195186171.png", // Call of Cthulhu — sketched, shaded eye
  "/img/marketplace/195185430.png", // Dagon — dense ink illustration
  "/img/marketplace/136299843.png", // Fox — zentangle mandala fur
  "/img/marketplace/137184475.png", // compass — engraving hatching
  "/img/marketplace/196221931.png", // Street Art — ink splatter, fine feathers
  "/img/marketplace/302177058.png", // Robin Family — watercolour
  "/img/marketplace/327536495.png", // Tiny Adventures Lion — watercolour
  "/img/marketplace/327526047.png", // Tiny Adventures Funny Lion — watercolour
  "/img/marketplace/171016667.png", // Bowhead Whale — watercolour, tiny caption
  "/img/marketplace/306472629.png", // Birthday Party Monkey — confetti bits
  "/img/marketplace/319384555.png", // Mama Bear — soft painted shading
  "/img/marketplace/7876182.png", // audio cassette — glitch layers, tiny parts
]

// The hoop guide's arrow is dropped once the object is within this share of
// the hoop-frame size (snapped, or about to be) — there is nowhere left to point.
export const HOOP_ARROW_MIN_RATIO_GAP = 0.02

// How strongly the object under the hoop guide is blurred, in px, and how long
// it takes to blur in and back out — the 300ms ease of the canvas pills.
export const HOOP_GUIDE_CONTENT_BLUR_PX = 4
export const HOOP_GUIDE_BLUR_MS = 300
export const HOOP_GUIDE_BLUR_TRANSITION = `filter ${HOOP_GUIDE_BLUR_MS}ms ease-out`

// During a guided resize the object counts as fitting the hoop frame within
// this share of it — matches the snap, which lands it exactly on the frame.
export const HOOP_RESIZE_FIT_TOLERANCE = 0.01
// How long "Maximum size" stays after the resize is released.
export const PRINT_MAX_SIZE_LINGER_MS = 4000
// What that notice says: its title, and its button under the image's pixels.
export const PRINT_MAX_SIZE_LABEL = "Maximum size"
export const PRINT_MAX_SIZE_ACTION = "Upload larger"
// Its secondary button, beside it: the size is fine as it is — just close.
export const PRINT_MAX_SIZE_KEEP = "Keep this size"
/** The notice's line under its title: the image's own pixels. */
export function printMaxSizeDetail(size: { w: number; h: number }) {
  return `Your image is ${pixelSizeLabel(size)}`
}
// How long the green "good size" badge stays once a lone design is brought
// down to the hoop frame from past it.
export const RECOVERED_GOOD_SIZE_MS = 2000
// The bounce at the design's minimum size: how far it gives, and for how long.
export const EMBROIDERY_MIN_BOUNCE_SCALE = 0.93
export const EMBROIDERY_MIN_BOUNCE_MS = 360
// The desktop add panels' slide-in (their duration-300).
export const PANEL_SLIDE_MS = 300
// The same bounce at an upload's print-quality maximum, giving outwards.
export const PRINT_MAX_BOUNCE_SCALE = 1 / EMBROIDERY_MIN_BOUNCE_SCALE

// Selection frame / corner handle / text-edit edge colours per state: the
// gizmo blue, the too-large orange and the fits-the-hoop green. Literal class
// names so Tailwind picks them up.
// How a selection frame eases between tones: its colour, --selection-tone
// (registered in globals.css), transitions — the ring itself doesn't, so it
// still comes and goes at once.
export const SELECTION_FRAME_TRANSITION = "--selection-tone 300ms ease-out"

export const SELECTION_TONE = {
  blue: {
    hex: "#3355FF",
    handle: "border-[#3355FF] hover:bg-[#3355FF]",
    edge: "bg-[#3355FF]",
    edgeHover: "bg-[#2B48D9]",
  },
  orange: {
    hex: "#EA580C",
    handle: "border-[#EA580C] hover:bg-[#EA580C]",
    edge: "bg-[#EA580C]",
    edgeHover: "bg-[#C2410C]",
  },
  green: {
    hex: "#16A34A",
    handle: "border-[#16A34A] hover:bg-[#16A34A]",
    edge: "bg-[#16A34A]",
    edgeHover: "bg-[#15803D]",
  },
} as const
