"use client"

/**
 * /handoff/canvas-bottom-row — desktop's canvas controls merged into one row:
 * zoom, product views and print technique.
 *
 * Every demo is the shipping component from components/merged-bottom-row.tsx,
 * fed real catalogue products, so the spec cannot drift from the prototype.
 * States that need a hover or a click are held open with the components' own
 * pinning props (ViewStrip's pinnedHoverId, TechniqueSwitcher's pinnedOpen).
 */

import { useEffect, useState } from "react"
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
  type NavItem,
} from "@/components/handoff/handoff-ui"
import {
  MergedBottomRow,
  TechniqueSwitcher,
  ViewStrip,
  ZoomControl,
  type MergedRowView,
} from "@/components/merged-bottom-row"
import { ParkedCursor } from "@/components/handoff/rail-replica"
import { loadCatalog } from "@/lib/catalog"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

/** The designer's zoom range, as components/designer.tsx sets it. */
const MAX_ZOOM = 15

const TSHIRT_ID = "812" // Men's Premium Organic T-Shirt — the designer's default
const HOODIE_ID = "20" // Men's Premium Organic Hoodie — 8 views, so it overflows
const UNISEX_HOODIE_ID = "1047" // Unisex Hoodie — has a Close-up view

const NAV: NavItem[] = [
  { id: "brief", mark: "◆", label: "Problem & Hypotheses" },
  { id: "live", mark: "◉", label: "One row" },
  { id: "s1", mark: "§1", label: "Zoom" },
  { id: "s2", mark: "§2", label: "Product views" },
  { id: "s3", mark: "§3", label: "Print technique" },
  { id: "s4", mark: "§4", label: "Print technique, static" },
]

const noop = () => {}

/* ------------------------------------------------------------------- data */

type Product = { name: string; views: MergedRowView[]; embroidery: boolean }

const EMPTY: Product = { name: "", views: [], embroidery: true }

/**
 * A catalogue product's views as the row takes them, in black where the
 * product comes in it. The thumbnails are the plain product shots — no design
 * on them, which is all these demos need.
 */
function useProductViews(id: string): Product {
  const [product, setProduct] = useState<Product>(EMPTY)
  useEffect(() => {
    let live = true
    loadCatalog()
      .then(catalog => {
        const p = catalog.products.find(x => x.id === id)
        if (!p || !live) return
        const appearance =
          p.appearances.find(a => a.name.trim().toLowerCase() === "black") ?? p.appearances[0]
        setProduct({
          name: p.name,
          embroidery: !!p.embroidery,
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
  }, [id])
  return product
}

/* ------------------------------------------------------------------ demos */

/** The whole row on a canvas, live: zoom, pick a view, switch technique. */
function LiveRow({
  product,
  staticTechnique = false,
}: {
  product: Product
  /** The technique named, not switchable — standard print (§4). */
  staticTechnique?: boolean
}) {
  const [zoom, setZoom] = useState(1)
  const [viewId, setViewId] = useState<string | null>(null)
  // Embroidery to start with: the shorter label keeps the row's two sides closer in width.
  const [technique, setTechnique] = useState<"standard" | "embroidery">(
    staticTechnique ? "standard" : "embroidery"
  )
  const activeId = viewId ?? product.views[0]?.id ?? null
  const active = product.views.find(v => v.id === activeId)
  // The designer's zoom stops, as + and − step through them.
  const stops = [1, 5, 10, MAX_ZOOM]
  const step = (dir: 1 | -1) => {
    const i = stops.findIndex(s => s >= zoom - 0.001)
    setZoom(stops[Math.min(stops.length - 1, Math.max(0, i + dir))])
  }
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[12px] bg-[#F4F4F4]">
      <div className="absolute inset-x-0 top-6 bottom-[104px] flex items-center justify-center">
        {active && <div className="size-[280px]">{active.thumb(280)}</div>}
      </div>
      <MergedBottomRow
        zoom={zoom}
        maxZoom={MAX_ZOOM}
        onZoomStep={step}
        onZoomChange={setZoom}
        onZoomJump={setZoom}
        views={product.views}
        activeViewId={activeId}
        onSelectView={setViewId}
        printTechnique={technique}
        onPrintTechnique={setTechnique}
        embroiderySupported={product.embroidery}
        staticTechnique={staticTechnique}
      />
    </div>
  )
}

/**
 * A patch of canvas: the controls are white pills meant for the designer's
 * #F4F4F4 canvas, and on the document's white they would all but disappear.
 */
function Canvas({ children, padding }: { children: React.ReactNode; padding: string }) {
  return (
    <div className={`flex justify-center rounded-[12px] bg-[#F4F4F4] ${padding}`}>{children}</div>
  )
}

/** One state, labelled underneath. */
function StateCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {children}
      <span className="font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
        {label}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------- page */

export default function CanvasBottomRow() {
  const tshirt = useProductViews(TSHIRT_ID)
  const hoodie = useProductViews(HOODIE_ID)
  const front = tshirt.views[0]?.id ?? null
  const back = tshirt.views[1]?.id
  // The two photo views, for §2's circle rule.
  const unisexHoodie = useProductViews(UNISEX_HOODIE_ID)
  const neckLabel = tshirt.views.find(v => /neck label/i.test(v.name))
  const closeUp = unisexHoodie.views.find(v => /close-?up/i.test(v.name))

  return (
    <HandoffShell
      slug="canvas-bottom-row"
      items={NAV}
      links={[
        { label: "Prototype", href: PROTOTYPE },
        { label: "Repo", href: REPO },
      ]}
    >
      <HandoffHeader
        title="Canvas controls, in one row"
        actions={[
          { label: "See prototype", href: PROTOTYPE },
          { label: "See repo", href: REPO, ghost: true },
        ]}
      />

      {/* ----------------------------------------------------------- brief */}
      <Section id="brief" first>
        <Brief>
          <BriefCard tone="problem" label="Problem">
            <ul>
              <li>
                On desktop the canvas controls are scattered: the zoom stands upright in the
                bottom-left corner, the product views sit at the bottom centre — each in its own
                shape and style.
              </li>
              <li>
                Print technique has no place. Squeezed in at the bottom, it pulls the eye to the
                corners, away from the design.
              </li>
              <li>
                The product views have no width limit. On a product with many views they run into
                the controls beside them and overlap.
              </li>
            </ul>
          </BriefCard>
          <BriefCard tone="hypothesis" label="Hypothesis">
            We believe one row, in one style, centred under the design calms the canvas and gives
            print technique a natural home — so users find and switch it without being pulled away
            from designing.
          </BriefCard>
          <BriefCard tone="win" label="What win looks like">
            <ul>
              <li>
                More people switch to embroidery, and more embroidery orders come from it — with no
                drop in zoom or view switching.
              </li>
            </ul>
          </BriefCard>
          <BriefCard tone="result" label="Result">
            Will follow.
          </BriefCard>
        </Brief>
      </Section>

      {/* ------------------------------------------------------------ live */}
      <Section id="live">
        <SectionHead title="One row - zoom, product views, print technique" />
        <p>Live: zoom, pick a view, switch the technique</p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <div className="min-w-[600px]">
            <LiveRow product={tshirt} />
          </div>
        </Demo>
        <Note>
          The product views are centred on the canvas, not on the row. Zoom and print technique
          sit 12px either side of them, whatever their widths.
        </Note>
      </Section>

      {/* -------------------------------------------------------------- §1 */}
      <Section id="s1">
        <Kicker>§1 · Zoom</Kicker>
        <SectionHead title="Zoom - minus, percentage, plus" />
        <p>0% fitted, 100% at the closest zoom. A button that can&rsquo;t act is greyed out</p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <Canvas padding="gap-10 px-6 py-[46px]">
            <StateCell label="fitted">
              <ZoomControl zoom={1} maxZoom={MAX_ZOOM} onStep={noop} onChange={noop} onJump={noop} />
            </StateCell>
            <StateCell label="zoomed in">
              <ZoomControl zoom={5} maxZoom={MAX_ZOOM} onStep={noop} onChange={noop} onJump={noop} />
            </StateCell>
            <StateCell label="closest">
              <ZoomControl
                zoom={MAX_ZOOM}
                maxZoom={MAX_ZOOM}
                onStep={noop}
                onChange={noop}
                onJump={noop}
              />
            </StateCell>
          </Canvas>
        </Demo>
        <Note>The zoom slider is removed.</Note>
      </Section>

      {/* -------------------------------------------------------------- §2 */}
      <Section id="s2">
        <Kicker>§2 · Product views</Kicker>
        <SectionHead title="Product views - circles, preview on hover" />
        <p>Selected, hovered with its preview, and default</p>
        {/* Room above the strip for the preview, which opens upward. The §2
            frames don't clip (overflow-visible, not -auto), so a preview never
            gets cut by its frame. */}
        <Demo padding="p-3.5" className="overflow-visible">
          <Canvas padding="px-6 pt-[260px] pb-[46px]">
            <div className="relative">
              <ViewStrip
                views={tshirt.views}
                activeViewId={front}
                onSelect={noop}
                pinnedHoverId={back}
              />
              {/* The held hover drawn in: the hand, as the tile is a button.
                  Its tip on the second tile — 6px strip padding, one 44px tile
                  and a 2px gap, then half a tile in. */}
              <ParkedCursor hand className="top-[30px] left-[76px]" />
            </div>
          </Canvas>
        </Demo>
        <p className="ho-caption">
          Max width 264px - room for 5½ views. Fewer views shrink it, more scroll
        </p>
        <Demo padding="p-3.5" className="overflow-visible">
          <Canvas padding="px-6 pt-[260px] pb-[46px]">
            <LiveStrip views={hoodie.views} />
          </Canvas>
        </Demo>
        <p className="ho-caption">Neck label and close-up photos are cut to a circle</p>
        <Demo padding="p-3.5" className="overflow-visible">
          <Canvas padding="gap-10 px-6 py-[46px]">
            <StateCell label="neck label">
              {neckLabel && <ViewStrip views={[neckLabel]} activeViewId={null} onSelect={noop} />}
            </StateCell>
            <StateCell label="close-up">
              {closeUp && <ViewStrip views={[closeUp]} activeViewId={null} onSelect={noop} />}
            </StateCell>
          </Canvas>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §3 */}
      <Section id="s3">
        <Kicker>§3 · Print technique</Kicker>
        <SectionHead title="Print technique - dropdown with icons" />
        <p>Opens upward, the current one ticked</p>
        {/* Room above the button for the menu. */}
        <Demo padding="p-3.5" className="overflow-x-auto">
          <Canvas padding="px-6 pt-[150px] pb-[46px]">
            <TechniqueSwitcher value="standard" onChange={noop} embroiderySupported pinnedOpen />
          </Canvas>
        </Demo>
        <Note>
          Show the button from the start, also with nothing on the product. Today it only appears
          once something is added: the available techniques are fetched only for views that
          already carry a design. Fetch them for the product&rsquo;s views instead.
        </Note>
        <p className="ho-caption">Product without embroidery</p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <Canvas padding="px-6 pt-[170px] pb-[46px]">
            <TechniqueSwitcher
              value="standard"
              onChange={noop}
              embroiderySupported={false}
              pinnedOpen
            />
          </Canvas>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §4 */}
      <Section id="s4">
        <Kicker>§4 · Print technique, static</Kicker>
        <SectionHead title="Print technique - static, name and icon" />
        <p>Not a dropdown: it only names the current technique</p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <div className="min-w-[600px]">
            <LiveRow product={tshirt} staticTechnique />
          </div>
        </Demo>
      </Section>

      <HandoffEnd />
    </HandoffShell>
  )
}

/** A strip you can scroll and pick in, the hoodie's 8 views. */
function LiveStrip({ views }: { views: MergedRowView[] }) {
  const [active, setActive] = useState<string | null>(null)
  return (
    <ViewStrip views={views} activeViewId={active ?? views[0]?.id ?? null} onSelect={setActive} />
  )
}
