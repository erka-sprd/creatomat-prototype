"use client"

import type { ReactNode } from "react"

import {
  PHONE_BEZEL_PX as BEZEL_PX,
  PHONE_SAFARI_BAR_H,
  PHONE_SCREEN_RADIUS,
  PHONE_SCREEN_W,
  PHONE_STATUS_BAR_H,
} from "@/lib/handoff-phone"

/**
 * The phone a handoff's mobile version plays on: a dark bezel around an
 * iPhone 12 mini screen (lib/handoff-phone.ts), nothing in it clickable. On
 * the screen, the status bar around the Dynamic Island, then the page, then Safari's
 * compact tab bar over the home indicator. The page's height is its
 * content's — a scene fills it to PHONE_VIEWPORT_H. Off (`on` false), it's
 * no box at all, so the same scene renders bare on desktop.
 */
export function PhoneFrame({ on, children }: { on: boolean; children: ReactNode }) {
  if (!on) return <>{children}</>
  const glass = BEZEL_PX - RIM_PX
  return (
    // The metal rim: brushed titanium, lit from the top left.
    <div
      className="relative mx-auto shadow-xl"
      style={{
        padding: RIM_PX,
        borderRadius: PHONE_SCREEN_RADIUS + BEZEL_PX,
        background: RIM_METAL,
        boxShadow: `${RIM_EDGES}, 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`,
      }}
    >
      {SIDE_BUTTONS.map(b => (
        <SideButton key={b.name} {...b} />
      ))}
      {/* The black glass border between rim and screen, with a soft gloss. */}
      <div
        style={{
          padding: glass,
          borderRadius: PHONE_SCREEN_RADIUS + glass,
          background: GLASS_BORDER,
          boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.12)",
        }}
      >
        <div
          className="relative overflow-hidden bg-white [&_*]:pointer-events-none"
          style={{ width: PHONE_SCREEN_W, borderRadius: PHONE_SCREEN_RADIUS }}
        >
          <StatusBar />
          {children}
          <SafariBar />
        </div>
      </div>
    </div>
  )
}

// Of the bezel, the outer part is the metal rim; the rest is black glass.
const RIM_PX = 3
// Titanium: bands of light and shade around the edge, as a polished frame
// catches the room's light.
// Dark graphite, so only the highlights read as metal.
const RIM_METAL =
  "linear-gradient(135deg, #8e8e94 0%, #3c3c40 10%, #1c1c1f 22%, #626268 40%, #2a2a2d 55%, #151517 70%, #6e6e74 86%, #2c2c30 100%)"
// The rim's own edges: a bright line on top, a dark one below.
const RIM_EDGES = "inset 0 1px 1px rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.7)"
// The buttons on the phone's sides, px from the frame's top: the Action
// button and volume up / down on the left, the side button on the right.
const SIDE_BUTTONS: { name: string; side: "left" | "right"; top: number; height: number }[] = [
  { name: "action", side: "left", top: 118, height: 30 },
  { name: "volume-up", side: "left", top: 176, height: 58 },
  { name: "volume-down", side: "left", top: 246, height: 58 },
  { name: "side", side: "right", top: 196, height: 94 },
]
// How far a button stands out of the rim.
const BUTTON_DEPTH_PX = 3

// One side button: a short bar of the rim's titanium, lit along its length.
function SideButton({ side, top, height }: { side: "left" | "right"; top: number; height: number }) {
  return (
    <span
      aria-hidden
      className="absolute"
      style={{
        top,
        height,
        width: BUTTON_DEPTH_PX + 1,
        [side]: -BUTTON_DEPTH_PX,
        borderRadius: side === "left" ? "2px 0 0 2px" : "0 2px 2px 0",
        // Darker than the rim: graphite with one soft highlight down its length.
        background: `linear-gradient(${side === "left" ? 90 : 270}deg, #1f1f22 0%, #6a6a70 45%, #2e2e32 100%)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.6)",
      }}
    />
  )
}

// The glass border: near-black, a touch lighter toward the top left.
const GLASS_BORDER = "linear-gradient(160deg, #2a2a2c 0%, #0b0b0c 35%, #050505 70%, #151517 100%)"

// The iPhone's own type, not the site's.
const SYSTEM_FONT = '-apple-system, "SF Pro Text", system-ui, sans-serif'
// Safari tints the status bar to the colour at the page's top: the site's
// promo bar (components/promo-banner.tsx).
const PAGE_TOP_TINT = "#FF6038"

// The status bar of an iPhone with the Dynamic Island: the time centred left
// of the island, signal, Wi-Fi and battery right of it, all level with it.
function StatusBar() {
  return (
    <div
      aria-hidden
      className="relative flex items-center text-black"
      style={{ height: PHONE_STATUS_BAR_H, background: PAGE_TOP_TINT, fontFamily: SYSTEM_FONT }}
    >
      <span className="flex flex-1 justify-center pt-1 text-[16px] leading-none font-semibold tracking-[-0.01em]">
        9:41
      </span>
      {/* The Dynamic Island: a black pill floating 11px below the top. */}
      <span className="mt-1 h-[36px] w-[124px] shrink-0 rounded-full bg-black" />
      <span className="flex flex-1 items-center justify-center gap-[5px] pt-1">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 14 10" fill="currentColor">
          <path d="M7 2.2c2 0 3.8.8 5.1 2.1l1-1A8.6 8.6 0 0 0 7 .8 8.6 8.6 0 0 0 .9 3.3l1 1A7.2 7.2 0 0 1 7 2.2Z" />
          <path d="M7 5c1.2 0 2.3.5 3.1 1.3l1-1A5.8 5.8 0 0 0 7 3.6c-1.6 0-3 .6-4.1 1.7l1 1C4.7 5.5 5.8 5 7 5Z" />
          <path d="M7 7.8c.5 0 .9.2 1.2.5L7 9.6 5.8 8.3c.3-.3.7-.5 1.2-.5Z" />
        </svg>
        <svg width="26" height="13" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="18" height="8" rx="1.6" fill="currentColor" />
          <path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4Z" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
    </div>
  )
}

// Liquid Glass, as Safari draws its floating controls: translucent white,
// a bright rim and a soft drop shadow.
const GLASS =
  "border border-white/70 bg-white/75 shadow-[0_2px_12px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl"

// Safari's compact tab bar (iOS 26): back, the address pill, more — floating
// glass controls, with the home indicator below them.
function SafariBar() {
  return (
    <div
      aria-hidden
      className="relative flex items-start gap-2 bg-neutral-50 px-3 pt-2 text-black"
      style={{ height: PHONE_SAFARI_BAR_H, fontFamily: SYSTEM_FONT }}
    >
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${GLASS}`}>
        <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
          <path d="M9 1.5 1.5 9 9 16.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={`flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full px-3.5 ${GLASS}`}>
        {/* The page menu. */}
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="shrink-0">
          <rect x="1" y="1" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.5 5h9M4.5 9h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="min-w-0 flex-1 truncate text-center text-[15px] leading-none">
          spreadshirt.com
        </span>
        {/* Reload. */}
        <svg width="15" height="16" viewBox="0 0 15 16" fill="none" className="shrink-0">
          <path d="M13 9a5.5 5.5 0 1 1-1.6-3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 1.5v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${GLASS}`}>
        <svg width="18" height="4" viewBox="0 0 18 4" fill="currentColor">
          <circle cx="2" cy="2" r="2" />
          <circle cx="9" cy="2" r="2" />
          <circle cx="16" cy="2" r="2" />
        </svg>
      </span>
      {/* The home indicator. */}
      <span className="absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black" />
    </div>
  )
}
