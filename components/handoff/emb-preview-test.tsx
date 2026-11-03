"use client"

/**
 * /handoff/embroidery/emb-preview-test — a tuning bench for the stitched
 * preview: every design from the Graphics panel rendered by the shader, the
 * shader's knobs in a bar that stays put while the page scrolls, and a Copy
 * button that puts the current configuration on the clipboard as the
 * `EMBROIDERY_GL_DEFAULTS` literal.
 *
 * Each design is scaled to the designer's render size before it goes to the
 * shader, as EmbroideryPreview does it.
 */

import { useEffect, useRef, useState } from "react"
import { Kicker } from "@/components/handoff/handoff-ui"
import {
  EMBROIDERY_GL_DEFAULTS,
  embroideryGlSupported,
  renderEmbroideryGl,
  type EmbroideryGlOptions,
} from "@/lib/embroidery-gl"
import { PANEL_DESIGNS } from "@/lib/graphics-library"

/** The designer's render size for the stitched preview (designer.tsx). */
const RENDER_PX = 620

/** The panel's list: the embroidery-rule designs first, then the marketplace mix. */
const DESIGNS = PANEL_DESIGNS
const SRCS = DESIGNS.map(d => d.src)

type Options = Required<EmbroideryGlOptions>

const KNOBS: { key: keyof Options; label: string; min: number; max: number; step: number }[] = [
  { key: "pitch", label: "Thread pitch", min: 1.5, max: 8, step: 0.1 },
  { key: "border", label: "Satin border", min: 2, max: 16, step: 0.5 },
  { key: "stitch", label: "Stitch length", min: 3, max: 20, step: 0.5 },
  { key: "levels", label: "Colour levels", min: 3, max: 32, step: 1 },
  { key: "sheen", label: "Sheen", min: 0, max: 1, step: 0.05 },
  { key: "relief", label: "Relief", min: 0, max: 1, step: 0.05 },
]

function loadScaled(src: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(RENDER_PX / img.width, RENDER_PX / img.height, 1)
      const c = document.createElement("canvas")
      c.width = Math.max(1, Math.round(img.width * scale))
      c.height = Math.max(1, Math.round(img.height * scale))
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height)
      resolve(c)
    }
    img.onerror = reject
    img.src = src
  })
}

/** The configuration as it would be pasted into embroidery-gl.ts. */
function asLiteral(o: Options) {
  const body = KNOBS.map(k => `  ${k.key}: ${o[k.key]},`).join("\n")
  return `export const EMBROIDERY_GL_DEFAULTS: Required<EmbroideryGlOptions> = {\n${body}\n}`
}

export default function EmbPreviewTest() {
  const [bases, setBases] = useState<(HTMLCanvasElement | undefined)[]>([])
  const [renders, setRenders] = useState<(HTMLCanvasElement | undefined)[]>([])
  const [options, setOptions] = useState<Options>(EMBROIDERY_GL_DEFAULTS)
  const [supported, setSupported] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    setSupported(embroideryGlSupported())
    Promise.all(SRCS.map(src => loadScaled(src).catch(() => undefined))).then(loaded => {
      if (!cancelled) setBases(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Every knob change re-renders the whole panel — a few milliseconds each on
  // a GPU — coalesced to one pass per frame while a slider is being dragged.
  useEffect(() => {
    if (!supported || bases.length === 0) return
    const id = requestAnimationFrame(() => {
      setRenders(
        bases.map(base => base && renderEmbroideryGl(base, base.width, base.height, options))
      )
    })
    return () => cancelAnimationFrame(id)
  }, [bases, options, supported])

  const copy = async () => {
    await navigator.clipboard.writeText(asLiteral(options))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="pt-[60px] pb-6">
        <Kicker>Embroidery · preview tuning</Kicker>
        <h1 className="m-0 font-display text-[clamp(28px,4.5vw,38px)] leading-[1.05] font-medium tracking-[-0.02em]">
          The stitched preview, every design
        </h1>
      </header>

      <div className="sticky top-0 z-10 -mx-[22px] bg-[var(--ho-ground)] px-[22px] py-3">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 rounded-[18px] bg-[var(--ho-specimen)] px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          {KNOBS.map(k => (
            <label key={k.key} className="flex items-center gap-3 text-[14px] font-semibold">
              <span className="w-[96px]">{k.label}</span>
              <input
                type="range"
                min={k.min}
                max={k.max}
                step={k.step}
                value={options[k.key]}
                onChange={e => setOptions(o => ({ ...o, [k.key]: Number(e.target.value) }))}
                className="w-[120px] accent-[#2EBB6E]"
              />
              <span className="w-[36px] font-[family-name:var(--ho-mono)] font-normal text-[var(--ho-muted)] tabular-nums">
                {options[k.key]}
              </span>
            </label>
          ))}
          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              onClick={() => setOptions(EMBROIDERY_GL_DEFAULTS)}
              className="text-[14px] font-semibold text-[var(--ho-muted)] underline underline-offset-4"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={copy}
              className="rounded-full bg-black px-4 py-2 text-[14px] font-semibold text-white"
            >
              {copied ? "Copied" : "Copy config"}
            </button>
          </div>
        </div>
      </div>

      {!supported && (
        <p className="mt-6 rounded-[12px] border border-[#FCD34D] bg-[#FEF3C7] p-4 text-[15px] text-[#78350F]">
          This browser has no WebGL, so the shader cannot render here.
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 max-[720px]:grid-cols-2">
        {DESIGNS.map((design, i) => (
          <Cell key={design.src} label={`${design.name} · ${design.tags.join(", ")}`} canvas={renders[i]} />
        ))}
      </div>
    </div>
  )
}

/** Mounts a rendered canvas as-is, on the designer's canvas grey. */
function Cell({ label, canvas }: { label: string; canvas?: HTMLCanvasElement }) {
  const hostRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    host.replaceChildren()
    if (!canvas) return
    canvas.style.display = "block"
    canvas.style.maxWidth = "100%"
    canvas.style.maxHeight = "100%"
    canvas.style.width = "auto"
    canvas.style.height = "auto"
    canvas.style.margin = "auto"
    host.append(canvas)
  }, [canvas])

  return (
    <div className="flex flex-col gap-1.5 rounded-[18px] bg-[var(--ho-specimen)] p-3">
      {/* The host is left to the canvas alone; React never writes into it. */}
      <div className="relative aspect-square rounded-[12px] bg-[#F4F4F4]">
        {/* Absolute, so the box has a definite height for the canvas to fit into. */}
        <div ref={hostRef} className="absolute inset-3 flex items-center justify-center" />
      </div>
      <p className="m-0 truncate font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
        {label}
      </p>
    </div>
  )
}
