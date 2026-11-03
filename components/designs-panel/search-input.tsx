"use client"

import { useEffect, useRef, useState } from "react"
import { CloseIcon, SearchIcon } from "@/components/kit-icons"
import { cn } from "@/lib/utils"

// create-omat's SearchInput over the kit's v2 Input: a bordered row with the
// search glyph in front, a round clear button behind once there is text, and
// a debounced change beside the immediate one.

const DEFAULT_DEBOUNCE_MS = 400

type SearchInputProps = {
    value: string
    onChange: (value: string) => void
    onDebouncedChange: (value: string) => void
    placeholder: string
    debounceMs?: number
    className?: string
}

export function SearchInput({
    value,
    onChange,
    onDebouncedChange,
    placeholder,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    className,
}: SearchInputProps) {
    const [inputValue, setInputValue] = useState(value)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => setInputValue(value), [value])
    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current)
    }, [])

    const change = (next: string) => {
        setInputValue(next)
        onChange(next)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => onDebouncedChange(next), debounceMs)
    }

    const clear = () => {
        if (timer.current) clearTimeout(timer.current)
        setInputValue("")
        onChange("")
        onDebouncedChange("")
    }

    return (
        <label
            className={cn(
                "group flex w-full items-center gap-3 border border-neutral-700 p-3 focus-within:border-black focus-within:ring",
                className
            )}
        >
            <span className="sr-only">Search</span>
            <SearchIcon className="size-5 text-neutral-700 group-focus-within:text-black" />
            <input
                type="search"
                value={inputValue}
                onChange={e => change(e.target.value)}
                placeholder={placeholder}
                className="flex-1 border-none bg-transparent text-base outline-none placeholder:text-base placeholder:text-neutral-700 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            />
            {inputValue && (
                <button
                    type="button"
                    onClick={clear}
                    aria-label="Clear search"
                    className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-200 hover:bg-neutral-300"
                >
                    <CloseIcon className="size-3" />
                </button>
            )}
        </label>
    )
}
