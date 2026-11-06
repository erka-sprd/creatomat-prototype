"use client"

/**
 * The "building together" presentations (/ux-new-way-of-work-6 and -7): a
 * feature replayed as the prompts that built it. Each beat is one screen —
 * the prompt types itself, Claude answers in a line, the thing appears. ↓
 * finishes the typing, then adds the beat's builds one by one, then slides
 * the page down to the next beat. ↑ goes back.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { KitButton } from "@/components/kit-button"
import { Brings, useKeyNav } from "@/components/way-of-work/present"
import { HANDOFF_URL, PROTOTYPE_URL, REPO_URL } from "@/components/way-of-work/visuals"

export type Beat = {
  id: string
  /** A beat drawn its own way: this is shown centred, instead of the chat + frame layout. */
  body?: ReactNode
  /** Above the prompt: what this beat is there to show, in one plain line. */
  heading?: string
  /** Typed when the beat becomes current. A beat without one is a heading. */
  prompt?: string
  /** Claude's answer, one line — shown once the prompt is typed and `replyAt` builds are in. */
  reply?: string
  replyAt?: number
  /** Extra ↓ presses within the beat before the page moves on. */
  builds?: number
  /** What this step brings the company — one line, the beat's last build. */
  brings?: string
  /** What the beat shows: `b` builds pressed so far; `shown` once the prompt is typed. */
  render?: (b: number, shown: boolean) => ReactNode
  kicker?: string
  title?: string
  lede?: string
}

const TYPE_MS = 22
/** The beat's own builds, plus one for its benefit line. */
const buildsOf = (beat: Beat) => (beat.builds ?? 0) + (beat.brings ? 1 : 0)

/*
 * Emphasis: words wrapped in [[double brackets]] in any beat copy get a wavy
 * red underline. The brackets never count as typed characters.
 */
const EMPH = /\[\[(.+?)\]\]/g
const plain = (s: string) => s.replace(EMPH, "$1")

/** `s` with its [[marked]] words underlined — cut after `upto` visible characters, for typing. */
function Emph({ text, upto = Infinity }: { text: string; upto?: number }) {
  const parts: ReactNode[] = []
  let left = upto
  let last = 0
  const push = (chunk: string, marked: boolean, key: number) => {
    if (left <= 0 || !chunk) return
    const cut = chunk.slice(0, left)
    left -= cut.length
    parts.push(
      marked ? (
        <span
          key={key}
          // The wave's height follows the line's thickness in browsers — thin keeps it low.
          className="underline decoration-red-600/50 decoration-wavy decoration-[1px] underline-offset-[4px]"
        >
          {cut}
        </span>
      ) : (
        cut
      )
    )
  }
  let k = 0
  for (const m of text.matchAll(EMPH)) {
    push(text.slice(last, m.index), false, k++)
    push(m[1], true, k++)
    last = m.index! + m[0].length
  }
  push(text.slice(last), false, k++)
  return <>{parts}</>
}
const MONO = "font-[family-name:var(--ho-mono)] text-[12px] tracking-[0.1em] text-[var(--ho-muted)] uppercase"

/** The page's own easing — a long, soft settle. */
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
/** Base durations, scaled by `pace`. */
const DIM_MS = 600
const REVEAL_MS = 800
const REPLY_MS = 600
const GLIDE_MS = 900
/** The right-hand frame's height — room for a canvas scene with its auto-play switch. */
const FRAME_PX = 620

// True while the page is moving itself, so its own scrolling isn't read as the
// reader's (see the scroll sync below).
let gliding = false

/** Scrolls the window to `top` over `ms`, eased both ways — slower and steadier than the browser's smooth scroll. */
function glideTo(top: number, ms: number) {
  const from = window.scrollY
  const delta = top - from
  if (Math.abs(delta) < 1) return
  const start = performance.now()
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  gliding = true
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms)
    window.scrollTo(0, from + delta * ease(t))
    if (t < 1) requestAnimationFrame(tick)
    else window.setTimeout(() => (gliding = false), 120)
  }
  requestAnimationFrame(tick)
}

/** Where the reader was, kept across a refresh. */
const STORE_KEY = "way-of-work"
function readPlace(): { i: number; b: number } | null {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function savePlace(place: { i: number; b: number }) {
  try {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify(place))
  } catch {
    /* private mode — the page just starts at the top next time */
  }
}

/** What all of it brings the company — the closing grid. */
const OUTCOMES = [
  { title: "Faster to market", line: "Features reach customers sooner." },
  { title: "Less rework, less dev cost", line: "Engineers build features, not fixes." },
  { title: "Better decisions", line: "Tested on the real thing, on real data." },
  { title: "Lower risk", line: "Fewer surprises after launch." },
]

export function BuildPage({
  beats,
  pace = 1,
}: {
  beats: Beat[]
  /** Tempo of the page's own motion; higher is slower. */
  pace?: number
}) {
  const [i, setI] = useState(0)
  const [b, setB] = useState(0)
  const [typed, setTyped] = useState(0)
  const beat = beats[i]
  const promptDone = !beat.prompt || typed >= plain(beat.prompt).length
  const builds = buildsOf(beat)
  // Set when the beat was reached by scrolling or restored after a refresh:
  // it then appears finished, with no typing and no glide.
  const landed = useRef(false)
  const refs = useRef<(HTMLElement | null)[]>([])

  /** Make `n` the current beat as if it had been played through. */
  const landOn = useCallback(
    (n: number) => {
      landed.current = true
      setI(n)
      setB(buildsOf(beats[n]))
    },
    [beats]
  )

  // The prompt types itself when its beat is reached — unless the reader
  // landed on it, in which case it is already written.
  useEffect(() => {
    if (landed.current || !beats[i].prompt) {
      setTyped(plain(beats[i].prompt ?? "").length)
      return
    }
    setTyped(0)
    const id = window.setInterval(() => setTyped(n => n + 1), TYPE_MS * pace)
    return () => window.clearInterval(id)
  }, [i, beats, pace])

  // A refresh picks up where the reader was, without the glide there.
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const place = readPlace()
    if (!place || place.i <= 0 || place.i >= beats.length) return
    landOn(place.i)
    setB(Math.min(place.b, buildsOf(beats[place.i])))
    window.setTimeout(() => {
      const el = refs.current[place.i]
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" })
    }, 0)
  }, [beats, landOn])
  useEffect(() => savePlace({ i, b }), [i, b])

  // Scrolling by hand moves the current beat with the reader, so the keys
  // carry on from wherever they are looking — the page never yanks them back.
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (gliding) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const mid = window.innerHeight / 2
        let best = 0
        let bestDist = Infinity
        refs.current.forEach((el, n) => {
          if (!el) return
          const r = el.getBoundingClientRect()
          const dist = Math.abs((r.top + r.bottom) / 2 - mid)
          if (dist < bestDist) {
            bestDist = dist
            best = n
          }
        })
        setI(cur => {
          if (best === cur) return cur
          landOn(best)
          return best
        })
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [landOn])

  const next = useCallback(() => {
    if (!promptDone) return setTyped(plain(beat.prompt!).length)
    if (b < builds) return setB(b + 1)
    if (i < beats.length - 1) {
      landed.current = false
      setI(i + 1)
      setB(0)
    }
  }, [promptDone, beat, b, builds, i, beats.length])
  const prev = useCallback(() => {
    if (b > 0) return setB(b - 1)
    if (i > 0) {
      landed.current = false
      setI(i - 1)
      setB(buildsOf(beats[i - 1]))
    }
  }, [b, i, beats])
  useKeyNav(next, prev)
  /** The navigator: straight to beat `n`, played through, with the glide. */
  const go = useCallback(
    (n: number) => {
      landed.current = false
      setI(n)
      setB(buildsOf(beats[n]))
    },
    [beats]
  )

  // The page slides to the current beat — and, when a build adds something
  // below the fold (a tall scene plus its benefit line), slides on just far
  // enough to show it. A beat the reader scrolled to is left where it is.
  useEffect(() => {
    if (landed.current) return
    const el = refs.current[i]
    if (el) glideTo(el.getBoundingClientRect().top + window.scrollY, GLIDE_MS * pace)
  }, [i, pace])
  useEffect(() => {
    if (b === 0) return
    const el = refs.current[i]
    if (!el) return
    const id = window.setTimeout(() => {
      const bottom = el.getBoundingClientRect().bottom
      if (bottom > window.innerHeight) glideTo(window.scrollY + bottom - window.innerHeight, GLIDE_MS * pace)
    }, 80)
    return () => window.clearTimeout(id)
  }, [b, i, pace])

  return (
    <main>
      <p className={`${MONO} fixed top-6 left-6 z-50 m-0`}>UX New Way of Work</p>

      {beats.map((beat, n) => {
        const reached = n <= i
        const current = n === i
        const shown = n < i || (current && promptDone)
        const built = n < i ? buildsOf(beat) : current ? b : 0
        const replyIn = shown && built >= (beat.replyAt ?? 0)
        const bringsIn = !!beat.brings && built >= buildsOf(beat)
        return (
          <section
            key={beat.id}
            ref={el => {
              refs.current[n] = el
            }}
            className={`flex min-h-dvh flex-col justify-center px-[8vw] py-16 transition-opacity ${
              current ? "opacity-100" : "opacity-25"
            }`}
            style={{ transitionDuration: `${DIM_MS * pace}ms`, transitionTimingFunction: EASE }}
          >
            {!reached ? null : beat.body ? (
              <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center text-center">{beat.body}</div>
            ) : (
              // Words on the left, the thing built on the right.
              <div
                className={`mx-auto grid w-full max-w-[1200px] gap-10 lg:items-center ${
                  beat.render ? "lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]" : ""
                }`}
              >
                <div className="min-w-0">
                  {beat.kicker && <p className={`${MONO} mb-3`}>{beat.kicker}</p>}
                  {beat.title && (
                    <h1 className="m-0 font-display text-[clamp(32px,4vw,52px)] leading-[1.05] font-medium tracking-[-0.02em] text-balance">
                      {beat.title}
                    </h1>
                  )}
                  {beat.lede && (
                    <p className="mt-6 mb-0 max-w-[40ch] text-[19px] text-[var(--ho-muted)]">{beat.lede}</p>
                  )}
                  {beat.heading && (
                    <h2 className="m-0 mb-7 max-w-[26ch] font-display text-[24px] leading-[1.2] font-medium tracking-[-0.02em] text-balance">
                      <Emph text={beat.heading} />
                    </h2>
                  )}
                  {beat.prompt && (
                    <Prompt text={beat.prompt} upto={n < i ? Infinity : typed} typing={current && !promptDone} />
                  )}
                  {beat.reply && (
                    <Reply shown={replyIn} ms={REPLY_MS * pace}>
                      <Emph text={beat.reply} />
                    </Reply>
                  )}
                  {beat.brings && (
                    <ul className="mt-8 mb-0 list-none p-0">
                      <Brings shown={bringsIn}>
                        <span>
                          <Emph text={beat.brings} />
                        </span>
                      </Brings>
                    </ul>
                  )}
                </div>
                {beat.render && (
                  // The frame is one fixed height on every beat, whatever is
                  // in it — so the thing built sits in the middle, and the
                  // page's rhythm never changes from beat to beat.
                  <div
                    className={`flex min-w-0 items-center justify-center overflow-x-auto rounded-[18px] bg-[var(--ho-paper)] p-6 transition-[opacity,translate] ${
                      shown ? "opacity-100" : "translate-y-4 opacity-0"
                    }`}
                    style={{
                      height: FRAME_PX,
                      transitionDuration: `${REVEAL_MS * pace}ms`,
                      transitionTimingFunction: EASE,
                    }}
                  >
                    <div className="min-w-0 max-w-full">{shown && beat.render(built, shown)}</div>
                  </div>
                )}
              </div>
            )}
          </section>
        )
      })}

      <BeatNav count={beats.length} current={i} onPick={go} />
    </main>
  )
}

/** The page's place, on the right: one short line per beat, the current one drawn long. */
function BeatNav({ count, current, onPick }: { count: number; current: number; onPick: (n: number) => void }) {
  return (
    <nav
      aria-label="Beats"
      className="fixed top-1/2 right-5 z-50 flex -translate-y-1/2 flex-col items-end gap-2.5"
    >
      {Array.from({ length: count }, (_, n) => (
        <button
          key={n}
          type="button"
          aria-label={`Beat ${n + 1}`}
          aria-current={n === current}
          onClick={() => onPick(n)}
          className="group flex h-3 cursor-pointer items-center"
        >
          <span
            className={`block h-[2px] rounded-full transition-[width,background-color] duration-300 ${
              n === current
                ? "w-7 bg-black"
                : n < current
                  ? "w-3.5 bg-[var(--ho-muted)] group-hover:w-5"
                  : "w-3.5 bg-[var(--ho-line)] group-hover:w-5 group-hover:bg-[var(--ho-muted)]"
            }`}
          />
        </button>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------- the chat */

function Prompt({ text, upto, typing }: { text: string; upto: number; typing: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <span className={`${MONO} mt-3 w-[56px] shrink-0`}>Erkan</span>
      <p className="m-0 min-h-[54px] max-w-[56ch] rounded-[16px] rounded-tl-[4px] bg-[var(--ho-paper)] px-5 py-3.5 text-[17px] leading-[1.45]">
        <Emph text={text} upto={upto} />
        {typing && <span className="ho-wow-caret ml-px inline-block h-[1em] w-[2px] translate-y-[2px] bg-black" />}
      </p>
    </div>
  )
}

function Reply({ children, shown, ms }: { children: ReactNode; shown: boolean; ms: number }) {
  return (
    <div
      className={`mt-5 flex items-start gap-4 transition-[opacity,translate] ${
        shown ? "opacity-100" : "translate-y-2 opacity-0"
      }`}
      style={{ transitionDuration: `${ms}ms`, transitionTimingFunction: EASE }}
    >
      <span className={`${MONO} mt-[3px] w-[56px] shrink-0`}>Claude</span>
      <p className="m-0 max-w-[58ch] text-[16px] leading-[1.5] text-[var(--ho-muted)]">{children}</p>
    </div>
  )
}

/* ------------------------------------------------------- shared pieces */

/** The handoff notes, as they pile up while building. */
export function NotesCard({ items, count = items.length }: { items: string[]; count?: number }) {
  return (
    <div className="max-w-[600px] rounded-[16px] bg-[#F4F4F4] px-6 py-5">
      <p className={`${MONO} m-0 mb-3`}>handoff notes · appended as decided</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 font-[family-name:var(--ho-mono)] text-[14px] leading-snug">
        {items.slice(0, count).map((it, n) => (
          <li key={it} className="ho-wow-in flex gap-2" style={{ animationDelay: `${n * 120}ms` }}>
            <span className="text-green-700">+</span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}

// The index card's art is drawn 240px wide; here it is shown larger.
const ART_W = 240
const ART_H = 150
const ART_SCALE = 1.7

/** The built handoff, as a standing card: its art large, the way in below. The title only names the link. */
export function HandoffCard({ art, title, href }: { art: ReactNode; title: string; href: string }) {
  return (
    <div className="flex w-[460px] max-w-full flex-col items-center gap-6 rounded-[18px] bg-[#F4F4F4] p-5 text-center">
      <div
        className="overflow-hidden rounded-[14px]"
        style={{
          width: ART_W * ART_SCALE,
          height: ART_H * ART_SCALE,
          background: "color-mix(in srgb, var(--ho-ground) 35%, white)",
        }}
      >
        <div style={{ width: ART_W, height: ART_H, scale: ART_SCALE, transformOrigin: "top left" }}>{art}</div>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open the handoff: ${title}`}>
        <KitButton>Open the handoff</KitButton>
      </a>
    </div>
  )
}

/** The four outcomes, as the close: what all of it brings the company. */
export function OutcomesGrid() {
  return (
    <ul className="m-0 grid max-w-[900px] list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
      {OUTCOMES.map((o, n) => (
        <li
          key={o.title}
          className="ho-wow-in rounded-2xl bg-green-100 px-6 py-5 text-green-900"
          style={{ animationDelay: `${n * 120}ms` }}
        >
          <p className="m-0 font-display text-[24px] leading-tight font-medium tracking-[-0.02em]">{o.title}</p>
          <p className="mt-1.5 mb-0 text-[15px]">{o.line}</p>
        </li>
      ))}
    </ul>
  )
}

/** The closing links, the three things the developer gets. */
export function EndLinks({ handoff = HANDOFF_URL }: { handoff?: string }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {[
        { label: "Repo", href: REPO_URL },
        { label: "Living prototype", href: PROTOTYPE_URL },
        { label: "Handoff page", href: handoff },
      ].map(l => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
          <KitButton variant="ghost" size="l" className="bg-white">
            {l.label}
          </KitButton>
        </a>
      ))}
    </div>
  )
}
