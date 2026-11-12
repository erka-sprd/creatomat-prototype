"use client"

import * as Popover from "@radix-ui/react-popover"
import { useSearchParams } from "next/navigation"
import { useLayoutEffect, useRef, useState, type ReactNode } from "react"

// import { WedgeSlider } from "@/components/ui/editor-bar/WedgeSlider"
import {
  COLOR_ROW_SCROLL_STEP_PX,
  FloatingScrollChevron,
  ScrollBlur,
  useHorizontalOverflow,
} from "@/components/ui/horizontal-scroll"
import { ZOOM_ICON_PATH } from "@/lib/designer-constants"
import { ACTIVE_LABEL_GAP_PX, LABEL_SLIDE_MS, labelNotchMask } from "@/lib/view-strip-notch"

// The designer's bottom row (desktop): three controls under the canvas in
// one style — the zoom, the product views and the print technique switcher.
//
// - A grid of 1fr | auto | 1fr, so the views sit exactly at the canvas's
//   centre whatever the zoom and the switcher measure; those two sit right
//   beside it, 12px away, at the inner ends of their columns.
// - All three are 56px white pills, their zoom buttons round too; the view
//   tiles are circles 6px in from the strip's edges.
// - The views strip scrolls with the product colour row's chevrons and fades
//   (FloatingScrollChevron), the content under them blurred rather than faded
//   (ScrollBlur).

const BOX = "h-14 rounded-full bg-white shadow-xs"
// The switcher's menu: a card, not a pill.
const MENU_RADIUS = "rounded-[10px]"
// Slack for "at the zoom's limit": the zoom eases between stops, so it lands a
// hair off them.
const ZOOM_EPSILON = 0.001
// A view tile, TILE_GAP_PX apart, and how many fit before the strip
// scrolls — five and a half, so the cut-off one says there are more.
// The strip holds its tiles STRIP_PADDING_PX in from its edges — the editor
// bar's own padding (EditorBarShell, px-1.5 py-1.5) — so they're the pill's
// 56px less that on each side; each tile holds its thumbnail TILE_PADDING_PX in.
const STRIP_PADDING_PX = 6
const TILE_PADDING_PX = 6
const TILE_PX = 56 - 2 * STRIP_PADDING_PX
const TILE_THUMB_PX = TILE_PX - 2 * TILE_PADDING_PX
const VISIBLE_TILES = 5.5
// The hover close-up's preview, against the tile's.
const PREVIEW_SCALE = 5
// Between the label and the hover close-up above it.
const PREVIEW_GAP_PX = 6
// The label while its view is scrolled out of the strip (ViewStrip's
// labelPinned): blurred over this share of its width on the side its view went, by
// this much (ScrollBlur, fading in from that end).
const PINNED_LABEL_BLUR_SHARE = 0.6
const PINNED_LABEL_BLUR_PX = 5
// …and its white fading in from that side: from this much white at the end
// to full white this share of the way in.
const PINNED_LABEL_FADE_FROM = 0.2
const PINNED_LABEL_FADE_SHARE = 0.35
// The hover close-up card's padding all round. At the sides each preview in
// its sliding row carries it, so a slide runs to the card's edges, the two
// pictures twice this apart.
const PREVIEW_PADDING_PX = 12
// The hovers in the row — zoom buttons, the technique button and its menu
// rows: neutral-100. The view tiles have their own (VIEW_TILE_*).
const TILE_HOVER = "hover:bg-neutral-100"
// A view tile: on the kit's lightest neutral (neutral-50) — outlined 1px in
// the kit's neutral-100 on hover. Every tile keeps a clear border, so nothing
// shifts when one shows.
// Selected ("Pop", picked on /view-strip-variants), it sits on the next
// neutral up (neutral-100), unoutlined, its thumbnail grown with a bounce
// (.view-tile-pop, globals.css).
const VIEW_TILE_ACTIVE = "border border-transparent bg-[var(--sprd-neutral-100)]"
const VIEW_TILE_IDLE =
  "border border-transparent bg-white hover:border-[var(--sprd-neutral-100)] hover:bg-[var(--sprd-neutral-50)]"
// The hover state held (ViewStrip's pinnedHoverId).
const VIEW_TILE_HOVERED = "border border-[var(--sprd-neutral-100)] bg-[var(--sprd-neutral-50)]"
// Between tiles.
const TILE_GAP_PX = 2
// The strip's shadow (shadow-xs) as a drop-shadow on a wrapper: a box-shadow
// would be cut off by the strip's own mask, a drop-shadow follows the notch.
const STRIP_SHADOW = "drop-shadow(0 1px 2px rgb(0 0 0 / 0.05))"
// The strip's widest: five and a half tiles, the gaps between them, and the
// padding.
const STRIP_MAX_PX =
  TILE_PX * VISIBLE_TILES + TILE_GAP_PX * Math.floor(VISIBLE_TILES) + 2 * STRIP_PADDING_PX
// How strongly the strip's cut-off end is blurred (ScrollBlur).
const EDGE_BLUR_PX = 10
// The technique button while its menu is open: its hover grey, held.
const TILE_ACTIVE = "bg-neutral-100"

// The zoom's tooltips: the existing zoom tooltip, moved above its button.
const TOOLTIP =
  "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-neutral-900 p-3 text-sm whitespace-nowrap text-neutral-100 opacity-0 shadow-sm transition-opacity after:absolute after:top-full after:left-1/2 after:h-0 after:w-0 after:-translate-x-1/2 after:border-x-[4px] after:border-x-transparent after:border-t-[4px] after:border-t-neutral-900 after:content-['']"

/**
 * `thumb` renders the view's preview at a given size — tile and hover preview.
 * `photo`: the view is a square photo (a close-up or the neck label) rather
 * than a cut-out of the product, so its tile thumbnail is cut to a circle.
 */
export type MergedRowView = {
  id: string
  name: string
  thumb: (size: number) => ReactNode
  photo?: boolean
}

export function MergedBottomRow({
  zoom,
  maxZoom,
  onZoomStep,
  onZoomChange,
  onZoomJump,
  views,
  activeViewId,
  onSelectView,
  printTechnique,
  onPrintTechnique,
  embroiderySupported,
  showTechnique = true,
  staticTechnique = false,
  hidden = false,
  swapDelayMs = 0,
  techniqueConfirmed = false,
  techniqueMenuOpen = false,
  zoomOnly = false,
}: {
  zoom: number
  maxZoom: number
  onZoomStep: (dir: 1 | -1) => void
  onZoomChange: (value: number) => void
  onZoomJump: (value: number) => void
  views: MergedRowView[]
  activeViewId: string | null
  onSelectView: (id: string) => void
  printTechnique: "standard" | "embroidery"
  onPrintTechnique: (technique: "standard" | "embroidery") => void
  embroiderySupported: boolean
  /** False where the technique isn't the user's to switch here — the row keeps its grid, so the views stay centred. */
  showTechnique?: boolean
  /** Names the current technique instead of offering the dropdown. */
  staticTechnique?: boolean
  /**
   * Slid down out of the canvas, which clips it — while something else takes
   * the spot (the embroidery design-issue warning), as the editor bar comes
   * and goes. Coming back it waits `swapDelayMs`, so the two pass rather
   * than overlap.
   */
  hidden?: boolean
  swapDelayMs?: number
  /** The technique switcher's green tick in place of its technique icon (TechniqueSwitcher). */
  techniqueConfirmed?: boolean
  /** Holds the technique menu open — the handoff's scenes, which script the choice. */
  techniqueMenuOpen?: boolean
  /**
   * Only the zoom, at the row's centre — while a Simplify with AI result is up
   * for review. The change shows only while the row is out of view (`hidden`),
   * so it slides out and back in as it was and will be — never rearranging in
   * sight.
   */
  zoomOnly?: boolean
}) {
  // Hidden, the row keeps the look it left with — the zoom alone stays
  // centred as it slides out (Cancel, the warning taking the spot) — and
  // takes up the current one as it comes back.
  const [zoomOnlyShown, setZoomOnlyShown] = useState(zoomOnly)
  if (!hidden && zoomOnlyShown !== zoomOnly) setZoomOnlyShown(zoomOnly)
  // How far the zoom's own place is from the row's centre — its translate
  // while zoomOnly. Measured from layout (offsetLeft), which a translate
  // doesn't move — again whenever any of the row's parts resizes (the views
  // strip filling in moves the zoom's place), and as zoomOnly comes on.
  const rowRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const [centreOffset, setCentreOffset] = useState(0)
  useLayoutEffect(() => {
    const row = rowRef.current
    const zoomBox = zoomRef.current
    if (!row || !zoomBox) return
    const measure = () =>
      setCentreOffset(row.clientWidth / 2 - (zoomBox.offsetLeft + zoomBox.offsetWidth / 2))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    for (const part of row.children) observer.observe(part)
    return () => observer.disconnect()
  }, [zoomOnlyShown])
  const others = zoomOnlyShown ? "pointer-events-none! opacity-0" : ""
  return (
    // The equal side columns keep the views at the canvas centre whatever the
    // zoom and the technique button measure. They never go below their
    // controls, so on a narrow canvas only the strip gives way: its
    // fit-content column shrinks and the strip scrolls.
    <div
      ref={rowRef}
      aria-hidden={hidden}
      className={
        "max-dlg:hidden pointer-events-none absolute inset-x-6 bottom-6 z-[5] grid items-end gap-3 transition-transform duration-300 ease-out motion-reduce:transition-none " +
        // Out of view means below the canvas edge for the whole row — the
        // active view's label pill stands above the strip (outside the row's
        // own height), so the slide clears its height and gap on top of the
        // row's bottom offset.
        (hidden ? "translate-y-[calc(100%+4rem)] [&_*]:pointer-events-none!" : "translate-y-0")
      }
      style={{
        gridTemplateColumns: `1fr fit-content(${STRIP_MAX_PX}px) 1fr`,
        transitionDelay: hidden ? "0ms" : `${swapDelayMs}ms`,
      }}
    >
      <div
        ref={zoomRef}
        // Over the views and the technique: its translate makes it its own
        // stacking layer, which would otherwise keep the zoom tip under them.
        className="pointer-events-auto relative z-10 justify-self-end"
        style={{ translate: zoomOnlyShown ? `${centreOffset}px 0` : "0 0" }}
      >
        <ZoomControl
          zoom={zoom}
          maxZoom={maxZoom}
          onStep={onZoomStep}
          onChange={onZoomChange}
          onJump={onZoomJump}
        />
      </div>
      <div aria-hidden={zoomOnlyShown} className={`pointer-events-auto min-w-0 ${others}`}>
        {/* Shown for a single view too, so the row keeps its three parts. */}
        {views.length > 0 && (
          <ViewStrip views={views} activeViewId={activeViewId} onSelect={onSelectView} />
        )}
      </div>
      <div aria-hidden={zoomOnlyShown} className={`pointer-events-auto justify-self-start ${others}`}>
        {showTechnique && staticTechnique && <TechniqueLabel value={printTechnique} />}
        {showTechnique && !staticTechnique && (
          <TechniqueSwitcher
            value={printTechnique}
            onChange={onPrintTechnique}
            embroiderySupported={embroiderySupported}
            confirmed={techniqueConfirmed}
            pinnedOpen={techniqueMenuOpen}
          />
        )}
      </div>
    </div>
  )
}

// The zoom, laid flat: minus, slider, plus — as long as the upright one
// (180px), its slider the same 88px.
export function ZoomControl({
  zoom,
  maxZoom,
  onStep,
  onChange,
  onJump,
}: {
  zoom: number
  maxZoom: number
  onStep: (dir: 1 | -1) => void
  onChange: (value: number) => void
  onJump: (value: number) => void
}) {
  // A button that would do nothing — minus at the fitted view, plus at the
  // closest zoom — is greyed out and disabled, its tooltip with it.
  const atLimit = (dir: 1 | -1) =>
    dir === 1 ? zoom >= maxZoom - ZOOM_EPSILON : zoom <= 1 + ZOOM_EPSILON
  const button = (dir: 1 | -1) => (
    <div className="group/tooltip relative flex">
      <button
        type="button"
        aria-label={dir === 1 ? "Zoom in" : "Zoom out"}
        disabled={atLimit(dir)}
        onClick={() => onStep(dir)}
        className={`flex size-9 items-center justify-center rounded-full text-black transition-[color,background-color,opacity] duration-300 ${
          atLimit(dir) ? "cursor-not-allowed opacity-30" : `cursor-pointer ${TILE_HOVER}`
        }`}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d={dir === 1 ? ZOOM_ICON_PATH.plus : ZOOM_ICON_PATH.minus}
          />
        </svg>
      </button>
      {!atLimit(dir) && (
        <span className={`${TOOLTIP} group-hover/tooltip:opacity-100`}>
          {dir === 1 ? "Zoom in" : "Zoom out"}
        </span>
      )}
    </div>
  )
  return (
    // Slider commented out for now: just − and +, the pill hugging them. To
    // bring it back, restore the WedgeSlider (and its import) and the pill's
    // w-[180px] justify-between in place of gap-1.
    <div className={`${BOX} flex items-center gap-1 px-2`}>
      {button(-1)}
      {/* How far into the zoom range it is — 0% fitted, 100% at the closest
          zoom — in the kit's neutral-500. Fixed width and tabular figures, so
          the buttons don't shift as it changes. */}
      <span className="w-11 text-center text-sm font-semibold text-[var(--sprd-neutral-500)] tabular-nums select-none">
        {Math.round(((zoom - 1) / (maxZoom - 1)) * 100)}%
      </span>
      {/* <WedgeSlider
        min={1}
        max={maxZoom}
        value={zoom}
        onChange={onChange}
        width={88}
        jumpOnTrackClick
        onJump={onJump}
      /> */}
      {button(1)}
    </div>
  )
}

// The product views: a fixed-width strip of tiles, flush against each other,
// scrolling sideways when there are more than fit — with the product colour
// row's chevrons and a blur at the cut-off end. The tiles — the views' close-
// ups — are circles, hovered and selected alike. Hovering one opens a preview
// above it: the view PREVIEW_SCALE times its tile's size, its name underneath.
// The strip clips its tiles, so the preview sits outside it, and so do
// the chevrons, over the pill's ends.
export function ViewStrip({
  views,
  activeViewId,
  onSelect,
  pinnedHoverId,
}: {
  views: MergedRowView[]
  activeViewId: string | null
  onSelect: (id: string) => void
  /**
   * Holds one tile in its hover state, preview open — for the handoff, which
   * shows the states side by side. The pointer then hovers nothing else.
   */
  pinnedHoverId?: string
}) {
  const { ref, onScroll, canScrollLeft, canScrollRight, scrollBy } = useHorizontalOverflow(
    [views.length],
    COLOR_ROW_SCROLL_STEP_PX
  )
  const [hovered, setHovered] = useState<{ id: string; x: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!pinnedHoverId) return
    const wrapper = wrapperRef.current
    const tile = wrapper?.querySelector<HTMLElement>(`[data-view-id="${pinnedHoverId}"]`)
    if (!wrapper || !tile) return
    const t = tile.getBoundingClientRect()
    const w = wrapper.getBoundingClientRect()
    setHovered({ id: pinnedHoverId, x: t.left - w.left + t.width / 2 })
  }, [pinnedHoverId, views.length])
  // The view the close-up last showed — kept while it fades out, so it doesn't
  // empty mid-animation.
  const [shown, setShown] = useState<{ id: string; x: number } | null>(null)
  if (hovered && (hovered.id !== shown?.id || hovered.x !== shown?.x)) setShown(hovered)
  const shownView = views.find(v => v.id === shown?.id)
  const previewPx = TILE_THUMB_PX * PREVIEW_SCALE
  const activeView = views.find(v => v.id === activeViewId)
  // The label names the hovered view while there is one — gliding over to
  // it — and the active one otherwise.
  const labelView = views.find(v => v.id === hovered?.id) ?? activeView
  // The label's size, for the notch cut around it — again whenever the name
  // changes its width.
  const labelRef = useRef<HTMLDivElement>(null)
  const [labelSize, setLabelSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const label = labelRef.current
    if (!label) return
    const measure = () => setLabelSize({ w: label.offsetWidth, h: label.offsetHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(label)
    return () => observer.disconnect()
  }, [labelView?.id])
  // Where the label rests: over the active tile's centre (measured from the
  // strip's left edge, so it follows the strip's scroll) — at the end tiles
  // too, where a long name may overhang the strip's end. Once the strip is
  // scrolled so the active tile has gone (its centre past the strip's end),
  // the label stays pinned inside that end instead — it doesn't drift off
  // over the zoom or the switcher — blurred and fading out on that side,
  // like the strip's own cut-off end.
  const [labelX, setLabelX] = useState<number | null>(null)
  const [labelPinned, setLabelPinned] = useState<"left" | "right" | null>(null)
  const measureLabelX = () => {
    const wrapper = wrapperRef.current
    const tile = wrapper?.querySelector<HTMLElement>(`[data-view-id="${activeViewId}"]`)
    if (!wrapper || !tile) return
    const t = tile.getBoundingClientRect()
    const w = wrapper.getBoundingClientRect()
    const centre = t.left - w.left + t.width / 2
    const half = (labelRef.current?.offsetWidth ?? 0) / 2
    const pinned =
      centre < TILE_PX / 2 ? "left" : centre > w.width - TILE_PX / 2 ? "right" : null
    setLabelPinned(pinned)
    setLabelX(pinned ? Math.min(Math.max(centre, half), w.width - half) : centre)
  }
  useLayoutEffect(() => {
    measureLabelX()
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const observer = new ResizeObserver(measureLabelX)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [activeViewId, views.length, labelSize?.w])
  const shownLabelX = hovered?.x ?? labelX
  const notchMask =
    labelView && labelSize && shownLabelX !== null
      ? labelNotchMask(labelSize, shownLabelX, false)
      : undefined
  // The close-up glides between tiles with the label while it's up, but
  // appears in place — no slide in from wherever it was last.
  const previewWasOpen = useRef(false)
  useLayoutEffect(() => {
    previewWasOpen.current = !!hovered
  })
  return (
    <div ref={wrapperRef} className="relative">
      {/* The label: a view's name in a small white pill ACTIVE_LABEL_GAP_PX
          above the strip — the hovered view's while the pointer is on the
          strip, the active one's otherwise. It glides from tile to tile, the
          notch with it. */}
      {labelView && (
        <div
          ref={labelRef}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full z-10 -translate-x-1/2 rounded-full bg-white px-2.5 py-1 text-xs font-semibold tracking-[0.1em] whitespace-nowrap text-black uppercase"
          style={{
            marginBottom: ACTIVE_LABEL_GAP_PX,
            left: shownLabelX ?? "50%",
            // Pinned, its white fades in from the blurred end — from
            // PINNED_LABEL_FADE_FROM white to full over PINNED_LABEL_FADE_SHARE.
            ...(labelPinned && !hovered
              ? {
                  background: `linear-gradient(to ${labelPinned === "left" ? "right" : "left"}, rgb(255 255 255 / ${PINNED_LABEL_FADE_FROM}), white ${PINNED_LABEL_FADE_SHARE * 100}%)`,
                }
              : {}),
            transition: `left ${LABEL_SLIDE_MS}ms ease-out`,
          }}
        >
          {labelView.name}
          {labelPinned && !hovered && labelSize && (
            <ScrollBlur
              dir={labelPinned}
              widthPx={labelSize.w * PINNED_LABEL_BLUR_SHARE}
              blurPx={PINNED_LABEL_BLUR_PX}
            />
          )}
        </div>
      )}
      {/* The hover close-up, a card of its own PREVIEW_GAP_PX above the label
          (which names the view). */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-full z-[100] -translate-x-1/2 origin-bottom ease-out ${
          hovered ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        style={{
          left: shown?.x ?? 0,
          marginBottom: (labelSize?.h ?? 0) + ACTIVE_LABEL_GAP_PX + PREVIEW_GAP_PX,
          transition: `opacity 150ms ease-out, scale 150ms ease-out${
            previewWasOpen.current && hovered ? `, left ${LABEL_SLIDE_MS}ms ease-out` : ""
          }`,
        }}
      >
        {/* Inside, every view's preview sits in a row, the card a window onto
            one: moving to the next tile slides the row along under the window
            (left or right) as the card glides — a carousel following the
            pointer. Opening, it's already in place. Each preview carries the
            card's side padding (PREVIEW_PADDING_PX) itself, so at rest it sits
            padded, but sliding it runs out to the card's very edges. */}
        {shownView && (
          <div
            className="overflow-hidden rounded-[16px] bg-white shadow-xl"
            style={{ paddingBlock: PREVIEW_PADDING_PX }}
          >
            <div
              className="flex"
              style={{
                width: previewPx + 2 * PREVIEW_PADDING_PX,
                translate: `${-views.indexOf(shownView) * (previewPx + 2 * PREVIEW_PADDING_PX)}px 0`,
                transition:
                  previewWasOpen.current && hovered ? `translate ${LABEL_SLIDE_MS}ms ease-out` : "none",
              }}
            >
              {views.map(view => (
                <div key={view.id} className="shrink-0" style={{ paddingInline: PREVIEW_PADDING_PX }}>
                  <div
                    className={`relative ${view.photo ? "overflow-hidden rounded-[12px]" : ""}`}
                    style={{ width: previewPx, height: previewPx }}
                  >
                    {view.thumb(previewPx)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* The cap sits on the pill, not on the scroller inside it: a
          percentage cap there doesn't hold where the pill sizes to its
          content (outside the row's grid), and the pill ran on past it. */}
      <div style={{ filter: STRIP_SHADOW }}>
      <div
        className="relative h-14 overflow-hidden rounded-full bg-white"
        style={{ maxWidth: STRIP_MAX_PX, ...notchMask }}
      >
        {canScrollLeft && <ScrollBlur dir="left" blurPx={EDGE_BLUR_PX} />}
        <div
          ref={ref}
          onScroll={() => {
            onScroll()
            measureLabelX()
            if (!pinnedHoverId) setHovered(null)
          }}
          // The hover ends on leaving the strip, not a tile: crossing the gap
          // between two tiles keeps the close-up up (on the last tile), so the
          // active view's label doesn't flash back in between them.
          onMouseLeave={pinnedHoverId ? undefined : () => setHovered(null)}
          className="no-scrollbar flex h-full overflow-x-auto scroll-smooth"
          style={{
            padding: STRIP_PADDING_PX,
            gap: TILE_GAP_PX,
          }}
        >
          {views.map(view => {
            const selected = activeViewId === view.id
            const pinned = pinnedHoverId === view.id
            return (
              <button
                key={view.id}
                type="button"
                data-view-id={view.id}
                aria-label={view.name}
                aria-current={selected}
                onClick={() => onSelect(view.id)}
                onMouseEnter={
                  pinnedHoverId
                    ? undefined
                    : e => {
                        const tile = e.currentTarget.getBoundingClientRect()
                        const strip =
                          e.currentTarget.parentElement!.parentElement!.getBoundingClientRect()
                        setHovered({ id: view.id, x: tile.left - strip.left + tile.width / 2 })
                      }
                }
                // A circle, like the close-up — at the strip's ends it follows
                // the pill's curve STRIP_PADDING_PX in. overflow-hidden keeps
                // the thumbnail's square corners inside it.
                className={`flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full transition-colors ${
                  selected ? VIEW_TILE_ACTIVE : pinned ? VIEW_TILE_HOVERED : VIEW_TILE_IDLE
                }`}
                style={{ width: TILE_PX, height: TILE_PX }}
              >
                {/* A photo view (close-up, neck label) is cut to a circle,
                    so the square photo reads as round as the tile. Product
                    views are not clipped, so a light product's shadow is not
                    cut off where the garment meets the box edge. */}
                <div
                  className={`relative ${view.photo ? "overflow-hidden rounded-full" : ""} ${
                    selected ? "view-tile-pop" : "view-tile-unpop"
                  }`}
                  style={{ width: TILE_THUMB_PX, height: TILE_THUMB_PX }}
                >
                  {view.thumb(TILE_THUMB_PX)}
                </div>
              </button>
            )
          })}
        </div>
        {canScrollRight && <ScrollBlur dir="right" blurPx={EDGE_BLUR_PX} />}
      </div>
      </div>
      {/* Inside the pill's ends rather than half outside as on the colour
          row: the zoom and the switcher are only 12px away. */}
      {canScrollLeft && (
        <FloatingScrollChevron dir="left" offsetPx={8} onClick={() => scrollBy("left")} />
      )}
      {canScrollRight && (
        <FloatingScrollChevron dir="right" offsetPx={8} onClick={() => scrollBy("right")} />
      )}
    </div>
  )
}

const TECHNIQUE_LABEL = { standard: "Standard print", embroidery: "Embroidery" } as const
const NOT_AVAILABLE = "Not available for this product"

// TEMPORARY — ?longCopy=fr|nl puts create-omat's longest translations of the
// technique copy (fr-FR, nl-NL print-technique.*) in the row, to check the
// pills hold them. Remove once checked.
const LONG_COPY = {
  fr: {
    label: { standard: "Impression standard", embroidery: "Broderie" },
    notAvailable: "Non disponible pour ce produit",
  },
  nl: {
    label: { standard: "Standaard Afdrukken", embroidery: "Borduurwerk" },
    notAvailable: "Niet beschikbaar voor dit product",
  },
} as const
function useTechniqueCopy() {
  const lang = useSearchParams()?.get("longCopy")
  if (lang === "fr" || lang === "nl") return LONG_COPY[lang]
  return { label: TECHNIQUE_LABEL, notAvailable: NOT_AVAILABLE }
}
// The technique icons from mobile-dock-change's print technique switcher: a
// drop of ink for standard print, needle and thread for embroidery.
const TECHNIQUE_ICON = {
  standard: "/icons/icon-droplet.svg",
  embroidery: "/icons/icon-needle-embroidery.svg",
} as const

// Drawn as a mask in the text colour, so an unavailable option greys with its
// label.
function TechniqueIcon({ tech }: { tech: "standard" | "embroidery" }) {
  const url = `url(${TECHNIQUE_ICON[tech]})`
  return (
    <span
      aria-hidden="true"
      className="size-5 shrink-0 bg-current"
      style={{
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  )
}

// The print technique as plain text: the same pill and its contents as the
// dropdown's button, minus the chevron, the hover, the menu and the shadow,
// on a see-through white, its text greyed.
export function TechniqueLabel({ value }: { value: "standard" | "embroidery" }) {
  const copy = useTechniqueCopy()
  return (
    <div className="h-14 rounded-full bg-white/50" style={{ padding: STRIP_PADDING_PX }}>
      <div className="flex h-full items-center gap-2 px-4 text-sm font-semibold text-[var(--sprd-neutral-600)]">
        <TechniqueIcon tech={value} />
        <span className="whitespace-nowrap">{copy.label[value]}</span>
      </div>
    </div>
  )
}

// The switcher's icon and name. A change of technique is shown, not just
// made: the new one rises into place out of a blur (.technique-face-in), and
// the pill eases to its width — the switch to standard print from an
// embroidery warning is played out here. The first render doesn't animate.
// `confirmed` puts a green tick in the technique icon's place; the two
// crossfade, scaling, in one cell.
function TechniqueFace({
  tech,
  confirmed = false,
}: {
  tech: "standard" | "embroidery"
  confirmed?: boolean
}) {
  const copy = useTechniqueCopy()
  const innerRef = useRef<HTMLSpanElement>(null)
  // Pinned to the face's measured width, so the next change has a width to
  // ease from (auto would jump).
  const [width, setWidth] = useState<number | null>(null)
  const firstTech = useRef(tech)
  const [changed, setChanged] = useState(false)
  useLayoutEffect(() => {
    if (tech !== firstTech.current) setChanged(true)
    if (innerRef.current) setWidth(innerRef.current.offsetWidth)
  }, [tech])
  return (
    <span
      className="flex overflow-hidden transition-[width] duration-400 ease-out"
      style={{ width: width ?? undefined }}
    >
      <span
        ref={innerRef}
        key={tech}
        className={`flex shrink-0 items-center gap-2 ${changed ? "technique-face-in" : ""}`}
      >
        <span className="grid size-5 shrink-0 place-items-center [&>*]:[grid-area:1/1] [&>*]:transition-[opacity,scale] [&>*]:duration-300 [&>*]:ease-out">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`text-green-600 ${confirmed ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          >
            <path
              d="M5 12.5L10 17.5L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* flex, so the icon's inline span keeps its 20px box. */}
          <span className={`flex ${confirmed ? "scale-50 opacity-0" : "scale-100 opacity-100"}`}>
            <TechniqueIcon tech={tech} />
          </span>
        </span>
        <span className="whitespace-nowrap">{copy.label[tech]}</span>
      </span>
    </span>
  )
}

// The print technique as a dropdown: the box shows the current one, and opens
// upward onto both — the chosen one ticked, as the designer's earlier
// technique dropdown did (the menu at MENU_RADIUS, its rows at the tiles'
// 6px). Embroidery is offered only where the product takes it.
export function TechniqueSwitcher({
  value,
  onChange,
  embroiderySupported,
  pinnedOpen = false,
  confirmed = false,
}: {
  value: "standard" | "embroidery"
  onChange: (technique: "standard" | "embroidery") => void
  embroiderySupported: boolean
  /** Holds the menu open — for the handoff, which shows it without a click. */
  pinnedOpen?: boolean
  /** A green tick in the technique icon's place — confirming a switch just made. */
  confirmed?: boolean
}) {
  const copy = useTechniqueCopy()
  const [openState, setOpenState] = useState(false)
  const open = pinnedOpen || openState
  const setOpen = (next: boolean) => {
    if (!pinnedOpen) setOpenState(next)
  }
  const current = embroiderySupported ? value : "standard"

  const button = (
    <button
      type="button"
      aria-label={`Print technique: ${copy.label[current]}`}
      className={`flex h-full cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold text-black transition-colors ${TILE_HOVER} ${
        open ? TILE_ACTIVE : ""
      }`}
    >
      <TechniqueFace tech={current} confirmed={confirmed} />
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className={`text-neutral-500 transition-[rotate] duration-200 ${open ? "rotate-180" : ""}`}
      >
        <path
          d="M2.5 4.5L6 8L9.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
  const menuClass = `w-52 bg-white p-1 shadow-lg outline-none ${MENU_RADIUS}`

  // Held open (the handoff), the menu is laid out in the page, 8px above the
  // pill, rather than floated in a portal — a floated menu is re-placed on
  // every scroll and visibly trails the pill.
  if (pinnedOpen) {
    return (
      <div className="relative">
        <div className={`absolute bottom-full left-0 z-[100] mb-2 ${menuClass}`}>{menuRows()}</div>
        <div className={BOX} style={{ padding: STRIP_PADDING_PX }}>
          {button}
        </div>
      </div>
    )
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {/* The pill holds the button STRIP_PADDING_PX in, as the views strip
          holds its tiles — the button then greys like a tile on hover, and
          while its menu is open. The menu lines up with the pill. */}
      <Popover.Anchor asChild>
        <div className={BOX} style={{ padding: STRIP_PADDING_PX }}>
          <Popover.Trigger asChild>{button}</Popover.Trigger>
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={8}
          className={`z-[100] ${menuClass}`}
        >
          {menuRows()}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )

  function menuRows() {
    return (["standard", "embroidery"] as const).map(tech => {
      const selected = current === tech
      const unavailable = tech === "embroidery" && !embroiderySupported
      return (
        <button
          key={tech}
          type="button"
          disabled={unavailable}
          onClick={() => {
            onChange(tech)
            setOpen(false)
          }}
          className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm text-black transition-colors ${
            selected ? "font-semibold" : ""
          } ${unavailable ? "cursor-not-allowed text-neutral-400" : `cursor-pointer ${TILE_HOVER}`}`}
        >
          {/* Top-aligned: with the "not available" line under the label, the
              20px icon stays level with the label's 20px line. */}
          <span className="flex items-start gap-2">
            <TechniqueIcon tech={tech} />
            <span>
              {copy.label[tech]}
              {unavailable && (
                <span className="block text-xs font-normal">{copy.notAvailable}</span>
              )}
            </span>
          </span>
          {selected && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12.5L10 17.5L19 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )
    })
  }
}
