"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { ChevronIcon } from "@/components/kit-icons"
import { cn } from "@/lib/utils"
import { ChipTag, isTagSelected } from "./chip-tag"

// create-omat's two tag presentations: the grid at the top of the panel, six
// chips with "See more", and the one-row slider that takes over once the grid
// has scrolled away (desktop) or sits under the search (mobile).

const MAX_VISIBLE_TAGS = 6
const SCROLL_AMOUNT = 150

type TagListProps = {
    tags: string[]
    selectedTags: string[]
    onToggle: (name: string) => void
}

export function GridTagList({
    tags,
    selectedTags,
    onToggle,
    showAll,
    onShowAllChange,
}: TagListProps & { showAll: boolean; onShowAllChange: (value: boolean) => void }) {
    const visible = showAll ? tags : tags.slice(0, MAX_VISIBLE_TAGS)
    return (
        <div className="animate-in fade-in flex flex-col gap-3 duration-300">
            <div
                className={cn("grid grid-cols-2 gap-2", showAll && "max-h-[400px] overflow-y-auto pr-2")}
            >
                {visible.map(name => (
                    <ChipTag
                        key={name}
                        name={name}
                        selected={isTagSelected(selectedTags, name)}
                        onToggle={onToggle}
                    />
                ))}
            </div>
            {tags.length > MAX_VISIBLE_TAGS && (
                <button
                    type="button"
                    onClick={() => onShowAllChange(!showAll)}
                    className="flex cursor-pointer items-center gap-0.5 text-xs text-neutral-600"
                >
                    {showAll ? "See less" : "See more"}
                    <ChevronIcon className={cn("size-6", showAll && "rotate-180")} />
                </button>
            )}
        </div>
    )
}

function Arrow({
    side,
    disabled,
    onClick,
}: {
    side: "left" | "right"
    disabled: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={side === "left" ? "Scroll left" : "Scroll right"}
            className={cn(
                "absolute top-0 z-10 hidden h-full w-12 cursor-pointer items-center transition-opacity duration-200 dlg:flex",
                side === "left"
                    ? "left-0 justify-start bg-gradient-to-r from-white via-white to-transparent"
                    : "right-0 justify-end bg-gradient-to-l from-white via-white to-transparent",
                disabled ? "pointer-events-none opacity-0" : "opacity-100"
            )}
        >
            <ChevronIcon className={cn("size-5", side === "left" ? "rotate-90" : "-rotate-90")} />
        </button>
    )
}

export function HorizontalTagSlider({
    tags,
    selectedTags,
    onToggle,
    sliderRef: externalRef,
    className,
}: TagListProps & { sliderRef?: RefObject<HTMLDivElement | null>; className?: string }) {
    const internalRef = useRef<HTMLDivElement>(null)
    const sliderRef = externalRef ?? internalRef
    const [canLeft, setCanLeft] = useState(false)
    const [canRight, setCanRight] = useState(false)

    const update = useCallback(() => {
        const el = sliderRef.current
        if (!el) return
        setCanLeft(el.scrollLeft > 0)
        setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }, [sliderRef])

    useEffect(() => {
        const el = sliderRef.current
        if (!el) return
        update()
        el.addEventListener("scroll", update, { passive: true })
        window.addEventListener("resize", update)
        return () => {
            el.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)
        }
    }, [sliderRef, update])

    // The first selected chip scrolls into the middle, as in create-omat.
    useEffect(() => {
        const el = sliderRef.current
        if (!el || selectedTags.length === 0) return
        const chip = el.querySelector<HTMLElement>(`[data-tag-name="${selectedTags[0]}"]`)
        chip?.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" })
    }, [selectedTags, sliderRef])

    const scroll = (dir: "left" | "right") =>
        sliderRef.current?.scrollBy({
            left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
            behavior: "smooth",
        })

    return (
        <div className={cn("relative overflow-visible", className)}>
            <div
                ref={sliderRef}
                className="animate-in fade-in flex gap-2 overflow-x-auto duration-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {tags.map(name => (
                    <ChipTag
                        key={name}
                        name={name}
                        selected={isTagSelected(selectedTags, name)}
                        onToggle={onToggle}
                        className="w-auto shrink-0 whitespace-nowrap"
                    />
                ))}
            </div>
            <Arrow side="left" disabled={!canLeft} onClick={() => scroll("left")} />
            <Arrow side="right" disabled={!canRight} onClick={() => scroll("right")} />
        </div>
    )
}
