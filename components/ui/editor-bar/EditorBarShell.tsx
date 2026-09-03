"use client"

import { useCallback, useEffect, useRef, type ReactNode } from "react"
import { useState } from "react"

// The pill every editor bar is drawn in, and the one place the overflow
// behaviour lives — create-omat's EditorBar shell (src/components/ui/editor-bar
// /index.tsx): a 48px white pill at top-8, centred on the canvas, capped at its
// width less 16px. When the row no longer fits, a chevron appears at whichever
// end still has content behind it and scrolls by 120px; both vanish again once
// there is room. The scrollbar itself is always hidden.
//
// The text bar, the design bar and the mobile bar all render through this, so
// they cannot drift apart in placement or in how they behave when squeezed.

function Chevron({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            aria-hidden="true"
            className={className}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.65338 7.93241 6.22061 7.90468 6.6129 8.2097L6.70711 8.29289L12 13.585L17.2929 8.29289C17.6534 7.93241 18.2206 7.90468 18.6129 8.2097L18.7071 8.29289C19.0676 8.65338 19.0953 9.22061 18.7903 9.6129L18.7071 9.70711L12.7071 15.7071C12.3466 16.0676 11.7794 16.0953 11.3871 15.7903L11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill="currentColor"
            />
        </svg>
    )
}

export function EditorBarShell({
    children,
    className = "",
    ...rest
}: {
    children: ReactNode
    className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 0)
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }, [])

    // Re-check when the items change, not only on mount: a bar gains and loses
    // controls as the selection changes, and that alone can make it overflow.
    useEffect(() => {
        updateScrollState()
    }, [children, updateScrollState])

    useEffect(() => {
        window.addEventListener("resize", updateScrollState)
        return () => window.removeEventListener("resize", updateScrollState)
    }, [updateScrollState])

    const arrow = (dir: "left" | "right") => (
        <button
            type="button"
            aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
            onClick={() =>
                scrollRef.current?.scrollBy({
                    left: dir === "left" ? -120 : 120,
                    behavior: "smooth",
                })
            }
            className={
                "absolute z-10 flex h-full flex-shrink-0 cursor-pointer items-center bg-white hover:bg-neutral-100 " +
                (dir === "left"
                    ? "-left-0.5 rounded-l-full border-r border-neutral-200"
                    : "-right-0.5 rounded-r-full border-l border-neutral-200")
            }
        >
            <span className="p-2">
                <Chevron className={dir === "left" ? "rotate-90" : "-rotate-90"} />
            </span>
        </button>
    )

    return (
        <div
            {...rest}
            className={
                "shadow-xs absolute top-8 left-1/2 z-[5] flex h-[48px] max-w-[calc(100%-16px)] -translate-x-1/2 items-center overflow-hidden rounded-full bg-white " +
                className
            }
        >
            {canScrollLeft && arrow("left")}
            <div
                ref={scrollRef}
                // Named so anything outside can find the scroller itself rather
                // than guess at a utility class — the handoff parks it at its
                // right end to show the controls that live there.
                data-editor-bar-scroller="true"
                onScroll={updateScrollState}
                // [&>*]:shrink-0 is the point of the whole thing: flex children
                // shrink by default, so without it a narrow bar squeezes its
                // buttons and collapses the 1px separators to nothing instead of
                // scrolling. Every item keeps its natural width and the overflow
                // goes to the scroller, which is what the chevrons then drive.
                className="no-scrollbar flex h-full min-w-0 items-center gap-2 overflow-x-auto overflow-y-hidden scroll-smooth px-1.5 py-1.5 [&>*]:shrink-0"
            >
                {children}
            </div>
            {canScrollRight && arrow("right")}
        </div>
    )
}
