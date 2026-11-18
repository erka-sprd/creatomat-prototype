"use client"

import { useEffect, useRef } from "react"

import { EffectTile } from "./EffectTile"
import { EFFECTS, type EffectDef } from "@/lib/effects"

type EffectStripProps = {
  currentId: string | null
  onPick: (effect: EffectDef | null) => void
  /** The picked tile's sliders button: opens the controls view. */
  onShowControls: (effect: EffectDef) => void
}

// create-omat's mobile EffectsPanel (MobileEditDrawer → Effects): one
// horizontal strip of 96 × 120px thumbnails, "No Effect" first, the current
// effect scrolled into the middle when the tab opens.
export function EffectStrip({ currentId, onPick, onShowControls }: EffectStripProps) {
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" })
    // Only on mount: picking an effect shouldn't jump the strip under the finger.
  }, [])

  return (
    <div className="no-scrollbar flex w-full items-center overflow-x-auto py-1">
      <div className="flex w-max shrink-0 items-center gap-3 px-4">
        <EffectTile
          ref={currentId === null ? selectedRef : undefined}
          variant="mobile"
          effect={null}
          isSelected={currentId === null}
          onClick={() => onPick(null)}
        />
        {EFFECTS.map(effect => (
          <EffectTile
            key={effect.id}
            ref={effect.id === currentId ? selectedRef : undefined}
            variant="mobile"
            effect={effect}
            isSelected={effect.id === currentId}
            onClick={() => onPick(effect)}
            onShowControls={() => onShowControls(effect)}
          />
        ))}
      </div>
    </div>
  )
}
