"use client"

/**
 * A rule's demo with a Desktop / Mobile switch, at the left of the controls
 * under it. Desktop is the scene itself; Mobile is its mobile version in an
 * iframe (mobile-scene-frame) — a narrow window, so the designer's mobile
 * components lay out as on a phone — with Auto play and Start over still
 * here, sent in.
 */

import { useEffect, useRef, useState, type ReactNode } from "react"

import { SceneControls } from "@/components/handoff/embroidery-canvas"
import type { SceneDevice } from "@/components/handoff/embroidery-scene"
import type { MobileSceneKey } from "@/components/handoff/embroidery-scripts"
import { FRAME_CONTROL, FRAME_HEIGHT } from "@/components/handoff/mobile-scene-frame"
import type { QualityMobileSceneKey } from "@/components/handoff/print-quality-scripts"

type Device = "desktop" | "mobile"

/** The mobile version's scene: which handoff's frame page, and its key there. */
type FrameScene =
  | { frame?: "embroidery"; scene: MobileSceneKey }
  | { frame: "print-quality"; scene: QualityMobileSceneKey }

export function DeviceDemo({
  frame = "embroidery",
  scene,
  children,
}: FrameScene & {
  /** The desktop scene, given the switch to show beside its controls. */
  children: (device: SceneDevice) => ReactNode
}) {
  const [device, setDevice] = useState<Device>("desktop")
  const switcher = <DeviceSwitch value={device} onChange={setDevice} />
  if (device === "desktop") return <>{children({ controlsLeading: switcher })}</>
  return <MobileFrame src={`/handoff-frame/${frame}/${scene}`} switcher={switcher} />
}

function MobileFrame({ src, switcher }: { src: string; switcher: ReactNode }) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(820)
  const [autoPlay, setAutoPlay] = useState(true)
  const [restart, setRestart] = useState(0)

  const send = () =>
    frameRef.current?.contentWindow?.postMessage(
      { type: FRAME_CONTROL, autoPlay, restart },
      window.location.origin
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(send, [autoPlay, restart])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow || e.data?.type !== FRAME_HEIGHT) return
      setHeight(Number(e.data.h) || 820)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <iframe
        ref={frameRef}
        src={src}
        title="Mobile version"
        onLoad={send}
        className="block w-full border-0"
        style={{ height }}
      />
      <SceneControls
        leading={switcher}
        autoPlay={autoPlay}
        onAutoPlay={setAutoPlay}
        onStartOver={() => {
          setAutoPlay(true)
          setRestart(n => n + 1)
        }}
      />
    </div>
  )
}

/** Desktop / Mobile, as pill tabs in the controls' grey. */
function DeviceSwitch({ value, onChange }: { value: Device; onChange: (d: Device) => void }) {
  return (
    <div role="tablist" className="flex rounded-full bg-[var(--ho-tint)] p-1">
      {(["desktop", "mobile"] as const).map(d => (
        <button
          key={d}
          type="button"
          role="tab"
          aria-selected={value === d}
          onClick={() => onChange(d)}
          className={`cursor-pointer rounded-full px-4 text-base font-semibold capitalize transition-colors ${
            value === d ? "bg-white text-black shadow-xs" : "text-[var(--ho-muted)] hover:text-black"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  )
}
