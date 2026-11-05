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
import { EMBROIDERY_MIN_LOADER_MS, RECOVERED_GOOD_SIZE_MS } from "@/components/designer"
import {
  EmbroideryMaxSizeBadge,
  EmbroideryPreviewStatus,
  PREVIEW_LANGS,
  SizeBadgePill,
  type EmbroiderySizeStatus,
} from "@/components/embroidery-label"
import { useCanvasProduct } from "@/components/handoff/embroidery-canvas"
import {
  AiScene,
  AiTrashScene,
  BasketScene,
  CheckScene,
  FitScene,
  GroupFitScene,
  GroupScene,
  IssueScene,
  MidCheckScene,
  MinSizeScene,
  MoveScene,
  PrintScene,
  ResizeScene,
  SwitchOnScene,
  TextScene,
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
  { id: "s1", mark: "1", label: "Checked at once" },
  { id: "s2", mark: "2", label: "Text waits" },
  { id: "s3", mark: "3", label: "Selected mid-check" },
  { id: "s4", mark: "4", label: "The messages" },
  { id: "s5", mark: "5", label: "Too large on switch" },
  { id: "s6", mark: "6", label: "Resize and snap" },
  { id: "s7", mark: "7", label: "Moving" },
  { id: "s8", mark: "8", label: "Fit to best size" },
  { id: "s9", mark: "9", label: "Own minimum" },
  { id: "s10", mark: "10", label: "Combinations" },
  { id: "s11", mark: "11", label: "Combination fit" },
  { id: "s12", mark: "12", label: "Design issues" },
  { id: "s13", mark: "13", label: "Fix / Simplify with AI" },
  { id: "s14", mark: "14", label: "Removed mid-run" },
  { id: "s15", mark: "15", label: "Switch to print" },
  { id: "s16", mark: "16", label: "Add to basket" },
  { id: "s17", mark: "17", label: "At a glance" },
]

/** The messages §4 lists, each with the situation that brings it up. */
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

/** §17 — every rule in one line, pointing at its scene. */
const RULES: { when: string; then: string; at: string }[] = [
  { when: "Design added in embroidery", then: "Placed unselected, checked at once", at: "s1" },
  { when: "First stitched preview of the session", then: "“Preview is done…” + Zoom in, row held back", at: "s1" },
  { when: "Already zoomed in this session", then: "No zoom message", at: "s1" },
  { when: "Text added in embroidery", then: "Selected, not checked until deselected", at: "s2" },
  { when: "Selected while checking", then: "Check continues, result held until deselect", at: "s3" },
  { when: "Changed while selected (not just moved)", then: "Fresh check on deselect", at: "s3" },
  { when: "Past the hoop frame", then: "No preview, no check — the message at once", at: "s5" },
  { when: "Too large", then: "Selected for you, can’t be deselected until it fits", at: "s5" },
  { when: "Corner handle hovered", then: "Guide + arrow move to it", at: "s6" },
  { when: "Resized across the hoop size", then: "Snaps; orange ↔ green messages slide-swap live", at: "s6" },
  { when: "Back within the frame", then: `Green for ${RECOVERED_GOOD_SIZE_MS / 1000} s, then blue and checked`, at: "s6" },
  { when: "Moved while too large", then: "Guide/blur/handles go, message stays", at: "s7" },
  { when: "Fit to best size (single)", then: "Shrinks about its centre to the hoop, bounce", at: "s8" },
  { when: "Shrunk to its own minimum", then: "Stops with a bounce + “Min. size”", at: "s9" },
  { when: "Grown", then: "No maximum — the frame only warns", at: "s9" },
  { when: "2nd design added", then: "Placed inside the frame, checked", at: "s10" },
  { when: "Group moved past the frame", then: "Combination message live, no check", at: "s10" },
  { when: "Fit to best size (combination)", then: "Draw together, then shrink if needed", at: "s11" },
  { when: "Thin lines / too complex", then: "No stitched preview, message + See solutions", at: "s12" },
  { when: "Issue design selected", then: "No resize/rotate/move handles", at: "s12" },
  { when: "Fix / Simplify now", then: "Runs at once, no AI panel", at: "s13" },
  { when: "AI result in", then: "Review on canvas, zoom alone in the row", at: "s13" },
  { when: "Accepted", then: "Checked, then the whole row back", at: "s13" },
  { when: "Cancelled", then: "The warning comes back", at: "s13" },
  { when: "Trash while the AI runs", then: "Design removed, run stopped", at: "s14" },
  { when: "Switch to print", then: "Green message only, then the row on Standard print", at: "s15" },
  { when: "Add to basket with a warning up", then: "Refused — shake + canvas flash", at: "s16" },
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

/** §1 — the pill in every language it has: one width each, the longer statement's. */
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

/** §4 — every message, with what brings it up. */
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

/** §17 — the rules in one table, each pointing at its scene. */
function AtAGlance() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)_auto] items-baseline gap-x-3 gap-y-2.5 rounded-[12px] bg-white px-5 py-5">
      {RULES.map(({ when, then, at }) => (
        <Fragment key={`${when}-${at}`}>
          <span className="text-[13px] leading-snug text-[var(--ho-muted)]">{when}</span>
          <span aria-hidden className="text-[13px] text-[var(--ho-line-strong)]">
            →
          </span>
          <span className="text-[13px] leading-snug text-black">{then}</span>
          <a
            href={`#${at}`}
            className="font-[family-name:var(--ho-mono)] text-[11px] text-green-700 no-underline hover:underline"
          >
            §{at.slice(1)}
          </a>
        </Fragment>
      ))}
    </div>
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
        §{n} · {kicker}
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
          several. On mobile the messages sit at the top of the canvas instead of the bottom
          row&rsquo;s place.
        </Note>
      </Section>

      <Rule
        id="s1"
        n={1}
        kicker="Checked at once"
        title="Checked the moment it's on the product"
        line="No waiting for add to basket — and the first stitched preview asks to be looked at closely"
        note={
          <>
            &ldquo;Checking quality&rdquo; and &ldquo;Preview is done…&rdquo; need new translation
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
        <CheckScene product={product} />
      </Rule>

      <Rule
        id="s2"
        n={2}
        kicker="Text waits"
        title="A text is checked only once it's let go"
        line="Typing comes first — the check waits for the deselect"
      >
        <TextScene product={product} />
      </Rule>

      <Rule
        id="s3"
        n={3}
        kicker="Selected mid-check"
        title="Selecting doesn't cancel the check"
        line="It runs on in the background; only a real change makes it start over"
      >
        <MidCheckScene product={product} />
      </Rule>

      <Section id="s4">
        <Kicker>§4 · The messages</Kicker>
        <SectionHead title="Every message names its problem — and its way out" />
        <p>In the bottom row&rsquo;s place, swapping with it: one slides out, the next slides up</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <Messages />
        </Demo>
      </Section>

      <Rule
        id="s5"
        n={5}
        kicker="Too large on switch"
        title="Too large — size wins, nothing else runs"
        line="Past the hoop frame there's no preview and no check: the size message, at once"
        note={
          <>
            The hoop frame is mocked per garment in lib/embroidery-limits.ts — the decoration
            service only answers &ldquo;too large&rdquo;. The real sizes, in cm, are still to come.
          </>
        }
      >
        <SwitchOnScene product={product} />
      </Rule>

      <Rule
        id="s6"
        n={6}
        kicker="Resize and snap"
        title="Resize back to the hoop size — it snaps and turns green"
        line="The guide shows the size that fits; the messages swap live while the handle is held"
      >
        <ResizeScene product={product} />
      </Rule>

      <Rule
        id="s7"
        n={7}
        kicker="Moving"
        title="Moving clears the way — the message stays"
        line="Everything that's about the size steps aside for the move"
      >
        <MoveScene product={product} />
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
        kicker="Own minimum"
        title="A design's own minimum stops the resize"
        line="Some designs can't be stitched below a size — set per design, the only size stop"
      >
        <MinSizeScene product={product} />
      </Rule>

      <Rule
        id="s10"
        n={10}
        kicker="Combinations"
        title="Several designs are measured as one"
        line="The hoop frame holds the whole group; the verdict is live while one is moved"
      >
        <GroupScene product={product} />
      </Rule>

      <Rule
        id="s11"
        n={11}
        kicker="Combination fit"
        title="Fit to best size for a combination — closer first, smaller only if needed"
        line="Both steps anchored on the group's centre"
      >
        <GroupFitScene product={product} />
      </Rule>

      <Rule
        id="s12"
        n={12}
        kicker="Design issues"
        title="Thin lines or too complex — named, and nothing to resize"
        line="Found by the check; the design keeps its look, its handles step back"
      >
        <IssueScene product={product} />
      </Rule>

      <Rule
        id="s13"
        n={13}
        kicker="Fix / Simplify with AI"
        title="Fix with AI — runs at once, reviewed on the canvas"
        line="Thin lines are thickened, a too complex design simplified; nothing is kept until accepted"
      >
        <AiScene product={product} />
      </Rule>

      <Rule
        id="s14"
        n={14}
        kicker="Removed mid-run"
        title="The trash stays while the AI runs"
        line="Removing the design is still one click — and it ends the run"
      >
        <AiTrashScene product={product} />
      </Rule>

      <Rule
        id="s15"
        n={15}
        kicker="Switch to print"
        title="Switch to print — said once, then back to normal"
        line="A green message alone, then the row already on standard print"
      >
        <PrintScene product={product} />
      </Rule>

      <Rule
        id="s16"
        n={16}
        kicker="Add to basket"
        title="Add to basket — refused, pointing at the warning"
        line="While any warning is up the basket refuses the design"
      >
        <BasketScene product={product} />
      </Rule>

      <Section id="s17">
        <Kicker>§17 · At a glance</Kicker>
        <SectionHead title="Every rule in one line" />
        <p>For the review — each points at its scene</p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <AtAGlance />
        </Demo>
      </Section>

      <HandoffEnd />
    </HandoffShell>
  )
}
