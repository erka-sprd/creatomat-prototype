"use client"

import { Check, Copy } from "lucide-react"
import { useEffect, useRef, useState } from "react"

// The bulk-order info panel: light purple (create-omat's price-calculator
// panel colour, #bfb9fd @ 30%), a headline in the darkest shade of
// that purple, the bulk address with a copy button, and the response-time note.
// Shared by the desktop Contact dropdown (pinned at its bottom) and the mobile
// "More Actions" sheet (its own category card at the bottom).

const BULK_PURPLE = "#bfb9fd"
const BULK_PURPLE_DARK = `color-mix(in oklab, ${BULK_PURPLE} 40%, black)`
const BULK_HEADLINE = "50+ products? Email us"
const BULK_EMAIL = "pro@spreadshirt.net"
const BULK_NOTE = "We answer in 24 hours, except the weekends."

export default function BulkOrderNote({ className = "" }: { className?: string }) {
    const [copied, setCopied] = useState(false)
    const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (copiedTimer.current) clearTimeout(copiedTimer.current)
    }, [])

    // Copy the bulk address, swap the icon to a checkmark for 2s. Any host
    // popover/sheet stays open — this panel is a plain div, not a menu item.
    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(BULK_EMAIL)
        } catch {
            return // clipboard blocked (insecure context / denied) — leave the icon as-is
        }
        setCopied(true)
        if (copiedTimer.current) clearTimeout(copiedTimer.current)
        copiedTimer.current = setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            className={`flex flex-col gap-1.5 rounded-lg px-4 py-3 text-[14px] text-black ${className}`}
            style={{
                backgroundColor: `color-mix(in oklab, ${BULK_PURPLE} 30%, transparent)`,
            }}
        >
            <span
                className="text-[14px] leading-tight font-semibold"
                style={{ color: BULK_PURPLE_DARK }}
            >
                {BULK_HEADLINE}
            </span>
            {/* Same hover tooltip as the canvas zoom control (opacity fade
                only, no scale animation) — placed above the button so a host
                with overflow-hidden doesn't clip it. */}
            <span className="flex items-center gap-1.5">
                <a href={`mailto:${BULK_EMAIL}`} className="underline hover:no-underline">
                    {BULK_EMAIL}
                </a>
                <span className="group/tooltip relative flex">
                    <button
                        type="button"
                        onClick={copyEmail}
                        aria-label={copied ? "E-mail copied" : "Copy e-mail"}
                        className="shrink-0 cursor-pointer rounded p-0.5 text-neutral-600 transition-colors hover:bg-black/5 hover:text-black"
                    >
                        {copied ? (
                            <Check className="size-[14px]" />
                        ) : (
                            <Copy className="size-[14px]" />
                        )}
                    </button>
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-neutral-900 p-3 text-sm whitespace-nowrap text-neutral-100 opacity-0 shadow-sm transition-opacity group-hover/tooltip:opacity-100 before:absolute before:top-full before:left-1/2 before:h-0 before:w-0 before:-translate-x-1/2 before:border-x-[4px] before:border-x-transparent before:border-t-[4px] before:border-t-neutral-900 before:content-['']">
                        {copied ? "Copied" : "Copy e-mail"}
                    </span>
                </span>
            </span>
            <span className="text-[12px] leading-tight text-neutral-600">{BULK_NOTE}</span>
        </div>
    )
}
