"use client"

/**
 * /handoff/embroidery — embroidery that warns early, says exactly what is wrong
 * and always offers a way out. Every rule is a scene: its "If → Then" steps,
 * played on the designer's canvas (embroidery-scripts.tsx, on the engine in
 * embroidery-scene.tsx).
 *
 * The docks, bottom row, solutions, stitched preview, handles and AI results
 * are the shipping components; faked are the script (tweened, not dragged) and
 * the check itself — its verdict is the designer's mocked one for these designs.
 */

import { Fragment, useEffect, useState } from "react"
import { EMBROIDERY_MIN_LOADER_MS } from "@/components/designer"
import {
  EmbroideryMaxSizeBadge,
  EmbroideryPreviewStatus,
  PREVIEW_LANGS,
  SizeBadgePill,
  type EmbroiderySizeStatus,
} from "@/components/embroidery-label"
import { useCanvasProduct } from "@/components/handoff/embroidery-canvas"
import { HoopSizeStill } from "@/components/handoff/hoop-size-still"
import { ShineStill } from "@/components/handoff/shine-still"
import {
  AiScene,
  AiTrashScene,
  BasketScene,
  FitScene,
  GroupFitScene,
  GroupScene,
  IssueScene,
  PrintScene,
  ResizeScene,
  SwitchOnScene,
  TextScene,
  ZoomTipScene,
} from "@/components/handoff/embroidery-scripts"
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

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

const NAV: NavItem[] = [
  { id: "brief", mark: "◆", label: "Problem & Hypotheses" },
  { id: "s1", mark: "1", label: "Added at the hoop size" },
  { id: "s2", mark: "2", label: "Zoom tip" },
  { id: "s3", mark: "3", label: "Design shine" },
  { id: "s4", mark: "4", label: "Text waits" },
  { id: "s5", mark: "5", label: "The messages" },
  { id: "s6", mark: "6", label: "Too large on switch" },
  { id: "s7", mark: "7", label: "Resize and snap" },
  { id: "s8", mark: "8", label: "Fit to best size" },
  { id: "s9", mark: "9", label: "Combinations" },
  { id: "s10", mark: "10", label: "Combination fit" },
  { id: "s11", mark: "11", label: "Design issues" },
  { id: "s12", mark: "12", label: "Fix / Simplify with AI" },
  { id: "s13", mark: "13", label: "Removed mid-run" },
  { id: "s14", mark: "14", label: "Switch to print" },
  { id: "s15", mark: "15", label: "Add to basket" },
]

/** The messages §5 lists, each with the situation that brings it up. */
const MESSAGES: { note: string; status: EmbroiderySizeStatus; label?: string; action?: boolean }[] = [
  { note: "past the hoop frame", status: "too-large", action: true },
  {
    note: "several, together past it",
    status: "too-large",
    label: "Combination of designs too large for embroidery",
    action: true,
  },
  { note: "lines too thin to stitch", status: "thin-line", action: true },
  { note: "too much detail", status: "too-complex", action: true },
  { note: "back within the frame", status: "good" },
  { note: "after Switch to print", status: "print-switched" },
]

/* ------------------------------------------------------------------ demos */

/** A boolean that is on for `onMs`, off for `offMs`, on a loop. */
function usePulse(onMs: number, offMs: number) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setOn(o => !o), on ? onMs : offMs)
    return () => window.clearTimeout(t)
  }, [on, onMs, offMs])
  return on
}

/** §2 — the pill in every language it has: one width each, the longer statement's. */
function LanguagePills() {
  const loading = usePulse(EMBROIDERY_MIN_LOADER_MS, 1200)
  return (
    <div className="flex justify-center rounded-[12px] bg-[#F4F4F4] px-6 py-[46px]">
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
    </div>
  )
}

/** §5 — every message, with what brings it up. */
function Messages() {
  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-3 gap-y-5 rounded-[12px] bg-[#F4F4F4] px-6 py-6 whitespace-nowrap">
        {MESSAGES.map(({ note, status, label, action }) => (
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
                docked={action}
                onSeeOptions={() => {}}
                onFitToSize={status === "too-large" ? () => {} : undefined}
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
  )
}

/** A section's number, on a small rounded black badge before its kicker. */
function Num({ n }: { n: number }) {
  return (
    <span className="mr-2 inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-black px-1.5 align-[1px] text-[16px] leading-none tracking-normal text-white">
      {n}
    </span>
  )
}

/** A rule: kicker, title, one line, and its scene. */
function Rule({
  id,
  n,
  kicker,
  title,
  line,
  children,
  note,
  after,
}: {
  id: string
  n: number
  kicker: string
  title: string
  line: string
  children: React.ReactNode
  note?: React.ReactNode
  /** More under the scene — a second demo. */
  after?: React.ReactNode
}) {
  return (
    <Section id={id}>
      <Kicker>
        <Num n={n} />
        {kicker}
      </Kicker>
      <SectionHead title={title} />
      <p>{line}</p>
      <Demo padding="p-3.5" className="overflow-x-auto">
        {children}
      </Demo>
      {after}
      {note && <Note>{note}</Note>}
    </Section>
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
        <Note>
          Every section below is one rule: its steps as &ldquo;If → Then&rdquo;, played on the
          canvas with the step on screen lit. Desktop, single designs and texts alike unless it says
          several. On mobile the dock is the bottom row: the messages swap with it the same way.
        </Note>
      </Section>

      <Rule
        id="s1"
        n={1}
        kicker="Added at the hoop size"
        title="Added at the hoop frame's size"
        line="Designs and texts start at the largest size that stitches"
      >
        <HoopSizeStill product={product} />
      </Rule>

      <Rule
        id="s2"
        n={2}
        kicker="Zoom tip"
        title="The first preview asks to be looked at closely"
        line="Once per session — “Zoom in” is the only way on"
        note={
          <>
            &ldquo;Preview is done…&rdquo; and &ldquo;Checking quality&rdquo; need new translation
            keys; &ldquo;Creating preview&rdquo; has one in every locale. Once per session:
            sessionStorage <code>embroidery-zoom-hint-seen</code>.
          </>
        }
        after={
          <>
            <p className="ho-caption">
              The loader: one width per language, the longer statement&rsquo;s
            </p>
            <Demo padding="p-3.5" className="overflow-x-auto">
              <LanguagePills />
            </Demo>
          </>
        }
      >
        <ZoomTipScene product={product} />
      </Rule>

      <Rule
        id="s3"
        n={3}
        kicker="Design shine"
        title="The design shines while it's checked"
        line="A light sweep over the design's own pixels, never the product — with “Creating preview”"
      >
        <ShineStill />
      </Rule>

      <Rule
        id="s4"
        n={4}
        kicker="Text waits"
        title="A text is checked only once it's let go"
        line="Typing comes first — the check waits for the deselect"
      >
        <TextScene product={product} />
      </Rule>

      <Section id="s5">
        <Kicker>
          <Num n={5} />
          The messages
        </Kicker>
        <SectionHead title="Every message names its problem — and its way out" />
        <p>In the bottom row&rsquo;s place, swapping with it: one slides out, the next slides up</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <Messages />
        </Demo>
      </Section>

      <Rule
        id="s6"
        n={6}
        kicker="Too large on switch"
        title="Too large — size wins, nothing else runs"
        line="Past the hoop frame there's no preview and no check: the size message, at once"
      >
        <SwitchOnScene product={product} />
      </Rule>

      <Rule
        id="s7"
        n={7}
        kicker="Resize and snap"
        title="Resize back to the hoop size — it snaps and turns green"
        line="The guide shows the size that fits; the messages swap live while the handle is held"
      >
        <ResizeScene product={product} />
      </Rule>

      <Rule
        id="s8"
        n={8}
        kicker="Fit to best size"
        title="Fit to best size — one click to the hoop size"
        line="The secondary button under “Design too large”, always there with it"
      >
        <FitScene product={product} />
      </Rule>

      <Rule
        id="s9"
        n={9}
        kicker="Combinations"
        title="Several designs are measured as one"
        line="The hoop frame holds the whole group; the verdict is live while one is moved"
      >
        <GroupScene product={product} />
      </Rule>

      <Rule
        id="s10"
        n={10}
        kicker="Combination fit"
        title="Fit to best size for a combination — closer first, smaller only if needed"
        line="Both steps anchored on the group's centre"
      >
        <GroupFitScene product={product} />
      </Rule>

      <Rule
        id="s11"
        n={11}
        kicker="Design issues"
        title="Thin lines or too complex — named, and nothing to resize"
        line="Shown on the customer's own upload: the check flags it, it keeps its look, its handles step back"
      >
        <IssueScene product={product} />
      </Rule>

      <Rule
        id="s12"
        n={12}
        kicker="Fix / Simplify with AI"
        title="Fix with AI — runs at once, reviewed on the canvas"
        line="The AI reworks the customer's own file — no new design. Kept only once accepted"
      >
        <AiScene product={product} />
      </Rule>

      <Rule
        id="s13"
        n={13}
        kicker="Removed mid-run"
        title="The trash stays while the AI runs"
        line="Removing the design is still one click — and it ends the run"
      >
        <AiTrashScene product={product} />
      </Rule>

      <Rule
        id="s14"
        n={14}
        kicker="Switch to print"
        title="Switch to print — said once, then back to normal"
        line="A green message alone, then the row already on standard print"
      >
        <PrintScene product={product} />
      </Rule>

      <Rule
        id="s15"
        n={15}
        kicker="Add to basket"
        title="Add to basket — checked first, refused with a warning up"
        line="A design not checked yet is checked; a warning refuses it"
      >
        <BasketScene product={product} />
      </Rule>

      <HandoffEnd />
    </HandoffShell>
  )
}
