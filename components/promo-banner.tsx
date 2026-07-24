"use client"

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react"

// Top promo bar: rolls horizontally to the next message every 5s, slow and smooth.
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
    const barRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(0)
    const [index, setIndex] = useState(0)
    const [withTransition, setWithTransition] = useState(true)
    const [reduce, setReduce] = useState(false)
    const items = [...MESSAGES, MESSAGES[0]] // clone the first for a seamless loop

    useEffect(() => {
        setReduce(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
    }, [])

    // Measure the bar width so each slide steps exactly one panel.
    useLayoutEffect(() => {
        const el = barRef.current
        if (!el) return
        const update = () => setWidth(el.clientWidth)
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
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
        <div ref={barRef} className="h-8 w-full overflow-hidden bg-[#FF6038]">
            <div
                className="flex h-8"
                style={{
                    transform: `translateX(-${index * width}px)`,
                    transition:
                        withTransition && !reduce
                            ? `transform ${ROLL_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
                            : "none",
                }}
            >
                {items.map((msg, i) => (
                    <div
                        key={i}
                        style={{ width }}
                        className="flex h-8 shrink-0 items-center justify-center gap-2 px-8 text-[12px] text-black"
                    >
                        {msg}
                    </div>
                ))}
            </div>
        </div>
    )
}
