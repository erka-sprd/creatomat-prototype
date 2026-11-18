"use client"

import { useState } from "react"

import { effectSliderStep, type EffectDef } from "@/lib/effects"

type EffectSlidersProps = {
  effect: EffectDef
  values: Record<string, number>
  onChange: (key: string, value: number) => void
  /**
   * desktop — the grey box under the picked tile (EffectsGrid): small labels.
   * mobile  — the sheet's controls view (EffectControlsPanel): larger labels,
   *           and the thumb's halo stays while it's dragged.
   */
  variant: "desktop" | "mobile"
}

// create-omat's effect range input: a 3px neutral-300 track and a white thumb
// with a black ring — 20px on desktop, 28px on a phone.
const RANGE_CLASS =
  "w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:transition-shadow [&::-moz-range-track]:h-[3px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-neutral-300 [&::-webkit-slider-runnable-track]:h-[3px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-neutral-300 [&::-webkit-slider-thumb]:mt-[-12.5px] [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:transition-shadow"
const DESKTOP_RANGE_CLASS =
  "[&::-moz-range-thumb]:hover:shadow-[0_0_0_6px_rgba(0,0,0,0.1)] md:[&::-moz-range-thumb]:size-5 [&::-webkit-slider-thumb]:hover:shadow-[0_0_0_6px_rgba(0,0,0,0.1)] md:[&::-webkit-slider-thumb]:mt-[-8.5px] md:[&::-webkit-slider-thumb]:size-5"
const DRAGGING_THUMB =
  "[&::-webkit-slider-thumb]:shadow-[0_0_0_6px_rgba(0,0,0,0.1)] [&::-moz-range-thumb]:shadow-[0_0_0_6px_rgba(0,0,0,0.1)]"

export function EffectSliders({ effect, values, onChange, variant }: EffectSlidersProps) {
  const [dragging, setDragging] = useState<string | null>(null)
  const mobile = variant === "mobile"
  return (
    <>
      {effect.params.map(param => (
        <div key={param.key} className={mobile ? "flex flex-col gap-4" : "flex flex-col"}>
          <span className={mobile ? "mb-1.5 text-sm text-black" : "mb-[18px] text-xs text-black"}>
            {param.label}
          </span>
          <input
            type="range"
            aria-label={param.label}
            min={param.min}
            max={param.max}
            step={effectSliderStep(param)}
            value={values[param.key] ?? param.defaultValue}
            onChange={e => onChange(param.key, Number(e.target.value))}
            onPointerDown={() => setDragging(param.key)}
            onPointerUp={() => setDragging(null)}
            onPointerCancel={() => setDragging(null)}
            onBlur={() => setDragging(null)}
            className={`${RANGE_CLASS} ${mobile ? "" : DESKTOP_RANGE_CLASS} ${
              mobile && dragging === param.key ? DRAGGING_THUMB : ""
            }`}
          />
        </div>
      ))}
    </>
  )
}
