"use client"

import { WedgeSlider } from "@/components/ui/editor-bar/WedgeSlider"
import {
  TEXT_CURVES,
  type TextCurve,
  type TextCurveId,
  clampOffset,
  pathMetrics,
} from "@/lib/text-path"

type TextPathPanelProps = {
  open: boolean
  onClose: () => void
  /** The active preset, or null when the text is still on a straight baseline. */
  curveId: TextCurveId | null
  offset: number
  onCurveChange: (id: TextCurveId) => void
  onOffsetChange: (offset: number) => void
}

/**
 * A preset's own path drawn as its button — the tab shows the curve it applies,
 * which is what CE.SDK's PathArch / PathWave / PathElevate icons are too. Fit
 * into the tile by its measured bounding box, so the three very differently
 * shaped paths all read at the same size.
 */
function CurvePreview({ curve }: { curve: TextCurve }) {
  // iconPath where a preset shows something other than the baseline it applies
  // — "Arch" draws an arch but lays text on CE.SDK's circle.
  const path = curve.iconPath ?? curve.path
  const m = pathMetrics(path)
  if (!m.width || !m.height) return null
  // A hair of padding so the stroke's own width is not clipped at the edges.
  const pad = Math.max(m.width, m.height) * 0.06
  return (
    <svg
      viewBox={`${m.x - pad} ${m.y - pad} ${m.width + pad * 2} ${m.height + pad * 2}`}
      className="h-7 w-14"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={Math.max(m.width, m.height) * 0.05}
        strokeLinecap="round"
      />
    </svg>
  )
}

// One nudge of the offset: a single percentage point, matching the readout
// beside the slider, so a click moves the text by exactly what it says.
const OFFSET_STEP = 0.01

/**
 * The offset's step buttons — the editor bar's minus and plus glyphs, at the
 * size and hit area the panel's other controls use.
 */
function OffsetStep({
  dir,
  label,
  onClick,
}: {
  dir: -1 | 1
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-black hover:bg-neutral-100"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
        {dir === -1 ? (
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.8333 9.16663C16.2935 9.16663 16.6666 9.53972 16.6666 9.99996C16.6666 10.4273 16.3449 10.7795 15.9305 10.8277L15.8333 10.8333H4.16665C3.70641 10.8333 3.33331 10.4602 3.33331 9.99996C3.33331 9.5726 3.65501 9.22037 4.06946 9.17223L4.16665 9.16663H15.8333Z"
          />
        ) : (
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.8277 4.06952C10.7796 3.65507 10.4273 3.33337 9.99998 3.33337C9.53974 3.33337 9.16665 3.70647 9.16665 4.16671V9.16671H4.16665L4.06946 9.17231C3.65501 9.22045 3.33331 9.57268 3.33331 10C3.33331 10.4603 3.70641 10.8334 4.16665 10.8334H9.16665V15.8334L9.17225 15.9306C9.22039 16.345 9.57262 16.6667 9.99998 16.6667C10.4602 16.6667 10.8333 16.2936 10.8333 15.8334V10.8334H15.8333L15.9305 10.8278C16.3449 10.7796 16.6666 10.4274 16.6666 10C16.6666 9.5398 16.2935 9.16671 15.8333 9.16671H10.8333V4.16671L10.8277 4.06952Z"
          />
        )}
      </svg>
    </button>
  )
}

/**
 * The Curve panel — the text-on-path controls, in the same shell as the Font
 * panel (same 275px width, same slide-in, same close chevron).
 *
 * CE.SDK's panel offers curve, path position, direction and offset; this one
 * carries three curves and the offset, which is the pair the flow actually
 * needs. Direction (`text/pathFlipped`) is deliberately absent, and "Arch"
 * applies CE.SDK's circle behind an arch icon — see lib/text-path.ts.
 */
export function TextPathPanel({
  open,
  onClose,
  curveId,
  offset,
  onCurveChange,
  onOffsetChange,
}: TextPathPanelProps) {
  return (
    <div
      data-text-path-panel="true"
      className={`absolute z-40 inset-y-[4px] left-[4px] w-[275px] rounded-[12px] bg-white shadow-[32px_0px_50px_0px_rgba(0,0,0,0.05)] flex flex-col transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "-translate-x-[calc(100%+100px)]"
      }`}
    >
      <div className="px-7 pt-6 flex-shrink-0">
        {/* Panel headings are MADE Outer Sans, as everywhere create-omat
            reaches for the kit's `font-made` token; this project registers the
            same face as --font-display. Size/leading/weight follow create-omat's
            own text panels (src/components/ui/color-panel/ColorPanel.tsx). */}
        <h3 className="font-display mb-6 text-lg leading-[26px] font-medium">Curve text</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-3 gap-2">
          {TEXT_CURVES.map(curve => {
            const active = curve.id === curveId
            return (
              <button
                key={curve.id}
                type="button"
                aria-pressed={active}
                onClick={() => onCurveChange(curve.id)}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-[8px] border px-2 py-3 transition-colors ${
                  active
                    ? "border-black bg-neutral-50 text-black"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <CurvePreview curve={curve} />
                <span className="text-[12px] font-semibold">{curve.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-8">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[14px] font-medium">Offset</span>
            {/* CE.SDK stores this as a proportion of path length; shown as a
                percentage, which is how the value reads to a person. */}
            <span className="text-[12px] text-neutral-500 tabular-nums">
              {Math.round(offset * 100)}%
            </span>
          </div>
          {/* Same slider as the editor bar and the zoom dock, flanked by the
              same minus/plus pair — the slider crosses a full turn in one short
              sweep, so a step is the only way to land on a small change.
              32 + 4 + 155 + 4 + 32 = 227, the panel's content width (275 less
              its px-6), so the row sits exactly inside the padding. */}
          <div className="flex items-center gap-1">
            <OffsetStep
              dir={-1}
              label="Decrease offset"
              onClick={() => onOffsetChange(clampOffset(offset - OFFSET_STEP))}
            />
            <WedgeSlider
              min={-1}
              max={1}
              value={offset}
              width={155}
              jumpOnTrackClick
              onChange={v => onOffsetChange(clampOffset(v))}
            />
            <OffsetStep
              dir={1}
              label="Increase offset"
              onClick={() => onOffsetChange(clampOffset(offset + OFFSET_STEP))}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Close curve panel"
        onClick={onClose}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-2xl border border-neutral-200 bg-white px-0.5 py-3 hover:bg-neutral-50"
      >
        <img src="/icons/icon-chevron-left.svg" alt="" className="size-6" />
      </button>
    </div>
  )
}
