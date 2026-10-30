"use client"

/**
 * /handoff/contact-customer-service — the Contact dropdown in the canvas corner
 * and the bulk-order panel it carries, on desktop and in the mobile sheet.
 *
 * Every demo is the shipping component: HelpMenu, ShareButton, BulkOrderNote,
 * MobileMoreMenu and the EditorBar, from components/. Faked: §2's German and
 * French wording — the prototype has no translations, so these are stand-ins
 * that show how the panel sizes itself to a longer label.
 */

import { useEffect, useState } from "react"
import {
  Brief,
  BriefCard,
  Demo,
  HandoffEnd,
  HandoffHeader,
  HandoffShell,
  Kicker,
  Section,
  SectionHead,
  type NavItem,
} from "@/components/handoff/handoff-ui"
import BulkOrderNote, {
  BULK_ORDER_STRINGS,
  type BulkOrderStrings,
} from "@/components/bulk-order-note"
import HelpMenu, {
  CLICK_GUARD_MS,
  CONTACT_OPTIONS,
  HOVER_CLOSE_MS,
  HOVER_OPEN_MS,
} from "@/components/help-menu"
import KitSwitch from "@/components/kit-switch"
import MobileMoreMenu from "@/components/mobile/mobile-more-menu"
import ShareButton from "@/components/share-button"
import { EditorBar } from "@/components/ui/editor-bar"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

const NAV: NavItem[] = [
  { id: "brief", mark: "◆", label: "Problem & Hypotheses" },
  { id: "s1", mark: "1", label: "The dropdown" },
  { id: "s2", mark: "2", label: "Width" },
  { id: "s3", mark: "3", label: "Plain pills" },
  { id: "s4", mark: "4", label: "Mobile" },
]

const noop = () => {}

/** The selection's blue, as components/designer.tsx paints a selected text. */
const SELECTION_BLUE = "#3355FF"

/* ------------------------------------------------------------------- data */

const LANGUAGES: { id: string; label: string; strings: BulkOrderStrings }[] = [
  { id: "en", label: "EN", strings: BULK_ORDER_STRINGS },
  {
    id: "de",
    label: "DE",
    strings: {
      headline: "Sie brauchen Hilfe bei einer Bestellung ab 50 Produkten?",
      cta: "Schreiben Sie uns an:",
      copy: "KOPIEREN",
      note: "Wir antworten innerhalb von 24 Stunden, außer am Wochenende.",
    },
  },
  {
    id: "fr",
    label: "FR",
    strings: {
      headline: "Besoin d'aide pour commander 50 produits ou plus ?",
      cta: "Écrivez-nous à :",
      copy: "COPIER",
      note: "Nous répondons sous 24 h, sauf le week-end.",
    },
  },
]

/* ------------------------------------------------------------------ demos */

/** A patch of canvas: the corner the pills live in, the designer's grey. */
function Canvas({
  children,
  className = "",
  hostRef,
}: {
  children: React.ReactNode
  className?: string
  hostRef?: (el: HTMLDivElement | null) => void
}) {
  return (
    <div
      ref={hostRef}
      className={`relative w-full overflow-hidden rounded-[12px] bg-[#F4F4F4] ${className}`}
    >
      {children}
    </div>
  )
}

/** §1 — the corner, live: hover or click Contact, open the share dialog. */
function LiveCorner() {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  return (
    <Canvas className="h-[340px]" hostRef={setHost}>
      {/* The wrapper from components/designer.tsx: top-right, the two pills 8px apart. */}
      <div className="absolute top-6 right-6 z-[4] flex items-center gap-2">
        <HelpMenu variant="icon" />
        <ShareButton container={host} />
      </div>
    </Canvas>
  )
}

const LANG_PILL =
  "cursor-pointer rounded-full border border-black px-3.5 py-[7px] font-[family-name:var(--ho-mono)] text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors"

/**
 * §2 — the menu's box and its rows as help-menu.tsx renders them, static here
 * outside Radix, in the chosen language. The box is min-content wide; the
 * address row is its only row that may not wrap, so that row sets the width.
 */
function MenuWidth() {
  const [lang, setLang] = useState(LANGUAGES[0])
  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 flex gap-1.5">
        {LANGUAGES.map(l => (
          <button
            key={l.id}
            type="button"
            aria-pressed={l.id === lang.id}
            onClick={() => setLang(l)}
            className={`${LANG_PILL} ${
              l.id === lang.id ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="flex w-min max-w-[92vw] flex-col overflow-hidden rounded-[12px] bg-white p-1.5 text-[14px] text-black shadow-lg">
        {CONTACT_OPTIONS.map(o => (
          <a
            key={o.label}
            href={o.href}
            onClick={e => e.preventDefault()}
            className="group flex cursor-pointer items-start gap-3 rounded-lg px-4 py-3 text-[14px] hover:bg-neutral-100"
          >
            <o.Icon className="size-[20px] shrink-0 text-neutral-700 transition-colors group-hover:text-black" />
            <span className="flex flex-col leading-tight">
              <span>{o.label}</span>
              {o.sub && <span className="mt-0.5 text-[12px] text-neutral-500">{o.sub}</span>}
            </span>
          </a>
        ))}
        <BulkOrderNote className="mt-1" strings={lang.strings} />
      </div>
    </div>
  )
}

// One 6.4s loop: nothing selected, then the text is selected — its editor bar
// slides in and the pills go plain — then it is let go again.
const SELECT_AT_MS = 2200
const DESELECT_AT_MS = 5200
const PLAIN_CYCLE_MS = 6400

/** Where the designer puts a selected text's corner handles. */
const HANDLE_CORNERS = [
  "-top-[7.5px] -left-[7.5px]",
  "-top-[7.5px] -right-[7.5px]",
  "-bottom-[7.5px] -left-[7.5px]",
  "-bottom-[7.5px] -right-[7.5px]",
]

/**
 * §3 — the corner while a text is selected, on a loop. The wrapper marks the
 * state once (data-canvas-actions-plain) and each pill reacts on its own, as
 * in the designer; the editor bar is the real one, shown and hidden.
 */
function PlainPills() {
  const [autoPlay, setAutoPlay] = useState(true)
  const [selected, setSelected] = useState(false)

  useEffect(() => {
    if (!autoPlay) return
    const timers: number[] = []
    const cycle = () => {
      timers.push(window.setTimeout(() => setSelected(true), SELECT_AT_MS))
      timers.push(window.setTimeout(() => setSelected(false), DESELECT_AT_MS))
      timers.push(window.setTimeout(cycle, PLAIN_CYCLE_MS))
    }
    cycle()
    return () => timers.forEach(clearTimeout)
  }, [autoPlay])

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 rounded-full bg-[var(--ho-ground)] py-2 pr-2 pl-4">
        <KitSwitch
          checked={autoPlay}
          onChange={setAutoPlay}
          label="Auto play"
          size="m"
          className="gap-4"
        />
      </div>
      <Canvas className="h-[320px] [&_*]:pointer-events-none">
        <div
          className={`absolute top-6 right-6 z-[4] flex items-center gap-2 transition-[filter,opacity] duration-200 ${
            selected ? "pointer-events-none opacity-60 blur-xs" : ""
          }`}
          data-canvas-actions-plain={selected ? "true" : undefined}
        >
          <HelpMenu variant="icon" />
          <ShareButton container={null} />
        </div>
        <EditorBar
          show={selected}
          fontSize={64}
          fontFamily="MADEOuterSans"
          color="#000000"
          onFontSizeChange={noop}
          onFontFamilyClick={noop}
          onColorClick={noop}
        />
        {/* A text on the canvas; selected, it gets the designer's 1px ring and
            its four 15px corner handles. */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="relative px-5 py-3 font-display text-[28px] font-[900] tracking-[0.02em] text-black uppercase transition-shadow duration-200"
            style={{ boxShadow: selected ? `0 0 0 1px ${SELECTION_BLUE}` : "none" }}
          >
            Your text
            {HANDLE_CORNERS.map(pos => (
              <span
                key={pos}
                className={`absolute ${pos} size-[15px] rounded-full border-2 bg-white transition-opacity duration-200 ${
                  selected ? "opacity-100" : "opacity-0"
                }`}
                style={{ borderColor: SELECTION_BLUE }}
              />
            ))}
          </div>
        </div>
      </Canvas>
    </div>
  )
}

/**
 * §4 — the mobile "More Actions" sheet, opened inside a phone-width frame
 * rather than over the page. MobileMoreMenu is a vaul drawer; given a
 * container it portals there and positions absolutely, so this is the sheet
 * that ships — its cards, its badges, the bulk-order panel at the bottom.
 */
function PhoneSheet() {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  return (
    <div
      ref={setHost}
      // Tall enough for the whole sheet: it is capped at the host's height
      // less 6rem, and scrolls inside past that, which would hide its last card.
      className="relative h-[820px] w-[330px] flex-none overflow-hidden rounded-[12px] bg-[#F4F4F4]"
    >
      {host && (
        <MobileMoreMenu
          open
          modal={false}
          container={host}
          onOpenChange={noop}
          onProductDetails={noop}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- page */

export default function ContactCustomerService() {
  return (
    <HandoffShell
      slug="contact-customer-service"
      items={NAV}
      links={[
        { label: "Prototype", href: PROTOTYPE },
        { label: "Repo", href: REPO },
      ]}
    >
      <HandoffHeader
        title="Contact customer service"
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
                Contact is a plain menu in the canvas corner: it opens only on a click, and closes
                on the click that naturally follows a hover.
              </li>
              <li>
                A customer with a large order has nowhere to turn — nothing on the canvas says
                where bulk orders go.
              </li>
              <li>On mobile the same help is spread across the More Actions sheet.</li>
            </ul>
          </BriefCard>
          <BriefCard tone="hypothesis" label="Hypothesis">
            We believe a dropdown that opens on hover, holds the phone number and names the bulk
            order address in a panel of its own — the same panel in the mobile sheet — gets large
            orders to the right inbox without a search.
          </BriefCard>
          <BriefCard tone="win" label="What win looks like">
            <ul>
              <li>More bulk enquiries arrive at the pro address, fewer through general support.</li>
            </ul>
          </BriefCard>
          <BriefCard tone="result" label="Result">
            Will follow.
          </BriefCard>
        </Brief>
      </Section>

      {/* -------------------------------------------------------------- §1 */}
      <Section id="s1">
        <Kicker>§1 · The dropdown</Kicker>
        <SectionHead title="Contact - phone option and the bulk-order panel" />
        <p>
          Hover opens it after {HOVER_OPEN_MS} ms and leaving closes it after {HOVER_CLOSE_MS} ms;
          opened by hover, it ignores clicks for {CLICK_GUARD_MS / 1000} s, so the click that
          follows a hover doesn&rsquo;t shut it
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <div className="min-w-[480px]">
            <LiveCorner />
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §2 */}
      <Section id="s2">
        <Kicker>§2 · Width</Kicker>
        <SectionHead title="The dropdown's width is intrinsic" />
        <p>
          The address row never wraps, so it alone sets the width - a longer label in another
          language widens the whole menu
        </p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <MenuWidth />
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §3 */}
      <Section id="s3">
        <Kicker>§3 · Plain pills</Kicker>
        <SectionHead title="The pills get out of the way" />
        <p>
          While an element is selected and its editor bar is up, Contact and Share blur and drop
          their border and background
        </p>
        <Demo padding="p-3.5" className="overflow-x-auto">
          <div className="min-w-[480px]">
            <PlainPills />
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §4 */}
      <Section id="s4">
        <Kicker>§4 · Mobile</Kicker>
        <SectionHead title="Mobile - the More Actions sheet" />
        <p>The same bulk-order panel, as its own card at the bottom of the sheet</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <PhoneSheet />
          </div>
        </Demo>
      </Section>

      <HandoffEnd />
    </HandoffShell>
  )
}
