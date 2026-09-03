"use client"

/**
 * /handoff/curve-text — bending a text along a baseline.
 *
 * Three sections: the editor bar the feature is reached from, the panel it
 * opens, and how the panel's presets map onto CE.SDK's text-on-path API.
 *
 * The bar, the panel and the curved glyphs are the app's own components, so
 * they cannot drift from what ships. Only the selection chrome around the text
 * is a copy — it lives inline in components/designer.tsx, and importing it
 * would drag the whole designer into this document.
 */

import { useEffect, useRef, useState } from "react"
import {
  Demo,
  DemoNote,
  FileLinks,
  HandoffFooter,
  HandoffHeader,
  HandoffShell,
  Kicker,
  Section,
  SectionHead,
  Tok,
  type NavItem,
} from "@/components/handoff/handoff-ui"
import MobileEditSheet from "@/components/mobile/mobile-edit-sheet"
import { EditorBar } from "@/components/ui/editor-bar"
import { FontSizeSlider } from "@/components/ui/editor-bar/FontSizeSlider"
import { WedgeSlider } from "@/components/ui/editor-bar/WedgeSlider"
import { CurvePreview } from "@/components/ui/text-path/curve-tiles"
import { TextPathPanel } from "@/components/ui/text-path/TextPathPanel"
import { useFonts } from "@/hooks/useFonts"
import { MAX_FONT_SIZE, MIN_FONT_SIZE } from "@/lib/fonts"
import { TEXT_CURVES, type TextCurveId } from "@/lib/text-path"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

const LAST_UPDATED = "September 3, 2026 · 3:56 PM"

/** The face a new text arrives in, and what these specimens are set in. */
const FONT = "Lobster Two"

const NAV: NavItem[] = [
  { id: "s1", mark: "§1", label: "Editor bar" },
  { id: "s2", mark: "§2", label: "Curve panel" },
  { id: "s3", mark: "§3", label: "img.ly mapping" },
]

/* -------------------------------------------------------------- §1 specimen */

const noop = () => {}

// The corner handles and the rotate/move pair, as components/designer.tsx draws
// them around a selected text. Static here: this section specifies what the
// selection looks like, not what it does.
const CORNER = "absolute z-30 block size-[15px] rounded-full border-2 border-[#3355FF] bg-white"
const BOTTOM_HANDLE =
  "flex size-[26px] items-center justify-center rounded-full border-2 border-[#3355FF] bg-white text-[#3355FF]"

function BottomHandles() {
  return (
    <span className="absolute top-full left-1/2 z-30 mt-5 flex -translate-x-1/2 gap-3">
      <span className={BOTTOM_HANDLE} aria-label="Rotate">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      </span>
      <span className={BOTTOM_HANDLE} aria-label="Move">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2v20M2 12h20" />
          <path d="m9 5 3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" />
        </svg>
      </span>
    </span>
  )
}

/** The trash button: 28px, 20px clear of the box, centred over it. */
function TrashButton() {
  return (
    <span
      aria-label="Delete object"
      className="absolute left-1/2 z-40 flex size-[28px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#d01c00] bg-[#f4f4f4] text-[#d01c00] shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
      style={{ top: -48 }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 2C15.0543 2 15.9177 2.81581 15.9941 3.85059L16 4V6H20C20.5523 6 21 6.44772 21 7C21 7.51284 20.6136 7.9354 20.1162 7.99316L20 8H19.9199L19 19C19 20.5975 17.7513 21.9036 16.1768 21.9951L16 22H8C6.4024 22 5.09608 20.7512 5.00781 19.251L5.00391 19.083L4.08008 8H4C3.44772 8 3 7.55228 3 7C3 6.48716 3.38645 6.0646 3.88379 6.00684L4 6H8V4C8 2.9457 8.81581 2.08229 9.85059 2.00586L10 2H14ZM7 19C7 19.5128 7.38645 19.9354 7.88379 19.9932L8 20H16C16.5155 20 16.94 19.6096 16.9971 19.041L17.0039 18.917L17.9141 8H6.08594L7 19ZM10 10C10.5128 10 10.9354 10.3865 10.9932 10.8838L11 11V17C11 17.5523 10.5523 18 10 18C9.48716 18 9.0646 17.6135 9.00684 17.1162L9 17V11C9 10.4477 9.44772 10 10 10ZM14 10C14.5128 10 14.9354 10.3865 14.9932 10.8838L15 11V17C15 17.5523 14.5523 18 14 18C13.4872 18 13.0646 17.6135 13.0068 17.1162L13 17V11C13 10.4477 13.4477 10 14 10ZM10 6H14V4H10V6Z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}

/**
 * Park every bar inside `ref` at its right end.
 *
 * Instant, not smooth: the bar glides when a chevron is pressed, but this is a
 * starting position rather than a movement to watch.
 */
function useBarsParkedRight(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const frame = ref.current
    if (!frame) return
    const park = () => {
      frame.querySelectorAll<HTMLElement>("[data-editor-bar-scroller]").forEach(el => {
        el.scrollTo({ left: el.scrollWidth, behavior: "instant" })
      })
    }
    park()
    const ro = new ResizeObserver(park)
    ro.observe(frame)
    return () => ro.disconnect()
  }, [ref])
}

/**
 * A selected text with its bar above it, on the canvas ground and nothing else.
 *
 * The frame is narrower than the bar, which is the bar's own overflow case: it
 * scrolls and grows a chevron rather than squeezing its buttons. Parked at its
 * right end on mount, so Curve — what this document is about — is the part on
 * show, and the left chevron demonstrates the rule at the same time.
 */
function EditorBarSpecimen() {
  const frameRef = useRef<HTMLDivElement>(null)
  useBarsParkedRight(frameRef)

  return (
    <div
      ref={frameRef}
      className="relative h-[300px] w-full overflow-hidden rounded-[12px] bg-[#F4F4F4]"
    >
      <EditorBar
        show
        fontSize={64}
        fontFamily={FONT}
        color="#000000"
        isDefaultColor
        textAlign="left"
        onFontSizeChange={noop}
        onFontFamilyClick={noop}
        onColorClick={noop}
        onCurveClick={noop}
        onTextAlignChange={noop}
        onToggleBold={noop}
        onToggleItalic={noop}
        onToggleUnderline={noop}
        onDuplicate={noop}
        onDelete={noop}
      />
      <div
        className="absolute top-[192px] left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none"
        style={{
          fontFamily: `"${FONT}"`,
          fontSize: 64,
          color: "#000000",
          whiteSpace: "pre",
          width: "max-content",
          boxShadow: "0 0 0 1px #3355FF",
        }}
      >
        Text
        <span className={`${CORNER} -top-[7.5px] -left-[7.5px]`} />
        <span className={`${CORNER} -top-[7.5px] -right-[7.5px]`} />
        <span className={`${CORNER} -bottom-[7.5px] -left-[7.5px]`} />
        <span className={`${CORNER} -bottom-[7.5px] -right-[7.5px]`} />
        <BottomHandles />
        <TrashButton />
      </div>
    </div>
  )
}

/**
 * The same bar in four of create-omat's locales, stacked so the Curve control
 * can be read down the column.
 *
 * Font and Color are create-omat's own strings (editor-bar.tabs.font / .color).
 * Curve has no key there yet, so those words are candidates — fi-FI is in the
 * set because "Kaarevuus" is the widest of them at 61.9px against English's
 * 35.1px, which makes it the case the control has to survive.
 */
const LOCALES = [
  { locale: "en-GB", labels: undefined },
  {
    locale: "fi-FI",
    labels: { font: "Fontti", color: "Väri", curve: "Kaarevuus", curveTooltip: "Kaareva teksti" },
  },
  {
    locale: "fr-FR",
    labels: { font: "Police", color: "Couleur", curve: "Courbe", curveTooltip: "Courber le texte" },
  },
  {
    locale: "pl-PL",
    labels: { font: "Czcionka", color: "Kolor", curve: "Krzywa", curveTooltip: "Wygnij tekst" },
  },
]

function LocalizedBars() {
  const frameRef = useRef<HTMLDivElement>(null)
  useBarsParkedRight(frameRef)

  return (
    // ho-focus-curve pushes every control but Curve back — the words are the
    // subject, and unlabelled rows read as one column rather than four bars.
    <div ref={frameRef} className="ho-focus-curve flex flex-col gap-2.5">
      {LOCALES.map(locale => (
        <div
          key={locale.locale}
          className="relative h-[72px] w-full overflow-hidden rounded-[12px] bg-[#F4F4F4]"
        >
          <EditorBar
            show
            fontSize={64}
            fontFamily={FONT}
            color="#000000"
            isDefaultColor
            textAlign="left"
            labels={locale.labels}
            onFontSizeChange={noop}
            onFontFamilyClick={noop}
            onColorClick={noop}
            onCurveClick={noop}
            onTextAlignChange={noop}
            onToggleBold={noop}
            onToggleItalic={noop}
            onToggleUnderline={noop}
            onDuplicate={noop}
            onDelete={noop}
          />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------- §1 · size control before/after */

/** The bar's own step glyphs, as components/ui/editor-bar draws them. */
function StepGlyph({ plus }: { plus?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={
          plus
            ? "M10.8277 4.06952C10.7796 3.65507 10.4273 3.33337 9.99998 3.33337C9.53974 3.33337 9.16665 3.70647 9.16665 4.16671V9.16671H4.16665L4.06946 9.17231C3.65501 9.22045 3.33331 9.57268 3.33331 10C3.33331 10.4603 3.70641 10.8334 4.16665 10.8334H9.16665V15.8334L9.17225 15.9306C9.22039 16.345 9.57262 16.6667 9.99998 16.6667C10.4602 16.6667 10.8333 16.2936 10.8333 15.8334V10.8334H15.8333L15.9305 10.8278C16.3449 10.7796 16.6666 10.4274 16.6666 10C16.6666 9.5398 16.2935 9.16671 15.8333 9.16671H10.8333V4.16671L10.8277 4.06952Z"
            : "M15.8333 9.16663C16.2935 9.16663 16.6666 9.53972 16.6666 9.99996C16.6666 10.4273 16.3449 10.7795 15.9305 10.8277L15.8333 10.8333H4.16665C3.70641 10.8333 3.33331 10.4602 3.33331 9.99996C3.33331 9.5726 3.65501 9.22037 4.06946 9.17223L4.16665 9.16663H15.8333Z"
        }
      />
    </svg>
  )
}

const STEP_BTN =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-neutral-100"
const STEP_LABEL = "flex h-9 cursor-pointer items-center rounded-md px-2 font-semibold"

/**
 * A measured width, drawn under the thing it measures — the horizontal twin of
 * the min-height bracket in the purchase-rail document. Absolute, so it hangs
 * below without changing what it is measuring; `w-full` on a container that is
 * exactly the track wide puts its caps on the track's ends.
 */
function WidthBracket({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="absolute top-full left-0 mt-3.5 flex w-full items-center text-[var(--ho-thread-ink)]"
    >
      <span className="h-3 w-0.5 shrink-0 bg-current" />
      <span className="h-0.5 flex-1 bg-current" />
      <span className="mx-2 font-[family-name:var(--ho-mono)] text-[12px] font-bold whitespace-nowrap">
        {label}
      </span>
      <span className="h-0.5 flex-1 bg-current" />
      <span className="h-3 w-0.5 shrink-0 bg-current" />
    </div>
  )
}

/**
 * The size control as create-omat has it, against the one that ships here.
 *
 * create-omat's track is 140px and its steps are the words "Small" and "Large"
 * — at 10px and 14px, the words sized like what they do — which turn into minus
 * and plus only while the pointer is over them.
 */
function SizeControlCompare() {
  const [before, setBefore] = useState(64)
  const [now, setNow] = useState(64)

  // pb, not a translate: the bracket hangs below the pill without taking up
  // room, so the padding is what lifts the pair back to the row's middle.
  const row = (tag: string, children: React.ReactNode) => (
    <div className="flex items-center gap-4">
      <span className="w-[46px] shrink-0 text-right font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
        {tag}
      </span>
      <div className="flex h-[104px] flex-1 items-center justify-center rounded-[12px] bg-[#F4F4F4] pb-[30px]">
        {/* Square, not the bar's pill: this is a cut-out of the bar, not the
            whole of it, and rounded ends would read as a complete control. */}
        <div className="shadow-xs flex h-[48px] items-center gap-2 bg-white px-1.5 py-1.5">
          {children}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-2.5">
      {row(
        "Before",
        <>
          <span className={`${STEP_LABEL} text-[10px]`}>Small</span>
          <div className="relative">
            <WedgeSlider
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              value={before}
              onChange={setBefore}
              width={140}
              jumpOnTrackClick
            />
            <WidthBracket label="140px" />
          </div>
          <span className={`${STEP_LABEL} text-sm`}>Large</span>
        </>
      )}
      {row(
        "After",
        <>
          <span className={STEP_BTN}>
            <StepGlyph />
          </span>
          <div className="relative">
            <FontSizeSlider
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              value={now}
              onChange={setNow}
              width={80}
            />
            <WidthBracket label="80px" />
          </div>
          <span className={STEP_BTN}>
            <StepGlyph plus />
          </span>
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- §2 specimen */

/** The panel on the canvas ground, at the width and inset it opens with. */
function CurvePanelSpecimen() {
  const [curveId, setCurveId] = useState<TextCurveId | null>("arch-top")
  const [open, setOpen] = useState(true)
  const [platform, setPlatform] = useState<"desktop" | "mobile">("desktop")

  return (
    <div className="flex flex-col items-center gap-4">
      <PlatformSwitch value={platform} onChange={setPlatform} />
      {platform === "desktop" ? (
        <div className="relative h-[512px] w-[330px] flex-none overflow-hidden rounded-[12px] bg-[#F4F4F4]">
          <TextPathPanel
            open={open}
            onClose={() => setOpen(false)}
            curveId={curveId}
            onCurveChange={setCurveId}
          />
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-[var(--ho-line-strong)] bg-white px-4 py-2 font-[family-name:var(--ho-mono)] text-[13px] text-[var(--ho-muted)] hover:text-[var(--ho-ink)]"
            >
              Open it again
            </button>
          )}
        </div>
      ) : (
        <MobileSheetSpecimen curveId={curveId} onCurveChange={setCurveId} />
      )}
    </div>
  )
}

/**
 * The mobile sheet itself, opened on Curve inside the frame rather than over
 * the page.
 *
 * MobileEditSheet is a vaul drawer, which portals to <body> and pins itself to
 * the viewport; given a container it portals there and positions absolutely
 * instead. So this is the sheet that ships — its title, its tab row, its
 * duplicate and delete — not a drawing of it.
 *
 * The tabs are inert (ho-sheet-tabs): the section is about the Curve panel, and
 * a reader who lands on Color has lost the thing they came to see.
 */
function MobileSheetSpecimen({
  curveId,
  onCurveChange,
}: {
  curveId: TextCurveId | null
  onCurveChange: (id: TextCurveId | null) => void
}) {
  const [host, setHost] = useState<HTMLDivElement | null>(null)

  // Curve is the last tab, off the end of a phone-width row — scroll it into
  // view once the sheet has mounted, so the section opens on the tab it is
  // about rather than on Font.
  useEffect(() => {
    if (!host) return
    const id = window.setTimeout(() => {
      const tabs = host.querySelector<HTMLElement>("[data-sheet-tabs]")
      tabs?.scrollTo({ left: tabs.scrollWidth, behavior: "instant" })
    }, 60)
    return () => window.clearTimeout(id)
  }, [host])

  return (
    <div
      ref={setHost}
      className="ho-sheet-tabs relative h-[512px] w-[330px] flex-none overflow-hidden rounded-[12px] bg-[#F4F4F4]"
    >
      {host && (
        <MobileEditSheet
          open
          container={host}
          onClose={noop}
          blockType="text"
          initialTab="Curve"
          text={{
            fontFamily: FONT,
            fontSize: 64,
            color: "#000000",
            colorSet: false,
            textAlign: "left",
            bold: false,
            italic: false,
            underline: false,
          }}
          maxFontSize={MAX_FONT_SIZE}
          canBold
          canItalic
          curveId={curveId}
          onCurveChange={onCurveChange}
          onFontFamilyChange={noop}
          onFontSizeChange={noop}
          onColorChange={noop}
          onTextAlignChange={noop}
          onToggleBold={noop}
          onToggleItalic={noop}
          onToggleUnderline={noop}
          onDuplicate={noop}
          onDelete={noop}
          onWrite={noop}
        />
      )}
    </div>
  )
}

/**
 * Desktop / Mobile, for a demo that has both. Document furniture, in the
 * document's own type — it must not read as a control the product has.
 */
function PlatformSwitch({
  value,
  onChange,
}: {
  value: "desktop" | "mobile"
  onChange: (next: "desktop" | "mobile") => void
}) {
  return (
    <div className="flex gap-1 rounded-full border border-[var(--ho-line)] bg-[var(--ho-ground)] p-1">
      {(["desktop", "mobile"] as const).map(option => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`cursor-pointer rounded-full px-3.5 py-1 font-[family-name:var(--ho-mono)] text-[12px] capitalize transition-colors ${
            value === option
              ? "bg-[var(--ho-thread-ink)] text-white"
              : "text-[var(--ho-muted)] hover:text-[var(--ho-ink)]"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------- §3 specimen */

/**
 * Each preset in CE.SDK's own terms — the three block properties it sets, named
 * as the engine names them (`text/path`, `text/pathOffset`, `text/pathFlipped`;
 * BlockAPI's setTextOnPath, setTextOnPathOffset, setTextOnPathFlipped).
 */
const MAPPING: Record<TextCurveId, { path: string; offset: string; flipped: string }> = {
  "arch-top": { path: "circle, from 90° (bottom), clockwise", offset: "0", flipped: "false" },
  "arch-bottom": {
    path: "circle, from 270° (top), anticlockwise",
    offset: "+1.0",
    flipped: "true",
  },
  "arch-left": { path: "circle, from 0° (right), clockwise", offset: "−0.5", flipped: "false" },
  "arch-right": { path: "circle, from 180° (left), clockwise", offset: "+0.5", flipped: "false" },
  wave: { path: "wave (CE.SDK's, unchanged)", offset: "0", flipped: "false" },
  elevate: { path: "elevate (CE.SDK's, unchanged)", offset: "0", flipped: "false" },
}

/** Every preset drawn as the run it actually produces, beside what it sets. */
function PresetTable() {
  return (
    <div className="flex flex-col gap-2.5">
      {TEXT_CURVES.map(curve => {
        const map = MAPPING[curve.id]
        return (
          <div key={curve.id} className="flex items-center gap-6">
            {/* The panels' own tile, minus the button: same neutral ground,
                same rounded-xs corner, the same CurvePreview icon and label. */}
            <div className="flex w-[128px] flex-none flex-col items-center gap-1.5 rounded-xs bg-neutral-100 px-2 py-3">
              <CurvePreview path={curve.iconPath ?? curve.path} />
              <span className="text-[12px] font-semibold">{curve.label}</span>
            </div>
            <ul className="m-0 min-w-0 list-disc pl-4 font-[family-name:var(--ho-mono)] text-[13px] text-[var(--ho-muted)] marker:text-[var(--ho-line-strong)] [&_li]:mb-0.5">
              <li>
                <Tok>text/path</Tok> {map.path}
              </li>
              <li>
                <Tok>text/pathOffset</Tok> {map.offset}
              </li>
              <li>
                <Tok>text/pathFlipped</Tok> {map.flipped}
              </li>
            </ul>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ document */

export default function CurveTextHandoff() {
  const { loadFont } = useFonts()
  useEffect(() => {
    loadFont(FONT)
    // loadFont is stable per render and de-duplicates internally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <HandoffShell
      navTitle="NAVIGATION"
      items={NAV}
      links={[
        { label: "Prototype", href: PROTOTYPE },
        { label: "Repo", href: REPO },
      ]}
    >
      <HandoffHeader
        eyebrow="handoff"
        title="Curve text"
        lede="Bending a text along a baseline — where it is reached from, what it offers, and how those options sit on img.ly's own text-on-path API."
        actions={[
          { label: "See prototype", href: PROTOTYPE },
          { label: "See repo", href: REPO, ghost: true },
        ]}
      />

      {/* -------------------------------------------------------------- §1 */}
      <Section id="s1" first>
        <Kicker>§1 · Editor bar</Kicker>
        
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <EditorBarSpecimen />
          </div>
        </Demo>
        <p className="ho-caption">Curve button connected to languages.</p>
        <Demo padding="px-3.5 py-[30px]">
          <LocalizedBars />
        </Demo>

        <p className="ho-caption">Size control, before and now. -- Replace labels with static - and + buttons. Reduce the width of the ranger.</p>
        <Demo padding="px-3.5 py-[30px]">
          <SizeControlCompare />
        </Demo>
        
        
        
      </Section>

      {/* -------------------------------------------------------------- §2 */}
      <Section id="s2">
        <Kicker>§2 · Curve panel</Kicker>
        <SectionHead title="The panel it opens" />
        
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <CurvePanelSpecimen />
          </div>
        </Demo>
        
      </Section>

      {/* -------------------------------------------------------------- §3 */}
      <Section id="s3">
        <Kicker>§3 · img.ly mapping</Kicker>
        <SectionHead title="How the presets sit on CE.SDK's text-on-path" />
        <Demo padding="px-6 py-6">
          <FileLinks
            files={[
              {
                label: "CE.SDK v1.78.0 — Path control (Circle, Arch, Wave)",
                href: "https://img.ly/docs/cesdk/changelog/",
              },
            ]}
          />
          <PresetTable />
        </Demo>
      </Section>

      <HandoffFooter source="source of truth: creatomat-prototype · lib/text-path.ts" updated={LAST_UPDATED} />
    </HandoffShell>
  )
}
