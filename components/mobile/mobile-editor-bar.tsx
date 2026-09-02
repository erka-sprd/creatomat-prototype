"use client"

import {
    ColorDotIcon,
    DeleteIcon,
    DuplicateIcon,
    FontIcon,
    KeyboardIcon,
    TextFormatIcon,
    TextSizeIcon,
} from "@/components/mobile/icons"
import { CurvedLabel } from "@/components/ui/editor-bar"
import { useCallback, useEffect, useRef, useState } from "react"

// The floating bar create-omat shows on the canvas the moment a block is
// selected on mobile (EditorBar with its `textMobile` item list). Tapping an
// item is what opens the bottom sheet, at that panel — the sheet never appears
// on its own.
//
// Same shell as the design editor bar it sits beside (GraphicEditorBar): a
// 48px white pill at top-8, centred on the canvas, capped at its width less
// 16px, scrolling horizontally with a chevron at either end once its items
// overflow. Items are icon + label pills with
// hairline separators, and duplicate/delete close the row.

export type MobileEditorBarPanel = "Font" | "Format" | "Size" | "Curve" | "Color"

type MobileEditorBarProps = {
    show: boolean
    /** Current text colour, drawn in the Color item. */
    color: string
    /** False until the shopper picks a colour — shows the rainbow wheel. */
    colorSet: boolean
    onWrite: () => void
    onPanel: (panel: MobileEditorBarPanel) => void
    onDuplicate: () => void
    onDelete: () => void
}

function Chevron({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" className={className}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 8.29289C5.65338 7.93241 6.22061 7.90468 6.6129 8.2097L6.70711 8.29289L12 13.585L17.2929 8.29289C17.6534 7.93241 18.2206 7.90468 18.6129 8.2097L18.7071 8.29289C19.0676 8.65338 19.0953 9.22061 18.7903 9.6129L18.7071 9.70711L12.7071 15.7071C12.3466 16.0676 11.7794 16.0953 11.3871 15.7903L11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill="currentColor"
            />
        </svg>
    )
}

export default function MobileEditorBar({
    show,
    color,
    colorSet,
    onWrite,
    onPanel,
    onDuplicate,
    onDelete,
}: MobileEditorBarProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 1)
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }, [])

    useEffect(() => {
        updateScrollState()
    }, [show, updateScrollState])

    useEffect(() => {
        window.addEventListener("resize", updateScrollState)
        return () => window.removeEventListener("resize", updateScrollState)
    }, [updateScrollState])

    if (!show) return null

    const item =
        "flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 text-xs font-semibold transition-colors active:bg-neutral-100"
    const line = <div className="-my-1.5 w-px shrink-0 self-stretch bg-[#e9e9e9]" />
    const arrow = (dir: "left" | "right") => (
        <button
            type="button"
            aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
            onClick={() =>
                scrollRef.current?.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" })
            }
            className={
                "absolute z-10 flex h-full shrink-0 cursor-pointer items-center bg-white active:bg-neutral-100 " +
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
            data-mobile-editor-bar="true"
            className="shadow-xs absolute top-8 left-1/2 z-[5] flex h-[48px] max-w-[calc(100%-16px)] -translate-x-1/2 items-center overflow-hidden rounded-full bg-white"
        >
            {canScrollLeft && arrow("left")}
            <div
                ref={scrollRef}
                onScroll={updateScrollState}
                className="no-scrollbar flex h-full min-w-0 items-center gap-2 overflow-x-auto overflow-y-hidden scroll-smooth px-1.5 py-1.5"
            >
                <button type="button" onClick={onWrite} className={item}>
                    <KeyboardIcon className="h-3 w-[17px]" />
                    Write
                </button>
                {line}
                <button type="button" onClick={() => onPanel("Font")} className={item}>
                    <FontIcon className="size-5" />
                    Font
                </button>
                {line}
                <button type="button" onClick={() => onPanel("Format")} className={item}>
                    <TextFormatIcon className="h-4 w-[27px]" />
                    Format
                </button>
                {line}
                <button type="button" onClick={() => onPanel("Size")} className={item}>
                    <TextSizeIcon />
                    Size
                </button>
                {line}
                <button
                    type="button"
                    aria-label="Curve text"
                    onClick={() => onPanel("Curve")}
                    className={item}
                >
                    {/* The desktop bar's own lettering — the word set on the arc
                        it applies, which is its whole label rather than an icon
                        beside one. fontFamily="inherit" takes the face from the
                        button, so it matches the words either side of it. */}
                    <CurvedLabel />
                </button>
                {line}
                <button type="button" onClick={() => onPanel("Color")} className={item}>
                    <ColorDotIcon color={color} isDefault={!colorSet} />
                    Color
                </button>
                {line}
                <button
                    type="button"
                    aria-label="Duplicate text"
                    onClick={onDuplicate}
                    className={item + " px-2"}
                >
                    <DuplicateIcon className="size-5" />
                </button>
                <button
                    type="button"
                    aria-label="Delete text"
                    onClick={onDelete}
                    className={item + " px-2 text-[#DC2626]"}
                >
                    <DeleteIcon className="size-5" />
                </button>
            </div>
            {canScrollRight && arrow("right")}
        </div>
    )
}
