"use client"

/**
 * /handoff/view-switcher — the desktop views strip's label: the active view's
 * name in a pill that cuts into the strip, follows the selected and the
 * hovered view, and stays at the strip's end when its view is scrolled away.
 *
 * Every demo is the shipping ViewStrip from components/merged-bottom-row.tsx,
 * fed a real catalogue product. What is faked:
 * - the scripted demos drive it from outside — the selected view, the held
 *   hover (pinnedHoverId, pinnedChevron) and the strip's scroll position on a
 *   timer;
 * - the hover demos' cursors are drawn;
 * - §2's backgrounds are flat patches in the product's own catalogue colours,
 *   standing in for a zoomed-in product behind the strip.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react"

import {
  Brief,
  BriefCard,
  Demo,
  HandoffEnd,
  HandoffHeader,
  HandoffShell,
  Kicker,
  Note,
  Section,
  SectionHead,
  WinTable,
  type NavItem,
} from "@/components/handoff/handoff-ui"
import { ParkedCursor } from "@/components/handoff/rail-replica"
import { ViewStrip, type MergedRowView } from "@/components/merged-bottom-row"
import { COLOR_ROW_SCROLL_STEP_PX } from "@/components/ui/horizontal-scroll"
import { loadCatalog } from "@/lib/catalog"
import { ACTIVE_LABEL_GAP_PX } from "@/lib/view-strip-notch"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

const HOODIE_ID = "20" // Men's Premium Organic Hoodie — 8 views, so the strip scrolls
const TSHIRT_ID = "812" // Men's Premium Organic T-Shirt — 5 views, so it doesn't
const PRODUCT_COLOR = "bottle green"
const TSHIRT_COLOR = "mauve"
// §2's patches: a light and a dark colour of the T-shirt.
const LIGHT_COLOR = "light blue"
const DARK_COLOR = "navy"
// The designer's desktop canvas.
const CANVAS_GREY = "#F4F4F4"
// A scripted demo's beat: long enough to follow.
const BEAT_MS = 1600

const NAV: NavItem[] = [
  { id: "brief", mark: "◆", label: "Problem & Hypotheses" },
  { id: "live", mark: "1", label: "Live" },
  { id: "s2", mark: "2", label: "The cut" },
  { id: "s3", mark: "3", label: "Selected view" },
  { id: "s4", mark: "4", label: "Hover" },
  { id: "s5", mark: "5", label: "Scrolled away" },
  { id: "s6", mark: "6", label: "Scroll arrows" },
  { id: "s7", mark: "7", label: "Click “See more”" },
  { id: "s8", mark: "8", label: "Behind the arrow" },
  { id: "s9", mark: "9", label: "Resting pointer" },
]

const noop = () => {}

/* ------------------------------------------------------------------- data */

type Product = { views: MergedRowView[]; colors: Record<string, string> }

const EMPTY: Product = { views: [], colors: {} }

/**
 * A catalogue product's views as the strip takes them, in one of its colours —
 * and its colours' hex values by name. The thumbnails are the plain product
 * shots: no design on them, which is all these demos need.
 */
function useProduct(id: string, color = PRODUCT_COLOR): Product {
  const [product, setProduct] = useState<Product>(EMPTY)
  useEffect(() => {
    let live = true
    loadCatalog()
      .then(catalog => {
        const p = catalog.products.find(x => x.id === id)
        if (!p || !live) return
        const appearance =
          p.appearances.find(a => a.name.trim().toLowerCase() === color) ?? p.appearances[0]
        setProduct({
          colors: Object.fromEntries(p.appearances.map(a => [a.name.trim().toLowerCase(), a.color])),
          views: p.views.map(view => {
            const image = appearance?.views.find(v => v.id === view.id)?.image
            return {
              id: view.id,
              name: view.name,
              photo: /close-?up|neck label/i.test(view.name),
              thumb: () =>
                image ? (
                  <img src={image} alt="" className="size-full object-contain" draggable={false} />
                ) : null,
            }
          }),
        })
      })
      // A document should degrade, not break: the demos just stay empty.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [id, color])
  return product
}

/** Counts up one a beat, for the scripted demos; stays at 0 with reduced motion. */
function useBeat(ms = BEAT_MS) {
  const [beat, setBeat] = useState(0)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = setInterval(() => setBeat(b => b + 1), ms)
    return () => clearInterval(timer)
  }, [ms])
  return beat
}

/* ------------------------------------------------------------------ demos */

/**
 * A patch of canvas: the strip is a white pill meant for the designer's
 * canvas, and on the document's white it would all but disappear.
 */
function Canvas({
  children,
  padding,
  background = CANVAS_GREY,
}: {
  children: React.ReactNode
  padding: string
  background?: string
}) {
  return (
    <div className={`flex justify-center rounded-[12px] ${padding}`} style={{ background }}>
      {children}
    </div>
  )
}

/** One state, labelled underneath. */
function StateCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
      {children}
      <span className="font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
        {label}
      </span>
    </div>
  )
}

/** A scripted demo's strip: it plays, it doesn't take clicks. */
function Scripted({ children }: { children: React.ReactNode }) {
  return <div className="relative [&_*]:pointer-events-none">{children}</div>
}

/** §1 — the strip live under the view it shows: hover, pick, scroll. */
function LiveStrip({ views }: { views: MergedRowView[] }) {
  const [picked, setPicked] = useState<string | null>(null)
  const activeId = picked ?? views[0]?.id ?? null
  const active = views.find(v => v.id === activeId)
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="size-[240px]">{active?.thumb(240)}</div>
      <ViewStrip views={views} activeViewId={activeId} onSelect={setPicked} />
    </div>
  )
}

/** §3 — a view is picked, one after the next: the label glides over, the view pops. */
function SelectLoop({ views }: { views: MergedRowView[] }) {
  const beat = useBeat()
  return (
    <Scripted>
      <ViewStrip
        views={views}
        activeViewId={views.length ? views[beat % views.length].id : null}
        onSelect={noop}
      />
    </Scripted>
  )
}

/**
 * §4 — the pointer comes onto the strip, crosses three views and leaves; the
 * first view stays selected. The cursor's spots are measured from the tiles.
 */
function HoverLoop({ views }: { views: MergedRowView[] }) {
  const beat = useBeat()
  const ref = useRef<HTMLDivElement>(null)
  // Off the strip, then on the 2nd, 3rd and 4th view.
  const hoveredId = [undefined, views[1]?.id, views[2]?.id, views[3]?.id][beat % 4]
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    const tile = hoveredId
      ? box.querySelector<HTMLElement>(`[data-view-id="${hoveredId}"]`)
      : null
    const b = box.getBoundingClientRect()
    if (!tile) {
      // Parked beside the strip's end, clear of it.
      setCursor({ x: b.width + 28, y: b.height + 14 })
      return
    }
    const t = tile.getBoundingClientRect()
    setCursor({ x: t.left - b.left + t.width / 2, y: t.top - b.top + t.height * 0.6 })
  }, [hoveredId, views.length])
  return (
    <Scripted>
      <div ref={ref}>
        <ViewStrip
          views={views}
          activeViewId={views[0]?.id ?? null}
          onSelect={noop}
          pinnedHoverId={hoveredId}
        />
      </div>
      {/* The hand, as a view is a button. */}
      {cursor && (
        <span
          className="absolute z-[120] transition-[left,top] duration-300 ease-out"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <ParkedCursor hand className="top-0 left-0" />
        </span>
      )}
    </Scripted>
  )
}

/**
 * §4 — the second view held hovered, the pointer resting `at` one spot of
 * its hover area: the gap after it (the arrow: a gap is not a button), its
 * label or its preview (the hand: both are clickable). The spot is measured —
 * a frame late, once the strip has laid out its label and preview.
 */
function HeldHover({ views, at }: { views: MergedRowView[]; at: "gap" | "label" | "preview" }) {
  const ref = useRef<HTMLDivElement>(null)
  const hoveredId = views[1]?.id
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const box = ref.current
      const tile = hoveredId && box?.querySelector<HTMLElement>(`[data-view-id="${hoveredId}"]`)
      const next = tile && (tile.nextElementSibling as HTMLElement | null)
      if (!box || !tile || !next) return
      const b = box.getBoundingClientRect()
      const t = tile.getBoundingClientRect()
      const centre = t.left - b.left + t.width / 2
      if (at === "gap") {
        const n = next.getBoundingClientRect()
        setCursor({ x: (t.right + n.left) / 2 - b.left, y: t.top - b.top + t.height / 2 })
        return
      }
      // The label stands on the strip's top edge, the preview on the label:
      // heights only, as both are still gliding into place.
      const labelH = box.querySelector<HTMLElement>("[data-view-label]")?.offsetHeight ?? 0
      const labelTop = -ACTIVE_LABEL_GAP_PX - labelH
      const previewH = box.querySelector<HTMLElement>("[data-view-preview]")?.offsetHeight ?? 0
      setCursor({ x: centre, y: at === "label" ? labelTop + labelH / 2 : labelTop - previewH / 2 })
    })
    return () => cancelAnimationFrame(frame)
  }, [hoveredId, views.length, at])
  return (
    <Scripted>
      <div ref={ref}>
        <ViewStrip
          views={views}
          activeViewId={views[0]?.id ?? null}
          onSelect={noop}
          pinnedHoverId={hoveredId}
        />
      </div>
      {cursor && (
        <span className="absolute z-[120]" style={{ left: cursor.x, top: cursor.y }}>
          <ParkedCursor hand={at !== "gap"} className="top-0 left-0" />
        </span>
      )}
    </Scripted>
  )
}

/**
 * §6 — the pointer comes onto the scroll arrow and leaves again: the label
 * glides over the arrow and reads "See more", then goes back to the selected
 * view. The cursor's spot is measured from the arrow.
 */
function ArrowHoverLoop({ views }: { views: MergedRowView[] }) {
  const beat = useBeat()
  const ref = useRef<HTMLDivElement>(null)
  const onArrow = beat % 2 === 1
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  useLayoutEffect(() => {
    const box = ref.current
    const arrow = box?.querySelector<HTMLElement>('button[aria-label="Scroll right"]')
    if (!box || !arrow) return
    const b = box.getBoundingClientRect()
    if (!onArrow) {
      // Parked beside the strip's end, clear of it.
      setCursor({ x: b.width + 28, y: b.height + 14 })
      return
    }
    const a = arrow.getBoundingClientRect()
    setCursor({ x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height * 0.6 })
  }, [onArrow, views.length])
  return (
    <Scripted>
      <div ref={ref}>
        <ViewStrip
          views={views}
          activeViewId={views[0]?.id ?? null}
          onSelect={noop}
          pinnedChevron={onArrow ? "right" : undefined}
        />
      </div>
      {/* The hand, as the arrow is a button. */}
      {cursor && (
        <span
          className="absolute z-[120] transition-[left,top] duration-300 ease-out"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <ParkedCursor hand className="top-0 left-0" />
        </span>
      )}
    </Scripted>
  )
}

/**
 * §5 — the strip scrolled so its selected view is out of it. `loop` scrolls
 * to that end and back, a beat each; otherwise it stays as `scrolledTo` says.
 */
function ScrolledStrip({
  views,
  activeIndex,
  scrolledTo,
  loop = false,
}: {
  views: MergedRowView[]
  activeIndex: number
  scrolledTo: "start" | "end"
  loop?: boolean
}) {
  const beat = useBeat(2200)
  const ref = useRef<HTMLDivElement>(null)
  const atRest = loop && beat % 2 === 0
  useEffect(() => {
    // The strip's own scroller (it scrolls smoothly).
    const scroller = ref.current?.querySelector<HTMLElement>(".no-scrollbar")
    if (!scroller) return
    const end = scroller.scrollWidth - scroller.clientWidth
    const away = scrolledTo === "end" ? end : 0
    scroller.scrollLeft = atRest ? end - away : away
  }, [atRest, scrolledTo, views.length])
  return (
    <Scripted>
      <div ref={ref}>
        <ViewStrip
          views={views}
          activeViewId={views.at(activeIndex)?.id ?? null}
          onSelect={noop}
        />
      </div>
    </Scripted>
  )
}

/**
 * §7 — the pointer comes onto the arrow, moves up onto the "See more" label
 * and clicks it: the strip scrolls a step, as the arrow would scroll it. The
 * cursor's spots are measured from the arrow and the label.
 */
function SeeMoreClickLoop({ views }: { views: MergedRowView[] }) {
  const beat = useBeat()
  const ref = useRef<HTMLDivElement>(null)
  // Off the strip, on the arrow, on the label, clicked.
  const step = beat % 4
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const scroller = ref.current?.querySelector<HTMLElement>(".no-scrollbar")
    if (scroller) scroller.scrollLeft = step === 3 ? COLOR_ROW_SCROLL_STEP_PX : 0
    // A frame late: the label has stood over the arrow since the beat before.
    const frame = requestAnimationFrame(() => {
      const box = ref.current
      if (!box) return
      const b = box.getBoundingClientRect()
      const target =
        step === 0
          ? null
          : box.querySelector<HTMLElement>(
              step === 1 ? 'button[aria-label="Scroll right"]' : "[data-view-label]"
            )
      if (!target) {
        // Parked beside the strip's end, clear of it.
        setCursor({ x: b.width + 28, y: b.height + 14 })
        return
      }
      const t = target.getBoundingClientRect()
      setCursor({ x: t.left - b.left + t.width / 2, y: t.top - b.top + t.height * 0.6 })
    })
    return () => cancelAnimationFrame(frame)
  }, [step, views.length])
  return (
    <Scripted>
      <div ref={ref}>
        <ViewStrip
          views={views}
          activeViewId={views[0]?.id ?? null}
          onSelect={noop}
          pinnedChevron={step > 0 ? "right" : undefined}
        />
      </div>
      {/* The hand: the arrow and the label are both clickable. */}
      {cursor && (
        <span
          className="absolute z-[120] transition-[left,top] duration-300 ease-out"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <ParkedCursor hand className="top-0 left-0" />
        </span>
      )}
    </Scripted>
  )
}

/**
 * §9 — the pointer comes onto the arrow and clicks it: the strip scrolls to
 * its end, the arrow goes, and the view that has arrived under the pointer —
 * which hasn't moved — is hovered. The cursor's spot is measured from the
 * arrow; the hover is then held from outside, on the view found under that
 * spot once the strip has reached its end.
 */
function ArrowClickHoverLoop({ views }: { views: MergedRowView[] }) {
  const beat = useBeat()
  const ref = useRef<HTMLDivElement>(null)
  // Off the strip, on the arrow, clicked, and a beat to look at it.
  const step = beat % 4
  const clicked = step >= 2
  const [onArrow, setOnArrow] = useState<{ x: number; y: number } | null>(null)
  const [parked, setParked] = useState<{ x: number; y: number } | null>(null)
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined)
  // The cursor's two spots, taken while the arrow is there (the strip at its
  // start) — again whenever the strip redraws, as the arrow only appears once
  // the strip knows it can scroll.
  useEffect(() => {
    const box = ref.current
    if (!box) return
    const measure = () => {
      const arrow = box.querySelector<HTMLElement>('button[aria-label="Scroll right"]')
      if (!arrow) return
      const b = box.getBoundingClientRect()
      const a = arrow.getBoundingClientRect()
      const x = Math.round(a.left - b.left + a.width / 2)
      const y = Math.round(a.top - b.top + a.height * 0.6)
      setOnArrow(prev => (prev?.x === x && prev.y === y ? prev : { x, y }))
      // Parked beside the strip's end, clear of it.
      setParked({ x: Math.round(b.width + 28), y: Math.round(b.height + 14) })
    }
    measure()
    const observer = new MutationObserver(measure)
    observer.observe(box, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [views.length])
  const arrowX = onArrow?.x
  useEffect(() => {
    const box = ref.current
    const scroller = box?.querySelector<HTMLElement>(".no-scrollbar")
    if (!box || !scroller) return
    const end = scroller.scrollWidth - scroller.clientWidth
    if (!clicked || arrowX === undefined) {
      setHoveredId(undefined)
      scroller.scrollLeft = 0
      return
    }
    // The strip at its end (the arrow gone): the view under the cursor.
    const underCursor = () => {
      if (scroller.scrollLeft < end - 1) return
      const x = box.getBoundingClientRect().left + arrowX
      const tile = [...box.querySelectorAll<HTMLElement>("[data-view-id]")].find(t => {
        const r = t.getBoundingClientRect()
        return r.left <= x && x <= r.right
      })
      if (tile) setHoveredId(tile.dataset.viewId)
    }
    scroller.addEventListener("scroll", underCursor)
    scroller.scrollLeft = end
    return () => scroller.removeEventListener("scroll", underCursor)
  }, [clicked, arrowX, views.length])
  const cursor = step === 0 ? parked : onArrow
  return (
    <Scripted>
      <div ref={ref}>
        <ViewStrip
          views={views}
          activeViewId={views[0]?.id ?? null}
          onSelect={noop}
          pinnedHoverId={hoveredId}
          pinnedChevron={step > 0 && !hoveredId ? "right" : undefined}
        />
      </div>
      {/* The hand: the arrow is a button, and so is the view after it. */}
      {cursor && (
        <span
          className="absolute z-[120] transition-[left,top] duration-300 ease-out"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <ParkedCursor hand className="top-0 left-0" />
        </span>
      )}
    </Scripted>
  )
}

/**
 * §8 — the strip scrolled halfway, so both ends are cut off, and the area at
 * each end that takes no hover and no click drawn over it: dashed and tinted.
 * The areas are the strip's own (its edge shields), measured — whenever the
 * strip redraws, as they only appear once it knows it can scroll.
 */
function BlockedEnds({ views }: { views: MergedRowView[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [areas, setAreas] = useState<{ left: number; top: number; width: number; height: number }[]>(
    []
  )
  useEffect(() => {
    const box = ref.current
    if (!box) return
    const scroller = box.querySelector<HTMLElement>(".no-scrollbar")
    if (scroller) scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2
    const measure = () => {
      const b = box.getBoundingClientRect()
      const next = [...box.querySelectorAll<HTMLElement>("[data-edge-shield]")].map(shield => {
        const s = shield.getBoundingClientRect()
        return {
          left: Math.round(s.left - b.left),
          top: Math.round(s.top - b.top),
          width: Math.round(s.width),
          height: Math.round(s.height),
        }
      })
      setAreas(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    measure()
    const observer = new MutationObserver(measure)
    observer.observe(box, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [views.length])
  return (
    <Scripted>
      <div ref={ref}>
        <ViewStrip views={views} activeViewId={views[3]?.id ?? null} onSelect={noop} />
      </div>
      {areas.map(area => (
        <span
          key={area.left}
          aria-hidden="true"
          // Over the strip, under its arrows (z-20): the arrow is what reacts.
          className={`absolute z-[18] border-[1.5px] border-dashed border-[#DC2626] bg-[#DC2626]/15 ${
            area.left === 0 ? "rounded-l-full" : "rounded-r-full"
          }`}
          style={area}
        />
      ))}
    </Scripted>
  )
}

/* -------------------------------------------------------------------- page */

export default function ViewSwitcher() {
  const hoodie = useProduct(HOODIE_ID)
  const tshirt = useProduct(TSHIRT_ID, TSHIRT_COLOR)
  // §2: the same T-shirt in a light and a dark colour, its views on a patch
  // of that colour — the strip as it sits over that product zoomed in.
  const lightTshirt = useProduct(TSHIRT_ID, LIGHT_COLOR)
  const darkTshirt = useProduct(TSHIRT_ID, DARK_COLOR)
  const first = tshirt.views[0]?.id ?? null
  const last = tshirt.views.at(-1)?.id ?? null
  // The strip needs room above it: the label, and on hover the preview.
  // At the sides, room for a label overhanging the strip's end.
  const LABEL_ROOM = "px-10 pt-[70px] pb-[46px]"
  const PREVIEW_ROOM = "px-10 pt-[270px] pb-[46px]"

  return (
    <HandoffShell
      slug="view-switcher"
      items={NAV}
      links={[
        { label: "Prototype", href: PROTOTYPE },
        { label: "Repo", href: REPO },
      ]}
    >
      <HandoffHeader
        title="Product views, easier to explore"
        actions={[
          { label: "See prototype", href: PROTOTYPE, live: true },
          { label: "See repo", href: REPO, ghost: true },
        ]}
      />

      {/* ----------------------------------------------------------- brief */}
      <Section id="brief" first>
        <Brief>
          <BriefCard tone="problem" label="Problem">
            <ul>
              <li>
                Since the new bottom row, users on desktop switch product views less: 48.7% of
                designer visits before, 42.2% after (Spreadshirt EU, 28 Oct – 2 Nov vs 4 – 11
                Nov).
              </li>
              <li>
                The views are small circles without names. Users don&rsquo;t see which side they
                are on, or what else there is to design.
              </li>
            </ul>
          </BriefCard>
          <BriefCard tone="hypothesis" label="Hypothesis">
            We believe naming the view on the strip, and letting the name and a large preview
            follow the pointer, makes the views easier to explore — so more users switch views.
          </BriefCard>
          <BriefCard tone="win" label="What win looks like">
            <WinTable
              rows={[
                {
                  win: "More desktop users explore the product's other views.",
                  signals: "Share of desktop designer visits that switch view",
                },
                {
                  win: "More products get designed on more than one side.",
                  signals: "Share of desktop orders with a design on several views",
                },
              ]}
            />
          </BriefCard>
          <BriefCard tone="result" label="Result">
            Will follow.
          </BriefCard>
        </Brief>
      </Section>

      {/* ------------------------------------------------------------ live */}
      <Section id="live">
        <Kicker>§1 · Live</Kicker>
        <SectionHead title="The view's name, on the strip" />
        <p>Live: hover the views, pick one, scroll the strip. Desktop only</p>
        <Demo padding="p-3.5" className="overflow-visible">
          <Canvas padding="px-6 pt-8 pb-[46px]">
            <LiveStrip views={hoodie.views} />
          </Canvas>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §2 */}
      <Section id="s2">
        <Kicker>§2 · The cut</Kicker>
        <SectionHead title="The label cuts into the strip" />
        <p>The gap around the label is a hole in the strip, not a border</p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <div className="flex flex-col gap-3.5">
            <StateCell label="on the canvas">
              <div className="w-full">
                <Canvas padding={LABEL_ROOM}>
                  <ViewStrip views={tshirt.views} activeViewId={first} onSelect={noop} />
                </Canvas>
              </div>
            </StateCell>
            <StateCell label={`over a ${LIGHT_COLOR} product`}>
              <div className="w-full">
                <Canvas padding={LABEL_ROOM} background={lightTshirt.colors[LIGHT_COLOR]}>
                  <ViewStrip views={lightTshirt.views} activeViewId={first} onSelect={noop} />
                </Canvas>
              </div>
            </StateCell>
            <StateCell label={`over a ${DARK_COLOR} product`}>
              <div className="w-full">
                <Canvas padding={LABEL_ROOM} background={darkTshirt.colors[DARK_COLOR]}>
                  <ViewStrip views={darkTshirt.views} activeViewId={first} onSelect={noop} />
                </Canvas>
              </div>
            </StateCell>
          </div>
        </Demo>
        <Note>
          Cut it with a mask: the strip, minus a pill slightly larger than the label. Whatever is
          behind shows through, so it holds on any product colour and at any zoom. A border in
          the canvas colour would show as soon as a product is behind it. The strip&rsquo;s
          shadow is a drop shadow, so it follows the cut.
        </Note>
      </Section>

      {/* -------------------------------------------------------------- §3 */}
      <Section id="s3">
        <Kicker>§3 · Selected view</Kicker>
        <SectionHead title="The label sits over the selected view" />
        <p>Pick a view: the label and its cut glide over, and the view pops</p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <Canvas padding={LABEL_ROOM}>
            <SelectLoop views={tshirt.views} />
          </Canvas>
        </Demo>
        <p className="ho-caption">
          Always centred on its view — on the first and the last one too, where a long name
          overhangs the strip
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <div className="flex flex-col gap-3.5">
            <StateCell label="first view">
              <div className="w-full">
                <Canvas padding={LABEL_ROOM}>
                  <ViewStrip views={tshirt.views} activeViewId={first} onSelect={noop} />
                </Canvas>
              </div>
            </StateCell>
            <StateCell label="last view">
              <div className="w-full">
                <Canvas padding={LABEL_ROOM}>
                  <ViewStrip views={tshirt.views} activeViewId={last} onSelect={noop} />
                </Canvas>
              </div>
            </StateCell>
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §4 */}
      <Section id="s4">
        <Kicker>§4 · Hover</Kicker>
        <SectionHead title="On hover, the label follows the pointer" />
        <p>
          It names the hovered view, a preview above it. Leaving the strip, it goes back to the
          selected view
        </p>
        <Demo padding="p-3.5" className="overflow-visible">
          <Canvas padding={PREVIEW_ROOM}>
            <HoverLoop views={tshirt.views} />
          </Canvas>
        </Demo>
        <Note>
          The preview is one card that glides along with the label; inside it the pictures slide
          left or right, like a carousel.
        </Note>
        <p className="ho-caption">
          No &ldquo;hover off&rdquo; between views: in the gap, the last hovered view stays
          hovered. The hover ends only when the pointer leaves the strip
        </p>
        <Demo padding="p-3.5" className="overflow-visible">
          <Canvas padding={PREVIEW_ROOM}>
            <HeldHover views={tshirt.views} at="gap" />
          </Canvas>
        </Demo>
        <p className="ho-caption">
          The label and the preview belong to the hover too: the pointer can move up onto them,
          and a click on either picks that view
        </p>
        <Demo padding="p-3.5" className="overflow-visible">
          <div className="flex flex-col gap-3.5">
            <StateCell label="pointer on the label">
              <div className="w-full">
                <Canvas padding={PREVIEW_ROOM}>
                  <HeldHover views={tshirt.views} at="label" />
                </Canvas>
              </div>
            </StateCell>
            <StateCell label="pointer on the preview">
              <div className="w-full">
                <Canvas padding={PREVIEW_ROOM}>
                  <HeldHover views={tshirt.views} at="preview" />
                </Canvas>
              </div>
            </StateCell>
          </div>
        </Demo>
        <Note>
          Views, label and preview are one hover area. Leaving it ends the hover only after a
          short moment, so crossing from one to the next never closes the preview. Without a
          hover, a click on the label picks the selected view again.
        </Note>
      </Section>

      {/* -------------------------------------------------------------- §5 */}
      <Section id="s5">
        <Kicker>§5 · Scrolled away</Kicker>
        <SectionHead title="Selected view scrolled away: the label waits at that end" />
        <p>
          It stops inside the strip&rsquo;s end, blurred and fading out on the side its view went
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <Canvas padding={LABEL_ROOM}>
            <ScrolledStrip views={hoodie.views} activeIndex={0} scrolledTo="end" loop />
          </Canvas>
        </Demo>
        <p className="ho-caption">Either end, the blur on the side of the hidden view</p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <div className="flex flex-col gap-3.5">
            <StateCell label="selected view is to the left">
              <div className="w-full">
                <Canvas padding={LABEL_ROOM}>
                  <ScrolledStrip views={hoodie.views} activeIndex={0} scrolledTo="end" />
                </Canvas>
              </div>
            </StateCell>
            <StateCell label="selected view is to the right">
              <div className="w-full">
                <Canvas padding={LABEL_ROOM}>
                  <ScrolledStrip views={hoodie.views} activeIndex={-1} scrolledTo="start" />
                </Canvas>
              </div>
            </StateCell>
          </div>
        </Demo>
        <Note>
          The label never leaves the strip to follow its view, so it can&rsquo;t end up over the
          zoom or the print technique. Scrolled back into sight, the view gets its label back,
          sharp. Hover works as always. A click on the waiting label scrolls its view back into
          sight.
        </Note>
      </Section>

      {/* -------------------------------------------------------------- §6 */}
      <Section id="s6">
        <Kicker>§6 · Scroll arrows</Kicker>
        <SectionHead title="Hovering the arrow: the label says “See more”" />
        <p>
          Hover the arrow: the label moves over it, grey, and reads &ldquo;See more&rdquo;. No
          preview
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <Canvas padding={LABEL_ROOM}>
            <ArrowHoverLoop views={hoodie.views} />
          </Canvas>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §7 */}
      <Section id="s7">
        <Kicker>§7 · Click “See more”</Kicker>
        <SectionHead title="A click on “See more” scrolls, like the arrow" />
        <p>The pointer moves from the arrow up onto the label and clicks: the strip scrolls</p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <Canvas padding={LABEL_ROOM}>
            <SeeMoreClickLoop views={hoodie.views} />
          </Canvas>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §8 */}
      <Section id="s8">
        <Kicker>§8 · Behind the arrow</Kicker>
        <SectionHead title="The view behind the arrow takes no hover and no click" />
        <p>
          In the marked area — from the strip&rsquo;s end to the arrow&rsquo;s inner edge — only
          the arrow reacts
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <StateCell label="dashed red: no hover, no click on the views there">
            <div className="w-full">
              <Canvas padding={LABEL_ROOM}>
                <BlockedEnds views={hoodie.views} />
              </Canvas>
            </div>
          </StateCell>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §9 */}
      <Section id="s9">
        <Kicker>§9 · Resting pointer</Kicker>
        <SectionHead title="After a scroll, the view under the pointer is hovered" />
        <p>
          Click the arrow: the strip scrolls and the arrow goes. The view that arrives under the
          pointer is hovered right away
        </p>
        <Demo padding="p-3.5" className="overflow-visible">
          <Canvas padding={PREVIEW_ROOM}>
            <ArrowClickHoverLoop views={hoodie.views} />
          </Canvas>
        </Demo>
      </Section>

      <HandoffEnd />
    </HandoffShell>
  )
}
