"use client"

/**
 * Shared chrome for the handoff documents under /handoff.
 *
 * Two typographic worlds live on these pages and must stay distinguishable:
 * the document (paper ground, mono kickers, thread-red accent — the `ho-`
 * tokens in app/handoff/handoff.css) and the product replicas inside it, which
 * are pasted out of components/designer.tsx and keep the app's own classes.
 * Nothing here styles a replica.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

/* ------------------------------------------------------------------ inline */

/** A token: a class name, file name, or literal value quoted mid-sentence. */
export function Tok({
  children,
  neutral = false,
}: {
  children: ReactNode
  /** Neutral slate rather than thread red — for values, not API surface. */
  neutral?: boolean
}) {
  return (
    <code
      className={`rounded-[5px] bg-[#efece4] px-1.5 py-px font-[family-name:var(--ho-mono)] text-[13px] whitespace-nowrap ${
        neutral ? "text-[var(--ho-slate)]" : "text-[var(--ho-thread-ink)]"
      }`}
    >
      {children}
    </code>
  )
}

/* -------------------------------------------------------------------- chips */

/** A spec fact, short enough to read at a glance. Bold the value, not the label. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--ho-line)] bg-[var(--ho-paper)] px-3 py-1 font-[family-name:var(--ho-mono)] text-[13px] text-[var(--ho-slate)] [&_b]:font-semibold [&_b]:text-[var(--ho-ink)]">
      {children}
    </span>
  )
}

export function Chips({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mt-3.5 flex flex-wrap gap-2 ${className}`}>{children}</div>
}

/* ----------------------------------------------------------------- gesture */

/** A rule with a number attached: the blue band, keyed by its own value. */
export function Gesture({ value, children }: { value: string; children: ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-[18px] rounded-[14px] border border-[var(--ho-hit-line)] bg-[var(--ho-hit-soft)] px-5 py-4">
      <span className="min-w-[74px] flex-none rounded-lg border border-b-2 border-[#c1cce9] bg-white px-[11px] py-1.5 text-center font-[family-name:var(--ho-mono)] text-[15px] whitespace-nowrap text-[var(--ho-hit-ink)]">
        {value}
      </span>
      <p className="m-0 flex-[1_1_220px] text-[15px] [&_b]:font-[640]">{children}</p>
    </div>
  )
}

/* --------------------------------------------------------------- file links */

/** Where the behaviour actually lives, in the prototype repo. */
export function FileLinks({ files }: { files: { label: string; href: string }[] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {files.map(f => (
        <a
          key={f.label + f.href}
          href={f.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ho-line)] bg-[var(--ho-paper)] px-2.5 py-1 font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-thread-ink)] transition-colors after:text-[11px] after:opacity-70 after:content-['↗'] hover:bg-[#e9e0d0] hover:underline"
        >
          {f.label}
        </a>
      ))}
    </div>
  )
}

/* --------------------------------------------------------------------- demo */

/** A live piece of the product, framed as a specimen rather than as page furniture. */
export function Demo({
  children,
  className = "",
  padding = "p-5",
}: {
  children: ReactNode
  className?: string
  padding?: string
}) {
  return (
    <div
      className={`mt-1.5 rounded-[18px] border border-[var(--ho-line)] bg-[var(--ho-paper)] ${padding} ${className}`}
    >
      {children}
    </div>
  )
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3.5 max-w-[var(--ho-measure)] text-[14px] text-[var(--ho-muted)] [&_b]:font-[640] [&_b]:text-[var(--ho-ink)]">
      {children}
    </p>
  )
}

/**
 * A decision worth not missing. Loud on purpose — yellow is used nowhere else
 * on these pages, so a note cannot be read as part of the spec around it.
 */
export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-[12px] border border-[#FCD34D] bg-[#FEF3C7] p-5 text-[15px] leading-[1.5] text-[#78350F]">
      <b className="font-bold">NOTE:</b> {children}
    </div>
  )
}

/* ------------------------------------------------------------------- brief */

/** The four cards that open a document: why, what we think, how we will know. */
const BRIEF_TONES = {
  problem: { bg: "#F6D8D0", ink: "#7B1D10" },
  hypothesis: { bg: "#FBEBC6", ink: "#7A5514" },
  win: { bg: "#DCF4C2", ink: "#2F5A1B" },
  result: { bg: "#C9E6FC", ink: "#123B66" },
} as const

const BRIEF_ICONS = {
  problem: "M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6M19 8v3M19 14v.5",
  hypothesis: "M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.6.6-1 1.3-1 2.1v.4H9v-.4c0-.8-.4-1.5-1-2.1A6 6 0 0 1 12 3Z",
  win: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18M8.5 12.5l2.5 2.5 4.5-5",
  result: "M4 20h16M7 20v-6M12 20V8M17 20v-9",
} as const

export function BriefCard({
  tone,
  label,
  children,
}: {
  tone: keyof typeof BRIEF_TONES
  label: string
  children: ReactNode
}) {
  const { bg, ink } = BRIEF_TONES[tone]
  return (
    <div className="rounded-2xl px-7 py-6" style={{ background: bg, color: ink }}>
      <div className="flex gap-4">
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="mt-0.5 size-6 shrink-0 opacity-60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={BRIEF_ICONS[tone]} />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--ho-mono)] text-[15px] font-bold tracking-[0.06em] uppercase">
            {label}
          </p>
          <div className="mt-4 font-[family-name:var(--ho-mono)] text-[15px] leading-[1.6] [&_li]:mb-1 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Brief({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2.5">{children}</div>
}

/* ----------------------------------------------------------------- sections */

export function Section({
  id,
  children,
  first = false,
}: {
  id: string
  children: ReactNode
  first?: boolean
}) {
  return (
    <section
      id={id}
      className={`ho-prose scroll-mt-5 py-10 max-[900px]:scroll-mt-16 ${
        first
          ? "pt-0"
          : "border-t-2 border-dashed border-[var(--ho-line-strong)]"
      }`}
    >
      {children}
    </section>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2.5 font-[family-name:var(--ho-mono)] text-[14px] tracking-[0.1em] text-[var(--ho-muted)] uppercase">
      {children}
    </p>
  )
}

/** Section heading, with the code-tip button parked on its right when there is one. */
export function SectionHead({ title, tip }: { title: string; tip?: string }) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 text-[25px] font-[640] tracking-[-0.015em] text-balance">{title}</h2>
      {tip && <CodeTipButton tipKey={tip} />}
    </div>
  )
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-7 mb-2.5 text-[17px] font-[640]">{children}</h3>
}

/* ---------------------------------------------------------------- code tips */

export type CodeTip = {
  title: string
  files: { label: string; href: string }[]
  desc: string
  code: string
  foot: string
}

const TipContext = createContext<{
  open: (key: string) => void
  tips: Record<string, CodeTip>
} | null>(null)

/** Opens the drawer for one tip. Rendered by SectionHead. */
export function CodeTipButton({ tipKey }: { tipKey: string }) {
  const ctx = useContext(TipContext)
  if (!ctx) return null
  return (
    <button
      type="button"
      onClick={() => ctx.open(tipKey)}
      className="inline-flex flex-none cursor-pointer items-center gap-2 rounded-full bg-black px-4 py-[7px] pl-3 font-[family-name:var(--ho-mono)] text-[13px] font-semibold text-white transition-[translate] duration-150 hover:-translate-y-px"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="block size-3.5 flex-none text-[#2ec95f]"
      >
        <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
      </svg>
      Code tip
    </button>
  )
}

/**
 * Provides the tips and hosts the drawer. The drawer is the app's own Sheet —
 * same primitive the designer uses — so focus trapping and Escape come for free.
 */
export function CodeTipProvider({
  tips,
  children,
}: {
  tips: Record<string, CodeTip>
  children: ReactNode
}) {
  const [key, setKey] = useState<string | null>(null)
  const open = useCallback((k: string) => setKey(k), [])
  const value = useMemo(() => ({ open, tips }), [open, tips])
  const tip = key ? tips[key] : null

  return (
    <TipContext.Provider value={value}>
      {children}
      <Sheet open={!!tip} onOpenChange={o => !o && setKey(null)}>
        <SheetContent
          side="right"
          // The title carries the meaning; a separate description would only
          // repeat it, so opt out rather than let Radix warn about it.
          aria-describedby={undefined}
          className="gap-0 overflow-y-auto border-l border-[var(--ho-line-strong)] bg-[var(--ho-paper)] px-6 pt-[22px] pb-7 sm:max-w-[480px]"
        >
          {tip && (
            <>
              <p className="font-[family-name:var(--ho-mono)] text-[11.5px] tracking-[0.14em] text-[var(--ho-thread-ink)] uppercase">
                code tip
              </p>
              <SheetTitle className="mt-2 mb-3 text-[20px] font-bold text-[var(--ho-slate)]">
                {tip.title}
              </SheetTitle>
              <FileLinks files={tip.files} />
              <p className="mb-3.5 text-[14.5px] text-[var(--ho-ink)]">{tip.desc}</p>
              <pre className="mb-3.5 overflow-x-auto rounded-[10px] bg-[#1e1e26] px-4 py-3.5">
                <code className="block font-[family-name:var(--ho-mono)] text-[12.5px] leading-[1.6] whitespace-pre text-[#eceff4]">
                  {tip.code}
                </code>
              </pre>
              <p className="m-0 text-[12.5px] text-[var(--ho-muted)]">{tip.foot}</p>
            </>
          )}
        </SheetContent>
      </Sheet>
    </TipContext.Provider>
  )
}

/* ---------------------------------------------------------------- page shell */

export type NavItem = { id: string; mark: string; label: string }

/**
 * Fixed left nav + content column. Under 900px the nav becomes a sticky chip
 * bar, which is why the sections carry a larger scroll margin there.
 */
export function HandoffShell({
  navTitle,
  items,
  links,
  children,
}: {
  navTitle: string
  items: NavItem[]
  links: { label: string; href: string }[]
  children: ReactNode
}) {
  const [active, setActive] = useState(items[0]?.id ?? "")

  useEffect(() => {
    // A scroll spy rather than IntersectionObserver: sections here are taller
    // than the viewport, so "which heading did I last pass" is the question,
    // and a third-of-viewport line answers it directly.
    const spy = () => {
      const line = window.innerHeight * 0.33
      let best = items[0]?.id ?? ""
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.getBoundingClientRect().top <= line) best = item.id
      }
      setActive(best)
    }
    spy()
    window.addEventListener("scroll", spy, { passive: true })
    window.addEventListener("resize", spy)
    return () => {
      window.removeEventListener("scroll", spy)
      window.removeEventListener("resize", spy)
    }
  }, [items])

  return (
    <div className="mx-auto grid max-w-[950px] grid-cols-[208px_minmax(0,1fr)] gap-12 max-[900px]:block">
      <nav
        aria-label="Sections"
        className="ho-noscrollbar sticky top-0 max-h-[100dvh] self-start overflow-y-auto pt-[68px] pb-10 max-[900px]:z-[80] max-[900px]:mx-[-22px] max-[900px]:flex max-[900px]:max-h-none max-[900px]:items-center max-[900px]:gap-0.5 max-[900px]:overflow-x-auto max-[900px]:overflow-y-hidden max-[900px]:border-b max-[900px]:border-[var(--ho-line)] max-[900px]:bg-[var(--ho-ground)] max-[900px]:px-[22px] max-[900px]:py-2.5"
      >
        <p className="mb-3.5 font-[family-name:var(--ho-mono)] text-[12px] tracking-[0.14em] text-[var(--ho-thread-ink)] uppercase max-[900px]:hidden">
          {navTitle}
        </p>
        {items.map(item => {
          const on = active === item.id
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`-ml-3.5 flex items-baseline gap-2.5 rounded-r-lg border-l-2 py-2 pr-3 pl-3.5 text-[14px] no-underline transition-colors max-[900px]:m-0 max-[900px]:flex-none max-[900px]:rounded-full max-[900px]:border-l-0 max-[900px]:px-3 max-[900px]:py-1.5 max-[900px]:whitespace-nowrap ${
                on
                  ? "border-[var(--ho-thread-ink)] font-semibold text-[var(--ho-thread-ink)] max-[900px]:bg-[var(--ho-thread-soft)]"
                  : "border-transparent text-[var(--ho-muted)] hover:bg-black/[0.03] hover:text-[var(--ho-ink)]"
              }`}
            >
              <span
                className={`min-w-5 font-[family-name:var(--ho-mono)] text-[12px] transition-colors ${
                  on ? "text-[var(--ho-thread-ink)]" : "text-[var(--ho-line-strong)]"
                }`}
              >
                {item.mark}
              </span>
              {item.label}
            </a>
          )
        })}
        <div className="mt-[22px] flex flex-col gap-1.5 border-t border-[var(--ho-line)] pt-4 max-[900px]:hidden">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="-ml-3.5 flex items-baseline gap-2.5 rounded-r-lg border-l-2 border-transparent py-2 pr-3 pl-3.5 text-[14px] text-[var(--ho-muted)] no-underline transition-colors hover:bg-black/[0.03] hover:text-[var(--ho-ink)]"
            >
              <span className="min-w-5 font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-line-strong)]">
                ↗
              </span>
              {l.label}
            </a>
          ))}
        </div>
      </nav>
      <div className="min-w-0 max-w-[660px] max-[900px]:mx-auto">{children}</div>
    </div>
  )
}

/* --------------------------------------------------------------- header/foot */

export function HandoffHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow: string
  title: string
  /** Optional — a title that already says it needs no second sentence. */
  lede?: ReactNode
  actions: { label: string; href: string; ghost?: boolean }[]
}) {
  return (
    <header className="pt-[60px] pb-9">
      <p className="mb-[18px] font-[family-name:var(--ho-mono)] text-[14px] tracking-[0.12em] text-[var(--ho-thread-ink)] uppercase">
        {eyebrow}
      </p>
      <h1 className="mb-4 text-[clamp(30px,5.5vw,44px)] leading-[1.05] font-[680] tracking-[-0.02em] text-balance">
        {title}
      </h1>
      {lede && (
        <p className="m-0 max-w-[var(--ho-measure)] text-[18px] text-[var(--ho-muted)]">{lede}</p>
      )}
      <div className="mt-[22px] flex flex-wrap gap-2.5">
        {actions.map(a => (
          <a
            key={a.href + a.label}
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-[var(--ho-thread-ink)] px-5 py-[11px] font-[family-name:var(--ho-mono)] text-[15px] font-semibold no-underline transition-colors ${
              a.ghost
                ? "bg-transparent text-[var(--ho-thread-ink)] hover:bg-[var(--ho-thread-soft)]"
                : "bg-[var(--ho-thread-ink)] text-white hover:bg-[#8f3319]"
            }`}
          >
            {a.label}
          </a>
        ))}
      </div>
    </header>
  )
}

export function HandoffFooter({ source, updated }: { source: string; updated: string }) {
  return (
    <footer className="mt-1 flex flex-wrap justify-between gap-2 border-t-2 border-dashed border-[var(--ho-line-strong)] pt-6 font-[family-name:var(--ho-mono)] text-[14px] text-[var(--ho-muted)]">
      <span>{source}</span>
      <span>Last updated: {updated}</span>
    </footer>
  )
}
