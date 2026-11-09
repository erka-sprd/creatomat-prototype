"use client"

import { useEffect, useState } from "react"

/**
 * A text being typed, as images — placed, sized and stitched like a graphic:
 * one per letter typed (with the caret), then the whole text without it.
 * Each only as wide as what's typed so far, on one height, so its box grows
 * with the text as a text box does (the scene keeps the letters' scale).
 */
export const TYPED_TEXT_H = 200
export function useTypedText(text: string, color: string) {
  const [frames, setFrames] = useState<{ src: string; w: number }[] | null>(null)
  useEffect(() => {
    const ctx = document.createElement("canvas").getContext("2d")
    if (!ctx) return
    const font = "800 160px system-ui, sans-serif"
    const draw = (typed: string, caret: boolean) => {
      ctx.font = font
      const w = Math.ceil(ctx.measureText(typed).width) + (caret ? 34 : 16)
      const canvas = ctx.canvas
      canvas.width = w
      canvas.height = TYPED_TEXT_H
      ctx.font = font
      ctx.fillStyle = color
      ctx.textBaseline = "middle"
      ctx.fillText(typed, 8, 104)
      if (caret) ctx.fillRect(14 + ctx.measureText(typed).width, 30, 8, 148)
      return { src: canvas.toDataURL("image/png"), w }
    }
    const typing = Array.from({ length: text.length + 1 }, (_, n) => draw(text.slice(0, n), true))
    setFrames([...typing, draw(text, false)])
  }, [text, color])
  return frames
}
