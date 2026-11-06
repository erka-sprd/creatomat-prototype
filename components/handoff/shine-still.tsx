"use client"

/**
 * The design's shine while "Creating preview" runs — the designer's own
 * .embroidery-scan sweep, masked to the design's pixels so only the design
 * lights up, never the product — and the loader pill under it. Just the two,
 * in a plain frame: a style reference, not a scene.
 */

import { useEffect, useState } from "react"

import { EMBROIDERY_MIN_LOADER_MS } from "@/components/designer"
import { EmbroideryPreviewStatus } from "@/components/embroidery-label"

const DESIGN = "/img/graphics/graphics5.png"
/** A beat on the last statement before the pill types both again. */
const HOLD_MS = 1200

export function ShineStill() {
  // The pill types its two statements once per check; here it starts over,
  // so both keep coming.
  const [round, setRound] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setRound(n => n + 1), EMBROIDERY_MIN_LOADER_MS + HOLD_MS)
    return () => window.clearInterval(t)
  }, [])
  const mask = {
    maskImage: `url(${DESIGN})`,
    WebkitMaskImage: `url(${DESIGN})`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  }
  return (
    <div className="flex w-full min-w-[560px] flex-col items-center gap-8 rounded-[12px] bg-[#F4F4F4] py-12">
      <div className="relative size-[200px]">
        <img src={DESIGN} alt="" draggable={false} className="absolute inset-0 size-full object-contain" />
        <div aria-hidden="true" className="embroidery-scan absolute inset-0" style={mask} />
      </div>
      <EmbroideryPreviewStatus key={round} loading durationMs={EMBROIDERY_MIN_LOADER_MS} docked />
    </div>
  )
}
