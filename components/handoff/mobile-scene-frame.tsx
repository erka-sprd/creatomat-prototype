"use client"

/**
 * The page inside a handoff rule's Mobile tab: one scene on a phone screen.
 * Its Auto play and Start over are the handoff page's (DeviceDemo), sent in by
 * postMessage; it reports its height back, so the frame fits it.
 */

import { useEffect, useState, type ReactNode } from "react"

import { useCanvasProduct, type CanvasProduct } from "@/components/handoff/embroidery-canvas"
import type { SceneDevice } from "@/components/handoff/embroidery-scene"
import { MOBILE_SCENES } from "@/components/handoff/embroidery-scripts"
import {
  QUALITY_MOBILE_SCENES,
  QUALITY_PRODUCT_COLOR,
} from "@/components/handoff/print-quality-scripts"

export const FRAME_CONTROL = "ho-frame-control"
export const FRAME_HEIGHT = "ho-frame-height"

type MobileScene = (props: { product: CanvasProduct | null; device?: SceneDevice }) => ReactNode
// Each handoff's scenes with a mobile version, by the frame page's path.
const FRAMES: Record<string, Record<string, MobileScene>> = {
  embroidery: MOBILE_SCENES,
  "print-quality": QUALITY_MOBILE_SCENES,
}
// A handoff's own T-shirt colour, where it isn't the default white.
const FRAME_COLORS: Record<string, string> = { "print-quality": QUALITY_PRODUCT_COLOR }

export default function MobileSceneFrame({
  scene,
  frame = "embroidery",
}: {
  scene: string
  /** Whose scene it is: the handoff the frame page belongs to. */
  frame?: string
}) {
  const product = useCanvasProduct(undefined, FRAME_COLORS[frame])
  const [control, setControl] = useState({ autoPlay: true, restart: 0 })

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== FRAME_CONTROL) return
      setControl({ autoPlay: !!e.data.autoPlay, restart: Number(e.data.restart) || 0 })
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const report = () =>
      window.parent.postMessage({ type: FRAME_HEIGHT, h: root.scrollHeight }, window.location.origin)
    const ro = new ResizeObserver(report)
    ro.observe(document.body)
    report()
    return () => ro.disconnect()
  }, [])

  const Scene = FRAMES[frame]?.[scene]
  if (!Scene) return null
  return (
    // White, like the handoff's demo frame it sits in — the phone screen alone
    // is grey. (Inline: .handoff paints the page's grey, unlayered.)
    <div className="handoff" style={{ background: "#fff" }}>
      <Scene
        product={product}
        device={{ mobile: true, hideControls: true, autoPlay: control.autoPlay, restartSignal: control.restart }}
      />
    </div>
  )
}
