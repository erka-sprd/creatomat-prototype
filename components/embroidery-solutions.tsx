"use client"

import { X } from "lucide-react"
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

import { KitButton } from "@/components/kit-button"

// What the design-issue popover (ThinLineHelpPopover) holds — the warning's
// "See solutions", for thin lines or too complex: two ways out, side by side.
// Simplify it with AI (`onSimplifyWithAI`, primary — the AI panel in modify
// mode) or print it instead (`onSwitchToPrint`, secondary). The AI card opens
// with a preview of the simplification on the user's own design (`designSrc`).
export function EmbroiderySolutions({
  designSrc,
  printSavingLabel,
  onClose,
  onSimplifyWithAI,
  onSwitchToPrint,
}: {
  designSrc: string | null
  /** "X € cheaper", badged on the print card's design — or null. */
  printSavingLabel: string | null
  onClose: () => void
  onSimplifyWithAI: () => void
  onSwitchToPrint: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-[18px] leading-tight font-[800] text-black">Solutions</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 cursor-pointer text-neutral-500 outline-none hover:text-black"
        >
          <X size={20} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <SolutionCard
          title="Simplify with AI"
          text="You might lose some details."
          visual={designSrc && <SimplifyPreview src={designSrc} />}
        >
          <KitButton variant="primary" onClick={onSimplifyWithAI}>
            Simplify now
          </KitButton>
        </SolutionCard>
        <SolutionCard
          title="Print it instead"
          text="Digital print keeps every detail."
          visual={designSrc && <DesignPreview src={designSrc} badge={printSavingLabel} />}
        >
          <KitButton variant="ghost" onClick={onSwitchToPrint}>
            Switch to print
          </KitButton>
        </SolutionCard>
      </div>
    </div>
  )
}

function SolutionCard({
  title,
  text,
  visual,
  children,
}: {
  title: string
  text: string
  /** Above the title. */
  visual?: ReactNode
  children?: ReactNode
}) {
  return (
    // Centred throughout: visual, title, text and button.
    <div className="flex flex-col items-center gap-2 rounded-xl bg-neutral-100 p-5 text-center">
      {visual && <div className="mb-2 w-full">{visual}</div>}
      <h3 className="text-base font-bold text-black">{title}</h3>
      <p className="text-sm leading-snug text-neutral-700">{text}</p>
      {children && <div className="mt-auto pt-3">{children}</div>}
    </div>
  )
}

// The print card's visual: the design as it is, in the same box as the AI
// card's preview (128px tall, 12px in), so the two sit level — with `badge`
// in a small white pill at its top centre.
function DesignPreview({ src, badge }: { src: string; badge: string | null }) {
  return (
    <div className="relative h-32">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-x-3 inset-y-3 h-[calc(100%-24px)] w-[calc(100%-24px)] object-contain"
      />
      {badge && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-white px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap text-black shadow-xs">
          {badge}
        </span>
      )}
    </div>
  )
}

// The dots: a regular pattern, DOT_SPACING_PX apart both ways from the top
// left, enough of them to cover the widest card (the shape clips the rest).
const DOT_SPACING_PX = 7
const DOT_COLS = 44
const DOT_ROWS = 16
// The design sits 12px in at top and bottom (inset-y-3).
const DESIGN_INSET_PX = 12
// The line never comes closer than this share of the design's width to either
// side, so a little of both versions always shows.
const SPLIT_MARGIN = 0.2

// The image's aspect, and the share of its width its visible pixels span
// (left and right, 0–1): read from its alpha at a small size, which is plenty
// for a preview.
type InkSpan = { aspect: number; left: number; right: number }
const INK_SAMPLE_PX = 200
const INK_ALPHA_MIN = 16
function inkSpan(src: string): Promise<InkSpan> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.onload = () => {
      const { naturalWidth: nw, naturalHeight: nh } = img
      const full = { aspect: nw / nh, left: 0, right: 1 }
      const scale = Math.min(1, INK_SAMPLE_PX / Math.max(nw, nh))
      const w = Math.max(1, Math.round(nw * scale))
      const h = Math.max(1, Math.round(nh * scale))
      const ctx = Object.assign(document.createElement("canvas"), { width: w, height: h })
        .getContext("2d", { willReadFrequently: true })
      if (!ctx) return resolve(full)
      ctx.drawImage(img, 0, 0, w, h)
      const { data } = ctx.getImageData(0, 0, w, h)
      let minX = w
      let maxX = -1
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] < INK_ALPHA_MIN) continue
          if (x < minX) minX = x
          if (x > maxX) maxX = x
        }
      }
      resolve(maxX < 0 ? full : { aspect: nw / nh, left: minX / w, right: (maxX + 1) / w })
    }
    img.src = src
  })
}

// A fixed pseudo-random stream (mulberry32), so the dots' paces come out the
// same on the server and the client.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const DOTS = (() => {
  const rand = seeded(7)
  const dots: { left: number; top: number; duration: number; delay: number }[] = []
  // Placed on the grid; only their colour's pace and phase are random.
  for (let r = 0; r < DOT_ROWS; r++) {
    for (let c = 0; c < DOT_COLS; c++) {
      dots.push({
        left: (c + 0.5) * DOT_SPACING_PX,
        top: (r + 0.5) * DOT_SPACING_PX,
        duration: 1.2 + rand() * 2,
        delay: -rand() * 3,
      })
    }
  }
  return dots
})()

// The user's design, split by a black line that sweeps from side to side
// within the design's width, 20% clear of each side (--ai-t in globals.css,
// made --ai-split here): left of it the design as it is, cut 2px short of
// the line; right of it what the AI makes of it — only its outline, its body
// filled with dots drifting between black and mid grey at their own paces,
// a light shine running along the outline.
function SimplifyPreview({ src }: { src: string }) {
  const filterId = `ai-outline-${useId().replace(/:/g, "")}`
  // Where the artwork itself is drawn across the box, in % of it — so the line
  // keeps to the design, never closer than SPLIT_MARGIN of its width to either
  // side. Two things put empty space beside it: object-contain's margins
  // beside a tall image, and the transparent margins inside the image file —
  // so the image is read once for its opaque columns (inkSpan).
  const boxRef = useRef<HTMLDivElement>(null)
  const [ink, setInk] = useState<InkSpan | null>(null)
  const [design, setDesign] = useState({ left: 0, width: 100 })
  useEffect(() => {
    let cancelled = false
    inkSpan(src).then(
      span => !cancelled && setInk(span),
      err => console.error("Measuring the design for the preview failed", err)
    )
    return () => {
      cancelled = true
    }
  }, [src])
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box || !ink) return
    const measure = () => {
      const boxW = box.clientWidth
      const imgH = box.clientHeight - 2 * DESIGN_INSET_PX
      if (!boxW || imgH <= 0) return
      // The image's drawn width (contain, centred), then the ink within it.
      const drawnW = Math.min(boxW, imgH * ink.aspect)
      const drawnLeft = (boxW - drawnW) / 2
      const left = drawnLeft + drawnW * ink.left
      const width = drawnW * (ink.right - ink.left)
      setDesign({ left: (left / boxW) * 100, width: (width / boxW) * 100 })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => observer.disconnect()
  }, [ink])
  const splitVars = {
    "--ai-split": `calc(${design.left}% + ${design.width}% * (${SPLIT_MARGIN} + ${
      1 - 2 * SPLIT_MARGIN
    } * var(--ai-t)))`,
  } as CSSProperties
  // The design's shape, as a mask, fitted like the <img>s (contain, centred).
  const shapeMask: CSSProperties = {
    maskImage: `url(${src})`,
    WebkitMaskImage: `url(${src})`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  }
  return (
    <div aria-hidden="true" className="ai-split relative h-32 overflow-hidden">
      {/* The outline: the design's alpha grown by a pixel and a half, minus
          itself — a ring along every edge — in black. */}
      <svg className="absolute size-0">
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="grown" />
          <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
          <feFlood floodColor="#000" />
          <feComposite in2="ring" operator="in" />
        </filter>
        <filter id={`${filterId}-light`} x="-5%" y="-5%" width="110%" height="110%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.2" result="grown" />
          <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
          <feFlood floodColor="#E5E5E5" />
          <feComposite in2="ring" operator="in" />
        </filter>
      </svg>
      {/* One box for the design and the line, so --ai-split means the same
          for both: 12px in at the sides, the design 12px in at top and
          bottom, the line full height. The line is 2px wide on the split
          (±1px), with a 2px gap on either side: the design stops 3px short
          of the split, the after side starts 3px past it. */}
      <div ref={boxRef} className="absolute inset-x-3 inset-y-0" style={splitVars}>
        {/* Before: the design, up to 2px short of the line. */}
        <img
          src={src}
          alt=""
          className="absolute inset-x-0 inset-y-3 h-[calc(100%-24px)] w-full object-contain"
          style={{ clipPath: "inset(0 calc(100% - var(--ai-split) + 3px) 0 0)" }}
        />
        {/* After: dots inside the shape, under its outline. */}
        <div
          className="absolute inset-x-0 inset-y-3"
          style={{ ...shapeMask, clipPath: "inset(0 0 0 calc(var(--ai-split) + 3px))" }}
        >
          {DOTS.map((d, i) => (
            <span
              key={i}
              className="ai-dot absolute size-[2px] -translate-1/2 rounded-full"
              style={{
                left: d.left,
                top: d.top,
                animationDuration: `${d.duration}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
          {/* The shine passing over them too: the same pattern in light grey,
              under the outline's sweeping band (.ai-shine). */}
          <div className="ai-shine absolute inset-0">
            {DOTS.map((d, i) => (
              <span
                key={i}
                className="absolute size-[2px] -translate-1/2 rounded-full bg-[#E5E5E5]"
                style={{ left: d.left, top: d.top }}
              />
            ))}
          </div>
        </div>
        <img
          src={src}
          alt=""
          className="absolute inset-x-0 inset-y-3 h-[calc(100%-24px)] w-full object-contain"
          style={{
            filter: `url(#${filterId})`,
            clipPath: "inset(0 0 0 calc(var(--ai-split) + 3px))",
          }}
        />
        {/* The outline's shine: the same ring in a light grey, shown only
            under a soft band that sweeps across (.ai-shine) — the design
            scan's light, on the outline alone. */}
        <img
          src={src}
          alt=""
          className="ai-shine absolute inset-x-0 inset-y-3 h-[calc(100%-24px)] w-full object-contain"
          style={{
            filter: `url(#${filterId}-light)`,
            clipPath: "inset(0 0 0 calc(var(--ai-split) + 3px))",
          }}
        />
        {/* The line. */}
        <div
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-black"
          style={{ left: "var(--ai-split)" }}
        />
      </div>
    </div>
  )
}
