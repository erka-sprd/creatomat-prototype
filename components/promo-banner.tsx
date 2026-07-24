"use client"

import { ReactNode, useEffect, useState } from "react"

// Top promo bar: rolls horizontally to the next message every 5s, slow and
// smooth. Percentage-based translate (no width measuring) so it works in every
// browser — each panel is full width and the track shifts one panel per step.
const ROLL_MS = 1000
const HOLD_MS = 5000

const Chevrons = () => (
    <span className="inline-flex items-center" aria-hidden>
        <img src="/icons/icon-chevron-right.svg" alt="" className="h-3.5 w-3.5" />
        <img src="/icons/icon-chevron-right.svg" alt="" className="-ml-2 h-3.5 w-3.5" />
    </span>
)

const MESSAGES: ReactNode[] = [
    <>
        <span className="font-semibold">30% off everything</span>
        <a href="#" className="font-semibold underline underline-offset-2">
            Redeem Code Now
        </a>
    </>,
    <>
        <span className="font-medium">Subscribe to the newsletter and get a £5 voucher</span>
        <Chevrons />
    </>,
]

export default function PromoBanner() {
    const [index, setIndex] = useState(0)
    const [withTransition, setWithTransition] = useState(true)
    const [reduce, setReduce] = useState(false)
    const items = [...MESSAGES, MESSAGES[0]] // clone the first for a seamless loop

    useEffect(() => {
        setReduce(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
    }, [])

    useEffect(() => {
        const id = setInterval(() => setIndex(i => i + 1), HOLD_MS)
        return () => clearInterval(id)
    }, [])

    // After rolling onto the cloned first item, snap back to real index 0 (no transition).
    useEffect(() => {
        if (index !== MESSAGES.length) return
        const t = setTimeout(() => {
            setWithTransition(false)
            setIndex(0)
        }, ROLL_MS)
        return () => clearTimeout(t)
    }, [index])

    // Re-enable the transition a frame after a snap.
    useEffect(() => {
        if (withTransition) return
        const r = requestAnimationFrame(() => requestAnimationFrame(() => setWithTransition(true)))
        return () => cancelAnimationFrame(r)
    }, [withTransition])

    return (
        <div className="h-8 w-full overflow-hidden bg-[#FF6038]">
            <div
                className="flex h-8 w-full"
                style={{
                    transform: `translateX(-${index * 100}%)`,
                    transition:
                        withTransition && !reduce
                            ? `transform ${ROLL_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
                            : "none",
                }}
            >
                {items.map((msg, i) => (
                    <div
                        key={i}
                        className="flex h-8 w-full shrink-0 items-center justify-center gap-2 px-8 text-[12px] text-black"
                    >
                        {msg}
                    </div>
                ))}
            </div>
        </div>
    )
}
