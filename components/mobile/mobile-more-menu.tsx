"use client"

import BulkOrderNote from "@/components/bulk-order-note"
import { PhoneIcon } from "@/components/contact-icons"
import MobileDrawer from "@/components/mobile/mobile-drawer"
import { CheckmarkIcon } from "@/components/kit-icons"
import { SHIPPING_OPTIONS, deliveryDateRange } from "@/lib/shipping"
import { useState } from "react"

// Mobile "More Actions" sheet — organised exactly like create-omat's
// MoreActionsDrawer (src/components/ui/MoreActionsDrawer.tsx) for row anatomy,
// grouped into iOS-style cards by topic:
//     row 1   two cards side by side: info + "Product details" · share +
//             "Share" (icon centred above the label)
//     card 2  truckAlt + delivery ETA pill   + "See prices and more"
//             refresh  + black returns pill  + "See details"
//     card 3  bulk-order purple panel        (shared with the desktop menu)
//     card 4  contact form / phone           (the proto's own rows)
// Rows keep create-omat's `flex gap-2.5 p-4` metrics; the two sub-links are the
// kit's plain Button (p-0 text-sm font-normal text-neutral-700 + a 16px Chevron
// rotated -90). Icons are create-omat's Icon-set glyphs (truckAlt / refresh /
// info) at 24px plus the proto's own share glyph.

const SHARE_LINK = "sprd.co/x9zfKsM"

// Standard + Express delivery windows for the badges, from the proto's shipping
// data (same source the desktop shipping section uses).
const DELIVERY_BADGES = (["standard", "express"] as const).map(id => {
    const option = SHIPPING_OPTIONS.find(o => o.id === id)!
    return {
        label: option.label,
        range: deliveryDateRange(option.minDays, option.maxDays),
        express: id === "express",
    }
})

type MobileMoreMenuProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onProductDetails: () => void
    /** Portal host — the gray canvas area, so overlay + sheet stay inside it. */
    container?: HTMLElement | null
}

const TruckAltIcon = () => (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M11.375 3.5C11.8237 3.5 12.1936 3.83827 12.2441 4.27344L12.25 4.375H15.75C16.0189 4.375 16.2709 4.49863 16.4355 4.70605L16.5 4.7998L19.125 9.1748L19.1572 9.23242L19.1953 9.31836L19.2295 9.43457L19.2461 9.53711L19.25 9.625V14.875C19.25 15.3237 18.9117 15.6936 18.4766 15.7441L18.375 15.75H17.3477C16.987 16.7691 16.0176 17.5 14.875 17.5C13.7324 17.5 12.763 16.7691 12.4023 15.75H8.59766C8.23704 16.7691 7.26759 17.5 6.125 17.5C4.98241 17.5 4.01296 16.7691 3.65234 15.75H2.625C2.17627 15.75 1.8064 15.4117 1.75586 14.9766L1.75 14.875V5.25C1.75 4.32752 2.46376 3.57181 3.36914 3.50488L3.5 3.5H11.375ZM6.125 14C5.64175 14 5.25 14.3918 5.25 14.875C5.25 15.3582 5.64175 15.75 6.125 15.75C6.60825 15.75 7 15.3582 7 14.875C7 14.3918 6.60825 14 6.125 14ZM14.875 14C14.3918 14 14 14.3918 14 14.875C14 15.3582 14.3918 15.75 14.875 15.75C15.3582 15.75 15.75 15.3582 15.75 14.875C15.75 14.3918 15.3582 14 14.875 14ZM12.25 14H12.4023C12.763 12.9809 13.7324 12.25 14.875 12.25C16.0176 12.25 16.987 12.9809 17.3477 14H17.5V10.5H12.25V14ZM3.5 14H3.65234C4.01296 12.9809 4.98241 12.25 6.125 12.25C7.26759 12.25 8.23704 12.9809 8.59766 14H10.5V5.25H3.5V14ZM12.25 8.75H16.8301L15.2549 6.125H12.25V8.75Z"
            fill="currentColor"
        />
    </svg>
)

const RefreshIcon = () => (
    <svg width={24} height={24} viewBox="0 0 25 24" fill="none" aria-hidden>
        <path
            d="M21.4906 10.8625C20.9258 6.79842 17.7111 3.61498 13.6418 3.0899C10.5031 2.68492 7.45488 3.93858 5.50072 6.27103L5.50012 5.00013L5.49339 4.88351C5.43563 4.38617 5.01296 4.00013 4.50012 4.00013C3.94784 4.00013 3.50012 4.44784 3.50012 5.00013V9.00013L3.50685 9.11675C3.56462 9.61409 3.98729 10.0001 4.50012 10.0001H8.50012L8.61674 9.9934C9.11408 9.93563 9.50012 9.51296 9.50012 9.00013L9.49339 8.88351C9.43563 8.38617 9.01296 8.00013 8.50012 8.00013L6.69018 8.00066C8.18467 5.89764 10.7442 4.7326 13.3858 5.07346C16.5608 5.48314 19.069 7.96691 19.5096 11.1378C19.5857 11.6848 20.0907 12.0666 20.6378 11.9906C21.1848 11.9146 21.5666 11.4095 21.4906 10.8625ZM11.6144 18.9268C8.43941 18.5171 5.93126 16.0333 5.4906 12.8625C5.41458 12.3155 4.9095 11.9336 4.36247 12.0096C3.81545 12.0857 3.43362 12.5907 3.50964 13.1378C4.07443 17.2018 7.2891 20.3853 11.3585 20.9104C14.4976 21.3154 17.5462 20.0613 19.5004 17.7282L19.5001 19.0001L19.5069 19.1167C19.5646 19.6141 19.9873 20.0001 20.5001 20.0001C21.0524 20.0001 21.5001 19.5524 21.5001 19.0001V15.0001L21.4934 14.8835C21.4356 14.3862 21.013 14.0001 20.5001 14.0001H16.5001L16.3835 14.0069C15.8862 14.0646 15.5001 14.4873 15.5001 15.0001L15.5069 15.1167C15.5646 15.6141 15.9873 16.0001 16.5001 16.0001L18.3093 16.0006C16.8148 18.103 14.2556 19.2676 11.6144 18.9268Z"
            fill="currentColor"
        />
    </svg>
)

const InfoIcon = () => (
    <svg width={24} height={24} viewBox="-3.8 -3.8 27.6 27.6" fill="none" aria-hidden>
        <path
            d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM12 11C12.5128 11 12.9354 11.3865 12.9932 11.8838L13 12V15L13.1162 15.0068C13.5753 15.0602 13.9398 15.4247 13.9932 15.8838L14 16C14 16.5128 13.6135 16.9354 13.1162 16.9932L13 17H12C11.4872 17 11.0646 16.6135 11.0068 16.1162L11 16V13C10.4477 13 10 12.5523 10 12C10 11.4872 10.3865 11.0646 10.8838 11.0068L11 11H12ZM12.0098 7C12.5621 7 13.0098 7.44772 13.0098 8C13.0098 8.51272 12.6241 8.93525 12.127 8.99316L12 9C11.4477 9 11 8.55228 11 8C11 7.48716 11.3865 7.0646 11.8838 7.00684L12.0098 7Z"
            fill="currentColor"
        />
    </svg>
)

// The proto's own share glyph — the same one the desktop canvas ShareButton
// renders (public/icons/icon-share.svg), at 24px currentColor.
const ShareIcon = () => (
    <svg width={24} height={24} viewBox="-3.8 -3.8 27.6 27.6" fill="currentColor" aria-hidden>
        <path d="M18 2C20.2091 2 22 3.79086 22 6C22 8.20914 20.2091 10 18 10C16.7836 10 15.6946 9.45645 14.9609 8.59961L9.91895 11.1963C9.97191 11.4559 10 11.7247 10 12C10 12.275 9.97179 12.5434 9.91895 12.8027L14.9609 15.3994C15.6946 14.5429 16.7838 14 18 14C20.2091 14 22 15.7909 22 18C22 20.2091 20.2091 22 18 22C15.7909 22 14 20.2091 14 18C14 17.7248 14.0271 17.4559 14.0801 17.1963L9.03809 14.5996C8.30446 15.4562 7.21622 16 6 16C3.79086 16 2 14.2091 2 12C2 9.79086 3.79086 8 6 8C7.21595 8 8.30446 8.54318 9.03809 9.39941L14.0801 6.80273C14.0273 6.54343 14 6.2749 14 6C14 3.79086 15.7909 2 18 2ZM18 16C17.2176 16 16.5415 16.4499 16.2129 17.1045C16.205 17.1222 16.1985 17.1407 16.1895 17.1582C16.1864 17.1641 16.1818 17.169 16.1787 17.1748C16.0645 17.4265 16 17.7056 16 18C16 19.1046 16.8954 20 18 20C19.1046 20 20 19.1046 20 18C20 16.8954 19.1046 16 18 16ZM6 10C4.89543 10 4 10.8954 4 12C4 13.1046 4.89543 14 6 14C6.78252 14 7.45756 13.5493 7.78613 12.8945C7.79396 12.8769 7.80162 12.8591 7.81055 12.8418C7.81362 12.8358 7.81713 12.8301 7.82031 12.8242C7.9344 12.5726 8 12.2942 8 12C8 11.705 7.93399 11.4259 7.81934 11.1738C7.81651 11.1686 7.81329 11.1635 7.81055 11.1582C7.80101 11.1397 7.79344 11.1204 7.78516 11.1016C7.45592 10.4487 6.78112 10 6 10ZM18 4C16.8954 4 16 4.89543 16 6C16 6.29453 16.0654 6.57342 16.1797 6.8252C16.1827 6.83083 16.1865 6.83608 16.1895 6.8418C16.1988 6.85993 16.2057 6.87904 16.2139 6.89746C16.5429 7.55099 17.2184 8 18 8C19.1046 8 20 7.10457 20 6C20 4.89543 19.1046 4 18 4Z" />
    </svg>
)

// The kit's v2 Chevron at 16px, rotated -90° → points right (create-omat's
// sub-link affordance).
const ChevronRight = () => (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" className="-rotate-90" aria-hidden>
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.29289 8.29289C5.65338 7.93241 6.22061 7.90468 6.6129 8.2097L6.70711 8.29289L12 13.585L17.2929 8.29289C17.6534 7.93241 18.2206 7.90468 18.6129 8.2097L18.7071 8.29289C19.0676 8.65338 19.0953 9.22061 18.7903 9.6129L18.7071 9.70711L12.7071 15.7071C12.3466 16.0676 11.7794 16.0953 11.3871 15.7903L11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
            fill="currentColor"
        />
    </svg>
)

// Hairline between rows *inside* a card (create-omat's Separator colour).
const RowDivider = () => <span className="block h-px w-full bg-gray-200" />

// The kit's plain Button, as create-omat styles these two sub-links.
const SubLink = ({ label }: { label: string }) => (
    <span className="inline-flex w-fit cursor-pointer items-center gap-2 p-0 text-sm leading-none font-normal text-neutral-700">
        {label}
        <span className="-ml-1">
            <ChevronRight />
        </span>
    </span>
)

export default function MobileMoreMenu({
    open,
    onOpenChange,
    onProductDetails,
    container,
}: MobileMoreMenuProps) {
    const [copied, setCopied] = useState(false)

    const copyShareLink = () => {
        try {
            navigator.clipboard?.writeText(SHARE_LINK)
        } catch {
            /* clipboard blocked — ignore */
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <MobileDrawer
            open={open}
            onOpenChange={onOpenChange}
            title="More Actions"
            container={container}
        >
            {/* Rows are grouped into cards by topic (shipping/returns · product ·
                contact), separated by gaps — the iOS action-sheet pattern. The
                drawer itself stays white; cards sit on --neutral-100 with
                hairline dividers between rows inside a card. Row anatomy
                (icon + pills + sub-links, typography) is create-omat's. */}
            <div className="flex flex-col gap-3 px-4 pt-1 pb-[calc(16px+env(safe-area-inset-bottom))]">
                {/* Product details + Share — two separate cards side by side,
                    each with its icon centred above the label, h-20 (80px). */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--sprd-neutral-100)] px-3 text-center active:bg-[var(--sprd-neutral-200)]"
                        onClick={() => {
                            onOpenChange(false)
                            onProductDetails()
                        }}
                    >
                        <InfoIcon />
                        <span className="text-[14px] font-medium">Product details</span>
                    </button>
                    {/* create-omat opens its ShareDialog here; the proto copies
                        the same dummy link the canvas Share button uses. */}
                    <button
                        type="button"
                        aria-label={copied ? "Link copied" : "Share"}
                        className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl bg-[var(--sprd-neutral-100)] px-3 text-center active:bg-[var(--sprd-neutral-200)]"
                        onClick={copyShareLink}
                    >
                        {/* Confirms with the kit checkmark instead of a word, like
                            the bulk-order panel — nothing to translate, no
                            reflow. */}
                        {copied ? <CheckmarkIcon className="size-6" /> : <ShareIcon />}
                        <span className="text-[14px] font-medium">Share</span>
                    </button>
                </div>

                {/* Shipping & returns */}
                <div className="overflow-hidden rounded-xl bg-[var(--sprd-neutral-100)]">
                    <div className="flex gap-2.5 p-4">
                        <div className="pt-0.5">
                            <TruckAltIcon />
                        </div>
                        <div className="flex flex-col gap-2">
                            {/* Standard (neutral) + Express (green) badges, like
                                create-omat's QuickDeliveryInfo — the express one
                                is prefixed with its shipping name. Dates come
                                from the proto's own SHIPPING_OPTIONS. */}
                            <div className="inline-flex shrink-0 flex-wrap items-start gap-2">
                                {DELIVERY_BADGES.map(({ label, range, express }) => (
                                    <div className="inline-flex items-center gap-2.5" key={label}>
                                        <div
                                            className={
                                                "inline-flex items-center rounded-xs px-1 py-0.5 text-sm " +
                                                (express ? "bg-green-200" : "bg-neutral-200")
                                            }
                                        >
                                            <p>
                                                {express ? `${label}: ` : ""}
                                                <span className="font-bold">{range}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <SubLink label="See prices and more" />
                        </div>
                    </div>
                    <RowDivider />
                    <div className="flex gap-2.5 p-4">
                        <RefreshIcon />
                        <div className="flex flex-col gap-2">
                            <p className="flex w-fit items-center rounded-xs bg-black px-1 py-0.5 text-sm leading-5 text-white">
                                <span className="font-bold">30-Day</span>&nbsp;easy returns!
                            </p>
                            <SubLink label="See details" />
                        </div>
                    </div>
                </div>

                {/* Bulk orders — the purple panel from the desktop Contact
                    dropdown, as its own category at the very bottom. */}
                <BulkOrderNote />
                {/* Contact — the proto's own addition. */}
                <div className="overflow-hidden rounded-xl bg-[var(--sprd-neutral-100)]">
                    {/* Informational only — no tel: link, so tapping never
                        starts a call. */}
                    <div className="flex items-center gap-2.5 p-4">
                        <PhoneIcon viewBox="-3.8 -3.8 27.6 27.6" className="size-6 shrink-0 text-black" />
                        {/* Sub-label styling matches the returns row's "See
                            details" link; the column gap is 2px tighter (6px vs
                            gap-2's 8px) so the number and its hours sit closer. */}
                        <span className="flex flex-col gap-1.5">
                            <span className="text-[15px] font-medium text-black">
                                0341 996 59989
                            </span>
                            <span className="text-sm leading-none font-normal text-neutral-700">
                                Mo-Fr 9-18 Uhr
                            </span>
                        </span>
                    </div>
                </div>

            </div>
        </MobileDrawer>
    )
}
