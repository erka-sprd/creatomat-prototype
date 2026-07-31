"use client"

import { CheckmarkIcon } from "@/components/kit-icons"
import { useEffect, useRef, useState } from "react"

// The bulk-order info panel: light purple card (create-omat's price-calculator
// panel colour, #bfb9fd @ 30% — the lightest purple in the proto) holding a bold
// headline, a "Write to us at:" label, the address inside a white field with a
// COPY action, and the response-time note.
// Shared by the desktop Contact dropdown (pinned at its bottom) and the mobile
// "More Actions" sheet (its own category card at the bottom).

const BULK_PURPLE = "#bfb9fd"
const BULK_HEADLINE = "Need help ordering 50+ products?"
const BULK_CTA = "Write to us at:"
const BULK_EMAIL = "pro@spreadshirt.net"
const BULK_COPY = "COPY"
const BULK_NOTE = "We answer in 24 hours, except the weekends."

export default function BulkOrderNote({ className = "" }: { className?: string }) {
    const [copied, setCopied] = useState(false)
    const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (copiedTimer.current) clearTimeout(copiedTimer.current)
    }, [])

    // Copy the address and confirm on the button for 2s. Any host popover/sheet
    // stays open — this panel is a plain div, not a menu item.
    // navigator.clipboard only exists in a secure context, so on a phone opened
    // via http://<LAN-IP> it is undefined; fall back to a hidden textarea +
    // execCommand, which still works there.
    const copyEmail = async () => {
        const text = BULK_EMAIL
        let ok = false
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text)
                ok = true
            }
        } catch {
            ok = false
        }
        if (!ok) {
            const field = document.createElement("textarea")
            field.value = text
            field.setAttribute("readonly", "")
            field.style.position = "fixed"
            field.style.opacity = "0"
            document.body.appendChild(field)
            field.select()
            field.setSelectionRange(0, text.length) // iOS needs an explicit range
            try {
                // Deprecated, but the only copy path in an insecure context.
                document.execCommand("copy")
            } catch {
                /* nothing else to try */
            }
            document.body.removeChild(field)
        }
        // Confirm either way — on a locked-down browser the address is at least
        // selected, and a dead button reads as broken.
        setCopied(true)
        if (copiedTimer.current) clearTimeout(copiedTimer.current)
        copiedTimer.current = setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            className={`flex flex-col gap-3 rounded-lg px-5 py-5 text-black ${className}`}
            style={{
                backgroundColor: `color-mix(in oklab, ${BULK_PURPLE} 30%, transparent)`,
            }}
        >
            {/* MADE Outer Sans ships only Medium (500) and Black (900), so
                font-bold resolved up to Black — Medium is the one lighter face
                that exists. */}
            <span className="font-display text-[16px] leading-tight font-medium">
                {BULK_HEADLINE}
            </span>
            <div className="flex flex-col gap-2">
                <span className="text-[14px] leading-tight text-neutral-600">{BULK_CTA}</span>
                {/* The address field: a whisper of the panel purple rather than
                    plain white (12% vs the panel's 30%), so it lifts off the
                    card without reading as a different colour. */}
                <div
                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                    style={{
                        backgroundColor: `color-mix(in oklab, ${BULK_PURPLE} 18%, white)`,
                    }}
                >
                    {/* No truncation: this row's intrinsic width is what sizes
                        the desktop dropdown (see help-menu.tsx), so it has to
                        report its full width. */}
                    <a
                        href={`mailto:${BULK_EMAIL}`}
                        className="text-[15px] whitespace-nowrap underline hover:no-underline"
                    >
                        {BULK_EMAIL}
                    </a>
                    {/* Confirms with a thick black check rather than a word, so
                        no translation can change the row's width (and the label
                        keeps reserving its space while the check shows, so the
                        dropdown that sizes itself off this row never jumps).
                        The padding/negative-margin pair grows the tap target to
                        the field's full height and right edge without moving the
                        label. */}
                    <button
                        type="button"
                        onClick={copyEmail}
                        aria-label={copied ? "Address copied" : `Copy ${BULK_EMAIL}`}
                        className="relative -my-3 -mr-4 shrink-0 cursor-pointer touch-manipulation py-3 pr-4 pl-4 text-[12px] font-bold tracking-wide whitespace-nowrap transition-opacity hover:opacity-70"
                    >
                        <span className={copied ? "invisible" : ""}>{BULK_COPY}</span>
                        {copied && (
                            // Right-aligned with the label's own right edge
                            // (the button's pr-4), vertically centred.
                            <CheckmarkIcon className="absolute top-1/2 right-4 size-[18px] -translate-y-1/2" />
                        )}
                    </button>
                </div>
            </div>
            <span className="text-[13px] leading-tight text-neutral-600">{BULK_NOTE}</span>
        </div>
    )
}
