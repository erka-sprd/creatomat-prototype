"use client"

import { CloseIcon } from "@/components/kit-icons"
import { cn } from "@/lib/utils"

// create-omat's ChipTag: a pill per hot topic, bordered black with a close
// glyph while it is part of the search.

type ChipTagProps = {
    name: string
    selected: boolean
    onToggle: (name: string) => void
    className?: string
}

export function ChipTag({ name, selected, onToggle, className }: ChipTagProps) {
    return (
        <div
            data-tag-name={name}
            onClick={() => onToggle(name)}
            className={cn(
                "w-full cursor-pointer rounded-full border px-5 py-3 text-left text-sm font-normal",
                "hover:bg-neutral-100",
                selected ? "border-black" : "border-neutral-300",
                className
            )}
        >
            {selected ? (
                <span className="flex items-center gap-2 overflow-hidden">
                    <CloseIcon className="size-4 min-w-4 shrink-0" />
                    <span className="min-w-0 truncate">{name}</span>
                </span>
            ) : (
                <span className="block min-w-0 truncate">{name}</span>
            )}
        </div>
    )
}

/** Case-insensitive, trimmed — as create-omat's isTagSelected. */
export function isTagSelected(selectedTags: string[], name: string) {
    const normalized = name.toLowerCase().trim()
    return selectedTags.some(t => t.toLowerCase().trim() === normalized)
}

/** Adds the tag, or removes it when it is already there — as create-omat's toggleTagInArray. */
export function toggleTagInArray(tags: string[], name: string) {
    const normalized = name.toLowerCase().trim()
    return tags.some(t => t.toLowerCase().trim() === normalized)
        ? tags.filter(t => t.toLowerCase().trim() !== normalized)
        : [...tags, name.trim()]
}
