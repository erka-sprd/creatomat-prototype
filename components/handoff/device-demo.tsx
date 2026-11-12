"use client"

/**
 * A rule's demo with a Desktop / Mobile switch, at the left of the controls
 * under it. Desktop is the scene itself; Mobile is its mobile version in an
 * iframe (mobile-scene-frame) — a narrow window, so the designer's mobile
 * components lay out as on a phone — with Auto play and Start over still
 * here, sent in.
 *
 * Switching: the old version fades out and the box eases straight to the new
 * one's size. Mobile shows a phone-shaped skeleton there while its page
 * loads, hidden behind it, then fades the page in.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

import { SceneControls } from "@/components/handoff/embroidery-canvas"
import type { SceneDevice } from "@/components/handoff/embroidery-scene"
import type { MobileSceneKey } from "@/components/handoff/embroidery-scripts"
import { FRAME_CONTROL, FRAME_HEIGHT } from "@/components/handoff/mobile-scene-frame"
import type { QualityMobileSceneKey } from "@/components/handoff/print-quality-scripts"
import {
  PHONE_BEZEL_PX,
  PHONE_FRAME_H,
  PHONE_FRAME_W,
  PHONE_SCREEN_RADIUS,
} from "@/lib/handoff-phone"

type Device = "desktop" | "mobile"

/** The mobile version's scene: which handoff's frame page, and its key there. */
type FrameScene =
  | { frame?: "embroidery"; scene: MobileSceneKey }
  | { frame: "print-quality"; scene: QualityMobileSceneKey }

const FADE_OUT_MS = 150
const RESIZE_MS = 450
const FADE_IN_MS = 300
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)"
// How long the mobile page's height reports must stay quiet to count as final.
const HEIGHT_SETTLE_MS = 120
// A mobile page that never reports its height is shown anyway after this.
const READY_FALLBACK_MS = 3000
// Above the phone, a mobile page holds the rule's steps (StepList). Until a
// page has reported its height, the skeleton guesses theirs.
const STEPS_GUESS_PX = 153

// The mobile pages' heights as last reported, by page, and the last of any —
// so the skeleton takes the size its page will have.
const reportedHeights = new Map<string, number>()
let lastReportedHeight = PHONE_FRAME_H + STEPS_GUESS_PX
const expectedHeight = (src: string) => reportedHeights.get(src) ?? lastReportedHeight

export function DeviceDemo({
  frame = "embroidery",
  scene,
  children,
}: FrameScene & {
  /** The desktop scene, given the switch to show beside its controls. */
  children: (device: SceneDevice) => ReactNode
}) {
  const [device, setDevice] = useState<Device>("desktop")
  const box = useSmoothBox()
  const switcher = (
    <DeviceSwitch value={device} onChange={d => d !== device && box.swap(() => setDevice(d))} />
  )

  // The new version is in: ease the box to it (skipped on the first render).
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) firstRender.current = false
    else box.settle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device])

  return (
    <div ref={box.wrapRef} style={box.style} onTransitionEnd={box.onTransitionEnd}>
      <div ref={box.innerRef} style={box.innerStyle}>
        {device === "desktop" ? (
          children({ controlsLeading: switcher })
        ) : (
          <MobileFrame
            src={`/handoff-frame/${frame}/${scene}`}
            switcher={switcher}
            onResize={box.resize}
          />
        )}
      </div>
    </div>
  )
}

/**
 * A box whose height eases when its content changes: `swap` fades the
 * content out, changes it, then (on `settle`) eases to the new height and
 * fades it in; `resize` eases to a change made in place, with no fade.
 */
function useSmoothBox() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  // The box's height while it moves, in px; null is its content's own.
  const [lockedH, setLockedH] = useState<number | null>(null)
  const [shown, setShown] = useState(true)
  // Locked and waiting for the content's new height.
  const waiting = useRef(false)
  const reduced = useRef(false)
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  const lock = () => {
    waiting.current = true
    setLockedH(wrapRef.current?.offsetHeight ?? null)
  }

  // Ease to the content's height. Two frames, so the change is laid out.
  const settle = () => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        waiting.current = false
        const target = innerRef.current?.offsetHeight ?? 0
        const from = wrapRef.current?.offsetHeight ?? 0
        setShown(true)
        // No change in height: no transition to wait for.
        setLockedH(Math.abs(target - from) < 1 ? null : target)
      })
    )
  }

  const swap = (change: () => void) => {
    if (reduced.current) return change()
    lock()
    setShown(false)
    window.setTimeout(change, FADE_OUT_MS)
  }

  const resize = (change: () => void) => {
    if (reduced.current) return change()
    lock()
    change()
    settle()
  }

  // Done moving: back to the content's own height, so a scene that grows
  // later isn't clipped.
  const onTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target === wrapRef.current && e.propertyName === "height" && !waiting.current) {
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
  return { wrapRef, innerRef, style, innerStyle, swap, settle, resize, onTransitionEnd }
}

function MobileFrame({
  src,
  switcher,
  onResize,
}: {
  src: string
  switcher: ReactNode
  /** Makes a change in place, easing the box to the height it leaves. */
  onResize: (change: () => void) => void
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(() => expectedHeight(src))
  // The page has laid out: it replaces the skeleton.
  const [ready, setReady] = useState(false)
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize
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
    let isReady = false
    const show = () => {
      if (isReady) return
      isReady = true
      window.clearTimeout(fallback)
      onResizeRef.current(() => setReady(true))
    }
    // Ready once the reports settle: the page can report a few heights as it
    // lays out, and the skeleton should give way once, to the last.
    let settle: number | undefined
    const fallback = window.setTimeout(show, READY_FALLBACK_MS)
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow || e.data?.type !== FRAME_HEIGHT) return
      const h = Number(e.data.h)
      if (!h) return
      reportedHeights.set(src, h)
      lastReportedHeight = h
      setHeight(h)
      window.clearTimeout(settle)
      settle = window.setTimeout(show, HEIGHT_SETTLE_MS)
    }
    window.addEventListener("message", onMessage)
    return () => {
      window.clearTimeout(settle)
      window.clearTimeout(fallback)
      window.removeEventListener("message", onMessage)
    }
  }, [src])

  return (
    <div className="flex flex-col gap-3">
      {/* Until it's ready the page loads out of sight, behind the skeleton. */}
      <div className="relative">
        {!ready && <MobileSkeleton height={expectedHeight(src)} />}
        <iframe
          ref={frameRef}
          src={src}
          title="Mobile version"
          onLoad={send}
          className={`block w-full border-0 ${ready ? "" : "pointer-events-none absolute inset-x-0 top-0"}`}
          style={{
            height,
            opacity: ready ? 1 : 0,
            transition: `opacity ${FADE_IN_MS}ms ${EASE}`,
          }}
        />
      </div>
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

/** The mobile page's shape while it loads: its steps above, the phone below. */
function MobileSkeleton({ height }: { height: number }) {
  return (
    <div aria-hidden className="flex animate-pulse flex-col items-center gap-3" style={{ height }}>
      <div className="flex w-full flex-1 flex-col justify-center gap-3">
        <div className="h-12 w-full rounded-[12px] bg-[var(--ho-tint)]" />
        <div className="mx-auto h-4 w-2/3 rounded-full bg-[var(--ho-tint)]" />
      </div>
      <div
        className="shrink-0 bg-neutral-200"
        style={{
          width: PHONE_FRAME_W,
          height: PHONE_FRAME_H,
          padding: PHONE_BEZEL_PX,
          borderRadius: PHONE_SCREEN_RADIUS + PHONE_BEZEL_PX,
        }}
      >
        <div className="size-full bg-neutral-100" style={{ borderRadius: PHONE_SCREEN_RADIUS }} />
      </div>
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
