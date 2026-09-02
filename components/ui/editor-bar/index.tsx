"use client"

import { useId } from "react"
import { EditorBarTooltip } from "./EditorBarTooltip"
import { FontSizeSlider } from "./FontSizeSlider"

type TextAlign = "left" | "center" | "right"

type EditorBarProps = {
  show: boolean
  fontSize: number
  fontFamily: string
  color: string
  isDefaultColor?: boolean
  textAlign?: TextAlign
  bold?: boolean
  italic?: boolean
  underline?: boolean
  canBold?: boolean
  canItalic?: boolean
  // False while the text sits on a curve: curved text is always centre-aligned
  // here, so the control shows that state and stops responding.
  canAlign?: boolean
  maxFontSize?: number
  onFontSizeChange: (next: number) => void
  onFontFamilyClick: () => void
  onColorClick: () => void
  onCurveClick?: () => void
  onTextAlignChange?: (next: TextAlign) => void
  onToggleBold?: () => void
  onToggleItalic?: () => void
  onToggleUnderline?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}

const MIN_FONT_SIZE = 1
const ABS_MAX_FONT_SIZE = 320
const ALIGN_ORDER: TextAlign[] = ["left", "center", "right"]

export function BoldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4h7a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h8a4 4 0 0 1 0 8H6z" />
    </svg>
  )
}

export function ItalicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  )
}

export function UnderlineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3v7a6 6 0 0 0 12 0V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  )
}

// Alignment icon — three lines shifted to match the alignment.
export function AlignIcon({ align }: { align: TextAlign }) {
  const lines =
    align === "center"
      ? [
          [4, 16],
          [6.5, 13.5],
          [5, 15],
        ]
      : align === "right"
        ? [
            [3, 17],
            [9, 17],
            [7, 17],
          ]
        : [
            [3, 17],
            [3, 11],
            [3, 13],
          ]
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      {lines.map(([x1, x2], i) => (
        <line
          key={i}
          x1={x1}
          x2={x2}
          y1={5 + i * 5}
          y2={5 + i * 5}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

/**
 * The word "Curve" set on an upward arc, so the button is its own preview of
 * what it does. SVG text-on-path rather than a picture of type, so it keeps the
 * bar's own face at the same 12px semibold as the Font and Color labels beside
 * it — fontFamily="inherit" pulls the face down from the button.
 *
 * Geometry: a 40px chord lifted 5px at its middle, so R = (40²/4 + 5²) / (2·5)
 * = 42.5. That arc is ~41.6px long, enough for the word at this size, and the
 * lift stays gentle enough to read as type rather than as a logo.
 *
 * The rule beneath is drawn, not a text-decoration: Chrome ignores
 * text-underline-offset on SVG text-on-path (Firefox honours it), so the gap
 * was uncontrollable that way. Drawing it costs a second arc but renders the
 * same everywhere.
 *
 * That arc is concentric with the baseline — same centre (23, 56.5), radius 4px
 * shorter — so it holds an even 4px gap along the whole word instead of
 * pinching at the ends. Its endpoints keep the baseline's angular extent
 * (half-angle asin(20/42.5) = 0.4899 rad), which lands it at ~36px wide: the
 * width of the word, not of the arc it sits on.
 */
export function CurvedLabel({ text = "Curve" }: { text?: string }) {
  // useId yields ":r1:"-style values; colons are not valid in an XML id.
  const pathId = `curve-${useId().replace(/:/g, "")}`
  return (
    <svg width="46" height="25" viewBox="0 0 46 25" aria-hidden="true">
      <defs>
        <path id={pathId} d="M 3 19 A 42.5 42.5 0 0 1 43 19" fill="none" />
      </defs>
      <text
        fill="currentColor"
        fontSize="12"
        fontWeight="600"
        fontFamily="inherit"
        textAnchor="middle"
      >
        <textPath href={`#${pathId}`} startOffset="50%">
          {text}
        </textPath>
      </text>
      <path
        d="M 4.88 22.91 A 38.5 38.5 0 0 1 41.12 22.91"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function EditorBar({
  show,
  fontSize,
  fontFamily,
  color,
  isDefaultColor = false,
  textAlign = "left",
  bold = false,
  italic = false,
  underline = false,
  canBold = true,
  canItalic = true,
  canAlign = true,
  maxFontSize = ABS_MAX_FONT_SIZE,
  onFontSizeChange,
  onFontFamilyClick,
  onColorClick,
  onCurveClick,
  onTextAlignChange,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onDuplicate,
  onDelete,
}: EditorBarProps) {
  if (!show) return null
  const max = Math.max(MIN_FONT_SIZE, Math.min(ABS_MAX_FONT_SIZE, Math.floor(maxFontSize)))
  const clamp = (n: number) => Math.max(MIN_FONT_SIZE, Math.min(max, Math.round(n)))
  const nextAlign = ALIGN_ORDER[(ALIGN_ORDER.indexOf(textAlign) + 1) % ALIGN_ORDER.length]
  const iconBtn = (active: boolean, disabled: boolean) =>
    `flex h-9 w-9 items-center justify-center rounded-md ${
      disabled
        ? "cursor-not-allowed opacity-30"
        : `cursor-pointer hover:bg-neutral-100 ${active ? "bg-neutral-100" : ""}`
    }`

  return (
    <div
      data-editor-bar="true"
      className="shadow-xs absolute top-8 left-1/2 z-[5] flex h-[48px] -translate-x-1/2 items-center overflow-hidden rounded-full bg-white"
    >
      <div className="flex h-full min-w-0 items-center gap-2 px-1.5 py-1.5">
        {/* Font family (fixed label; hover shows current font) */}
        <EditorBarTooltip content={fontFamily}>
          <button
            type="button"
            aria-label="Font"
            onClick={onFontFamilyClick}
            className="flex h-9 cursor-pointer items-center justify-start rounded-md rounded-l-[24px] px-3 text-left text-[12px] font-semibold hover:bg-neutral-100"
          >
            Font
          </button>
        </EditorBarTooltip>

        {/* divider */}
        <div className="bg-[#e9e9e9] -my-1.5 w-px self-stretch" />

        {/* Bold / Italic / Underline / Alignment */}
        <div className="flex items-center gap-[2px]">
        <EditorBarTooltip content="Bold">
          <button
            type="button"
            aria-label="Bold"
            disabled={!canBold}
            onClick={onToggleBold}
            className={iconBtn(bold, !canBold)}
          >
            <BoldIcon />
          </button>
        </EditorBarTooltip>
        <EditorBarTooltip content="Italic">
          <button
            type="button"
            aria-label="Italic"
            disabled={!canItalic}
            onClick={onToggleItalic}
            className={iconBtn(italic, !canItalic)}
          >
            <ItalicIcon />
          </button>
        </EditorBarTooltip>
        <EditorBarTooltip content="Underline">
          <button
            type="button"
            aria-label="Underline"
            onClick={onToggleUnderline}
            className={iconBtn(underline, false)}
          >
            <UnderlineIcon />
          </button>
        </EditorBarTooltip>
        <EditorBarTooltip
          content={canAlign ? "Text align" : "Curved text is always centred"}
        >
          <button
            type="button"
            aria-label={`Text alignment: ${textAlign}`}
            disabled={!canAlign}
            onClick={() => onTextAlignChange?.(nextAlign)}
            className={iconBtn(false, !canAlign)}
          >
            <AlignIcon align={canAlign ? textAlign : "center"} />
          </button>
        </EditorBarTooltip>
        </div>

        {/* divider */}
        <div className="bg-[#e9e9e9] -my-1.5 w-px self-stretch" />

        {/* Font size: decrease */}
        <EditorBarTooltip content="Decrease text size">
          <button
            type="button"
            aria-label="Decrease font size"
            onClick={() => onFontSizeChange(clamp(fontSize - 1))}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-neutral-100"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.8333 9.16663C16.2935 9.16663 16.6666 9.53972 16.6666 9.99996C16.6666 10.4273 16.3449 10.7795 15.9305 10.8277L15.8333 10.8333H4.16665C3.70641 10.8333 3.33331 10.4602 3.33331 9.99996C3.33331 9.5726 3.65501 9.22037 4.06946 9.17223L4.16665 9.16663H15.8333Z"
              />
            </svg>
          </button>
        </EditorBarTooltip>

        {/* Font size slider — same infrastructure as the canvas zoom dock:
            drag-relative, with a press on bare track easing to that point. */}
        <FontSizeSlider
          min={MIN_FONT_SIZE}
          max={max}
          value={Math.min(fontSize, max)}
          onChange={v => onFontSizeChange(clamp(v))}
        />

        {/* Font size: increase */}
        <EditorBarTooltip content="Increase text size">
          <button
            type="button"
            aria-label="Increase font size"
            onClick={() => onFontSizeChange(clamp(fontSize + 1))}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-neutral-100"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.8277 4.06952C10.7796 3.65507 10.4273 3.33337 9.99998 3.33337C9.53974 3.33337 9.16665 3.70647 9.16665 4.16671V9.16671H4.16665L4.06946 9.17231C3.65501 9.22045 3.33331 9.57268 3.33331 10C3.33331 10.4603 3.70641 10.8334 4.16665 10.8334H9.16665V15.8334L9.17225 15.9306C9.22039 16.345 9.57262 16.6667 9.99998 16.6667C10.4602 16.6667 10.8333 16.2936 10.8333 15.8334V10.8334H15.8333L15.9305 10.8278C16.3449 10.7796 16.6666 10.4274 16.6666 10C16.6666 9.5398 16.2935 9.16671 15.8333 9.16671H10.8333V4.16671L10.8277 4.06952Z"
              />
            </svg>
          </button>
        </EditorBarTooltip>

        {/* divider */}
        <div className="bg-[#e9e9e9] -my-1.5 w-px self-stretch" />

        {/* Curve */}
        <EditorBarTooltip content="Curve text">
          <button
            type="button"
            aria-label="Curve text"
            onClick={onCurveClick}
            className="flex h-9 cursor-pointer items-center justify-center rounded-md px-2 text-[12px] font-semibold hover:bg-neutral-100"
          >
            <CurvedLabel />
          </button>
        </EditorBarTooltip>

        {/* divider */}
        <div className="bg-[#e9e9e9] -my-1.5 w-px self-stretch" />

        {/* Color */}
        <EditorBarTooltip content="Select text color">
        <button
          type="button"
          aria-label="Text color"
          onClick={onColorClick}
          className="flex h-9 items-center gap-2 cursor-pointer rounded-md px-2 hover:bg-neutral-100"
        >
          {isDefaultColor ? (
            // Rainbow swatch while the colour is still the default (unchanged).
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(from 90deg, rgba(43, 113, 247, 1) 0deg, rgba(254, 48, 195, 1) 83.07deg, rgba(254, 28, 31, 1) 157.5deg, rgba(244, 245, 71, 1) 240.57deg, rgba(1, 241, 87, 1) 294.23deg, rgba(102, 102, 102, 1) 360deg)",
              }}
            >
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="inline-block h-5 w-5 rounded-full border border-neutral-300"
              style={{ backgroundColor: color }}
            />
          )}
          <span className="text-[12px] font-semibold">Color</span>
        </button>
        </EditorBarTooltip>

        {/* divider */}
        <div className="bg-[#e9e9e9] -my-1.5 w-px self-stretch" />

        {/* Duplicate */}
        <EditorBarTooltip content="Duplicate text">
        <button
          type="button"
          aria-label="Duplicate text"
          onClick={onDuplicate}
          className="flex h-9 w-9 items-center justify-center cursor-pointer rounded-md hover:bg-neutral-100"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none" aria-hidden="true">
            <path
              d="M9.33691 2C10.4019 2 11.273 2.83212 11.334 3.88184L11.3369 4V4.66602H12.0059C13.1101 4.66618 14.0055 5.56183 14.0059 6.66602V12C14.0057 13.1043 13.1102 13.9998 12.0059 14H6.67188C5.56774 13.9996 4.67206 13.1042 4.67188 12V11.333H4.00391C2.93879 11.333 2.06767 10.5001 2.00684 9.4502L2.00391 9.33301V4C2.00391 2.93501 2.83605 2.06395 3.88574 2.00293L4.00391 2H9.33691ZM6.6709 6C6.30297 6.00019 6.00407 6.29906 6.00391 6.66699V12C6.00391 12.3681 6.30287 12.6668 6.6709 12.667H12.0039C12.3721 12.667 12.6709 12.3682 12.6709 12V6.66699C12.6707 6.29894 12.372 6 12.0039 6H6.6709ZM4.00391 3.33301C3.66206 3.33301 3.38036 3.59037 3.3418 3.92188L3.33691 4V9.33301C3.33691 9.67485 3.59428 9.95655 3.92578 9.99512L4.00391 10H4.67188V6.66602C4.6722 5.56196 5.56783 4.66639 6.67188 4.66602H10.0039V4C10.0039 3.65823 9.74643 3.37656 9.41504 3.33789L9.33691 3.33301H4.00391Z"
              fill="currentColor"
            />
          </svg>
        </button>
        </EditorBarTooltip>

        {/* Delete */}
        <EditorBarTooltip content="Delete text">
        <button
          type="button"
          aria-label="Delete text"
          onClick={onDelete}
          className="-ml-1.5 flex h-9 w-9 items-center justify-center cursor-pointer rounded-md rounded-r-[24px] text-[#DC2626] hover:bg-neutral-100"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.9945 3.85074C15.9182 2.81588 15.0544 2 14 2H10L9.85074 2.00549C8.81588 2.08183 8 2.94564 8 4V6H5.01169H4.99054H4L3.88338 6.00673C3.38604 6.06449 3 6.48716 3 7C3 7.55228 3.44772 8 4 8H4.07987L5.00345 19.083L5.00819 19.2507C5.09634 20.7511 6.40232 22 8 22H16L16.1763 21.9949C17.7511 21.9037 19 20.5977 19 19L19.9199 8H20L20.1166 7.99327C20.614 7.93551 21 7.51284 21 7C21 6.44772 20.5523 6 20 6H16V4L15.9945 3.85074ZM14 6V4H10V6H14ZM9 8H6.08649L7 19C7 19.5128 7.38604 19.9355 7.88338 19.9933L8 20H16C16.5155 20 16.9398 19.61 16.9969 19.0414L17.0035 18.917L17.9132 8H15H9ZM10 10C10.5128 10 10.9355 10.386 10.9933 10.8834L11 11V17C11 17.5523 10.5523 18 10 18C9.48716 18 9.06449 17.614 9.00673 17.1166L9 17V11C9 10.4477 9.44772 10 10 10ZM14.9933 10.8834C14.9355 10.386 14.5128 10 14 10C13.4477 10 13 10.4477 13 11V17L13.0067 17.1166C13.0645 17.614 13.4872 18 14 18C14.5523 18 15 17.5523 15 17V11L14.9933 10.8834Z"
              fill="currentColor"
            />
          </svg>
        </button>
        </EditorBarTooltip>
      </div>
    </div>
  )
}
