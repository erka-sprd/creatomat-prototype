"use client"

import { CurvePreview, STRAIGHT_PATH } from "@/components/ui/text-path/curve-tiles"
import { TEXT_CURVES, type TextCurveId } from "@/lib/text-path"

type TextPathPanelProps = {
  open: boolean
  onClose: () => void
  /** The active preset, or null when the text is still on a straight baseline. */
  curveId: TextCurveId | null
  /** null clears the baseline — CE.SDK's setTextOnPath(id, null). */
  onCurveChange: (id: TextCurveId | null) => void
}

/**
 * The Curve panel — the text-on-path controls, in the same shell as the Font
 * panel (same 275px width, same slide-in, same close chevron).
 *
 * CE.SDK's panel offers curve, path position, direction and a free offset
 * slider; this one offers presets only. The four arch positions are fixed
 * offsets around one circle — no slider to land wrong — and Bottom carries the
 * reversed direction that makes it readable. See lib/text-path.ts.
 */
export function TextPathPanel({
  open,
  onClose,
  curveId,
  onCurveChange,
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
        {/* The straight baseline, on its own row above the bends: it is where
            the text starts and what every other tile is a departure from, so it
            reads as the way back rather than a fourth curve. Clearing the path
            is CE.SDK's setTextOnPath(id, null). */}
        <button
          type="button"
          aria-pressed={curveId === null}
          onClick={() => onCurveChange(null)}
          className={`mb-2 flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xs border bg-neutral-100 px-2 py-3 transition ${
            curveId === null
              ? "border-black"
              : "border-transparent hover:bg-[#e9e9e9]"
          }`}
        >
          <CurvePreview path={STRAIGHT_PATH} />
          <span className="text-[12px] font-semibold">Do not curve</span>
        </button>

        <div className="grid grid-cols-3 gap-2">
          {TEXT_CURVES.map(curve => {
            const active = curve.id === curveId
            return (
              <button
                key={curve.id}
                type="button"
                aria-pressed={active}
                onClick={() => onCurveChange(curve.id)}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xs border bg-neutral-100 px-2 py-3 transition ${
                  active ? "border-black" : "border-transparent hover:bg-[#e9e9e9]"
                }`}
              >
                {/* iconPath where the tile should show something other than
                    the baseline applied: the arch positions all ride the same
                    full circle, so each draws just its own half of it. */}
                <CurvePreview path={curve.iconPath ?? curve.path} />
                <span className="text-[12px] font-semibold">{curve.label}</span>
              </button>
            )
          })}
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
