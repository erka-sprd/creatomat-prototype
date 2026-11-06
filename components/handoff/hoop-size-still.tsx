"use client"

/**
 * §1's picture, held still: a design as embroidery places it — at the hoop
 * frame's size — with the hoop frame drawn round it. The frame and its label
 * are the document's annotation (magenta, dashed, the document's mono type),
 * not the designer's UI: the designer draws no hoop frame.
 *
 * The shirt and print area are laid out as in the scenes (areaGeo). The
 * design is sized as the designer places it: by its ink — what's drawn, not
 * the file's transparent margins (graphicInkFractions) — filling the frame.
 */

import { useEffect, useRef, useState } from "react"

import { useAspects, type CanvasProduct } from "@/components/handoff/embroidery-canvas"
import {
  areaGeo,
  PRODUCT_PX,
  STAGE_HEIGHT_PX,
  useStageWidth,
} from "@/components/handoff/embroidery-scene"
import { graphicInkFractions, type InkRect } from "@/lib/ink-bounds"

/** A design about the hoop frame's own proportions, so it fills it both ways. */
const DESIGN = "/img/graphics/graphics16.png"
/** Where the design sits in the print area (0–1), the hoop frame round it. */
const CENTRE = { cx: 0.5, cy: 0.42 }

export function HoopSizeStill({ product }: { product: CanvasProduct | null }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const stageW = useStageWidth(stageRef)
  const aspect = useAspects([DESIGN])[DESIGN]
  const [ink, setInk] = useState<InkRect | null>(null)
  useEffect(() => {
    let live = true
    graphicInkFractions(DESIGN).then(r => live && setInk(r ?? { l: 0, t: 0, r: 1, b: 1 }))
    return () => {
      live = false
    }
  }, [])
  const area = product && stageW ? areaGeo(product, stageW) : null
  const hoop =
    product && area
      ? {
          width: product.hoop * area.width,
          height: product.hoop * area.height,
          left: CENTRE.cx * area.width - (product.hoop * area.width) / 2,
          top: CENTRE.cy * area.height - (product.hoop * area.height) / 2,
        }
      : null
  // The image, scaled so its ink is as large as fits the frame, ink centred in it.
  const geo =
    hoop && aspect && ink
      ? (() => {
          const width = Math.min(
            hoop.width / (ink.r - ink.l),
            hoop.height / (aspect * (ink.b - ink.t))
          )
          const height = width * aspect
          return {
            width,
            height,
            left: hoop.left + hoop.width / 2 - width * ((ink.l + ink.r) / 2),
            top: hoop.top + hoop.height / 2 - height * ((ink.t + ink.b) / 2),
          }
        })()
      : null

  return (
    <div
      ref={stageRef}
      className="relative w-full min-w-[560px] overflow-hidden rounded-[12px] bg-[#F4F4F4]"
      style={{ height: STAGE_HEIGHT_PX }}
    >
      {product && area && (
        <>
          <img
            src={product.image}
            alt=""
            draggable={false}
            className="absolute max-w-none"
            style={{ left: area.productLeft, top: area.productTop, width: PRODUCT_PX, height: PRODUCT_PX }}
          />
          <div
            className="absolute"
            style={{ left: area.left, top: area.top, width: area.width, height: area.height }}
          >
            {geo && (
              <img
                src={DESIGN}
                alt=""
                draggable={false}
                className="absolute object-contain"
                style={geo}
              />
            )}
            {hoop && (
              <div
                aria-hidden="true"
                className="absolute border-[1.5px] border-dashed border-fuchsia-600"
                style={hoop}
              >
                <span className="absolute bottom-full left-[-1.5px] mb-1.5 rounded-[3px] bg-fuchsia-600 px-1.5 py-0.5 font-[family-name:var(--ho-mono)] text-[10px] leading-none tracking-[0.08em] whitespace-nowrap text-white uppercase">
                  Hoop frame size
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
