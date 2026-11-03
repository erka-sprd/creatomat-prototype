"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import { HOT_TOPICS, PANEL_DESIGNS, searchDesigns, type PanelDesign } from "@/lib/graphics-library"
import { cn } from "@/lib/utils"
import { toggleTagInArray } from "./chip-tag"
import { DesignGrid } from "./design-grid"
import { SearchInput } from "./search-input"
import { GridTagList, HorizontalTagSlider } from "./tag-lists"

// create-omat's Designs & Graphics panel (DesignAndGraphicsPanel), over the
// prototype's local design list instead of the marketplace search.
//
// Desktop: the title and the search sit above a scrolling body that opens on
// the hot-topic grid; once that grid has scrolled out of view a one-row
// slider of the same tags sticks to the top. Mobile: the search and the
// slider are the sticky head, the grid of designs scrolls under them.
//
// Tapping a topic puts it in the search (several make a multi-word query);
// typing a topic's name selects its chip. A query with no match keeps the
// full list on screen under a "No results" note, as the product does.

export const DESIGNS_PANEL_TITLE = "Designs & Graphics"
const SEARCH_PLACEHOLDER = "Search designs..."
const POPULAR_TITLE = "Most popular"

type DesignsPanelProps = {
    layout: "desktop" | "mobile"
    onPick: (design: PanelDesign) => void
    onDragStart?: (e: DragEvent, design: PanelDesign) => void
}

export function DesignsPanel({ layout, onPick, onDragStart }: DesignsPanelProps) {
    const [searchInput, setSearchInput] = useState("")
    const [query, setQuery] = useState("")
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [showAll, setShowAll] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const gridTagsRef = useRef<HTMLDivElement>(null)
    const sliderRef = useRef<HTMLDivElement>(null)
    const [gridOutOfView, setGridOutOfView] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    const isSearching = query.trim().length > 0
    const matches = useMemo(() => (isSearching ? searchDesigns(query) : PANEL_DESIGNS), [isSearching, query])
    const noResults = isSearching && matches.length === 0
    const designs = noResults ? PANEL_DESIGNS : matches

    const resetScroll = () => scrollRef.current?.scrollTo({ top: 0 })

    const toggleTag = useCallback((name: string) => {
        setSelectedTags(prev => {
            const next = toggleTagInArray(prev, name)
            const value = next.join(" ")
            setSearchInput(value)
            setQuery(value)
            return next
        })
        resetScroll()
    }, [])

    // Typing keeps the chips in step: a topic spelt out in the box is selected.
    const changeInput = (value: string) => {
        setSearchInput(value)
        setSelectedTags(HOT_TOPICS.filter(t => value.toLowerCase().includes(t.toLowerCase())))
    }

    // Desktop: the sticky slider appears while the tag grid is scrolled away.
    useEffect(() => {
        const root = scrollRef.current
        const target = gridTagsRef.current
        if (layout !== "desktop" || !root || !target) return
        const observer = new IntersectionObserver(([entry]) => setGridOutOfView(!entry.isIntersecting), {
            root,
            threshold: 0,
        })
        observer.observe(target)
        return () => observer.disconnect()
    }, [layout])

    // Mobile: the head gets a shadow once the body has scrolled.
    useEffect(() => {
        const el = scrollRef.current
        if (layout !== "mobile" || !el) return
        const onScroll = () => setScrolled(el.scrollTop > 0)
        el.addEventListener("scroll", onScroll, { passive: true })
        return () => el.removeEventListener("scroll", onScroll)
    }, [layout])

    const search = (
        <SearchInput
            value={searchInput}
            onChange={changeInput}
            onDebouncedChange={setQuery}
            placeholder={SEARCH_PLACEHOLDER}
        />
    )

    const content = (
        <div className="pb-4">
            <h3 className="mb-4 text-sm font-medium">{isSearching && !noResults ? query : POPULAR_TITLE}</h3>
            <DesignGrid designs={designs} onPick={onPick} onDragStart={onDragStart} />
        </div>
    )

    if (layout === "mobile") {
        return (
            <div className="flex h-full min-h-0 flex-col">
                <div className="sticky top-0 z-20 bg-white px-4">
                    {search}
                    <div className={cn("-mx-4 px-4 py-4", scrolled && "shadow-md")}>
                        <HorizontalTagSlider
                            tags={HOT_TOPICS}
                            selectedTags={selectedTags}
                            onToggle={toggleTag}
                            sliderRef={sliderRef}
                        />
                    </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4">
                    {noResults && <NoResultsFound searchInput={searchInput} />}
                    {content}
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="px-6 pt-6">
                <h3 className="mb-6 font-display text-lg font-medium">{DESIGNS_PANEL_TITLE}</h3>
                {search}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-6">
                <div
                    className={cn(
                        "sticky top-0 z-10 -mx-6 overflow-hidden bg-white px-6 shadow-xs transition-all duration-200",
                        gridOutOfView ? "max-h-20 py-4 opacity-100" : "pointer-events-none max-h-0 py-0 opacity-0"
                    )}
                >
                    <HorizontalTagSlider
                        tags={HOT_TOPICS}
                        selectedTags={selectedTags}
                        onToggle={toggleTag}
                        sliderRef={sliderRef}
                    />
                </div>
                {noResults && <NoResultsFound searchInput={searchInput} className="py-0 pt-4" />}
                <div ref={gridTagsRef} className="pt-4">
                    <GridTagList
                        tags={HOT_TOPICS}
                        selectedTags={selectedTags}
                        onToggle={toggleTag}
                        showAll={showAll}
                        onShowAllChange={setShowAll}
                    />
                </div>
                <div className="pt-10">{content}</div>
            </div>
        </div>
    )
}

function NoResultsFound({ searchInput, className }: { searchInput: string; className?: string }) {
    return (
        <div className={className ?? "py-5"}>
            <h3 className="mb-1 text-sm font-medium">No results for &apos;{searchInput}&apos;</h3>
            <p className="text-sm text-neutral-600">
                But don&apos;t worry, there&apos;s a world of amazing designs to explore below.
            </p>
        </div>
    )
}
