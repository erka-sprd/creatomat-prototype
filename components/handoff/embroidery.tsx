"use client"

/**
 * /handoff/embroidery — embroidery that warns early, says exactly what is wrong
 * and always offers a way out: the check runs the moment embroidery is on, the
 * size is shown against the hoop frame, and every design issue comes with its
 * solutions.
 *
 * The badges, the "Creating preview" pill, the solutions, the stitched preview
 * and the technique switcher are the shipping components; the canvas around
 * them is the designer's markup (embroidery-canvas.tsx). Faked: the scripted
 * resize (tweened, not snapped), and the check itself — its result is the
 * designer's mocked one for these designs.
 */

import { Fragment, useEffect, useState } from "react"
import {
  COMPLEX_GRAPHIC_SRCS,
  EMBROIDERY_MIN_LOADER_MS,
  RECOVERED_GOOD_SIZE_MS,
  SELECTION_TONE,
  SWITCH_CONFIRM_MS,
} from "@/components/designer"
import {
  EmbroideryMaxSizeBadge,
  EmbroideryPreviewStatus,
  PREVIEW_LANGS,
  SizeBadgePill,
  type EmbroiderySizeStatus,
} from "@/components/embroidery-label"
import { EmbroiderySolutions } from "@/components/embroidery-solutions"
import {
  CheckWalkthrough,
  SizeWalkthrough,
  useCanvasProduct,
} from "@/components/handoff/embroidery-canvas"
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
import { KitButton } from "@/components/kit-button"
import { TechniqueSwitcher } from "@/components/merged-bottom-row"
import { printAreaTotal } from "@/lib/print-area-pricing"
import { simplifyImage } from "@/lib/simplify-image"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

/** The boy with the fish — too complex, and the one to try Simplify with AI on. */
const COMPLEX_SRC = COMPLEX_GRAPHIC_SRCS[1]

const NAV: NavItem[] = [
  { id: "brief", mark: "◆", label: "Problem & Hypotheses" },
  { id: "s1", mark: "1", label: "Checked at once" },
  { id: "s2", mark: "2", label: "Named warnings" },
  { id: "s3", mark: "3", label: "Hoop frame" },
  { id: "s4", mark: "4", label: "Solutions" },
  { id: "s5", mark: "5", label: "Simplify with AI" },
  { id: "s6", mark: "6", label: "Switch to print" },
  { id: "s7", mark: "7", label: "Add to basket" },
  { id: "s8", mark: "8", label: "Rules" },
]

const seconds = (ms: number) => `${ms / 1000} s`

/** What the solutions' print card saves, as the designer words it — one decorated area. */
const PRINT_SAVING = printAreaTotal(["front"], "embroidery") - printAreaTotal(["front"], "standard")
const PRINT_SAVING_LABEL =
  PRINT_SAVING > 0 ? `${PRINT_SAVING.toFixed(2).replace(".", ",")} € cheaper than embroidery` : null

/** The warnings §2 lists, each with the situation that brings it up. */
const WARNINGS: { note: string; status: EmbroiderySizeStatus; label?: string }[] = [
  { note: "past the hoop frame", status: "too-large" },
  {
    note: "several, together past it",
    status: "too-large",
    label: "Combination of designs too large for embroidery",
  },
  { note: "lines too thin to stitch", status: "thin-line" },
  { note: "too much detail", status: "too-complex" },
  { note: "back within the frame", status: "good" },
]

/** §8 — the logic, situation by situation. */
const RULES: { when: string; then: string }[] = [
  {
    when: "Embroidery turned on, or a design added",
    then: "Checked at once — “Creating preview”, then “Checking quality”",
  },
  {
    when: "Past the hoop frame",
    then: "No preview and no check — the size message shows straight away",
  },
  {
    when: "Switched to embroidery while too large",
    then: "Selected for you, with the hoop guide already showing",
  },
  {
    when: "Too large and selected",
    then: "Can’t be deselected until it fits — tap outside is ignored",
  },
  { when: "A corner handle hovered", then: "Guide and arrow move to that handle at once" },
  {
    when: "Moved while too large",
    then: "Guide, arrow and blur go, the message stays, no editor bar — all back on release",
  },
  {
    when: "Resized while too large",
    then: "Free both ways, snaps at the hoop size; the editor bar waits for the release",
  },
  {
    when: "Brought back within the frame",
    then: `“Good design size” for ${seconds(RECOVERED_GOOD_SIZE_MS)}, then the frame eases back to blue`,
  },
  {
    when: "A second or third design added",
    then: "Placed inside the frame beside the others, and checked as usual",
  },
  {
    when: "Several moved past the frame",
    then: "The combination warning replaces the check, live during the move",
  },
  {
    when: "Selected while the check runs",
    then: "The check carries on; its result waits until deselected. Changed meanwhile — not just moved — it checks again",
  },
  {
    when: "Shrunk to its own minimum",
    then: "The resize stops with a bounce — “Min. size for embroidery”",
  },
  { when: "Add to basket with a warning up", then: "Refused — the warning shakes, the canvas flashes" },
]

/* ------------------------------------------------------------------ demos */

/** A patch of the designer's canvas, for pieces that sit on it. */
function Canvas({
  children,
  padding = "px-6 py-[46px]",
  className = "",
}: {
  children: React.ReactNode
  padding?: string
  className?: string
}) {
  return (
    <div className={`relative flex justify-center rounded-[12px] bg-[#F4F4F4] ${padding} ${className}`}>
      {children}
    </div>
  )
}

/** A boolean that is on for `onMs`, off for `offMs`, on a loop. */
function usePulse(onMs: number, offMs: number) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setOn(o => !o), on ? onMs : offMs)
    return () => window.clearTimeout(t)
  }, [on, onMs, offMs])
  return on
}

/** §1 — the pill in every language it has: one width each, the longer statement's. */
function LanguagePills() {
  const loading = usePulse(EMBROIDERY_MIN_LOADER_MS, 1200)
  return (
    <div className="grid grid-cols-[auto_auto] items-center gap-x-6 gap-y-4">
      {PREVIEW_LANGS.map(lang => (
        <Fragment key={lang}>
          <span className="text-right font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
            {lang}
          </span>
          <div className="flex justify-start">
            <EmbroideryPreviewStatus
              docked
              lang={lang}
              loading={loading}
              durationMs={EMBROIDERY_MIN_LOADER_MS}
            />
          </div>
        </Fragment>
      ))}
    </div>
  )
}

/** §5 — the result up for review: before/after, then cancel or accept. Live. */
function SimplifyReview() {
  const [after, setAfter] = useState<string | null>(null)
  const [showBefore, setShowBefore] = useState(false)
  useEffect(() => {
    let live = true
    simplifyImage(COMPLEX_SRC)
      .then(src => live && setAfter(src))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return (
    <Canvas padding="px-6 pt-[86px] pb-[96px]">
      <div className="relative size-[220px]">
        <img
          src={showBefore || !after ? COMPLEX_SRC : after}
          alt=""
          draggable={false}
          className="size-full object-contain"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ boxShadow: `0 0 0 1px ${SELECTION_TONE.blue.hex}` }}
        />
        <div
          role="radiogroup"
          aria-label="Compare with the original"
          className="absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 rounded-full bg-white p-1 whitespace-nowrap shadow-xs"
        >
          {[
            { label: "Before", before: true },
            { label: "After", before: false },
          ].map(option => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={showBefore === option.before}
              onClick={() => setShowBefore(option.before)}
              className={`min-h-8 cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors ${
                showBefore === option.before
                  ? "bg-neutral-200 text-black"
                  : "text-black hover:bg-neutral-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="absolute top-full left-1/2 mt-1 flex -translate-x-1/2 gap-2 whitespace-nowrap">
          <KitButton variant="ghost" size="m" className="bg-white">
            Cancel
          </KitButton>
          <KitButton size="m">Accept</KitButton>
        </div>
      </div>
    </Canvas>
  )
}

/** §6 — the switch made: the row names standard print, a tick in its icon's place. */
function SwitchConfirm() {
  const [phase, setPhase] = useState<"embroidery" | "confirmed" | "standard">("embroidery")
  useEffect(() => {
    const next = { embroidery: "confirmed", confirmed: "standard", standard: "embroidery" } as const
    const hold = { embroidery: 1800, confirmed: SWITCH_CONFIRM_MS, standard: 1800 }[phase]
    const t = window.setTimeout(() => setPhase(next[phase]), hold)
    return () => window.clearTimeout(t)
  }, [phase])
  return (
    <Canvas className="[&_*]:pointer-events-none">
      <TechniqueSwitcher
        value={phase === "embroidery" ? "embroidery" : "standard"}
        onChange={() => {}}
        embroiderySupported
        confirmed={phase === "confirmed"}
      />
    </Canvas>
  )
}

/** §7 — a refused add to basket: the warning shakes, the canvas edge flashes orange. */
function RefusedBasket() {
  const [refusals, setRefusals] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setRefusals(n => n + 1), 3500)
    return () => window.clearInterval(t)
  }, [])
  return (
    <Canvas padding="px-6 py-[60px]" className="overflow-hidden">
      <div key={refusals} className={refusals ? "embroidery-shake" : undefined}>
        <SizeBadgePill status="too-complex" docked onSeeOptions={() => {}} />
      </div>
      {refusals > 0 && (
        <div
          key={`border-${refusals}`}
          aria-hidden="true"
          className="canvas-alert-border pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      )}
    </Canvas>
  )
}

/* -------------------------------------------------------------------- page */

export default function Embroidery() {
  const product = useCanvasProduct()

  return (
    <HandoffShell
      slug="embroidery"
      items={NAV}
      links={[
        { label: "Prototype", href: PROTOTYPE },
        { label: "Repo", href: REPO },
      ]}
    >
      <HandoffHeader
        title="Embroidery, without dead ends"
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
                Users learn a design can&rsquo;t be embroidered too late — at add to basket, after
                they have finished designing.
              </li>
              <li>
                The warnings say something is wrong, not what: not how large the design may be, nor
                which part of it can&rsquo;t be stitched.
              </li>
              <li>
                There is little they can do about it. A warning with no way forward leaves them at a
                dead end, and many leave the designer there.
              </li>
            </ul>
          </BriefCard>
          <BriefCard tone="hypothesis" label="Hypothesis">
            We believe checking the design the moment embroidery is on, naming each problem on the
            canvas, showing the size that fits, and pairing every warning with a way out lets users
            fix their design instead of giving up on it — so more of them order embroidery.
          </BriefCard>
          <BriefCard tone="win" label="What win looks like">
            <ul>
              <li>
                More embroidery orders, and fewer sessions that end on an embroidery warning.
              </li>
            </ul>
          </BriefCard>
          <BriefCard tone="result" label="Result">
            Will follow.
          </BriefCard>
        </Brief>
      </Section>

      {/* -------------------------------------------------------------- §1 */}
      <Section id="s1">
        <Kicker>§1 · Checked at once</Kicker>
        <SectionHead title="Checked the moment embroidery is on" />
        <p>
          No waiting for add to basket: the design is checked as soon as it&rsquo;s on the product,
          and the stitched preview takes its place
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <CheckWalkthrough product={product} />
        </Demo>
        <p className="ho-caption">One width per language, the longer statement&rsquo;s</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <Canvas>
            <LanguagePills />
          </Canvas>
        </Demo>
        <Note>
          &ldquo;Checking quality&rdquo; needs a new translation key; &ldquo;Creating
          preview&rdquo; already has one in every locale.
        </Note>
      </Section>

      {/* -------------------------------------------------------------- §2 */}
      <Section id="s2">
        <Kicker>§2 · Named warnings</Kicker>
        <SectionHead title="Every warning names its problem" />
        <p>A design issue carries its way out in the same frame</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-3 gap-y-5 rounded-[12px] bg-[#F4F4F4] px-6 py-6 whitespace-nowrap">
              {WARNINGS.map(({ note, status, label }) => (
                <Fragment key={note}>
                  <span className="text-right font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
                    {note}
                  </span>
                  <span aria-hidden className="text-[13px] text-[var(--ho-line-strong)]">
                    →
                  </span>
                  <div className="flex">
                    <SizeBadgePill
                      status={status}
                      label={label}
                      onSeeOptions={status === "thin-line" || status === "too-complex" ? () => {} : undefined}
                    />
                  </div>
                </Fragment>
              ))}
              <span className="text-right font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
                below its own minimum
              </span>
              <span aria-hidden className="text-[13px] text-[var(--ho-line-strong)]">
                →
              </span>
              <div className="flex">
                <EmbroideryMaxSizeBadge show label="Min. size for embroidery" />
              </div>
            </div>
          </div>
        </Demo>
        <Note>
          On desktop the warnings take the bottom row&rsquo;s place, the row sliding out as they
          slide in; on mobile they sit at the top of the canvas.
        </Note>
      </Section>

      {/* -------------------------------------------------------------- §3 */}
      <Section id="s3">
        <Kicker>§3 · Hoop frame</Kicker>
        <SectionHead title="Too large - the size that fits, shown on the design" />
        <p>
          Green stripes mark the hoop frame and the arrow points to it; drag a handle down and it
          snaps there and turns green
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <SizeWalkthrough product={product} />
        </Demo>
        <Note>
          The hoop frame is mocked per garment in lib/embroidery-limits.ts — the decoration
          service only answers &ldquo;too large&rdquo;. The real sizes, in cm, are still to come.
        </Note>
      </Section>

      {/* -------------------------------------------------------------- §4 */}
      <Section id="s4">
        <Kicker>§4 · Solutions</Kicker>
        <SectionHead title="See solutions - two ways out" />
        <p>Thin lines or too complex: simplify it with AI, or print it instead</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <Canvas padding="px-4 py-[46px]">
            <div className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-xl">
              <EmbroiderySolutions
                designSrc={COMPLEX_SRC}
                printSavingLabel={PRINT_SAVING_LABEL}
                onClose={() => {}}
                onSimplifyWithAI={() => {}}
                onSwitchToPrint={() => {}}
              />
            </div>
          </Canvas>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §5 */}
      <Section id="s5">
        <Kicker>§5 · Simplify with AI</Kicker>
        <SectionHead title="Simplify with AI - compare, then accept" />
        <p>The result is up for review on the canvas; accepted, it is checked again</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <SimplifyReview />
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §6 */}
      <Section id="s6">
        <Kicker>§6 · Switch to print</Kicker>
        <SectionHead title="Switch to print - confirmed in the row" />
        <p>
          The warning leaves with the embroidery; the row changes to standard print with a tick for{" "}
          {seconds(SWITCH_CONFIRM_MS)}
        </p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <SwitchConfirm />
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §7 */}
      <Section id="s7">
        <Kicker>§7 · Add to basket</Kicker>
        <SectionHead title="Add to basket - refused, pointing at the warning" />
        <p>While a warning is up the basket refuses the design, and the warning shakes</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <RefusedBasket />
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §8 */}
      <Section id="s8">
        <Kicker>§8 · Rules</Kicker>
        <SectionHead title="The rules, situation by situation" />
        <p>Single designs and texts alike, unless it says several</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="mx-auto grid max-w-[720px] grid-cols-[minmax(0,2fr)_auto_minmax(0,3fr)] items-baseline gap-x-4 gap-y-4 rounded-[12px] bg-white">
            {RULES.map(({ when, then }) => (
              <Fragment key={when}>
                <span className="text-right font-[family-name:var(--ho-mono)] text-[12px] leading-snug text-[var(--ho-muted)]">
                  {when}
                </span>
                <span aria-hidden className="text-[13px] text-[var(--ho-line-strong)]">
                  →
                </span>
                <span className="text-[14px] leading-snug text-black">{then}</span>
              </Fragment>
            ))}
          </div>
        </Demo>
      </Section>

      <HandoffEnd />
    </HandoffShell>
  )
}
