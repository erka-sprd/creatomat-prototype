"use client"

/**
 * A rule's demo with a Desktop / Mobile switch, at the left of the controls
 * under it. Desktop is the scene itself; Mobile is its mobile version in an
 * iframe (mobile-scene-frame) — a narrow window, so the designer's mobile
 * components lay out as on a phone — with Auto play and Start over still
 * here, sent in.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

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
  const { wrapRef, innerRef, style, innerStyle, switchTo, reveal, onTransitionEnd } =
    useSmoothSwap(setDevice)
  const switcher = <DeviceSwitch value={device} onChange={d => d !== device && switchTo(d)} />

  // Desktop is ready as soon as it's rendered; Mobile once its page has
  // reported its height (MobileFrame's onReady).
  useEffect(() => {
    if (device === "desktop") reveal()
  }, [device, reveal])

  return (
    <div ref={wrapRef} style={style} onTransitionEnd={onTransitionEnd}>
      <div ref={innerRef} style={innerStyle}>
        {device === "desktop" ? (
          children({ controlsLeading: switcher })
        ) : (
          <MobileFrame src={`/handoff-frame/${frame}/${scene}`} switcher={switcher} onReady={reveal} />
        )}
      </div>
    </div>
  )
}

// The switch's motion: the old version fades out, the box holds its height
// until the new version has its own, then eases to it as the new one fades in.
const FADE_OUT_MS = 150
const RESIZE_MS = 450
const FADE_IN_MS = 300
// A mobile page that never reports its height is shown anyway after this.
const READY_FALLBACK_MS = 2000
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)"
// How long the mobile page's height reports must stay quiet to count as final.
const HEIGHT_SETTLE_MS = 120

function useSmoothSwap(setDevice: (d: Device) => void) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  // The box's height while switching, in px; null is its content's own.
  const [lockedH, setLockedH] = useState<number | null>(null)
  const [shown, setShown] = useState(true)
  const switching = useRef(false)
  const fallback = useRef<number | undefined>(undefined)
  const reduced = useRef(false)
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    return () => window.clearTimeout(fallback.current)
  }, [])

  const switchTo = (d: Device) => {
    const wrap = wrapRef.current
    if (!wrap || reduced.current) return setDevice(d)
    switching.current = true
    setLockedH(wrap.offsetHeight)
    setShown(false)
    window.setTimeout(() => setDevice(d), FADE_OUT_MS)
    window.clearTimeout(fallback.current)
    fallback.current = window.setTimeout(() => reveal(), FADE_OUT_MS + READY_FALLBACK_MS)
  }

  // The new version is laid out: ease the box to its height and fade it in.
  // Two frames, so a height it has just set is in the layout.
  const reveal = useCallback(() => {
    if (!switching.current) return
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!switching.current) return
        switching.current = false
        window.clearTimeout(fallback.current)
        const target = innerRef.current?.offsetHeight ?? 0
        const from = wrapRef.current?.offsetHeight ?? 0
        setShown(true)
        // No change in height: no transition to wait for.
        setLockedH(Math.abs(target - from) < 1 ? null : target)
      })
    )
  }, [])

  // Done resizing: back to the content's own height, so a scene that grows
  // later isn't clipped.
  const onTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target === wrapRef.current && e.propertyName === "height" && !switching.current) {
      setLockedH(null)
    }
  }

  const style: CSSProperties =
    lockedH === null
      ? {}
      : { height: lockedH, overflow: "hidden", transition: `height ${RESIZE_MS}ms ${EASE}` }
  const innerStyle: CSSProperties = {
    opacity: shown ? 1 : 0,
    transition: `opacity ${shown ? FADE_IN_MS : FADE_OUT_MS}ms ${EASE}`,
  }
  return { wrapRef, innerRef, style, innerStyle, switchTo, reveal, onTransitionEnd }
}

function MobileFrame({
  src,
  switcher,
  onReady,
}: {
  src: string
  switcher: ReactNode
  /** The page has reported its height and the frame has taken it. */
  onReady: () => void
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(820)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
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
      // Ready once the reports settle: the page can report a few heights as
      // it lays out, and the box should resize once, to the last.
      window.clearTimeout(settle)
      settle = window.setTimeout(() => onReadyRef.current(), HEIGHT_SETTLE_MS)
    }
    let settle: number | undefined
    window.addEventListener("message", onMessage)
    return () => {
      window.clearTimeout(settle)
      window.removeEventListener("message", onMessage)
    }
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
