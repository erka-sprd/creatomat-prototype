"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

import { EmbroiderySolutions } from "@/components/embroidery-solutions"
import { KitButton } from "@/components/kit-button"

// Replica of create-omat's EmbroideryLabel (src/components/designer/EmbroideryLabel.tsx):
// the vertical "EMBROIDERY" watermark on the right edge of the canvas, marking the
// designer as being in embroidery mode, and the "Creating preview" status pill shown
// while the stitched render is being generated.
//
// Unlike create-omat, nothing parks in the bottom-right corner here (the print-
// technique selector is gated off), so the label sits at the bottom with the same
// 24px it keeps from the right edge: from the canvas bottom on desktop, and below
// the dlg breakpoint from the top of the dock's buttons (8px dock gap + 70px
// button + 24px = 102px above the screen bottom).

// create-omat Icon-set "embroidery" glyph, inlined at its 16px / currentColor defaults.
const EmbroideryIcon = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M11.4753 1.42382C11.8753 1.39757 12.2764 1.4541 12.6536 1.58984C13.0309 1.72557 13.3764 1.93712 13.668 2.21224C13.9596 2.48738 14.1915 2.82007 14.3489 3.1888C14.5063 3.55744 14.5856 3.95465 14.5827 4.35546C14.5797 4.75638 14.4942 5.15252 14.3314 5.51888C14.1685 5.88522 13.9317 6.21424 13.6361 6.48502C13.6278 6.49259 13.6194 6.50007 13.6107 6.50716C10.0833 9.37971 7.37156 11.4874 5.48111 12.8236C4.53906 13.4894 3.78333 13.9758 3.2246 14.2695C2.94924 14.4143 2.69194 14.5286 2.46809 14.5866C2.35657 14.6154 2.22235 14.6384 2.08267 14.6289C1.94021 14.6192 1.74676 14.5715 1.58788 14.4128C1.43026 14.2551 1.38142 14.0631 1.37108 13.9206C1.361 13.7811 1.38375 13.6471 1.4121 13.5358C1.46899 13.3126 1.58165 13.0565 1.7246 12.7832C2.01478 12.2284 2.49582 11.4791 3.15429 10.5456C4.47575 8.67211 6.56133 5.98558 9.40429 2.49218C9.65744 2.18129 9.97249 1.92607 10.3288 1.74218C10.685 1.55836 11.0753 1.45008 11.4753 1.42382ZM11.5514 2.58789C11.3116 2.60366 11.0775 2.66845 10.8639 2.77864C10.7035 2.86143 10.5569 2.96865 10.4297 3.0957L10.3092 3.22916C7.47028 6.71765 5.40492 9.37859 4.10741 11.2181C3.53423 12.0307 3.12044 12.6694 2.85676 13.1413C3.33401 12.8741 3.98188 12.4538 4.80728 11.8704C6.66099 10.5603 9.3417 8.4777 12.8555 5.61653C13.0292 5.45545 13.1693 5.26147 13.2656 5.04492C13.3633 4.82515 13.4142 4.5875 13.416 4.347C13.4178 4.10645 13.3698 3.86772 13.2754 3.64648C13.1809 3.42541 13.042 3.22617 12.8672 3.06119C12.6922 2.89611 12.4848 2.76894 12.2585 2.6875C12.0322 2.6061 11.7914 2.57214 11.5514 2.58789Z"
      fill="currentColor"
    />
    <path
      d="M11.254 3.92057C11.4818 3.69277 11.8517 3.69277 12.0795 3.92057C12.3074 4.14838 12.3074 4.51829 12.0795 4.74609L11.4129 5.41276C11.1851 5.64057 10.8152 5.64057 10.5874 5.41276C10.3596 5.18495 10.3596 4.81504 10.5874 4.58724L11.254 3.92057Z"
      fill="currentColor"
    />
    <path
      d="M6.0835 3.33333C6.0835 2.91333 6.18758 2.43057 6.51058 2.04297C6.84918 1.63681 7.36002 1.41666 8.00016 1.41666C8.69972 1.41666 9.27603 1.73758 9.84001 2.22526C10.392 2.7026 11.0062 3.40675 11.7723 4.28255C11.9844 4.52498 11.96 4.89333 11.7176 5.10547C11.4752 5.31754 11.1068 5.29312 10.8947 5.05078C10.1056 4.14872 9.55277 3.51954 9.07699 3.10807C8.61317 2.70698 8.30055 2.58333 8.00016 2.58333C7.64044 2.58333 7.48448 2.69668 7.40641 2.79036C7.31287 2.90278 7.25016 3.08685 7.25016 3.33333C7.25016 3.81173 7.49977 4.37014 7.96761 5.02018C8.4296 5.66206 9.03446 6.30236 9.63623 6.95703C10.2156 7.58732 10.8132 8.25188 11.161 8.88541C11.3376 9.20731 11.4748 9.56483 11.491 9.93945C11.5081 10.3335 11.3892 10.7109 11.1154 11.0397C10.6254 11.6281 9.88782 11.8761 9.14209 11.9525C8.39 12.0294 7.54383 11.9422 6.71891 11.7773C6.4032 11.7141 6.19822 11.4069 6.26123 11.0911C6.32436 10.7752 6.63216 10.5703 6.94808 10.6335C7.7143 10.7866 8.43299 10.8521 9.0236 10.7917C9.62062 10.7305 10.005 10.5499 10.2189 10.293C10.3048 10.1898 10.3304 10.0972 10.3257 9.98958C10.3201 9.86215 10.2689 9.68486 10.1382 9.44661C9.87094 8.9598 9.37807 8.39946 8.77751 7.74609C8.19924 7.11698 7.53407 6.41466 7.021 5.70182C6.5138 4.99713 6.0835 4.18823 6.0835 3.33333Z"
      fill="currentColor"
    />
    <path
      d="M0.75 8C0.75 7.67783 1.01117 7.41666 1.33333 7.41666C1.6555 7.41666 1.91667 7.67783 1.91667 8C1.91667 8.20841 2.10308 8.5323 2.5918 8.91666C3.04443 9.2726 3.61646 9.56879 4.04557 9.74284C4.34391 9.86403 4.48759 10.2042 4.36654 10.5026C4.24546 10.8011 3.90527 10.9452 3.60677 10.8242C3.10727 10.6216 2.43259 10.2755 1.87109 9.83398C1.34582 9.42092 0.75 8.79155 0.75 8Z"
      fill="currentColor"
    />
    <path
      d="M12.5874 5.92057C12.8152 5.69277 13.1851 5.69277 13.4129 5.92057L14.4129 6.92057C14.6407 7.14838 14.6407 7.51829 14.4129 7.74609C14.1851 7.9739 13.8152 7.9739 13.5874 7.74609L12.5874 6.74609C12.3596 6.51829 12.3596 6.14838 12.5874 5.92057Z"
      fill="currentColor"
    />
  </svg>
)

// Spot shared by the status pill and the size badge: top of the canvas, below
// the mobile action header (top-17), or on desktop vertically centred in the
// row the editor bar (48px) and the Contact/Share pills (46px) occupy from 24px
// down. The slot does the placing; the pill inside drops in from above and
// retracts the same way, so the two transforms don't fight.
//
// `stack` slides the slot down to sit 8px under whatever holds the spot above
// it, and back up when that goes — all on the same 300ms ease:
// - "editor-bar": while an element is selected the bar takes the top of the
//   canvas (create-omat docks its status pill under the bar the same way). The
//   bar spans 32–80px on mobile and 24–72px on desktop; the 30px badge rests at
//   68px and 33px, so it travels 20px and 47px.
// - "loader": while "Creating preview" (38px) holds the spot. It spans 68–106px
//   on mobile and 29–67px on desktop, so the badge travels 46px and 42px.
// `offsetPx` stacks it further down, under other badges in the spot.
export type CanvasStatusStack = "editor-bar" | "loader"

// [mobile, desktop] px.
const STACK_PX: Record<CanvasStatusStack, [number, number]> = {
  "editor-bar": [20, 47],
  loader: [46, 42],
}

// `concealed` hides it on the spot (no retract) — while the thin-line help
// popover is open, a sharp copy of the warning sits on top and this would only
// show through as a blurred ghost.
// `shakeSignal`: a counter that goes up each time add to basket is refused;
// each increase shakes the badge once (.embroidery-shake), by remounting the
// wrapper on a new key. Only an increase does — a badge that appears, hides
// or changes message never shakes on its own.
function useShakes(shakeSignal: number) {
  const [shakes, setShakes] = useState(0)
  const lastSignal = useRef(shakeSignal)
  useEffect(() => {
    if (shakeSignal > lastSignal.current) setShakes(n => n + 1)
    lastSignal.current = shakeSignal
  }, [shakeSignal])
  return shakes
}

function CanvasStatusSlot({
  children,
  stack = null,
  offsetPx = 0,
  concealed = false,
  shakeSignal = 0,
  className = "",
}: {
  children: ReactNode
  stack?: CanvasStatusStack | null
  offsetPx?: number
  concealed?: boolean
  shakeSignal?: number
  className?: string
}) {
  const [mobile, desktop] = stack ? STACK_PX[stack] : [0, 0]
  const extra = offsetPx
  const shakes = useShakes(shakeSignal)
  return (
    <div
      className={
        "pointer-events-none absolute top-17 left-1/2 z-4 flex -translate-x-1/2 translate-y-(--slot-y) items-center transition-transform duration-300 ease-out select-none dlg:top-6 dlg:h-12 dlg:translate-y-(--slot-y-dlg) " +
        className +
        (concealed ? " invisible" : "")
      }
      style={
        {
          "--slot-y": `${mobile + extra}px`,
          "--slot-y-dlg": `${desktop + extra}px`,
        } as CSSProperties
      }
    >
      <div key={shakes} className={shakes ? "embroidery-shake" : undefined}>
        {children}
      </div>
    </div>
  )
}

const PILL = "flex items-center rounded-full transition-all duration-300 ease-out "

const visibility = (show: boolean) =>
  show ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"

// The pill's two statements per language. create-omat already translates
// "creating-preview"; "Checking quality" has no key there yet, so those are
// placeholders. The prototype is English-only — `?lang=de|fi|es` swaps them in
// to check the fixed width and the font fit with longer languages.
type PreviewStatements = { creating: string; checking: string }
const PREVIEW_STATEMENTS: Record<string, PreviewStatements> = {
  en: { creating: "Creating preview...", checking: "Checking quality..." },
  de: { creating: "Vorschau erstellen...", checking: "Qualität wird geprüft..." },
  fi: { creating: "Esikatselun luominen...", checking: "Laatua tarkistetaan..." },
  es: { creating: "Creación de vista previa...", checking: "Comprobando la calidad..." },
}
export const PREVIEW_LANGS = Object.keys(PREVIEW_STATEMENTS)
// `fixed` overrides the URL's language (the handoff shows several side by side).
function usePreviewStatements(fixed?: string): PreviewStatements {
  const [lang, setLang] = useState("en")
  useEffect(() => {
    setLang(new URLSearchParams(window.location.search).get("lang") ?? "en")
  }, [])
  return PREVIEW_STATEMENTS[fixed ?? lang] ?? PREVIEW_STATEMENTS.en
}
// The pill's type size, and the least it may shrink to when the longer
// statement wouldn't fit the canvas otherwise (px).
const PREVIEW_STATUS_FONT_PX = 14
const PREVIEW_STATUS_MIN_FONT_PX = 10
// Kept clear between the pill and the canvas edges (px, both sides together).
const PREVIEW_STATUS_EDGE_PX = 32
// How the pill's time is shared: "Creating preview..." types in, holds and is
// deleted in the first 65%; "Checking quality..." types in during the rest.
const PREVIEW_STATUS_CREATING_SHARE = 0.65
// Within the first statement's share: the part spent typing and deleting it
// (half each, at one speed, as react-type-animation does); the rest it holds.
const CREATING_TYPING_SHARE = 0.75
// Within the second statement's share: the part spent typing it, so it rests
// complete for a moment before the pill retracts.
const CHECKING_TYPING_SHARE = 0.8

// The status text as typed, like create-omat's add-to-basket loader
// (AnimatedLoader, react-type-animation) — but timed to `durationMs`, the time
// the pill is sure to be up, so both statements make it in: the frames are
// laid out up front and each set at its own time from the start, so they
// don't drift. Restarts each time `active` turns on; kept as it is while it
// turns off, so the pill doesn't empty out as it retracts.
function typedPreviewStatusFrames(
  durationMs: number,
  { creating: first, checking: second }: PreviewStatements
): { at: number; text: string }[] {
  const creatingMs = durationMs * PREVIEW_STATUS_CREATING_SHARE
  const checkingMs = durationMs - creatingMs
  const firstCharMs = (creatingMs * CREATING_TYPING_SHARE) / (2 * first.length)
  const secondCharMs = (checkingMs * CHECKING_TYPING_SHARE) / second.length
  const frames: { at: number; text: string }[] = []
  for (let i = 1; i <= first.length; i++) {
    frames.push({ at: i * firstCharMs, text: first.slice(0, i) })
  }
  // Deleting ends exactly where the first share does.
  for (let i = first.length - 1; i >= 0; i--) {
    frames.push({ at: creatingMs - i * firstCharMs, text: first.slice(0, i) })
  }
  for (let i = 1; i <= second.length; i++) {
    frames.push({ at: creatingMs + i * secondCharMs, text: second.slice(0, i) })
  }
  return frames
}

function useTypedPreviewStatus(
  active: boolean,
  durationMs: number,
  statements: PreviewStatements
) {
  const [text, setText] = useState("")
  useEffect(() => {
    if (!active) return
    setText("")
    const timers = typedPreviewStatusFrames(durationMs, statements).map(frame =>
      window.setTimeout(() => setText(frame.text), frame.at)
    )
    return () => timers.forEach(t => window.clearTimeout(t))
  }, [active, durationMs, statements])
  return text
}

// The type size that lets the longer statement fit the canvas: full size where
// it does, scaled down (to PREVIEW_STATUS_MIN_FONT_PX at least) where it
// doesn't. Measured off the text grid, whose width the invisible full
// statements set; re-measured when the canvas resizes. Off (`enabled` false)
// for the docked pill, which has the desktop canvas's width and isn't in the
// slot the canvas lookup below expects.
function usePreviewStatusFontPx(
  pillRef: React.RefObject<HTMLDivElement | null>,
  sizerRef: React.RefObject<HTMLSpanElement | null>,
  statements: PreviewStatements,
  enabled = true
) {
  const [fontPx, setFontPx] = useState(PREVIEW_STATUS_FONT_PX)
  useLayoutEffect(() => {
    if (!enabled) return
    const pill = pillRef.current
    const sizer = sizerRef.current
    // The slot is absolute in the canvas, so the canvas is its offsetParent.
    const canvas = (pill?.offsetParent as HTMLElement | null)?.offsetParent as HTMLElement | null
    if (!pill || !sizer || !canvas) return
    const fit = () => {
      const pad = pill.offsetWidth - sizer.offsetWidth
      const room = canvas.clientWidth - PREVIEW_STATUS_EDGE_PX - pad
      // The sizer's width at full size: its current width undone by the
      // current scale.
      const current = parseFloat(getComputedStyle(sizer).fontSize) || PREVIEW_STATUS_FONT_PX
      const natural = (sizer.offsetWidth / current) * PREVIEW_STATUS_FONT_PX
      const next = Math.max(
        PREVIEW_STATUS_MIN_FONT_PX,
        Math.min(PREVIEW_STATUS_FONT_PX, (PREVIEW_STATUS_FONT_PX * room) / natural)
      )
      setFontPx(prev => (Math.abs(prev - next) < 0.1 ? prev : next))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [pillRef, sizerRef, statements, enabled])
  return fontPx
}

// create-omat's preview-generation status pill. create-omat also docks it under
// the editor bar while an element is selected; here the preview only renders
// once nothing is selected, so it appears as the editor bar leaves — at its own
// spot, without travelling there from the bar.
// Plain white, a short gradient line circling its border
// (.preview-status-ring); the status is typed in
// and out as on create-omat's add to basket (useTypedPreviewStatus). The pill
// is centred in its slot and the text centred in the pill, so it grows from
// the centre as letters arrive and shrinks back to it as they go.
// `durationMs`: the time the pill is sure to stay up (the designer's minimum
// loader time) — both statements are typed within it.
// `docked`: in the merged designer's bottom spot (desktop) instead of the top
// slot — placed by EmbroideryPreviewDock, rising in from below rather than
// dropping in. `className` goes on the top slot.
export function EmbroideryPreviewStatus({
  loading,
  durationMs,
  docked = false,
  className = "",
  lang,
}: {
  loading: boolean
  durationMs: number
  docked?: boolean
  className?: string
  /** One of PREVIEW_LANGS, in place of the URL's `?lang=`. */
  lang?: string
}) {
  const statements = usePreviewStatements(lang)
  const text = useTypedPreviewStatus(loading, durationMs, statements)
  const pillRef = useRef<HTMLDivElement>(null)
  const sizerRef = useRef<HTMLSpanElement>(null)
  const fontPx = usePreviewStatusFontPx(pillRef, sizerRef, statements, !docked)
  // Both statements in full, invisible, in the same grid cell as the typed
  // text: the cell takes the wider one's width, so the pill holds one width in
  // any language while the text is typed and deleted, centred, inside it.
  // The cursor's room is in both, so the last letter doesn't push it out.
  const sizer = (statement: string) => (
    <span aria-hidden="true" className="invisible [grid-area:1/1]">
      {statement}|
    </span>
  )
  // Typing the second statement once the text can only be its start.
  const checking =
    text.length > 0 && statements.checking.startsWith(text) && !statements.creating.startsWith(text)
  const pill = (
      <div
        ref={pillRef}
        role="status"
        aria-hidden={!loading}
        aria-label={checking ? statements.checking : statements.creating}
        className={
          PILL +
          "preview-status-ring border border-white bg-white px-4 py-2.5 text-black " +
          (docked
            ? loading
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0"
            : visibility(loading))
        }
      >
        <span aria-hidden="true" className="preview-status-glow" />
        <span
          ref={sizerRef}
          className="grid leading-none font-semibold whitespace-nowrap"
          style={{ fontSize: fontPx }}
        >
          {sizer(statements.creating)}
          {sizer(statements.checking)}
          <span className="text-center [grid-area:1/1]">
            {text}
            {/* The typing cursor, as react-type-animation draws it. */}
            <span aria-hidden="true" className="animate-[curve-caret-blink_1s_infinite]">
              |
            </span>
          </span>
        </span>
      </div>
  )
  if (docked) return pill
  return <CanvasStatusSlot className={className}>{pill}</CanvasStatusSlot>
}

export type EmbroiderySizeStatus = "too-large" | "good" | "print-switched" | EmbroideryDesignIssue

// Problems with the design itself rather than its size — each warns with a
// "See options" row and blocks add to basket.
export type EmbroideryDesignIssue = "thin-line" | "too-complex"

const isDesignIssue = (status: EmbroiderySizeStatus): status is EmbroideryDesignIssue =>
  status === "thin-line" || status === "too-complex"

const SIZE_BADGE = {
  // Two tones brighter than the thin-line warning's orange (400/500 against
  // its 600/700).
  "too-large": {
    label: "Design too large for embroidery",
    icon: "!",
    frame: "border-[#FB923C] text-[#F97316]",
    dot: "bg-[#FB923C]",
  },
  good: {
    label: "Good design size for embroidery",
    icon: "✓",
    frame: "border-[#16A34A] text-[#15803D]",
    dot: "bg-[#16A34A]",
  },
  "print-switched": {
    label: "Switched to standard print",
    icon: "✓",
    frame: "border-[#16A34A] text-[#15803D]",
    dot: "bg-[#16A34A]",
  },
  "thin-line": {
    label: "Design has too thin lines for embroidery",
    icon: "!",
    frame: "border-[#EA580C] text-[#C2410C]",
    dot: "bg-[#EA580C]",
  },
  "too-complex": {
    label: "Design too complex for embroidery",
    icon: "!",
    frame: "border-[#EA580C] text-[#C2410C]",
    dot: "bg-[#EA580C]",
  },
} as const

// Shares the status pill's spot:
// - "too-large": the design is bigger than the product's hoop frame
//   (lib/embroidery-limits) — the prototype's stand-in for the decoration
//   service's DESIGN_TOO_LARGE.
// - "good": the design fits again after a too-large warning this session.
// - "print-switched": a design issue's "Switch to print" was taken — said
//   once, then the bottom row comes back.
// - "thin-line": the design's lines are too thin to stitch (mocked — the pink
//   cat graphic).
// - "too-complex": the design has too much detail to stitch — the stand-in for
//   DESIGN_TOO_COMPLEX (mocked — the mountain lake graphic).
// Whatever holds the spot above it, it stacks beneath (`stack`): the editor bar
// while an element is selected, "Creating preview" while the stitched render is
// made — then slides up into the spot once that leaves. `offsetPx` puts it
// further down, under other badges.
// The design-issue warnings carry the way to their options in the same frame
// (`onSeeOptions`).
export function EmbroiderySizeBadge({
  status,
  stack = null,
  offsetPx = 0,
  concealed = false,
  shakeSignal = 0,
  combination = false,
  onSeeOptions,
  onFitToSize,
  dockedOnDesktop = [],
}: {
  status: EmbroiderySizeStatus | null
  stack?: CanvasStatusStack | null
  offsetPx?: number
  concealed?: boolean
  shakeSignal?: number
  /** Several objects: too large reads as the combination being too large. */
  combination?: boolean
  onSeeOptions?: () => void
  onFitToSize?: () => void
  /**
   * Statuses EmbroideryIssueDock shows at the bottom on desktop instead — the
   * badge sits them out there, retracting included, so none flashes up here.
   */
  dockedOnDesktop?: EmbroiderySizeStatus[]
}) {
  // Keep the last message on screen while the badge retracts, so it doesn't
  // empty out mid-animation.
  const [shown, setShown] = useState<EmbroiderySizeStatus>(status ?? "too-large")
  if (status && status !== shown) setShown(status)
  const show = status !== null
  return (
    <CanvasStatusSlot
      stack={stack}
      offsetPx={offsetPx}
      concealed={concealed}
      shakeSignal={shakeSignal}
      className={dockedOnDesktop.includes(status ?? shown) ? "dlg:hidden" : ""}
    >
      {/* A one-line badge's 30px box: on desktop the slot centres its content
          in 48px, so a taller badge (a design issue with its standard-print
          switch) would grow upward into the editor bar. Held to 30px, it
          keeps the one-line badge's top and grows downward. */}
      <div className="flex h-[30px] flex-col items-center">
        <SizeBadgePill
          status={status ?? shown}
          hidden={!show}
          onSeeOptions={onSeeOptions}
          onFitToSize={onFitToSize}
          label={
            combination && (status ?? shown) === "too-large"
              ? "Combination of designs too large for embroidery"
              : undefined
          }
        />
      </div>
    </CanvasStatusSlot>
  )
}

// The embroidery badges at the bottom of the canvas (desktop, merged
// designer) — too large, good size again, and the design issues with their
// way to their options — in place of the bottom row: the two swap, the way the editor bar
// comes and goes — the row slides down out of the canvas, the warning slides
// up into its spot from below (the canvas clips both), and back the other way
// once the issue is gone. The one arriving waits SWAP_DELAY_MS, so the two
// pass rather than overlap. Kept mounted through its exit, holding the last
// warning so it doesn't empty out on the way down.
const DOCK_SLIDE_MS = 300
export const SWAP_DELAY_MS = 150

// A dock's presence: mounted from `show` until its exit slide is done,
// entered (in its spot) a frame after mounting, so the entry slides.
function useDockPresence(show: boolean) {
  const [mounted, setMounted] = useState(show)
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (show) {
      setMounted(true)
      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setEntered(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }
    setEntered(false)
    const t = setTimeout(() => setMounted(false), DOCK_SLIDE_MS)
    return () => clearTimeout(t)
  }, [show])
  return { mounted, entered }
}

// The bottom spot's wrapper: centred, sliding up from below the canvas into
// it, the arrival waiting SWAP_DELAY_MS. Its spot (`spot`), with how far down
// it goes out of sight: its own height and its distance from the canvas
// bottom, plus a margin — or it peeks out over the edge while it waits.
const DOCK_SPOT = {
  // The row's spot, 24px up.
  row: { bottom: "bottom-6", away: "translate-y-[calc(100%+2rem)]" },
  // 12px higher, 36px up — with room for the loader's glow (2rem past it).
  raised: { bottom: "bottom-9", away: "translate-y-[calc(100%+4.25rem)]" },
}
const dockClass = (entered: boolean, spot: keyof typeof DOCK_SPOT = "row") =>
  `max-dlg:hidden absolute ${DOCK_SPOT[spot].bottom} left-1/2 z-[5] max-w-[calc(100%-48px)] -translate-x-1/2 transition-transform duration-300 ease-out motion-reduce:transition-none ` +
  (entered ? "translate-y-0" : `pointer-events-none ${DOCK_SPOT[spot].away}`)
const dockDelay = (entered: boolean) => (entered ? `${SWAP_DELAY_MS}ms` : "0ms")

// "Creating preview" in the bottom row's spot (desktop, merged designer),
// swapping with it like the warnings do.
export function EmbroideryPreviewDock({
  loading,
  durationMs,
}: {
  loading: boolean
  durationMs: number
}) {
  const { mounted, entered } = useDockPresence(loading)
  if (!mounted) return null
  return (
    <div
      aria-hidden={!entered}
      // 12px higher than the row: 36px from the canvas bottom.
      className={dockClass(entered, "raised")}
      style={{ transitionDelay: dockDelay(entered) }}
    >
      <EmbroideryPreviewStatus docked loading={loading} durationMs={durationMs} />
    </div>
  )
}

// "Simplify with AI" / "Fix with AI" at work, in the same spot and pill as
// "Creating preview" (the gradient line circling it), its text still and only
// the three dots pulsing in turn (.loading-dot). Its text by the issue it
// answers (`issue`).
const SIMPLIFY_STATUS = {
  "thin-line": "Fixing thin lines for embroidery",
  "too-complex": "Simplifying design for embroidery",
} as const
const LOADING_DOT_STAGGER_MS = 200

export function EmbroiderySimplifyDock({ issue }: { issue: EmbroideryDesignIssue | null }) {
  // Kept through the exit slide, so it doesn't empty out on the way down.
  const [shownIssue, setShownIssue] = useState<EmbroideryDesignIssue>(issue ?? "too-complex")
  if (issue && issue !== shownIssue) setShownIssue(issue)
  const { mounted, entered } = useDockPresence(issue !== null)
  if (!mounted) return null
  const status = SIMPLIFY_STATUS[shownIssue]
  return (
    <div
      aria-hidden={!entered}
      className={dockClass(entered, "raised")}
      style={{ transitionDelay: dockDelay(entered) }}
    >
      <div
        role="status"
        aria-label={`${status}...`}
        className={PILL + "preview-status-ring border border-white bg-white px-4 py-2.5 text-black"}
      >
        <span aria-hidden="true" className="preview-status-glow" />
        <span aria-hidden="true" className="text-sm leading-none font-semibold whitespace-nowrap">
          {status}
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="loading-dot"
              style={{ animationDelay: `${i * LOADING_DOT_STAGGER_MS}ms` }}
            >
              .
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}

// The first stitched preview's tip, in the bottom row's place (desktop),
// swapping with it like the messages: a green message and, centred under it,
// the kit's secondary button "Zoom in" — the only way on.
export function EmbroideryZoomTipDock({
  text,
  onZoomIn,
}: {
  text: string | null
  onZoomIn: () => void
}) {
  const [shownText, setShownText] = useState(text ?? "")
  if (text && text !== shownText) setShownText(text)
  const { mounted, entered } = useDockPresence(text !== null)
  if (!mounted) return null
  return (
    <div
      aria-hidden={!entered}
      className={dockClass(entered)}
      style={{ transitionDelay: dockDelay(entered) }}
    >
      {/* A green message — the docked SizeBadgePill's frame, ✓ and type —
          with "Zoom in" where the warnings put their action. */}
      <div
        role="status"
        className={`flex flex-col items-start gap-4 rounded-2xl border bg-white p-4 ${SIZE_BADGE.good.frame}`}
      >
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none font-bold text-white ${SIZE_BADGE.good.dot}`}
          >
            {SIZE_BADGE.good.icon}
          </span>
          <span className="text-sm leading-none font-semibold whitespace-nowrap">{shownText}</span>
        </div>
        <div className="flex self-stretch justify-center">
          <KitButton
            variant="ghost"
            onClick={onZoomIn}
            tabIndex={entered ? 0 : -1}
            className="whitespace-nowrap"
          >
            Zoom in
          </KitButton>
        </div>
      </div>
    </div>
  )
}

export function EmbroideryIssueDock({
  status,
  onSeeOptions,
  onFitToSize,
  shakeSignal = 0,
  combination = false,
  concealed = false,
}: {
  status: EmbroiderySizeStatus | null
  onSeeOptions: () => void
  onFitToSize?: () => void
  shakeSignal?: number
  /** Several objects: too large reads as the combination being too large. */
  combination?: boolean
  /** While ThinLineHelpPopover draws its sharp copy over it. */
  concealed?: boolean
}) {
  const show = status !== null
  const [shownStatus, setShownStatus] = useState<EmbroiderySizeStatus>(status ?? "too-large")
  if (status && status !== shownStatus) setShownStatus(status)
  const { mounted, entered } = useDockPresence(show)
  const shakes = useShakes(shakeSignal)

  if (!mounted) return null
  return (
    <div
      aria-hidden={!entered}
      className={dockClass(entered)}
      style={{
        transitionDelay: dockDelay(entered),
        visibility: concealed ? "hidden" : undefined,
      }}
    >
      <div key={shakes} className={shakes ? "embroidery-shake" : undefined}>
        <SizeBadgePill
          status={shownStatus}
          onSeeOptions={onSeeOptions}
          onFitToSize={onFitToSize}
          docked
          label={
            combination && shownStatus === "too-large"
              ? "Combination of designs too large for embroidery"
              : undefined
          }
        />
      </div>
    </div>
  )
}

// "Max. size for embroidery" under an object whose resize ran into the hoop
// frame (or whose move would pull a group past it): the warning pills' shape
// in the selection handles' blue — it's guidance on the edit in hand, not a
// warning about the design — popping in, scaling up from the top centre with
// a slight overshoot, and shrinking back out. Stays mounted so both ways
// animate; the parent places it (absolute, under the object).
const MAX_SIZE_BADGE = {
  icon: "!",
  frame: "border-[#3355FF] text-[#3355FF]",
  dot: "bg-[#3355FF]",
}

export function EmbroideryMaxSizeBadge({
  show,
  label = "Max. size for embroidery",
  icon = MAX_SIZE_BADGE.icon,
}: {
  show: boolean
  /** The limit it's about — "Min. size for embroidery" for a design's own minimum. */
  label?: string
  /** "✓" where the size is a good one rather than a stop ("Perfect size"). */
  icon?: string
}) {
  const badge = MAX_SIZE_BADGE
  return (
    <div
      role="status"
      aria-hidden={!show}
      // Its own font and style, set outright: under a text object it would
      // otherwise take on that text's font, italics and alignment.
      className={
        "flex origin-top items-center gap-1.5 rounded-full border bg-white py-1.5 pr-3 pl-1.5 text-left font-sans not-italic transition-[opacity,scale] " +
        `${badge.frame} ` +
        (show
          ? "scale-100 opacity-100 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          : "scale-75 opacity-0 duration-150 ease-in")
      }
    >
      <span
        aria-hidden="true"
        className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none font-bold text-white ${badge.dot}`}
      >
        {icon}
      </span>
      <span className="text-sm leading-none font-semibold whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}

// One badge pill. A
// design-issue warning adds, centred under its message, a secondary "See what
// you can do" that opens its options (`onSeeOptions`) — in the same orange frame, 16px
// in all round, so it rounds as a box rather than a full pill. "Too large"
// adds "Fit to best size" there the same way (`onFitToSize`).
export function SizeBadgePill({
  status,
  hidden = false,
  onSeeOptions,
  onFitToSize,
  label,
  docked = false,
}: {
  status: EmbroiderySizeStatus
  hidden?: boolean
  onSeeOptions?: () => void
  /** Shrinks the design into the hoop frame — offered under "too-large". */
  onFitToSize?: () => void
  /** In place of the status's own message. */
  label?: string
  /** In the bottom row's place (EmbroideryIssueDock): the 16px frame, options or not. */
  docked?: boolean
}) {
  const badge = SIZE_BADGE[status]
  const action =
    isDesignIssue(status) && onSeeOptions
      ? { label: "See solutions", onClick: onSeeOptions }
      : status === "too-large" && onFitToSize
        ? { label: "Fit to best size", onClick: onFitToSize }
        : null
  const withOptions = action !== null
  // The button's label, kept while its row folds away, so it doesn't empty
  // out mid-fold.
  const [actionLabel, setActionLabel] = useState(action?.label ?? null)
  if (action && action.label !== actionLabel) setActionLabel(action.label)
  return (
    <div
      role="status"
      aria-hidden={hidden}
      // "docked": ThinLineHelpPopover lines up with this one's bottom edge.
      data-thin-line-help={isDesignIssue(status) ? (docked ? "docked" : "true") : undefined}
      className={
        "flex flex-col items-start border bg-white transition-all duration-300 ease-out " +
        // pl-1.5 matches py-1.5: the icon sits as far from the left edge as
        // from the top (the 16px icon is the first row's tallest item).
        (withOptions || docked ? "rounded-2xl p-4 " : "rounded-full py-1.5 pr-3 pl-1.5 ") +
        `${badge.frame} ` +
        visibility(!hidden)
      }
    >
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none font-bold text-white ${badge.dot}`}
        >
          {badge.icon}
        </span>
        <span className="text-sm leading-none font-semibold whitespace-nowrap">
          {label ?? badge.label}
        </span>
      </div>
      {actionLabel && (
        // The kit's secondary button (ghost), 16px under the message, as below
        // it (p-4). Its row folds open and shut with the frame's own 300ms
        // (grid rows 0fr ↔ 1fr), fading, rather than the frame jumping.
        <div
          className={
            "grid self-stretch transition-[grid-template-rows,opacity] duration-300 ease-out " +
            (action ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
          }
        >
          <div className="flex min-h-0 justify-center overflow-hidden">
            <KitButton
              variant="ghost"
              onClick={action?.onClick}
              tabIndex={hidden || !action ? -1 : 0}
              aria-hidden={!action}
              className={
                "mt-4 whitespace-nowrap transition-colors " +
                (hidden || !action ? "pointer-events-none" : "pointer-events-auto")
              }
            >
              {actionLabel}
            </KitButton>
          </div>
        </div>
      )}
    </div>
  )
}

// Popover layout: as wide as fits up to POPOVER_WIDTH_PX, CANVAS_INSET_PX
// inside the canvas.
const POPOVER_WIDTH_PX = 640
const CANVAS_INSET_PX = 16
const POPOVER_SLIDE_MS = 300

// A design issue's solutions (thin lines or too complex — `issue`;
// EmbroiderySolutions). Opens from its "See solutions" over the warning
// itself (found by `data-thin-line-help`), covering it: docked at the canvas
// bottom, its bottom edge on the warning's — as far from the canvas bottom —
// otherwise its top edge on the warning's. Meanwhile the rest of the designer
// blurs (the designer applies the blur, as for the size sheet in the
// add-to-basket flow). A click outside or Escape closes it.
//
// `onPresenceChange` reports whether the layer is on screen, closing fade
// included: the warning stays concealed until it is gone, or it shows
// through — still blurred — round the popover's edges.
export function ThinLineHelpPopover({
  open,
  issue,
  onClose,
  onPresenceChange,
  designSrc,
  printSavingLabel,
  onSimplifyWithAI,
  onSwitchToPrint,
}: {
  open: boolean
  issue: EmbroideryDesignIssue
  onClose: () => void
  onPresenceChange?: (present: boolean) => void
  /** The graphic the issue is about — shown in the Simplify with AI card. */
  designSrc: string | null
  /** "X € cheaper", on the print card — or null. */
  printSavingLabel: string | null
  onSimplifyWithAI: () => void
  onSwitchToPrint: () => void
}) {
  // Kept mounted through the closing fade, like the editor bar.
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    onPresenceChange?.(mounted)
  }, [mounted, onPresenceChange])
  useEffect(() => {
    if (open) {
      setMounted(true)
      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setEntered(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }
    setEntered(false)
    const t = setTimeout(() => setMounted(false), POPOVER_SLIDE_MS)
    return () => clearTimeout(t)
  }, [open])

  // Where the warning sits on screen — the popover lines up with it — and the
  // canvas the popover has to stay inside. `docked`: EmbroideryIssueDock's, at
  // the canvas bottom.
  const [anchor, setAnchor] = useState<{
    centerX: number
    top: number
    bottom: number
    docked: boolean
    canvas: { left: number; right: number; top: number; bottom: number }
  } | null>(null)
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      // The one on screen: desktop docks it at the bottom, mobile keeps the
      // badge slot (the other is display: none — no box).
      const warning = Array.from(
        document.querySelectorAll<HTMLElement>("[data-thin-line-help]")
      ).find(el => !el.closest("[data-thin-line-help-layer]") && el.getClientRects().length > 0)
      const canvas = document.getElementById("canvas-section")
      if (!warning) return
      const r = warning.getBoundingClientRect()
      const c = canvas?.getBoundingClientRect() ?? {
        left: 0,
        right: window.innerWidth,
        top: 0,
        bottom: window.innerHeight,
      }
      setAnchor({
        centerX: r.left + r.width / 2,
        top: r.top,
        bottom: r.bottom,
        docked: warning.dataset.thinLineHelp === "docked",
        canvas: { left: c.left, right: c.right, top: c.top, bottom: c.bottom },
      })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!mounted || !anchor || typeof document === "undefined") return null

  // Kept inside the canvas, CANVAS_INSET_PX from its edges: as wide as fits
  // up to its own width, shifted sideways off the warning's centre when that
  // would cross an edge, and capped in height by the canvas — its content
  // scrolls when that is short.
  const { canvas, docked } = anchor
  const canvasWidth = canvas.right - canvas.left
  const width = Math.max(0, Math.min(POPOVER_WIDTH_PX, canvasWidth - 2 * CANVAS_INSET_PX))
  const naturalLeft = anchor.centerX - width / 2
  const left = Math.min(
    Math.max(naturalLeft, canvas.left + CANVAS_INSET_PX),
    canvas.right - CANVAS_INSET_PX - width
  )
  const maxHeight = Math.max(
    120,
    docked
      ? anchor.bottom - (canvas.top + CANVAS_INSET_PX)
      : canvas.bottom - CANVAS_INSET_PX - anchor.top
  )

  return createPortal(
    <div className="fixed inset-0 z-[60]" data-thin-line-help-layer="true" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Solutions"
        onClick={e => e.stopPropagation()}
        className={`absolute flex flex-col overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 shadow-xl transition-[translate,opacity] duration-300 ease-out ${
          entered
            ? "translate-y-0 opacity-100"
            : docked
              ? "translate-y-3 opacity-0"
              : "-translate-y-3 opacity-0"
        }`}
        style={{
          left,
          width,
          maxHeight,
          ...(docked ? { bottom: window.innerHeight - anchor.bottom } : { top: anchor.top }),
        }}
      >
        <EmbroiderySolutions
          issue={issue}
          designSrc={designSrc}
          printSavingLabel={printSavingLabel}
          onClose={onClose}
          onSimplifyWithAI={onSimplifyWithAI}
          onSwitchToPrint={onSwitchToPrint}
        />
      </div>
    </div>,
    document.body
  )
}

export default function EmbroideryLabel({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="pointer-events-none absolute right-6 bottom-[calc(102px+env(safe-area-inset-bottom))] z-10 flex flex-col items-end text-[#989898] select-none dlg:bottom-6">
      <span className="mb-2 flex">
        <EmbroideryIcon />
      </span>
      {/* whitespace-nowrap: in vertical writing mode a line break would put a second
          word in a column beside the first rather than under it. */}
      <span className="rotate-180 text-center text-sm leading-none font-semibold tracking-[0.1em] whitespace-nowrap uppercase [writing-mode:vertical-rl]">
        Embroidery
      </span>
    </div>
  )
}
