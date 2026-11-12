"use client"

import type { ReactNode } from "react"

import {
  PHONE_SAFARI_BAR_H,
  PHONE_SCREEN_RADIUS,
  PHONE_SCREEN_W,
  PHONE_STATUS_BAR_H,
} from "@/lib/handoff-phone"

// The bezel around the screen.
const BEZEL_PX = 10

/**
 * The phone a handoff's mobile version plays on: a dark bezel around an
 * iPhone 12 mini screen (lib/handoff-phone.ts), nothing in it clickable. On
 * the screen, the status bar around the notch, then the page, then Safari's
 * compact tab bar over the home indicator. The page's height is its
 * content's — a scene fills it to PHONE_VIEWPORT_H. Off (`on` false), it's
 * no box at all, so the same scene renders bare on desktop.
 */
export function PhoneFrame({ on, children }: { on: boolean; children: ReactNode }) {
  if (!on) return <>{children}</>
  return (
    <div
      className="mx-auto bg-neutral-900 shadow-xl"
      style={{ padding: BEZEL_PX, borderRadius: PHONE_SCREEN_RADIUS + BEZEL_PX }}
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
  )
}

// The iPhone's own type, not the site's.
const SYSTEM_FONT = '-apple-system, "SF Pro Text", system-ui, sans-serif'
// Safari tints the status bar to the colour at the page's top: the site's
// promo bar (components/promo-banner.tsx).
const PAGE_TOP_TINT = "#FF6038"

// The status bar of an iPhone with a notch: the time centred in the left
// ear, signal, Wi-Fi and battery in the right, the notch between.
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
      {/* The notch. */}
      <span className="h-[30px] w-[160px] shrink-0 self-start rounded-b-[20px] bg-black" />
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
