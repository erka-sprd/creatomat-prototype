"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Phone } from "lucide-react"
import { Fragment, useRef, useState, type ReactNode } from "react"

// "Contact" dropdown (left of the cart), built with the shadcn DropdownMenu.
// Option icons are the Spreadshirt component-kit icons (v2: Message / Mail /
// PhoneCall), pulled from create-omat's @sprd/sprd-component-kit and inlined
// here (the kit isn't a dependency of this proto). They use currentColor.
type IconProps = { className?: string }

const ChatIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path fillRule="evenodd" clipRule="evenodd" d="M20.9951 7.80036C20.8911 5.68397 19.1422 4 17 4H7L6.80036 4.0049C4.68397 4.10892 3 5.8578 3 8V14L3.0049 14.1996C3.10892 16.316 4.8578 18 7 18H8.585L11.2929 20.7071L11.3871 20.7903C11.5506 20.9174 11.7444 20.9867 11.941 20.9983H12.059L12.1764 20.9844C12.3708 20.9497 12.5569 20.8573 12.7071 20.7071L15.414 18H17L17.1996 17.9951C19.316 17.8911 21 16.1422 21 14V8L20.9951 7.80036ZM7 6H17L17.1493 6.00549C18.1841 6.08183 19 6.94564 19 8V14L18.9945 14.1493C18.9182 15.1841 18.0544 16 17 16H15L14.8686 16.0087C14.6519 16.0374 14.4492 16.1366 14.2929 16.2929L12 18.585L9.70711 16.2929L9.60803 16.2061C9.43448 16.0732 9.22101 16 9 16H7L6.85074 15.9945C5.81588 15.9182 5 15.0544 5 14V8L5.00549 7.85074C5.08183 6.81588 5.94564 6 7 6ZM16 8C16.5523 8 17 8.44772 17 9C17 9.51284 16.614 9.93551 16.1166 9.99327L16 10H8C7.44772 10 7 9.55228 7 9C7 8.48716 7.38604 8.06449 7.88338 8.00673L8 8H16ZM15 13C15 12.4477 14.5523 12 14 12H8L7.88338 12.0067C7.38604 12.0645 7 12.4872 7 13C7 13.5523 7.44772 14 8 14H14L14.1166 13.9933C14.614 13.9355 15 13.5128 15 13Z" />
    </svg>
)

const MailIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path fillRule="evenodd" clipRule="evenodd" d="M19 4H4.99998C3.34952 4 2.01035 5.3328 2.00004 6.98083C1.99984 6.99179 1.99982 7.00273 1.99998 7.01367V17C1.99998 18.6569 3.34313 20 4.99998 20H19C20.6568 20 22 18.6569 22 17V7.01366C22.0001 7.00273 22.0001 6.99179 21.9999 6.98085C21.9896 5.33281 20.6504 4 19 4ZM19.8879 6.53948C19.7213 6.21894 19.3862 6 19 6H4.99998C4.61377 6 4.27869 6.21894 4.1121 6.53948L12 11.797L19.8879 6.53948ZM3.99998 8.86852V17C3.99998 17.5523 4.4477 18 4.99998 18H19C19.5523 18 20 17.5523 20 17V8.86852L12.5547 13.8321C12.2561 14.0311 11.8772 14.0532 11.5607 13.8984L11.4453 13.8321L3.99998 8.86852Z" />
    </svg>
)

const PhoneIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path fillRule="evenodd" clipRule="evenodd" d="M22 9C22 5.13401 18.866 2 15 2C14.4477 2 14 2.44772 14 3C14 3.55228 14.4477 4 15 4C17.7614 4 20 6.23858 20 9C20 9.55228 20.4477 10 21 10C21.5523 10 22 9.55228 22 9ZM9.87662 3.51875C9.70266 3.20165 9.36801 3 9 3H5L4.82373 3.00509C3.24892 3.09634 2 4.40232 2 6C2.52306 14.6375 9.36247 21.4769 17.9393 21.9982C19.6569 22 21 20.6569 21 19V15L20.9926 14.8787C20.9489 14.5197 20.7131 14.2082 20.3714 14.0715L15.3714 12.0715L15.2563 12.0333C14.8308 11.9202 14.374 12.0997 14.1425 12.4855L13.138 14.158L13.0363 14.0963C11.7712 13.2995 10.7005 12.2288 9.90374 10.9637L9.841 10.861L11.5145 9.85749L11.6145 9.78897C11.9621 9.51864 12.0956 9.04635 11.9285 8.62861L9.92848 3.62861L9.87662 3.51875ZM5 5H8.323L9.755 8.58L7.9855 9.64251L7.88754 9.7094C7.516 9.99665 7.39065 10.5115 7.60314 10.9423C8.77146 13.3113 10.6887 15.2285 13.0577 16.3969L13.167 16.443C13.6096 16.5998 14.1103 16.4264 14.3575 16.0145L15.419 14.244L19 15.677V19L18.9933 19.1166C18.9355 19.614 18.5128 20 18 20C10.4928 19.5419 4.45806 13.5072 3.99816 5.93934C4 5.44772 4.44772 5 5 5ZM15 6C16.6569 6 18 7.34315 18 9C18 9.55228 17.5523 10 17 10C16.4872 10 16.0645 9.61396 16.0067 9.11662L16 9C16 8.48716 15.614 8.06449 15.1166 8.00673L15 8C14.4477 8 14 7.55228 14 7C14 6.44772 14.4477 6 15 6Z" />
    </svg>
)

type ContactOption = {
    Icon: (props: IconProps) => ReactNode
    label: string
    sub?: string
    href: string
}

const OPTIONS: ContactOption[] = [
    { Icon: ChatIcon, label: "AI Chatbot", sub: "Find easy answers fast", href: "#" },
    { Icon: MailIcon, label: "Contact form", href: "#" },
    { Icon: PhoneIcon, label: "0341 996 59989", sub: "Mo-Fr 9-18 Uhr", href: "tel:+4934199659989" },
]

// Moved out of the "Contact form" option into the info area pinned at the bottom.
const BULK_NOTE = "Bulk order? We answer in 24 hours except weekends"

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
                        className="group flex cursor-pointer items-center gap-1 rounded-l-full px-3.5 py-3 text-neutral-700 outline-none transition-colors hover:bg-white hover:text-black data-[state=open]:bg-white"
                    >
                        <Phone className="size-[22px]" strokeWidth={1.8} />
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
                className="flex w-56 flex-col overflow-hidden rounded-[12px] border-0 bg-white p-1.5 text-[14px] text-black shadow-lg"
            >
                {OPTIONS.map((o, i) => (
                    <Fragment key={o.label}>
                        <DropdownMenuItem
                            asChild
                            className={`group cursor-pointer gap-3 rounded-lg px-4 py-3 text-[14px] hover:bg-neutral-100 focus:bg-neutral-100 ${o.sub ? "items-start" : ""}`}
                        >
                            <a href={o.href}>
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
                        {/* Separator below the AI Chatbot option */}
                        {i === 0 && <DropdownMenuSeparator className="mx-0 my-1 h-px bg-neutral-200" />}
                    </Fragment>
                ))}
                {/* Info area pinned at the bottom — light purple (create-omat price
                    calculator panel: #bfb9fd @ 30% + border). Not a button. */}
                <div
                    className="mt-1 rounded-lg border px-4 py-3 text-[14px] text-black"
                    style={{
                        backgroundColor: "color-mix(in oklab, #bfb9fd 30%, transparent)",
                        borderColor: "#bfb9fd",
                    }}
                >
                    {BULK_NOTE}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
