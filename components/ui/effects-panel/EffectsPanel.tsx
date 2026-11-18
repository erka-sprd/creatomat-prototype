"use client"

import { Fragment, useEffect, useRef } from "react"

import { EffectSliders } from "./EffectSliders"
import { EffectTile } from "./EffectTile"
import { EFFECTS, EFFECTS_PANEL_TITLE, effectById, type AppliedEffect, type EffectDef } from "@/lib/effects"

type EffectsPanelProps = {
  open: boolean
  onClose: () => void
  /** The selected image's effect; null when it has none. */
  current: AppliedEffect | null
  onPick: (effect: EffectDef | null) => void
  onValueChange: (key: string, value: number) => void
}

// The grid as rows of two, "No Effect" first (EffectsGrid's allItems / rows).
const ITEMS: (EffectDef | null)[] = [null, ...EFFECTS]
const ROWS: (EffectDef | null)[][] = []
for (let i = 0; i < ITEMS.length; i += 2) ROWS.push(ITEMS.slice(i, i + 2))

// create-omat's desktop Effects panel — GridPanel with EffectsGrid: the left
// drawer, "Effects" over a two-column grid of thumbnails. The picked effect's
// sliders open in a grey box under its row, a caret pointing up at its tile.
export function EffectsPanel({ open, onClose, current, onPick, onValueChange }: EffectsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)
  const currentDef = effectById(current?.id)

  // On open, centre the image's current effect in the list.
  useEffect(() => {
    const container = scrollRef.current
    const el = selectedRef.current
    if (!open || !container || !el) return
    const top =
      el.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      container.clientHeight / 2 +
      el.clientHeight / 2
    container.scrollTop = Math.max(0, top)
  }, [open])

  const selectedIndex = currentDef && currentDef.params.length > 0 ? ITEMS.indexOf(currentDef) : -1
  const slidersRow = selectedIndex === -1 ? -1 : Math.floor(selectedIndex / 2)
  // Centre of the picked tile's column (two columns, 0.75rem apart).
  const caretLeft =
    selectedIndex % 2 === 0 ? "calc((100% - 0.75rem) / 4)" : "calc(100% - (100% - 0.75rem) / 4)"

  return (
    <div
      data-effects-panel="true"
      className={`absolute inset-y-[4px] left-[4px] z-40 flex w-[275px] flex-col rounded-[12px] bg-white shadow-[32px_0px_50px_0px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "-translate-x-[calc(100%+100px)]"
      }`}
    >
      <div className="flex-shrink-0 px-7 pt-6">
        <h3 className="font-display mb-6 text-lg leading-[26px] font-medium">
          {EFFECTS_PANEL_TITLE}
        </h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex flex-col gap-3">
          {ROWS.map((row, rowIndex) => (
            <Fragment key={rowIndex}>
              <div className="grid grid-cols-2 gap-3">
                {row.map(effect => {
                  const isSelected = effect === null ? !currentDef : effect.id === currentDef?.id
                  return (
                    <EffectTile
                      key={effect?.id ?? "no-effect"}
                      ref={isSelected ? selectedRef : undefined}
                      variant="desktop"
                      effect={effect}
                      isSelected={isSelected}
                      onClick={() => onPick(effect)}
                    />
                  )
                })}
              </div>
              {rowIndex === slidersRow && currentDef && current && (
                <div className="relative mb-3 flex flex-col gap-6 rounded-xs bg-neutral-100 p-6">
                  <div
                    aria-hidden="true"
                    className="absolute -top-3 size-0 -translate-x-1/2 border-x-[12px] border-b-[12px] border-x-transparent border-b-neutral-100"
                    style={{ left: caretLeft }}
                  />
                  <EffectSliders
                    variant="desktop"
                    effect={currentDef}
                    values={current.values}
                    onChange={onValueChange}
                  />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="Close effects panel"
        onClick={onClose}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 cursor-pointer rounded-2xl border border-neutral-200 bg-white px-0.5 py-3 hover:bg-neutral-50"
      >
        <img src="/icons/icon-chevron-left.svg" alt="" className="size-6" />
      </button>
    </div>
  )
}
