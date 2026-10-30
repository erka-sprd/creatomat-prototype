"use client"

/**
 * /handoff/zoom-slider — the desktop zoom dock: a press on the track eases the
 * handle there, + and − step through fixed stops, and every change eases.
 *
 * The slider is the shipping WedgeSlider; the dock around it is its markup from
 * components/designer.tsx, and the zoom is eased by the same rAF tween the
 * designer runs (animateZoomTo). Faked: the designer zooms its whole canvas —
 * here one catalogue shot stands in for it, scaled by the zoom.
 */

import { useEffect, useRef, useState } from "react"
import {
  Brief,
  BriefCard,
  Demo,
  HandoffEnd,
  HandoffHeader,
  HandoffShell,
  Kicker,
  Section,
  SectionHead,
  type NavItem,
} from "@/components/handoff/handoff-ui"
import { ZOOM_PRODUCT_COLOR, useProductViews } from "@/components/handoff/handoff-card-art"
import { CursorHand } from "@/components/handoff/rail-replica"
import KitSwitch from "@/components/kit-switch"
import { ZOOM_ICON_PATH } from "@/components/merged-bottom-row"
import { WedgeSlider } from "@/components/ui/editor-bar/WedgeSlider"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

const TSHIRT_ID = "812" // Men's Premium Organic T-Shirt — the designer's default

/** The designer's zoom range and its + / − stops, as components/designer.tsx sets them. */
const MAX_ZOOM = 15
const ZOOM_STOPS = [1, 5, 10, MAX_ZOOM] as const
/** How long a zoom change eases for — the designer's animateZoomTo. */
const ZOOM_EASE_MS = 260

const NAV: NavItem[] = [
  { id: "brief", mark: "◆", label: "Problem & Hypotheses" },
  { id: "s1", mark: "1", label: "Click to jump" },
  { id: "s2", mark: "2", label: "Stops, eased" },
]

/* ------------------------------------------------------------------- zoom */

/**
 * The designer's zoom state: the value itself is tweened with rAF, so the
 * handle and the canvas move together, and a drag takes over mid-glide.
 */
function useEasedZoom() {
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(zoom)
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])
  const cancel = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }
  useEffect(() => cancel, [])

  const animateTo = (target: number) => {
    cancel()
    const start = zoomRef.current
    if (Math.abs(target - start) < 0.001) return
    const startTime = performance.now()
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / ZOOM_EASE_MS)
      setZoom(Math.round((start + (target - start) * easeOutCubic(t)) * 100) / 100)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        setZoom(target)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  // A drag sets the value directly, 1:1 with the pointer.
  const set = (value: number) => {
    cancel()
    setZoom(value)
  }
  const step = (dir: 1 | -1) => {
    const cur = zoomRef.current
    const target =
      dir === 1
        ? (ZOOM_STOPS.find(s => s > cur + 0.001) ?? ZOOM_STOPS[ZOOM_STOPS.length - 1])
        : ([...ZOOM_STOPS].reverse().find(s => s < cur - 0.001) ?? ZOOM_STOPS[0])
    animateTo(target)
  }
  return { zoom, set, animateTo, step }
}

const ZOOM_BUTTON =
  "flex h-9 w-9 -m-1 cursor-pointer items-center justify-center rounded-full text-black transition-colors duration-300 hover:bg-neutral-100"
const ZOOM_TOOLTIP =
  "pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-md bg-neutral-900 p-3 text-sm whitespace-nowrap text-neutral-100 shadow-sm opacity-0 transition-opacity group-hover/tooltip:opacity-100 before:absolute before:top-1/2 before:right-full before:h-0 before:w-0 before:-translate-y-1/2 before:border-y-[4px] before:border-y-transparent before:border-r-[4px] before:border-r-neutral-900 before:content-['']"

/**
 * The zoom dock as the designer draws it: a 48px white pill, plus on top, the
 * slider lying on its side, minus at the bottom. `pressed` paints a button's
 * hover grey for the walkthrough's click, which no pointer delivers.
 */
function ZoomDock({
  zoom,
  onChange,
  onJump,
  onStep,
  pressed = null,
}: {
  zoom: number
  onChange: (value: number) => void
  onJump: (value: number) => void
  onStep: (dir: 1 | -1) => void
  pressed?: 1 | -1 | null
}) {
  const button = (dir: 1 | -1) => (
    <div className="group/tooltip relative flex">
      <button
        type="button"
        aria-label={dir === 1 ? "Zoom in" : "Zoom out"}
        data-demo={dir === 1 ? "zoom-in" : "zoom-out"}
        onClick={() => onStep(dir)}
        className={`${ZOOM_BUTTON} ${pressed === dir ? "bg-neutral-100" : ""}`}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d={dir === 1 ? ZOOM_ICON_PATH.plus : ZOOM_ICON_PATH.minus}
          />
        </svg>
      </button>
      <span className={ZOOM_TOOLTIP}>{dir === 1 ? "Zoom in" : "Zoom out"}</span>
    </div>
  )
  return (
    <div className="absolute bottom-6 left-6 z-[5] flex w-[48px] flex-col items-center gap-1 rounded-full bg-white py-2.5 shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105">
      {button(1)}
      {/* Container stays 96px (h-24) so the frame height is unchanged; the
          slider itself is 8px shorter and centred, leaving a 4px gap at each
          end between the slider and the +/- buttons' (enlarged) hit areas. */}
      <div className="flex h-24 w-6 items-center justify-center">
        <div className="-rotate-90">
          <WedgeSlider
            min={1}
            max={MAX_ZOOM}
            value={zoom}
            onChange={onChange}
            width={88}
            jumpOnTrackClick
            // Track-clicks ease to the pressed point with the same rAF tween
            // as the +/- stops, so the canvas and thumb move together.
            onJump={onJump}
          />
        </div>
      </div>
      {button(-1)}
    </div>
  )
}

/** A patch of canvas with the product on it, scaled by the zoom, and the dock in its corner. */
function Stage({
  zoom,
  image,
  children,
  className = "",
}: {
  zoom: number
  image: string | undefined
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative h-[380px] w-full overflow-hidden rounded-[12px] bg-[#F4F4F4] ${className}`}
    >
      {image && (
        <img
          src={image}
          alt=""
          draggable={false}
          className="absolute top-1/2 left-1/2 size-[260px] -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{ scale: zoom }}
        />
      )}
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ demos */

/** §1 — the dock, live: press the track, grab the handle, drag, step. */
function LiveZoom({ image }: { image: string | undefined }) {
  const { zoom, set, animateTo, step } = useEasedZoom()
  return (
    <Stage zoom={zoom} image={image}>
      <ZoomDock zoom={zoom} onChange={set} onJump={animateTo} onStep={step} />
    </Stage>
  )
}

/** One beat of the §2 playback. */
type Beat = { at: number; act: string }

// ~14s: the hand arrives on plus and presses it through every stop, with a
// beat of stillness on each so a reader can watch the ease; then on minus,
// back down the same way, and leaves.
const WALKTHROUGH: Beat[] = [
  { at: 0, act: "reset" },
  { at: 800, act: "point:in" },
  { at: 2000, act: "click:in" },
  { at: 3600, act: "click:in" },
  { at: 5200, act: "click:in" },
  { at: 6800, act: "point:out" },
  { at: 8000, act: "click:out" },
  { at: 9600, act: "click:out" },
  { at: 11200, act: "click:out" },
  { at: 12800, act: "leave" },
]
const WALKTHROUGH_CYCLE = 14200
/** How long a scripted press shows on the button. */
const CLICK_MS = 220

/**
 * §2 — the dock driven by a script: a drawn hand presses + and −, the handle
 * eases from stop to stop and the product with it. The hand's targets are
 * measured from the buttons at runtime, so a padding change can't strand it.
 */
function SteppedZoom({ image }: { image: string | undefined }) {
  const [autoPlay, setAutoPlay] = useState(true)
  const { zoom, set, animateTo, step } = useEasedZoom()
  const stageRef = useRef<HTMLDivElement>(null)
  const [cursor, setCursor] = useState<{ x: number; y: number; shown: boolean }>({
    x: 0,
    y: 0,
    shown: false,
  })
  const [clicking, setClicking] = useState(false)
  const [pressed, setPressed] = useState<1 | -1 | null>(null)

  useEffect(() => {
    if (!autoPlay) return
    const timers: number[] = []
    const stage = stageRef.current
    const pointAt = (which: "zoom-in" | "zoom-out") => {
      const target = stage?.querySelector<HTMLElement>(`[data-demo="${which}"]`)
      if (!stage || !target) return
      const s = stage.getBoundingClientRect()
      const r = target.getBoundingClientRect()
      setCursor({ x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2, shown: true })
    }
    const act = (what: string) => {
      switch (what) {
        case "reset":
          set(1)
          setCursor(c => ({ ...c, shown: false }))
          break
        case "point:in":
          pointAt("zoom-in")
          break
        case "point:out":
          pointAt("zoom-out")
          break
        case "click:in":
        case "click:out": {
          const dir = what === "click:in" ? 1 : -1
          setClicking(true)
          setPressed(dir)
          step(dir)
          timers.push(
            window.setTimeout(() => {
              setClicking(false)
              setPressed(null)
            }, CLICK_MS)
          )
          break
        }
        case "leave":
          setCursor(c => ({ ...c, shown: false }))
          break
      }
    }
    const cycle = () => {
      for (const beat of WALKTHROUGH) timers.push(window.setTimeout(() => act(beat.act), beat.at))
      timers.push(window.setTimeout(cycle, WALKTHROUGH_CYCLE))
    }
    cycle()
    return () => timers.forEach(clearTimeout)
    // The zoom helpers are stable for the stage's life; only the switch restarts it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay])

  return (
    <div className="flex flex-col items-center">
      {/* The one control on the page a reader operates, so it uses the kit's
          own switch rather than document chrome. Above the demo: it has to be
          reachable before the thing it governs has scrolled past. */}
      <div className="mb-8 rounded-full bg-[var(--ho-ground)] py-2 pr-2 pl-4">
        <KitSwitch
          checked={autoPlay}
          onChange={setAutoPlay}
          label="Auto play"
          size="m"
          className="gap-4"
        />
      </div>
      <div ref={stageRef} className="w-full [&_*]:pointer-events-none">
        <Stage zoom={zoom} image={image}>
          <ZoomDock
            zoom={zoom}
            onChange={set}
            onJump={animateTo}
            onStep={step}
            pressed={pressed}
          />
          {/* The hand: its fingertip (11,3 in the glyph's box) is what lands
              on the button, and it eases between targets like a real pointer. */}
          <div
            aria-hidden
            className={`absolute top-0 left-0 z-[60] transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              cursor.shown ? "opacity-100" : "opacity-0"
            }`}
            style={{ translate: `${cursor.x - 11}px ${cursor.y - 3}px` }}
          >
            <div
              className={`origin-[11px_3px] transition-[scale] duration-150 ${clicking ? "scale-[0.82]" : "scale-100"}`}
            >
              <CursorHand />
            </div>
          </div>
        </Stage>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- page */

export default function ZoomSlider() {
  const [front] = useProductViews(TSHIRT_ID, ZOOM_PRODUCT_COLOR)

  return (
    <HandoffShell
      slug="zoom-slider"
      items={NAV}
      links={[
        { label: "Prototype", href: PROTOTYPE },
        { label: "Repo", href: REPO },
      ]}
    >
      <HandoffHeader
        title="Zoom slider, under control"
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
                The zoom handle is a native range input: a press anywhere on the track throws it
                there, so grabbing it by its edge nudges the zoom before the drag has begun.
              </li>
              <li>
                The + and − buttons creep the zoom by small amounts instead of taking it to a
                useful level.
              </li>
              <li>The canvas snaps to each new level rather than easing into it.</li>
            </ul>
          </BriefCard>
          <BriefCard tone="hypothesis" label="Hypothesis">
            We believe a handle that is grabbed where it is, a track that takes a press as a
            destination, buttons that step between fixed stops and a zoom that eases make the
            control feel deliberate — so users zoom in to work on detail instead of fighting the
            slider.
          </BriefCard>
          <BriefCard tone="win" label="What win looks like">
            <ul>
              <li>More zooming in while designing, and fewer abandoned designs on desktop.</li>
            </ul>
          </BriefCard>
          <BriefCard tone="result" label="Result">
            Will follow.
          </BriefCard>
        </Brief>
      </Section>

      {/* -------------------------------------------------------------- §1 */}
      <Section id="s1">
        <Kicker>§1 · Click to jump</Kicker>
        <SectionHead title="Press the track to jump, press the handle to grab" />
        <p>
          A press on bare track eases the handle there and the drag continues from it; a press on
          the handle only ever follows the drag
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <div className="min-w-[480px]">
            <LiveZoom image={front} />
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §2 */}
      <Section id="s2">
        <Kicker>§2 · Stops, eased</Kicker>
        <SectionHead title="Plus and minus step between fixed stops" />
        <p>
          From fitted, + goes to the next stop and − back to the one before; the handle and the
          canvas ease there together, never snapping
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <div className="min-w-[480px]">
            <SteppedZoom image={front} />
          </div>
        </Demo>
      </Section>

      <HandoffEnd />
    </HandoffShell>
  )
}
