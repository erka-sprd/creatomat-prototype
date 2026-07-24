"use client"

import {
    ScopedDialog,
    ScopedDialogClose,
    ScopedDialogTitle,
} from "@/components/ui/scoped-dialog"
import { Check, Copy, X } from "lucide-react"
import { useState } from "react"

// Share button (right end of the canvas button group) + a share modal replicated
// from create-omat's ShareDialog: a link box + a "Copy link" button. No real
// link generation — a dummy shareable link the user can copy.
const SHARE_LINK = "sprd.co/x9zfKsM"

export default function ShareButton({ container }: { container: HTMLElement | null }) {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const copyLink = () => {
        try {
            navigator.clipboard?.writeText(SHARE_LINK)
        } catch {
            /* clipboard blocked — ignore */
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
    }

    return (
        <>
            <div className="group/tooltip relative flex">
                <button
                    type="button"
                    aria-label="Share"
                    onClick={() => setOpen(true)}
                    className="flex cursor-pointer items-center justify-center rounded-r-full px-3.5 py-3 text-black outline-none transition-colors hover:bg-white"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-[22px]" aria-hidden>
                        <path d="M18 2C20.2091 2 22 3.79086 22 6C22 8.20914 20.2091 10 18 10C16.7836 10 15.6946 9.45645 14.9609 8.59961L9.91895 11.1963C9.97191 11.4559 10 11.7247 10 12C10 12.275 9.97179 12.5434 9.91895 12.8027L14.9609 15.3994C15.6946 14.5429 16.7838 14 18 14C20.2091 14 22 15.7909 22 18C22 20.2091 20.2091 22 18 22C15.7909 22 14 20.2091 14 18C14 17.7248 14.0271 17.4559 14.0801 17.1963L9.03809 14.5996C8.30446 15.4562 7.21622 16 6 16C3.79086 16 2 14.2091 2 12C2 9.79086 3.79086 8 6 8C7.21595 8 8.30446 8.54318 9.03809 9.39941L14.0801 6.80273C14.0273 6.54343 14 6.2749 14 6C14 3.79086 15.7909 2 18 2ZM18 16C17.2176 16 16.5415 16.4499 16.2129 17.1045C16.205 17.1222 16.1985 17.1407 16.1895 17.1582C16.1864 17.1641 16.1818 17.169 16.1787 17.1748C16.0645 17.4265 16 17.7056 16 18C16 19.1046 16.8954 20 18 20C19.1046 20 20 19.1046 20 18C20 16.8954 19.1046 16 18 16ZM6 10C4.89543 10 4 10.8954 4 12C4 13.1046 4.89543 14 6 14C6.78252 14 7.45756 13.5493 7.78613 12.8945C7.79396 12.8769 7.80162 12.8591 7.81055 12.8418C7.81362 12.8358 7.81713 12.8301 7.82031 12.8242C7.9344 12.5726 8 12.2942 8 12C8 11.705 7.93399 11.4259 7.81934 11.1738C7.81651 11.1686 7.81329 11.1635 7.81055 11.1582C7.80101 11.1397 7.79344 11.1204 7.78516 11.1016C7.45592 10.4487 6.78112 10 6 10ZM18 4C16.8954 4 16 4.89543 16 6C16 6.29453 16.0654 6.57342 16.1797 6.8252C16.1827 6.83083 16.1865 6.83608 16.1895 6.8418C16.1988 6.85993 16.2057 6.87904 16.2139 6.89746C16.5429 7.55099 17.2184 8 18 8C19.1046 8 20 7.10457 20 6C20 4.89543 19.1046 4 18 4Z" />
                    </svg>
                </button>
                <span className="pointer-events-none absolute top-full right-0 z-50 mt-2 rounded-md bg-neutral-900 p-3 text-sm whitespace-nowrap text-neutral-100 opacity-0 shadow-sm transition-opacity group-hover/tooltip:opacity-100 before:absolute before:right-4 before:bottom-full before:h-0 before:w-0 before:border-x-[4px] before:border-x-transparent before:border-b-[4px] before:border-b-neutral-900 before:content-['']">
                    Share with others
                </span>
            </div>

            <ScopedDialog
                open={open}
                onOpenChange={setOpen}
                container={container}
                overlayClassName="rounded-[12px]"
                className="flex w-[460px] max-w-[92%] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            >
                <div className="flex items-start justify-between gap-4 px-[24px] pt-[20px] pb-[12px]">
                    <ScopedDialogTitle className="font-display text-[18px] leading-tight font-[800] text-black">
                        Share
                    </ScopedDialogTitle>
                    <ScopedDialogClose
                        aria-label="Close"
                        className="shrink-0 cursor-pointer text-neutral-500 outline-none hover:text-black focus:outline-none focus-visible:outline-none"
                    >
                        <X size={20} />
                    </ScopedDialogClose>
                </div>
                <div className="flex flex-col gap-3 px-[24px] pb-[24px]">
                    <div className="rounded-md bg-neutral-100 py-2.5 text-center text-[14px] text-black">
                        {SHARE_LINK}
                    </div>
                    <button
                        type="button"
                        onClick={copyLink}
                        disabled={copied}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-300 py-3 text-[15px] font-semibold text-black transition-colors hover:bg-neutral-100 disabled:cursor-default disabled:opacity-70"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? "Link copied" : "Copy link"}
                    </button>
                </div>
            </ScopedDialog>
        </>
    )
}
