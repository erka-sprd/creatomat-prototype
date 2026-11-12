"use client"

import type { ReactNode } from "react"

import { PHONE_SCREEN_W } from "@/lib/handoff-phone"

/**
 * The phone a handoff's mobile version plays on: a dark bezel around an
 * iPhone 8 screen (lib/handoff-phone.ts), nothing in it clickable. Its height
 * is its content's — a scene fills it to PHONE_SCREEN_H. Off (`on` false),
 * it's no box at all, so the same scene renders bare on desktop.
 */
export function PhoneFrame({ on, children }: { on: boolean; children: ReactNode }) {
  if (!on) return <>{children}</>
  return (
    <div className="mx-auto rounded-[44px] bg-neutral-900 p-2.5 shadow-xl">
      <div
        className="overflow-hidden rounded-[34px] bg-white [&_*]:pointer-events-none"
        style={{ width: PHONE_SCREEN_W }}
      >
        {children}
      </div>
    </div>
  )
}
