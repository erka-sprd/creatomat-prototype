"use client"

import { useEffect } from "react"

import { FontButton } from "./FontButton"
import { FontGridSkeleton } from "./FontGridSkeleton"
import { useFonts } from "@/hooks/useFonts"
import { FONTS } from "@/lib/fonts"

type FontPanelProps = {
  open: boolean
  onClose: () => void
  currentFontFamily: string
  onChange: (family: string) => void
}

export function FontPanel({ open, onClose, currentFontFamily, onChange }: FontPanelProps) {
  const { loadFont } = useFonts()

  // Preload the first 12 like create-omat does in FontGrid.
  useEffect(() => {
    if (!open) return
    FONTS.slice(0, 12).forEach(f => {
      loadFont(f.family)
    })
  }, [open, loadFont])

  return (
    <div
      data-font-panel="true"
      className={`absolute z-40 inset-y-[4px] left-[4px] w-[275px] rounded-[12px] bg-white shadow-[32px_0px_50px_0px_rgba(0,0,0,0.05)] flex flex-col transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "-translate-x-[calc(100%+100px)]"
      }`}
    >
      <div className="px-7 pt-6 flex-shrink-0">
        {/* Panel headings are MADE Outer Sans, as everywhere create-omat
            reaches for the kit's `font-made` token; this project registers the
            same face as --font-display. Size/leading/weight follow create-omat's
            own text panels (src/components/ui/color-panel/ColorPanel.tsx). */}
        <h3 className="font-display mb-6 text-lg leading-[26px] font-medium">Font</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex flex-col gap-3">
          <div className="no-scrollbar grid w-full grid-cols-2 gap-3 overflow-x-auto">
            {FONTS.length === 0 ? (
              <FontGridSkeleton />
            ) : (
              FONTS.map(font => (
                <FontButton
                  key={font.family}
                  font={font}
                  isSelected={font.family === currentFontFamily}
                  onClick={f => {
                    onChange(f.family)
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Close font panel"
        onClick={onClose}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-2xl border border-neutral-200 bg-white px-0.5 py-3 hover:bg-neutral-50"
      >
        <img src="/icons/icon-chevron-left.svg" alt="" className="size-6" />
      </button>
    </div>
  )
}
