"use client"

import BulkOrderNote from "@/components/bulk-order-note"
import { PhoneIcon, type ContactIconProps } from "@/components/contact-icons"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Phone } from "lucide-react"
import { Fragment, useRef, useState, type ReactNode } from "react"

// "Contact" dropdown (left of the cart), built with the shadcn DropdownMenu.
// Option icons are the Spreadshirt component-kit glyphs from contact-icons.tsx.

type ContactOption = {
    Icon: (props: ContactIconProps) => ReactNode
    label: string
    sub?: string
    href: string
    /** Open in a new tab (external destinations). */
    external?: boolean
}

const OPTIONS: ContactOption[] = [
    { Icon: PhoneIcon, label: "0341 996 59989", sub: "Mo-Fr 9-18 Uhr", href: "tel:+4934199659989" },
]

export default function HelpMenu({ variant = "label" }: { variant?: "label" | "icon" }) {
    const [open, setOpen] = useState(false)
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const openedAt = useRef(0)
    // Record when the menu opens so we can ignore the toggle-close click for a
    // grace period (see guardClick).
    const changeOpen = (next: boolean) => {
        if (next && !open) openedAt.current = Date.now()
        setOpen(next)
    }

    // Open on hover too (Radix is click-only by default). Opening waits 300ms so
    // a quick pass-over doesn't pop the menu (and doesn't flicker); leaving before
    // then cancels it. A short close delay bridges the gap to the menu.
    const hoverOpen = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current)
        if (open) return // already open (e.g. moving onto the menu) — nothing to schedule
        if (openTimer.current) clearTimeout(openTimer.current)
        openTimer.current = setTimeout(() => changeOpen(true), 300)
    }
    const hoverClose = () => {
        if (openTimer.current) clearTimeout(openTimer.current) // cancel a pending open
        if (closeTimer.current) clearTimeout(closeTimer.current)
        closeTimer.current = setTimeout(() => setOpen(false), 150)
    }

    // Hover already opened it — swallow the toggle-close interactions for the
    // first second so a natural hover-then-click doesn't dismiss it immediately.
    // After that, clicking closes it as usual. Radix closes via the trigger's
    // pointer-down AND via the content's outside-interaction, so guard both.
    const inGrace = () => open && Date.now() - openedAt.current < 1000
    const guardEvent = (e: { preventDefault: () => void }) => {
        if (inGrace()) e.preventDefault()
    }

    return (
        <DropdownMenu open={open} onOpenChange={changeOpen} modal={false}>
            <DropdownMenuTrigger asChild>
                {variant === "icon" ? (
                    <button
                        type="button"
                        aria-label="Contact"
                        onMouseEnter={hoverOpen}
                        onMouseLeave={hoverClose}
                        onPointerDown={guardEvent}
                        // Its own pill (no longer half of a button group). The
                        // frame drops away while the canvas marks the plain
                        // state — see the wrapper in designer.tsx.
                        className="group flex cursor-pointer items-center gap-1 rounded-full border border-neutral-200 bg-[#F4F4F4] px-3.5 py-3 text-neutral-700 outline-none transition-colors hover:bg-white hover:text-black data-[state=open]:bg-white in-data-[canvas-actions-plain]:border-transparent in-data-[canvas-actions-plain]:bg-transparent"
                    >
                        <Phone className="size-[20px]" strokeWidth={1.8} />
                        <ChevronDown className="h-4 w-4 text-neutral-700 transition-[transform,color] duration-200 group-hover:text-black group-data-[state=open]:rotate-180" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onMouseEnter={hoverOpen}
                        onMouseLeave={hoverClose}
                        onPointerDown={guardEvent}
                        className="group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-[14px] font-medium text-black outline-none transition-colors hover:bg-neutral-100"
                    >
                        Contact
                        <ChevronDown className="h-4 w-4 text-neutral-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                onMouseEnter={hoverOpen}
                onMouseLeave={hoverClose}
                onCloseAutoFocus={e => e.preventDefault()}
                onInteractOutside={guardEvent}
                // Width is intrinsic (min-content), so it is driven by the one
                // row that must never wrap: the bulk-order address field
                // ("pro@spreadshirt.net" + gap + COPY). Everything else — the
                // headline, the note, the option labels — wraps to that width.
                // A longer address or a longer COPY label in another language
                // therefore widens the dropdown automatically. max-w keeps it
                // sane on narrow viewports.
                className="flex w-min max-w-[92vw] flex-col overflow-hidden rounded-[12px] border-0 bg-white p-1.5 text-[14px] text-black shadow-lg"
            >
                {OPTIONS.map(o => (
                    <Fragment key={o.label}>
                        <DropdownMenuItem
                            asChild
                            className={`group cursor-pointer gap-3 rounded-lg px-4 py-3 text-[14px] hover:bg-neutral-100 focus:bg-neutral-100 ${o.sub ? "items-start" : ""}`}
                        >
                            <a
                                href={o.href}
                                {...(o.external
                                    ? { target: "_blank", rel: "noopener noreferrer" }
                                    : {})}
                            >
                                <o.Icon className="size-[20px] shrink-0 text-neutral-700 transition-colors group-hover:text-black" />
                                <span className="flex flex-col leading-tight">
                                    <span>{o.label}</span>
                                    {o.sub && (
                                        <span className="mt-0.5 text-[12px] text-neutral-500">
                                            {o.sub}
                                        </span>
                                    )}
                                </span>
                            </a>
                        </DropdownMenuItem>
                    </Fragment>
                ))}
                {/* Info area pinned at the bottom — shared with the mobile
                    "More Actions" sheet. */}
                <BulkOrderNote className="mt-1" />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
