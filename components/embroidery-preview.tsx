"use client"

// The stitched preview, rendered by the shader in lib/embroidery-gl.ts.
//
// Same contract as product-catalog-client's EmbroideryPreview — src in, a
// canvas out, onRendered with its data URL — and the same code as the
// package's new version. It lives here because the prototype pins the package
// by tarball: once the package is pushed and reinstalled, this file goes and
// the imports return to "product-catalog-client". A browser without WebGL
// falls back to the package's JS renderer.

import { useEffect, useRef, type CSSProperties } from "react"
import { renderEmbroidery } from "product-catalog-client"
import { embroideryGlSupported, renderEmbroideryGl } from "@/lib/embroidery-gl"

export interface EmbroideryPreviewProps {
  src: string
  maxSize?: number
  style?: CSSProperties
  className?: string
  onRendered?: (dataUrl: string) => void
}

export function EmbroideryPreview({
  src,
  maxSize = 500,
  style,
  className,
  onRendered,
}: EmbroideryPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onRenderedRef = useRef(onRendered)
  onRenderedRef.current = onRendered

  useEffect(() => {
    if (!src) return
    const canvas = canvasRef.current
    if (!canvas) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext("2d", { willReadFrequently: true })!
      ctx.clearRect(0, 0, w, h)

      const offscreen = document.createElement("canvas")
      offscreen.width = w
      offscreen.height = h
      const octx = offscreen.getContext("2d", { willReadFrequently: true })!
      octx.drawImage(img, 0, 0, w, h)

      const result = embroideryGlSupported()
        ? renderEmbroideryGl(offscreen, w, h)
        : renderEmbroidery(octx.getImageData(0, 0, w, h), w, h)
      ctx.drawImage(result, 0, 0)
      onRenderedRef.current?.(canvas.toDataURL("image/png"))
    }
    img.src = src
  }, [src, maxSize])

  return <canvas ref={canvasRef} style={style} className={className} />
}

export default EmbroideryPreview
