"use client"

/**
 * The visuals of /ux-new-way-of-work that aren't handoff scenes: the
 * volume-discount track, the QA list crossed out, the variants switch and
 * the one-design-system diagram. Real pieces wherever possible (the rail's
 * discount track, the kit's button); the QA list and the two-libraries
 * diagram are drawn.
 */

import { useEffect, useRef, useState, type ReactNode } from "react"
import { KitButton } from "@/components/kit-button"
import { VolumeDiscountTrack } from "@/components/volume-discount-popover-content"
import { volumeDiscountTiers } from "@/lib/volume-discount"

export const PROTOTYPE_URL = "https://creatomat-prototype.vercel.app/"
export const REPO_URL = "https://github.com/erka-sprd/creatomat-prototype"
export const HANDOFF_URL = "/handoff/embroidery"

const LABEL =
  "font-[family-name:var(--ho-mono)] text-[12px] tracking-[0.08em] text-[var(--ho-muted)] uppercase"

/* ------------------------------------------------------------------ hooks */

/** True once the element has scrolled into view — the visuals start then, not on load. */
function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return inView
}

/** Steps through `count` states while `on`, holding each for `ms`. */
function useCycle(on: boolean, count: number, ms: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!on) return
    const id = window.setInterval(() => setI(n => (n + 1) % count), ms)
    return () => window.clearInterval(id)
  }, [on, count, ms])
  return i
}

/* ------------------------------------------------------------- the tiers */

const TIER_PRODUCT_ID = "812"
const TIER_STEP_MS = 1600

/**
 * The volume-discount popover's own tier track — every tier of the product's
 * real scale, the handle gliding from one to the next.
 */
export function TierDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const stops = [1, ...volumeDiscountTiers(TIER_PRODUCT_ID).map(t => t.from)]
  const i = useCycle(inView, stops.length, TIER_STEP_MS)

  return (
    <div ref={ref} className="w-[640px] max-w-full py-3 [&_*]:pointer-events-none">
      <VolumeDiscountTrack productId={TIER_PRODUCT_ID} quantity={stops[i]} onQuantityChange={() => {}} animate />
    </div>
  )
}

/* ------------------------------------------------------ QA list → three */

const QA_ITEMS = [
  "Button hover is 2px too dark",
  "Badge should fade after 2 s, not 3",
  "Tooltip misaligned on the zoom +",
  "Loader frame has a gradient — should be plain white",
  "Popover arrow 1px off",
  "Pill text not centred in DE",
  "Green message needs a ✓ dot",
]
const QA_CYCLE_MS = 9000
const QA_CROSS_AT_MS = 1600
const QA_THREE_AT_MS = 3400

/** The old QA list crossed out in red, and what the developer gets instead. */
export function QaToThree() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const [phase, setPhase] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    if (!inView) return
    let ids: number[] = []
    const run = () => {
      setPhase(0)
      ids = [
        window.setTimeout(() => setPhase(1), QA_CROSS_AT_MS),
        window.setTimeout(() => setPhase(2), QA_THREE_AT_MS),
      ]
    }
    run()
    const loop = window.setInterval(run, QA_CYCLE_MS)
    return () => {
      ids.forEach(window.clearTimeout)
      window.clearInterval(loop)
    }
  }, [inView])

  return (
    <div ref={ref} className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div>
        <p className={`${LABEL} mb-3`}>Before: a QA list for the developer</p>
        <div className="relative">
          <ol
            className={`m-0 list-decimal rounded-[14px] bg-[#F4F4F4] py-3 pr-4 pl-8 text-[14px] leading-[1.9] transition-colors duration-500 ${
              phase > 0 ? "text-neutral-400" : ""
            }`}
          >
            {QA_ITEMS.map(q => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          {phase > 0 && (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
            >
              {/* No viewBox — percentages place the strokes in the list's own
                  pixels, and pathLength 100 lets one dash draw each whole
                  stroke however wide the list is. */}
              <line x1="6%" y1="6%" x2="94%" y2="94%" pathLength={100} className="ho-wow-stroke" />
              <line
                x1="94%"
                y1="6%"
                x2="6%"
                y2="94%"
                pathLength={100}
                className="ho-wow-stroke"
                style={{ animationDelay: "350ms" }}
              />
            </svg>
          )}
        </div>
      </div>
      <span aria-hidden className="hidden text-[22px] text-[var(--ho-muted)] sm:block">
        →
      </span>
      <div>
        <p className={`${LABEL} mb-3`}>Now: three things</p>
        <div className="flex flex-col gap-2.5">
          {[
            { label: "Repo", href: REPO_URL, at: 0 },
            { label: "Living prototype", href: PROTOTYPE_URL, at: 1 },
            { label: "Handoff page", href: HANDOFF_URL, at: 2 },
          ].map(b => (
            <a
              key={b.label}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-[opacity,translate] duration-500 ease-out ${
                phase === 2 ? "opacity-100" : "translate-y-2 opacity-0"
              }`}
              style={{ transitionDelay: phase === 2 ? `${b.at * 180}ms` : "0ms" }}
            >
              <KitButton variant="ghost" className="w-full bg-white">
                {b.label}
              </KitButton>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ variants */

export type Variant = { label: string; node: ReactNode }
const VARIANT_MS = 2200

/** Versions of one thing, switched through. */
export function VariantsDemo({ variants }: { variants: Variant[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const i = useCycle(inView, variants.length, VARIANT_MS)

  return (
    <div ref={ref} className="flex w-[520px] max-w-full flex-col items-center gap-5">
      <div className="flex gap-1 rounded-full bg-[#F4F4F4] p-1">
        {variants.map((v, n) => (
          <span
            key={v.label}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-300 ${
              n === i ? "bg-black text-white" : "text-neutral-500"
            }`}
          >
            {v.label}
          </span>
        ))}
      </div>
      <div className="flex h-[140px] w-full items-end justify-center rounded-[14px] bg-[#F4F4F4] pb-5 [&_*]:pointer-events-none">
        <div key={i} className="ho-art-tick">
          {variants[i].node}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------ a fix, committed */

const PILL_FIX_MS = 2600

/**
 * The real UI fix on Minh's branch (create-omat 7add0f65): the static
 * print-technique pill, before and after — classes lifted from the diff —
 * and the commit that carried it.
 */
export function PillFix() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const fixed = useCycle(inView, 2, PILL_FIX_MS) === 1

  return (
    <div ref={ref} className="flex w-[520px] max-w-full flex-col gap-5">
      <div className="flex h-[150px] items-center justify-center rounded-[14px] bg-[#F4F4F4]">
        <div
          className={`h-14 rounded-full p-1.5 transition-all duration-500 ${
            fixed ? "bg-white/50" : "bg-white shadow-xs"
          }`}
        >
          <div
            className={`flex h-full items-center gap-2 px-4 text-sm font-semibold transition-colors duration-500 ${
              fixed ? "text-neutral-600" : "text-black"
            }`}
          >
            Embroidery
          </div>
        </div>
      </div>
      <div className="rounded-[14px] bg-[#F4F4F4] p-4 font-[family-name:var(--ho-mono)] text-[12.5px] leading-[1.7]">
        <p className="m-0 text-[var(--ho-muted)]">chore/print-type-select-improvement</p>
        <p className="m-0">
          <span className="text-[var(--ho-muted)]">7add0f65</span> fix(designer): grey out the static print technique pill
        </p>
        <p className="m-0 text-red-700">- bg-white shadow-xs · text-black</p>
        <p className="m-0 text-green-700">+ bg-white/50 · text-neutral-600</p>
      </div>
    </div>
  )
}

/* ------------------------------------------- two services, side by side */

/**
 * The decoration service's precheck codes (create-omat src/types/Decoration.ts)
 * against what create-omat does with them (useEmbroideryDecoration.ts): the
 * size codes resize the design, everything else lands in one shared dialog.
 */
const SERVICE_GROUPS: { codes: string[]; shows: string }[] = [
  {
    codes: ["DESIGN_TOO_LARGE", "DESIGN_TOO_SMALL", "FONT_TOO_SMALL"],
    shows: "Resized to a suggested size",
  },
  {
    codes: ["DESIGN_TOO_COMPLEX", "LINES_TOO_THIN", "TEXT_TOO_SMALL"],
    shows: "One “too complex” dialog for all three",
  },
]

export function ServiceMap() {
  return (
    <div className="w-[560px] max-w-full">
      <div className="mb-3 grid grid-cols-[1fr_28px_1fr] gap-3">
        <p className={`${LABEL} m-0`}>Decoration service</p>
        <span />
        <p className={`${LABEL} m-0`}>create-omat shows</p>
      </div>
      <div className="flex flex-col gap-3">
        {SERVICE_GROUPS.map(g => (
          <div key={g.shows} className="grid grid-cols-[1fr_28px_1fr] items-center gap-3 rounded-[14px] bg-[#F4F4F4] p-4">
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 font-[family-name:var(--ho-mono)] text-[13px]">
              {g.codes.map(c => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <span aria-hidden className="text-center text-[var(--ho-muted)]">
              →
            </span>
            <p className="m-0 text-[14px] leading-snug font-semibold">{g.shows}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------- one system */

/** Two libraries kept in sync, above one — the kit, in code, as it ships. */
export function OneSystem() {
  return (
    <div className="mx-auto flex w-[460px] max-w-full flex-col items-stretch gap-4">
      <div>
        <p className={`${LABEL} mb-3`}>Before: two libraries</p>
        <div className="flex items-center justify-center gap-3 rounded-[14px] bg-[#F4F4F4] p-4">
          <Box>Figma library</Box>
          <span className="relative px-1 text-[12px] whitespace-nowrap text-neutral-500">
            sync
            <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rotate-[-20deg] bg-red-600" />
          </span>
          <Box>SPRD component kit</Box>
        </div>
      </div>
      <span aria-hidden className="text-center text-[22px] leading-none text-[var(--ho-muted)]">
        ↓
      </span>
      <div>
        <p className={`${LABEL} mb-3`}>Now: one, in code</p>
        <div className="flex items-center justify-center rounded-[14px] bg-[#F4F4F4] p-4">
          <Box>SPRD component kit</Box>
        </div>
      </div>
    </div>
  )
}

function Box({ children }: { children: ReactNode }) {
  return (
    // One fixed width for every box, so the lone kit below matches the kit above.
    <span className="w-[168px] shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-center text-[13px] font-semibold whitespace-nowrap">
      {children}
    </span>
  )
}
