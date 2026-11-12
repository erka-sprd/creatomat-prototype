"use client"

/**
 * A print-quality scene's mobile version, around the canvas: the designer's
 * own mobile header, view dots and dock — the dock showing "Done" while the
 * upload is selected — the Uploads panel in the designer's bottom drawer
 * (MobileDrawer's look, MobilePanelsDrawer's height), and a fingertip where
 * desktop draws the cursor.
 *
 * Rendered inside the phone screen's canvas, which is the dock's containing
 * block (its position is fixed, as on a phone). Only ever shown below 1080px
 * — the mobile frame page, in its own narrow window — so the components'
 * dlg: classes hold.
 */

import { X } from "lucide-react"
import type { ReactNode } from "react"

import { Fingertip } from "@/components/handoff/mobile-chrome"
import MobileActionHeader from "@/components/mobile/mobile-action-header"
import MobileDock from "@/components/mobile/mobile-dock"
import MobileViewSwitcher from "@/components/mobile/mobile-view-switcher"
import { SWAP_DELAY_MS } from "@/lib/embroidery-label"
import { PHONE_VIEWPORT_H } from "@/lib/handoff-phone"

const noop = () => {}
// The shirt's views, for the dots under the canvas.
const VIEWS = ["Front", "Back", "Left", "Right", "Neck Label"].map(name => ({ id: name, name }))
// The uploads drawer fits its content, up to the page's height less 32px —
// as MobilePanelsDrawer's uploads, and create-omat's.
const DRAWER_MAX_HEIGHT_PX = PHONE_VIEWPORT_H - 32

export function QualityMobileChrome({
  color,
  selected,
  drawer,
  drawerOpen,
  instant,
  tap,
  pressed,
  moveMs,
}: {
  /** The T-shirt's colour, for the header's colour button. */
  color: { name: string; hex: string }
  /** The upload is on the canvas, selected: the dock shows "Done". */
  selected: boolean
  /** The Uploads panel, for the drawer — kept mounted, so its uploads stay. */
  drawer: ReactNode | null
  drawerOpen: boolean
  /** Back at the loop's top: nothing animates there. */
  instant: boolean
  /** Where the finger is, if it's on the screen. */
  tap: { x: number; y: number } | null
  pressed: boolean
  moveMs: number
}) {
  return (
    <>
      {!selected && (
        <MobileActionHeader
          canUndo={false}
          canRedo={false}
          onUndo={noop}
          onRedo={noop}
          colorName={color.name}
          colorHex={color.hex}
          onColorClick={noop}
          onMoreClick={noop}
        />
      )}
      {!selected && (
        <MobileViewSwitcher
          views={VIEWS}
          activeIndex={0}
          onSelect={noop}
          hidden={false}
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
        hidden={false}
        swapDelayMs={SWAP_DELAY_MS}
      />
      {drawer && (
        <UploadsDrawer open={drawerOpen} instant={instant}>
          {drawer}
        </UploadsDrawer>
      )}
      <Fingertip at={tap} pressed={pressed} moveMs={moveMs} />
    </>
  )
}

/**
 * The mobile Uploads: the designer's drawer, over its dimmed page. A plain
 * panel rather than vaul's portal, so the fingertip can sit above it; it
 * slides rather than unmounts, so the panel keeps what was uploaded.
 */
function UploadsDrawer({
  open,
  instant,
  children,
}: {
  open: boolean
  instant: boolean
  children: ReactNode
}) {
  const still = instant ? { transition: "none" } : undefined
  return (
    <>
      <div
        className={`absolute inset-0 z-[55] bg-black/80 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        style={still}
      />
      <div
        className={`absolute inset-x-0 bottom-0 z-[56] flex flex-col rounded-t-xl border bg-white transition-[translate] duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: DRAWER_MAX_HEIGHT_PX, ...still }}
      >
        <div className="py-1 pr-1.5 pl-4">
          <div className="flex min-h-11 items-center justify-between text-left">
            <span className="font-display text-base font-medium">Uploads</span>
            <span className="p-2.5 text-black">
              <X className="size-6" aria-hidden strokeWidth={1.8} />
            </span>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
