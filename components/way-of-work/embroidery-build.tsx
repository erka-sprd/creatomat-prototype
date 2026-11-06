"use client"

/**
 * /ux-new-way-of-work — embroidery, built together: the simplest rules of
 * the handoff, each as a short prompt, the scene that shows it (the handoff's
 * own scenes, without their step lists) and, on the last ↓, what that step
 * brings the company. The heading says the point; the prompt just asks.
 */

import { EmbroideryMaxSizeBadge, SizeBadgePill } from "@/components/embroidery-label"
import { useCanvasProduct } from "@/components/handoff/embroidery-canvas"
import { EmbroideryArt } from "@/components/handoff/handoff-card-art"
import { AiScene, CheckScene, FitScene, IssueScene, TextScene } from "@/components/handoff/embroidery-scripts"
import {
  BuildPage,
  EndLinks,
  HandoffCard,
  NotesCard,
  OutcomesGrid,
  type Beat,
} from "@/components/way-of-work/build-page"
import { OneSystem, QaToThree, ServiceMap, TierDemo, VariantsDemo, type Variant } from "@/components/way-of-work/visuals"

const noop = () => {}

const NOTES = [
  "Checked the moment a design is added; text waits until it's deselected",
  "Too large ⇒ no check, the message at once; auto-selected until it fits",
  "Fit to best size: shrinks to the hoop, small bounce, green for 2 s",
  "Thin lines / too complex: no preview, a message and See solutions",
  "Every message, button and frame is the kit's own",
]

/** "Too large", three ways, built fast — the real pieces, the third shipped. */
const TOO_LARGE_VARIANTS: Variant[] = [
  {
    label: "A hard stop",
    node: (
      <div className="relative h-10 w-[240px]">
        <EmbroideryMaxSizeBadge show label="Max. size for embroidery" />
      </div>
    ),
  },
  { label: "A warning", node: <SizeBadgePill status="too-large" /> },
  {
    label: "A warning + one click",
    node: <SizeBadgePill status="too-large" docked onFitToSize={noop} />,
  },
]

/** Minh's answer in chat (29.10), as the starter. The screenshot lives in public/img/way-of-work. */
const MINH_CHAT = "/img/way-of-work/minh-chat.png"

/** The whole talk in six lines, shown right after the title. */
const SUMMARY = [
  "Start building with Claude",
  "The handoff builds itself with you",
  "Real data, so no detail gets missed",
  "Test with users immediately",
  "Devs build the details faster",
  "QA is far faster than before",
]

function Summary() {
  return (
    <>
      <p className="m-0 mb-8 font-[family-name:var(--ho-mono)] text-[12px] tracking-[0.1em] text-[var(--ho-muted)] uppercase">
        In short
      </p>
      {/* One column, an arrow between each step, so the order reads at a glance. */}
      <ol className="m-0 flex list-none flex-col items-center p-0 text-left">
        {SUMMARY.map((s, n) => (
          <li
            key={s}
            className="ho-wow-in flex flex-col items-center"
            style={{ animationDelay: `${n * 120}ms` }}
          >
            {n > 0 && (
              <span aria-hidden className="py-1 text-[16px] leading-none text-[var(--ho-muted)]">
                ↓
              </span>
            )}
            <span className="flex w-[440px] max-w-full items-center gap-4 rounded-2xl bg-[var(--ho-paper)] px-6 py-3.5">
              <span className="font-[family-name:var(--ho-mono)] text-[13px] text-[var(--ho-muted)]">{n + 1}</span>
              <span className="font-display text-[18px] leading-[1.25] font-medium tracking-[-0.01em]">{s}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  )
}

function Beats({ product }: { product: ReturnType<typeof useCanvasProduct> }): Beat[] {
  return [
    {
      id: "minh",
      // The starter: Erkan's question in a black bubble (this one went to a
      // developer, not to Claude), Minh's answer as he wrote it.
      body: (
        <>
          <p className="m-0 mb-6 max-w-[44ch] rounded-[16px] rounded-br-[4px] bg-black px-5 py-3.5 text-left text-[17px] leading-[1.45] text-white">
            How is it for you, working with the new handoffs and prototypes?
          </p>
          <img
            src={MINH_CHAT}
            alt="Minh in chat: as devs we focus on logic more than UI, so details get lost; the handoff immediately shows me what the way is — Figma can't."
            className="w-[560px] max-w-full rounded-[12px]"
          />
        </>
      ),
    },
    {
      id: "title",
      kicker: "UX · building together with Claude",
      title: "A new way of working",
      lede: "Explained with the embroidery improvements.",
    },
    { id: "summary", body: <Summary /> },
    {
      id: "check",
      heading: "Built on the [[real product]], with [[real interactions]]",
      prompt: "Add embroidery. Check every design as soon as it lands and show a stitched preview.",
      reply: "Done. A loader, then the stitched render on the T-shirt.",
      render: () => <CheckScene product={product} showSteps={false} />,
      brings: "User tests on the real thing — [[before any development time is spent]].",
    },
    {
      id: "warn",
      heading: "Claude knows the product's logic and warns me",
      prompt: "Texts too: check them right away.",
      reply: "Careful — in create-omat a new text goes straight into typing. [[Better to wait until it's deselected.]]",
      render: () => <TextScene product={product} showSteps={false} />,
      brings: "What I don't remember, the code does. Fewer wrong designs reach a developer.",
    },
    {
      id: "services",
      heading: "Real rules: [[both services' logic]], side by side",
      prompt: "What does the decoration service return, and what does create-omat show for each?",
      reply: "Six codes. The size ones get resized; the other three share one “too complex” dialog.",
      render: () => <ServiceMap />,
      brings: "Seeing both sides showed where the warnings needed polish — on real responses, not guesses.",
    },
    {
      id: "rules",
      heading: "Each warning says exactly what's wrong",
      prompt: "Thin lines: name it, and offer a way out.",
      reply: "“Design has too thin lines” — with See solutions, right there.",
      render: () => <IssueScene product={product} showSteps={false} />,
      brings: "No “can't be built” surprises later.",
    },
    {
      id: "fit",
      heading: "I [[see the interaction immediately]] — and know if it feels right",
      prompt: "Too large for the hoop? Say so, and fix it in one click.",
      reply: "“Fit to best size”: shrinks to the hoop, small bounce, green.",
      render: () => <FitScene product={product} showSteps={false} />,
      brings: "Good or bad is clear at once — faster than judging a static image in Figma.",
    },
    {
      id: "flow",
      heading: "A [[whole flow]], every detail visible",
      prompt: "Fix with AI: what happens while it runs, and what comes after?",
      reply: "A loader, then review on the canvas, accept, a fresh check — then the row slides back.",
      render: () => <AiScene product={product} showSteps={false} />,
      brings: "How things load, move and follow each other is decided early — [[fewer surprises]] later.",
    },
    {
      id: "kit",
      heading: "One design system, in code",
      prompt: "[[Only the kit's own buttons and messages.]] Nothing custom.",
      reply: "Done — same components, same Tailwind CSS as create-omat. What you see is what ships.",
      render: () => <OneSystem />,
      brings: "One system to maintain. No Figma library to keep in sync, no licence for it.",
    },
    {
      id: "notes",
      kicker: "Meanwhile",
      title: "Every rule was noted as it was decided",
      lede: "A Claude skill appends them while we build. Nothing is written up afterwards.",
      render: () => <NotesCard items={NOTES} />,
    },
    {
      id: "handoff",
      heading: "The handoff writes itself — I just make a few tweaks",
      prompt: "[[Build the handoff.]]",
      reply: "Built /handoff/embroidery — 17 rules, each played on the canvas.",
      render: () => <HandoffCard art={<EmbroideryArt />} title="Embroidery, without dead ends" href="/handoff/embroidery" />,
      brings: "Developers start from working code and exact rules. Less rework.",
    },
    {
      id: "code",
      heading: "Small fixes go straight into create-omat",
      prompt: "Check out Minh's branch and [[push the pill style]] from the handoff correctly.",
      reply: "Pushed. [[No QA list, no waiting for staging.]]",
      render: () => <QaToThree />,
      brings: "Polish reaches customers in hours. Developer time goes into features.",
    },
    {
      id: "variants",
      heading: "Three versions, built fast",
      prompt: "“Too large” — [[show me three ways]] to say it.",
      reply: "A hard stop, a warning, a warning with one click. The third shipped.",
      render: () => <VariantsDemo variants={TOO_LARGE_VARIANTS} />,
    },
    {
      id: "tiers",
      heading: "Answers from the Spreadshirt API, without asking anyone",
      prompt: "Figma only gave me five discount tiers. How many does this product really have? [[Check the Spreadshirt API.]]",
      reply: "Twelve — up to sixteen across the shop. The slider now uses the real scale.",
      render: () => <TierDemo />,
      brings: "Found myself in minutes — [[no one interrupted]].",
    },
    {
      id: "outcomes",
      kicker: "What it brings the company",
      title: "In one line each",
      render: () => <OutcomesGrid />,
    },
    {
      id: "end",
      kicker: "That's the loop",
      title: "It gets faster every time.",
      lede: "Claude keeps what it learns as skills — the handoff skill, for one — so each feature starts further ahead.",
      render: () => <EndLinks handoff="/handoff/embroidery" />,
    },
  ]
}

export default function EmbroideryBuild() {
  const product = useCanvasProduct()
  // Slower than the curve-text page: the scenes are heavier, and the page should settle before they play.
  return <BuildPage beats={Beats({ product })} pace={1.6} />
}
