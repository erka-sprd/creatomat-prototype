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
// `offsetPx` stacks it further down, under other badges in the spot — see
// BADGE_OFFSET for the thin-line group.
export type CanvasStatusStack = "editor-bar" | "loader"

// [mobile, desktop] px.
const STACK_PX: Record<CanvasStatusStack, [number, number]> = {
  "editor-bar": [20, 47],
  loader: [46, 42],
}

// Every badge is 30px tall. Under the thin-line warning, its "See what this
// means" link sits 4px down (it belongs to the warning).
const BADGE_HEIGHT_PX = 30
export const BADGE_OFFSET = {
  thinLineLink: BADGE_HEIGHT_PX + 4,
} as const

// `concealed` hides it on the spot (no retract) — while the thin-line help
// popover is open, a sharp copy of the warning and its link sits on top and
// these would only show through as a blurred ghost.
// `shakeSignal`: a counter that goes up each time add to basket is refused;
// each increase shakes the badge once (.embroidery-shake), by remounting the
// wrapper on a new key. Only an increase does — a badge that appears, hides
// or changes message never shakes on its own.
function CanvasStatusSlot({
  children,
  stack = null,
  offsetPx = 0,
  concealed = false,
  shakeSignal = 0,
}: {
  children: ReactNode
  stack?: CanvasStatusStack | null
  offsetPx?: number
  concealed?: boolean
  shakeSignal?: number
}) {
  const [mobile, desktop] = stack ? STACK_PX[stack] : [0, 0]
  const extra = offsetPx
  const [shakes, setShakes] = useState(0)
  const lastSignal = useRef(shakeSignal)
  useEffect(() => {
    if (shakeSignal > lastSignal.current) setShakes(n => n + 1)
    lastSignal.current = shakeSignal
  }, [shakeSignal])
  return (
    <div
      className={
        "pointer-events-none absolute top-17 left-1/2 z-4 flex -translate-x-1/2 translate-y-(--slot-y) items-center transition-transform duration-300 ease-out select-none dlg:top-6 dlg:h-12 dlg:translate-y-(--slot-y-dlg)" +
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

// create-omat's preview-generation status pill. create-omat also docks it under
// the editor bar while an element is selected; here the preview only renders
// once nothing is selected, so it appears as the editor bar leaves — at its own
// spot, without travelling there from the bar.
export function EmbroideryPreviewStatus({ loading }: { loading: boolean }) {
  return (
    <CanvasStatusSlot>
      <div
        role="status"
        aria-hidden={!loading}
        className={
          PILL +
          "gap-2 border border-neutral-200 bg-white px-4 py-2.5 text-neutral-700 " +
          visibility(loading)
        }
      >
        <span className="text-sm leading-none font-semibold tracking-[0.1em] whitespace-nowrap uppercase">
          Creating preview
        </span>
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700"
        />
      </div>
    </CanvasStatusSlot>
  )
}

export type EmbroiderySizeStatus = "too-large" | "good" | "thin-line"

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
  "thin-line": {
    label: "Design has too thin lines for embroidery",
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
// - "thin-line": shrinking the design to fit made its lines too thin to stitch
//   (mocked — shown whenever a resize ends inside the hoop frame).
// Whatever holds the spot above it, it stacks beneath (`stack`): the editor bar
// while an element is selected, "Creating preview" while the stitched render is
// made — then slides up into the spot once that leaves. `offsetPx` puts it
// further down, under other badges.
export function EmbroiderySizeBadge({
  status,
  stack = null,
  offsetPx = 0,
  concealed = false,
  shakeSignal = 0,
}: {
  status: EmbroiderySizeStatus | null
  stack?: CanvasStatusStack | null
  offsetPx?: number
  concealed?: boolean
  shakeSignal?: number
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
    >
      <SizeBadgePill status={status ?? shown} hidden={!show} />
    </CanvasStatusSlot>
  )
}

// One badge pill, also drawn sharp above the blur by ThinLineHelpPopover.
function SizeBadgePill({
  status,
  hidden = false,
}: {
  status: EmbroiderySizeStatus
  hidden?: boolean
}) {
  const badge = SIZE_BADGE[status]
  return (
    <div
      role="status"
      aria-hidden={hidden}
      className={PILL + `gap-1.5 border bg-white px-3 py-1.5 ${badge.frame} ` + visibility(!hidden)}
    >
      <span
        aria-hidden="true"
        className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none font-bold text-white ${badge.dot}`}
      >
        {badge.icon}
      </span>
      <span className="text-sm leading-none font-semibold whitespace-nowrap">{badge.label}</span>
    </div>
  )
}

// Solid warning orange with white text — the same orange as the warning's
// border and icon above it, so the pair reads as one, darkening on hover.
const HELP_LINK_CLASS =
  "gap-1 border border-[#EA580C] bg-[#EA580C] px-3 py-1.5 text-white hover:border-[#C2410C] hover:bg-[#C2410C] "

// The link's label and chevron, which turns to point up while the popover it
// opens is showing.
function HelpLinkContent({ open }: { open: boolean }) {
  return (
    <>
      <span className="text-sm leading-none font-semibold whitespace-nowrap">
        See what this means
      </span>
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </>
  )
}

// "See what this means" — the thin-line warning's follow-up, 4px under it, as a
// solid orange button; it opens ThinLineHelpPopover below it.
export function EmbroideryThinLineHelp({
  show,
  stack = null,
  concealed = false,
  shakeSignal = 0,
  onClick,
}: {
  show: boolean
  stack?: CanvasStatusStack | null
  concealed?: boolean
  shakeSignal?: number
  onClick?: () => void
}) {
  return (
    <CanvasStatusSlot
      stack={stack}
      offsetPx={BADGE_OFFSET.thinLineLink}
      concealed={concealed}
      shakeSignal={shakeSignal}
    >
      <button
        type="button"
        data-thin-line-help="true"
        onClick={onClick}
        aria-hidden={!show}
        tabIndex={show ? 0 : -1}
        className={
          PILL +
          HELP_LINK_CLASS +
          (show ? "pointer-events-auto cursor-pointer " : "") +
          visibility(show)
        }
      >
        <HelpLinkContent open={false} />
      </button>
    </CanvasStatusSlot>
  )
}

// Popover layout: 8px under the link, 450px tall, as wide as fits up to 480px.
const POPOVER_GAP_PX = 8
const POPOVER_HEIGHT_PX = 450
const POPOVER_SLIDE_MS = 300

// The thin-line explanation. Opens under "See what this means" while the rest
// of the designer blurs (the designer applies the blur, as for the size sheet
// in the add-to-basket flow). The warning and the link sit inside the canvas,
// which is blurred too — so this draws sharp copies of both on a layer above
// the page, exactly over the originals (found by `data-thin-line-help` and
// concealed meanwhile), with the popover below them. A click outside, the link
// again, or Escape closes it.
//
// `onPresenceChange` reports whether the layer is on screen, closing fade
// included: the originals must stay concealed until it is gone, or they show
// through — still blurred, as the blur eases off — as a glow behind the copies.
export function ThinLineHelpPopover({
  open,
  onClose,
  onPresenceChange,
}: {
  open: boolean
  onClose: () => void
  onPresenceChange?: (present: boolean) => void
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

  // Where the original link sits on screen; the copies line up with it.
  const [anchor, setAnchor] = useState<{ centerX: number; linkTop: number } | null>(null)
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      const link = document.querySelector<HTMLElement>("[data-thin-line-help]")
      if (!link) return
      const r = link.getBoundingClientRect()
      setAnchor({ centerX: r.left + r.width / 2, linkTop: r.top })
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

  const warningTop = anchor.linkTop - BADGE_OFFSET.thinLineLink
  return createPortal(
    <div className="fixed inset-0 z-[60]" data-thin-line-help-layer="true" onClick={onClose}>
      <div
        className="absolute flex -translate-x-1/2 flex-col items-center"
        style={{ left: anchor.centerX, top: warningTop }}
        onClick={e => e.stopPropagation()}
      >
        <SizeBadgePill status="thin-line" />
        <button
          type="button"
          onClick={onClose}
          aria-expanded={open}
          className={PILL + HELP_LINK_CLASS + "mt-1 cursor-pointer"}
        >
          <HelpLinkContent open={entered} />
        </button>
        <div
          role="dialog"
          aria-label="What too thin lines mean for embroidery"
          className={`flex w-[min(480px,calc(100vw-32px))] items-center justify-center rounded-2xl bg-white p-6 text-center text-sm text-neutral-500 shadow-xl transition-all duration-300 ease-out ${
            entered ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          }`}
          style={{ marginTop: POPOVER_GAP_PX, height: POPOVER_HEIGHT_PX }}
        >
          The explanation and image examples will come here...
        </div>
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
