"use client"

// Cmd+E edit mode (dev only): hover outlines any stamped element, click
// selects it, and the Color and Layout tabs restyle it live — an inline style
// on the DOM node, nothing written to the source. "Copy for Claude" puts the
// element's source location and the chosen classes on the clipboard for the
// hand-off.
import { Chakra_Petch } from "next/font/google"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import ColorTab, { type Token } from "@/components/dev-edit/ColorTab"
import LayoutTab from "@/components/dev-edit/LayoutTab"
import {
  COLOR_PROPERTIES,
  type ColorProperty,
  colorClassesOf,
  sprdColorClass,
} from "@/lib/dev-edit/color-tokens"
import { freezeHover } from "@/lib/dev-edit/freeze-hover"
import { freezeTimers } from "@/lib/dev-edit/freeze-timers"
import { type StyleRow, styleSummary } from "@/lib/dev-edit/style-summary"
import {
  type LayoutGroupId,
  type LayoutOption,
  LAYOUT_GROUPS,
  layoutClassesOf,
  layoutOption,
} from "@/lib/dev-edit/layout-options"

type Target = {
  el: HTMLElement
  file: string
  line: number
  column: number
  tag: string
  classes: string[]
}
type Tab = "color" | "layout"
type ColorPick = { property: ColorProperty; token: Token }
type LayoutPicks = Partial<Record<LayoutGroupId, LayoutOption>>

// The CSS property each colour preview sets (kebab-case, for setProperty).
const COLOR_CSS_PROP: Record<ColorProperty, string> = {
  bg: "background-color",
  text: "color",
  border: "border-color",
}
const TABS: { id: Tab; label: string }[] = [
  { id: "color", label: "Color" },
  { id: "layout", label: "Layout" },
]
// Edit mode's accent: neon green on black.
const NEON = "#00FF9C"
// Edit mode's own typeface — angular and techy, still legible at 12px. Only
// this dev-only module loads it, so the app never does.
const futuristic = Chakra_Petch({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

// What the browser sends the app's hovered element when the shield takes the
// pointer — held back in edit mode.
const HOVER_OUT_EVENTS = ["pointerout", "pointerleave", "mouseout", "mouseleave"] as const
// Presses on the shield. They'd bubble on to the app's document-level
// listeners, which read them as a press outside whatever is open, and close
// it: the print-size notice, popovers, menus. Held back at the window.
const PRESS_EVENTS = [
  "pointerdown",
  "pointerup",
  "mousedown",
  "mouseup",
  "click",
  "dblclick",
  "contextmenu",
  "touchstart",
  "touchend",
] as const

const isEditable =(target: EventTarget | null) => {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
}

function readTarget(el: HTMLElement): Target {
  const src = el.dataset.src ?? ""
  const columnAt = src.lastIndexOf(":")
  const lineAt = src.lastIndexOf(":", columnAt - 1)
  return {
    el,
    file: src.slice(0, lineAt),
    line: Number(src.slice(lineAt + 1, columnAt)),
    column: Number(src.slice(columnAt + 1)),
    tag: el.tagName.toLowerCase(),
    classes: Array.from(el.classList),
  }
}

// The selected element's outline. Under the pointer: solid, glowing. Otherwise
// it steps back — 0.3 opacity — as a dashed line running round the element
// (marching ants: the dash offset loops one dash+gap, so the run is seamless).
const MARCH_DASH = 6
const MARCH_GAP = 4
const MARCH_MS = 700

const holdInPanel = (e: React.SyntheticEvent) => e.nativeEvent.stopImmediatePropagation()

// The hover card: the hovered element's main styles as Tailwind classes. A
// class the element carries itself is bright; one read from the computed
// style (inherited, or set another way) is dimmed.
function StyleCard({ rows, above }: { rows: StyleRow[]; above: boolean }) {
  if (rows.length === 0) return null
  return (
    <div
      className={`absolute left-0 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 rounded-[3px] border border-[#00FF9C]/60 bg-[#050807]/95 px-2 py-1.5 whitespace-nowrap ${
        above ? "bottom-full mb-1" : "top-full mt-1"
      }`}
    >
      {rows.map(row => (
        <div key={row.label} className="contents">
          <span className="text-[#C8FFE6]/50">{row.label}</span>
          <span
            className={`flex items-center gap-1.5 font-medium ${
              row.own ? "text-[#00FF9C]" : "text-[#C8FFE6]/70"
            }`}
          >
            {row.swatch && (
              <span
                className="size-2.5 shrink-0 rounded-[2px] border border-white/30"
                style={{ background: row.swatch }}
              />
            )}
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function SelectionOutline({ rect, active }: { rect: DOMRect; active: boolean }) {
  return (
    <>
      <style>{`@keyframes dev-edit-march { to { stroke-dashoffset: -${MARCH_DASH + MARCH_GAP}; } }`}</style>
      <div
        className="absolute rounded-[2px] transition-[outline-color,box-shadow] duration-200"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          outline: `2px solid ${active ? NEON : "transparent"}`,
          boxShadow: active ? `0 0 12px ${NEON}66` : "none",
        }}
      />
      <svg
        aria-hidden
        className="absolute overflow-visible transition-opacity duration-200"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          opacity: active ? 0 : 0.3,
        }}
      >
        <rect
          x={-1}
          y={-1}
          width={rect.width + 2}
          height={rect.height + 2}
          rx={2}
          fill="none"
          stroke={NEON}
          strokeWidth={2}
          strokeDasharray={`${MARCH_DASH} ${MARCH_GAP}`}
          style={{ animation: `dev-edit-march ${MARCH_MS}ms linear infinite` }}
        />
      </svg>
    </>
  )
}

// "Set X to Y (replacing Z)." — one hand-off line.
const handoffLine = (what: string, next: string, current: string[]) =>
  `Set ${what} to ${next}${current.length > 0 ? ` (replacing ${current.join(" ")})` : ""}.`

export default function DevEditProvider() {
  const [enabled, setEnabled] = useState(false)
  const [hovered, setHovered] = useState<HTMLElement | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const [tab, setTab] = useState<Tab>("color")
  const [property, setProperty] = useState<ColorProperty>("bg")
  const [tokens, setTokens] = useState<Token[]>([])
  const [colorPicks, setColorPicks] = useState<ColorPick[]>([])
  const [layoutPicks, setLayoutPicks] = useState<LayoutPicks>({})
  const [copied, setCopied] = useState(false)
  const [, bump] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const shieldRef = useRef<HTMLDivElement>(null)
  // The latest select, for the window-level press handler.
  const selectRef = useRef<(x: number, y: number) => void>(() => {})
  // Undoes the frozen hover look — run when edit mode turns off.
  const unfreezeHoverRef = useRef<(() => void) | null>(null)
  // Inline styles the editor set, by element, with what they replaced — so
  // Reset puts an element back exactly.
  const originals = useRef(new Map<HTMLElement, Map<string, string>>())

  // Cmd+E toggles, Escape steps out (selection first, then the mode).
  // Turning on freezes what's hovered — now, before the shield takes the
  // pointer (lib/dev-edit/freeze-hover).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "e") {
        if (isEditable(e.target)) return
        e.preventDefault()
        if (!enabled) {
          const thawHover = freezeHover()
          const thawTimers = freezeTimers()
          unfreezeHoverRef.current = () => {
            thawHover()
            thawTimers()
          }
        }
        setEnabled(!enabled)
        setHovered(null)
      } else if (e.key === "Escape" && enabled) {
        e.preventDefault()
        if (target) setTarget(null)
        else setEnabled(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [enabled, target])

  useEffect(() => {
    if (!enabled || tokens.length > 0) return
    fetch("/api/dev-edit/tokens")
      .then(res => res.json())
      .then(data => setTokens(data.tokens ?? []))
      .catch(() => setTokens([]))
  }, [enabled, tokens.length])

  // In edit mode the page is frozen: a transparent layer (the shield, below)
  // covers it, so the app never sees the pointer — no clicks, and no hovers
  // either, CSS :hover or JS. The outlines keep up with scrolling and resizing.
  useEffect(() => {
    if (!enabled) return
    const refresh = () => bump(n => n + 1)
    window.addEventListener("scroll", refresh, true)
    window.addEventListener("resize", refresh)
    return () => {
      window.removeEventListener("scroll", refresh, true)
      window.removeEventListener("resize", refresh)
      setHovered(null)
      setTarget(null)
    }
  }, [enabled])

  // The shield takes the pointer, so the browser tells whatever the app had
  // hovered that the pointer left. Those hover-outs are stopped at the window
  // (capture runs before React's root listener), so JS hover states — open
  // hover popovers, hover menus — stay as they were for inspection. A layout
  // effect, so it's listening before the browser sends them. CSS :hover can't
  // be held: the browser sets it from what's under the pointer.
  useLayoutEffect(() => {
    if (!enabled) return
    const holdHover = (e: Event) => {
      if (rootRef.current?.contains(e.target as Node)) return
      e.stopImmediatePropagation()
    }
    for (const type of HOVER_OUT_EVENTS) window.addEventListener(type, holdHover, true)
    return () => {
      for (const type of HOVER_OUT_EVENTS) window.removeEventListener(type, holdHover, true)
      unfreezeHoverRef.current?.()
      unfreezeHoverRef.current = null
    }
  }, [enabled])

  // What's under a point on the page, looking through the edit-mode layers.
  const pageElementAt = (x: number, y: number) =>
    document.elementsFromPoint(x, y).find(el => !rootRef.current?.contains(el)) ?? null
  const stampedAt = (x: number, y: number) =>
    pageElementAt(x, y)?.closest<HTMLElement>("[data-src]") ?? null
  // The wheel lands on the shield, so it's handed on to whatever would have
  // scrolled: the nearest scrollable ancestor of the element underneath.
  const scrollUnder = (e: React.WheelEvent) => {
    let el = pageElementAt(e.clientX, e.clientY) as HTMLElement | null
    while (el && el !== document.body) {
      const { overflowY, overflowX } = getComputedStyle(el)
      const scrolls =
        (/auto|scroll/.test(overflowY) && el.scrollHeight > el.clientHeight) ||
        (/auto|scroll/.test(overflowX) && el.scrollWidth > el.clientWidth)
      if (scrolls) break
      el = el.parentElement
    }
    ;(el && el !== document.body ? el : document.scrollingElement)?.scrollBy(e.deltaX, e.deltaY)
  }
  const select = (x: number, y: number) => {
    const el = stampedAt(x, y)
    setTarget(el ? readTarget(el) : null)
    setColorPicks([])
    setLayoutPicks({})
    setCopied(false)
  }
  selectRef.current = select

  // Presses on the shield never reach the app (PRESS_EVENTS): stopped at the
  // window, in capture, ahead of every document listener. That also skips
  // React's own handlers, so the click selects from here. No focus moves
  // either, so nothing closes on blur.
  useLayoutEffect(() => {
    if (!enabled) return
    const holdPress = (e: Event) => {
      if (e.target !== shieldRef.current) return
      e.stopImmediatePropagation()
      if (e.cancelable && e.type !== "click") e.preventDefault()
      if (e.type === "click") {
        const { clientX, clientY } = e as MouseEvent
        selectRef.current(clientX, clientY)
      }
    }
    for (const type of PRESS_EVENTS) window.addEventListener(type, holdPress, true)
    return () => {
      for (const type of PRESS_EVENTS) window.removeEventListener(type, holdPress, true)
    }
  }, [enabled])

  // Preview a value inline, remembering what was there first.
  const setInline = (cssProp: string, value: string) => {
    if (!target) return
    const saved = originals.current.get(target.el) ?? new Map<string, string>()
    if (!saved.has(cssProp)) saved.set(cssProp, target.el.style.getPropertyValue(cssProp))
    originals.current.set(target.el, saved)
    target.el.style.setProperty(cssProp, value)
    setCopied(false)
  }

  const applyColor = (token: Token) => {
    setInline(COLOR_CSS_PROP[property], token.value)
    setColorPicks(prev => [...prev.filter(p => p.property !== property), { property, token }])
  }

  const applyLayout = (groupId: LayoutGroupId, className: string) => {
    const found = layoutOption(groupId, className)
    if (!found) return
    setInline(found.group.cssProp, found.option.value)
    setLayoutPicks(prev => ({ ...prev, [groupId]: found.option }))
  }

  const reset = () => {
    if (!target) return
    originals.current.get(target.el)?.forEach((value, prop) => {
      if (value) target.el.style.setProperty(prop, value)
      else target.el.style.removeProperty(prop)
    })
    originals.current.delete(target.el)
    setColorPicks([])
    setLayoutPicks({})
  }

  const copyForClaude = async () => {
    if (!target) return
    const lines = [
      `In ${target.file}, line ${target.line}: the <${target.tag}> element with className "${target.classes.join(" ")}".`,
      ...colorPicks.map(({ property, token }) =>
        handoffLine(
          `its ${COLOR_PROPERTIES.find(p => p.id === property)?.label.toLowerCase()} colour`,
          sprdColorClass(property, token.name),
          colorClassesOf(target.classes, property)
        )
      ),
      ...LAYOUT_GROUPS.flatMap(group => {
        const option = layoutPicks[group.id]
        if (!option) return []
        return [
          handoffLine(
            `its ${group.label.toLowerCase()}`,
            option.className,
            layoutClassesOf(target.classes, group)
          ),
        ]
      }),
    ]
    await navigator.clipboard.writeText(lines.join("\n"))
    setCopied(true)
  }

  if (!enabled) return null

  const hoverRect = hovered && hovered !== target?.el ? hovered.getBoundingClientRect() : null
  const targetRect = target?.el.getBoundingClientRect() ?? null
  const hasPicks = colorPicks.length > 0 || Object.keys(layoutPicks).length > 0

  return (
    // Its own look, apart from the app's: dark throughout, neon green (NEON),
    // its own typeface — so the tool never reads as part of the design it's
    // editing.
    <div
      ref={rootRef}
      className={`${futuristic.className} pointer-events-none fixed inset-0 z-[2147483000] text-[12px] leading-[16px] text-[#C8FFE6]`}
    >
      {/* The shield: takes every pointer event over the page, so the app
          beneath stays frozen, and picks by what's under it. */}
      <div
        ref={shieldRef}
        className="pointer-events-auto absolute inset-0 cursor-crosshair"
        onMouseMove={e => setHovered(stampedAt(e.clientX, e.clientY))}
        onMouseLeave={() => setHovered(null)}
        onWheel={scrollUnder}
      />
      {hoverRect && (
        <div
          className="absolute rounded-[2px]"
          style={{
            left: hoverRect.left,
            top: hoverRect.top,
            width: hoverRect.width,
            height: hoverRect.height,
            outline: `1px dashed ${NEON}`,
          }}
        >
          {hovered && (
            <StyleCard
              rows={styleSummary(hovered, tokens)}
              // Below the element, or above it when it sits low on screen.
              above={hoverRect.bottom + 180 > window.innerHeight}
            />
          )}
        </div>
      )}
      {targetRect && <SelectionOutline rect={targetRect} active={hovered === target?.el} />}

      <div
        // Sections 20px apart; within a section things sit closer (the tabs'
        // own gaps), so proximity says what belongs together.
        className="pointer-events-auto absolute top-4 right-4 flex w-[320px] flex-col gap-5 rounded-xl border border-[#00FF9C]/40 bg-[#050807]/95 p-4 shadow-[0_0_24px_rgba(0,255,156,0.18)] backdrop-blur"
        // Presses on the panel stay in the panel: the app's document-level
        // listeners would read them as a press outside whatever is open and
        // close it. React listens on the document ahead of them, so stopping
        // the native event here keeps it from them. Presses are stopped in
        // capture (the panel only uses clicks); clicks after the panel's own
        // handlers ran. Holding mousedown also keeps focus where it was.
        onPointerDownCapture={holdInPanel}
        onPointerUpCapture={holdInPanel}
        onMouseDownCapture={e => {
          e.preventDefault()
          holdInPanel(e)
        }}
        onMouseUpCapture={holdInPanel}
        onTouchStartCapture={holdInPanel}
        onTouchEndCapture={holdInPanel}
        onClick={holdInPanel}
      >
        <div className="flex items-baseline justify-between">
          <span className="flex items-center gap-1.5 font-semibold tracking-[0.08em] text-[#00FF9C] uppercase">
            <span className="size-1.5 animate-pulse rounded-full bg-[#00FF9C] shadow-[0_0_6px_#00FF9C]" />
            Edit mode
          </span>
          <span className="text-[#00FF9C]/55">⌘E to leave · Esc</span>
        </div>

        {!target ? (
          <p className="text-[#C8FFE6]/70">Click an element to edit it.</p>
        ) : (
          <>
            <div className="break-all text-[#C8FFE6]/70">
              &lt;{target.tag}&gt; · {target.file}:{target.line}
            </div>

            {/* Color | Layout — underlined tabs, so they read apart from
                the colour-property buttons below them. */}
            <div className="flex border-b border-[#00FF9C]/20">
              {TABS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`-mb-px flex-1 border-b-2 py-2 font-semibold tracking-[0.08em] uppercase transition-colors ${
                    tab === t.id
                      ? "border-[#00FF9C] text-[#00FF9C]"
                      : "border-transparent text-[#C8FFE6]/50 hover:text-[#C8FFE6]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "color" ? (
              <ColorTab
                classes={target.classes}
                tokens={tokens}
                property={property}
                onPropertyChange={setProperty}
                picked={colorPicks.find(p => p.property === property)?.token}
                onPick={applyColor}
              />
            ) : (
              <LayoutTab
                classes={target.classes}
                display={getComputedStyle(target.el).display}
                picked={layoutPicks}
                onPick={applyLayout}
              />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyForClaude}
                disabled={!hasPicks}
                className="flex-1 rounded-md bg-[#00FF9C] px-3 py-2 font-semibold text-black shadow-[0_0_10px_rgba(0,255,156,0.45)] disabled:bg-white/10 disabled:text-white/35 disabled:shadow-none"
              >
                {copied ? "Copied" : "Copy for Claude"}
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={!hasPicks}
                className="rounded-md border border-[#00FF9C]/40 px-3 py-2 font-medium text-[#00FF9C] hover:bg-[#00FF9C]/10 disabled:border-white/10 disabled:text-white/35"
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
