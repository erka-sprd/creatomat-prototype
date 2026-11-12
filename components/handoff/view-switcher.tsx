"use client"

/**
 * /handoff/view-switcher — the desktop views strip's label: the active view's
 * name in a pill that cuts into the strip, follows the selected and the
 * hovered view, and stays at the strip's end when its view is scrolled away.
 *
 * Every demo is the shipping ViewStrip from components/merged-bottom-row.tsx,
 * fed a real catalogue product. What is faked:
 * - the scripted demos drive it from outside — the selected view, the held
 *   hover (pinnedHoverId) and the strip's scroll position on a timer;
 * - the hover demo's cursor is drawn;
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
import { loadCatalog } from "@/lib/catalog"

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
 * §4 — the pointer resting in the gap after the second view, which stays
 * hovered. The arrow: the gap is not a button. Its spot is measured.
 */
function GapHover({ views }: { views: MergedRowView[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const hoveredId = views[1]?.id
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  useLayoutEffect(() => {
    const box = ref.current
    const tile = hoveredId && box?.querySelector<HTMLElement>(`[data-view-id="${hoveredId}"]`)
    const next = tile && (tile.nextElementSibling as HTMLElement | null)
    if (!box || !tile || !next) return
    const b = box.getBoundingClientRect()
    const t = tile.getBoundingClientRect()
    const n = next.getBoundingClientRect()
    setCursor({ x: (t.right + n.left) / 2 - b.left, y: t.top - b.top + t.height / 2 })
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
      {cursor && (
        <span className="absolute z-[120]" style={{ left: cursor.x, top: cursor.y }}>
          <ParkedCursor className="top-0 left-0" />
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
            <GapHover views={tshirt.views} />
          </Canvas>
        </Demo>
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
          sharp. Hover works as always.
        </Note>
      </Section>

      <HandoffEnd />
    </HandoffShell>
  )
}
