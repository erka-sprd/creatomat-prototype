"use client"

/**
 * A scene's mobile version, around the canvas: the designer's own mobile
 * header, view dots and dock — the dock showing "Done" while a design is
 * selected, and making way, as the bottom row does on desktop, while a
 * message or loader takes its place (designer.tsx's mobileDockHidden) — the
 * Solutions in a bottom drawer (MobileDrawer's look) with the two cards side
 * by side, and a fingertip where desktop draws the cursor.
 *
 * Rendered inside the phone screen, which is the dock's containing block (its
 * position is fixed, as on a phone). Only ever shown below 1080px — the
 * mobile frame page, in its own narrow window — so the components' dlg:
 * classes hold.
 */

import { X } from "lucide-react"
import { useEffect, useState } from "react"

import { SWAP_DELAY_MS, type EmbroideryDesignIssue } from "@/components/embroidery-label"
import { EmbroiderySolutions } from "@/components/embroidery-solutions"
import type { SceneState } from "@/components/handoff/embroidery-scene"
import MobileActionHeader from "@/components/mobile/mobile-action-header"
import MobileDock from "@/components/mobile/mobile-dock"
import MobileViewSwitcher from "@/components/mobile/mobile-view-switcher"

const noop = () => {}
// The shirt's views, for the dots under the canvas.
const VIEWS = ["Front", "Back", "Left", "Right", "Neck Label"].map(name => ({ id: name, name }))

export function MobileChrome({
  state,
  issueSrc,
  printSavingLabel,
  tap,
  moveMs,
}: {
  state: SceneState
  issueSrc: string | null
  printSavingLabel: string | null
  /** Where the finger is, if it's on the screen. */
  tap: { x: number; y: number } | null
  moveMs: number
}) {
  const selected = state.designs.some(d => d.selected && !d.gone)
  // As on a phone: out of the way while anything takes the bottom row's place,
  // and while an AI result is under review.
  const dockHidden = !state.row || state.zoomOnly
  return (
    <>
      {!selected && (
        <MobileActionHeader
          canUndo={false}
          canRedo={false}
          onUndo={noop}
          onRedo={noop}
          colorName="White"
          colorHex="#ffffff"
          onColorClick={noop}
          onMoreClick={noop}
        />
      )}
      {!selected && (
        <MobileViewSwitcher
          views={VIEWS}
          activeIndex={0}
          onSelect={noop}
          hidden={dockHidden}
          swapDelayMs={SWAP_DELAY_MS}
        />
      )}
      <MobileDock
        inspectorMode={selected}
        actionDisabled={false}
        onProductsClick={noop}
        onGraphicsClick={noop}
        onTextClick={noop}
        onUploadsClick={noop}
        onAIClick={noop}
        onTemplatesClick={noop}
        onFinish={noop}
        onUnselect={noop}
        hidden={dockHidden}
        swapDelayMs={SWAP_DELAY_MS}
      />
      {state.solutions && (
        <SolutionsDrawer issue={state.solutions} src={issueSrc} printSavingLabel={printSavingLabel} />
      )}
      <Fingertip at={tap} pressed={state.pressed} moveMs={moveMs} />
    </>
  )
}

/** The mobile Solutions: the designer's drawer, over its dimmed page. */
function SolutionsDrawer({
  issue,
  src,
  printSavingLabel,
}: {
  issue: EmbroideryDesignIssue
  src: string | null
  printSavingLabel: string | null
}) {
  return (
    <>
      <div className="animate-in fade-in absolute inset-0 z-[55] bg-black/80 duration-300" />
      <div className="animate-in slide-in-from-bottom absolute inset-x-0 bottom-0 z-[56] flex flex-col rounded-t-xl border bg-white duration-300">
        <div className="flex min-h-11 items-center justify-between py-1 pr-1.5 pl-4">
          <span className="font-display text-base font-medium">Solutions</span>
          <span className="p-2.5 text-black">
            <X className="size-6" aria-hidden strokeWidth={1.8} />
          </span>
        </div>
        <div className="px-4 pt-1 pb-4">
          <EmbroiderySolutions
            inDrawer
            issue={issue}
            designSrc={src}
            printSavingLabel={printSavingLabel}
            onClose={noop}
            onSimplifyWithAI={noop}
            onSwitchToPrint={noop}
          />
        </div>
      </div>
    </>
  )
}

// How long a fingertip stays on the glass after it lets go.
const LIFT_MS = 500

/**
 * A fingertip on the glass, where desktop draws the cursor: it presses in on
 * a tap and, once it lets go, lifts away — a hand doesn't rest on the screen.
 */
function Fingertip({
  at,
  pressed,
  moveMs,
}: {
  at: { x: number; y: number } | null
  pressed: boolean
  moveMs: number
}) {
  const [lifted, setLifted] = useState(false)
  const key = at ? `${Math.round(at.x)},${Math.round(at.y)}` : ""
  useEffect(() => {
    setLifted(false)
    if (pressed || !at) return
    // Arrived and not pressing: a tap is on its way, or just happened. Once
    // it's been still for the move and a beat after, it lifts.
    const t = window.setTimeout(() => setLifted(true), moveMs + LIFT_MS + 900)
    return () => window.clearTimeout(t)
    // `key` stands for the position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pressed, moveMs])
  const shown = !!at && !lifted
  return (
    <div
      aria-hidden
      className={`absolute top-0 left-0 z-[60] transition-[translate,opacity] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      style={{
        translate: `${(at?.x ?? 0) - 18}px ${(at?.y ?? 0) - 18}px`,
        transitionDuration: `${moveMs}ms, 300ms`,
      }}
    >
      <div
        className={`size-9 rounded-full border-2 border-white/90 bg-black/25 shadow-md transition-[scale] duration-150 ${
          pressed ? "scale-[0.8]" : "scale-100"
        }`}
      />
    </div>
  )
}
