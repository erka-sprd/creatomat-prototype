"use client"

import { useEffect, useRef, useState } from "react"

import { CloseIcon } from "@/components/kit-icons"
import { cn } from "@/lib/utils"

// Replica of create-omat's desktop AI panel (src/components/ui/ai-panel/AIPanel.tsx),
// UI only: the prompt box with its gradient border and style chip, the style
// grid behind it, the inspiration chips and the Generate button. Nothing
// generates — Generate is a no-op. Copy is create-omat's en-GB
// (translations/en-GB.json, "ai-panel").
//
// Sizes are what create-omat renders, not what its class lists suggest: the
// kit Button joins classes without tailwind-merge, so where a className clashes
// with the kit's size classes the stylesheet order decides — e.g. the chips
// (size "l") keep the kit's min-h-12 px-6 py-3 over their own px-3 py-1, and
// the style button (size "s") keeps min-h-8 and font-semibold over its
// max-h-[28px] and font-normal.

const STYLES_TITLE = "Styles"
const GENERATE_PLACEHOLDER = "Describe what you’d like to create ..."
const MODIFY_PLACEHOLDER = "Describe how you’d like to modify this image ..."
const MODIFY = "Modify"
// create-omat's first loading text ("ai-panel.loading-texts").
const GENERATING = "Generating design..."
const CHOOSE_STYLE = "Style"
const STYLE_IN = "in"
const OR_TRY = "Or try"
const GENERATE = "Generate"
const INSPIRATION_PROMPTS = [
    "A heart with “I love my girlfriend” text",
    "Two coffee mugs clinking together with small hearts floating above them",
    "Two game controllers facing each other with small lightning bolts between them",
]
// How far the chip arrows scroll the row.
const CHIP_SCROLL_PX = 150

// create-omat's AI_STYLES (lib/Constants.ts), images copied to /img/ai-styles.
const AI_STYLES = [
    { id: "hand-drawn", label: "Hand-drawn" },
    { id: "vintage", label: "Vintage" },
    { id: "typography", label: "Typography" },
    { id: "vibrant-halftone", label: "Vibrant halftone" },
    { id: "badge-emblem", label: "Badge/Emblem" },
    { id: "line-art", label: "Line art" },
    { id: "simple-graphic", label: "Simple graphic" },
    { id: "futuristic-colorful", label: "Futuristic colourful" },
    { id: "photo-illustration", label: "Photo illustration" },
] as const
type AIStyle = (typeof AI_STYLES)[number]

// The kit v2 Chevron (points down; rotated where used).
function KitChevron({ size, className }: { size: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
            <path
                d="M5.29289 8.29289C5.65338 7.93241 6.22061 7.90468 6.6129 8.2097L6.70711 8.29289L12 13.585L17.2929 8.29289C17.6534 7.93241 18.2206 7.90468 18.6129 8.2097L18.7071 8.29289C19.0676 8.65338 19.0953 9.22061 18.7903 9.6129L18.7071 9.70711L12.7071 15.7071C12.3466 16.0676 11.7794 16.0953 11.3871 15.7903L11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                fill="currentColor"
            />
        </svg>
    )
}

// create-omat's arrowLeft glyph (Icon.tsx) — the style grid's back button.
function ArrowLeftIcon() {
    return (
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M10.2862 5.29957C10.6759 4.90014 11.3054 4.90014 11.7051 5.29957C12.0948 5.68902 12.0949 6.31811 11.7051 6.71754L7.40826 11.0115H19.0001C19.5496 11.0115 19.9999 11.4505 20.0001 12.0095C20.0001 12.5588 19.5497 13.0086 19.0001 13.0086H7.42877L11.7139 17.2908C12.1036 17.6702 12.1036 18.3095 11.7139 18.699H11.7042C11.5144 18.8786 11.2548 18.9889 10.9952 18.989L11.0059 18.9998C10.7361 18.9998 10.4758 18.8895 10.296 18.7097L4.30084 12.7185C4.29775 12.7154 4.2951 12.7119 4.29205 12.7088C3.90182 12.3185 3.90446 11.6869 4.29108 11.3006V11.2908L10.2862 5.29957Z"
                fill="currentColor"
            />
        </svg>
    )
}

// create-omat's "ai" glyph (Icon.tsx) — the sparkle on the Generate button.
function AIIcon() {
    return (
        <svg width={24} height={24} viewBox="0 0 25 24" fill="none" aria-hidden>
            <path
                d="M10.1064 10.5528C10.4749 9.81574 11.5269 9.81574 11.8955 10.5528L13.1669 13.0967L15.665 13.5137C16.4272 13.6408 16.7507 14.5359 16.288 15.1182L16.208 15.2071L14.5605 16.8536L14.9912 19.8584C15.1001 20.6207 14.3483 21.2002 13.6523 20.9375L13.5537 20.8946L11.0009 19.6182L8.44819 20.8946C7.75949 21.2389 6.97186 20.7092 7.00092 19.9659L7.01069 19.8584L7.44038 16.8536L5.79389 15.2071C5.24759 14.6608 5.50488 13.7451 6.21967 13.5401L6.33686 13.5137L8.83393 13.0967L10.1064 10.5528ZM10.3955 14.4473C10.2524 14.7335 9.98057 14.9338 9.66499 14.9864L8.58198 15.1661L9.20796 15.793C9.40265 15.9877 9.50758 16.2526 9.50092 16.5245L9.49116 16.6416L9.25971 18.252L10.5537 17.6055C10.795 17.4849 11.0734 17.4676 11.3251 17.5538L11.4482 17.6055L12.7412 18.252L12.5107 16.6416C12.4718 16.3691 12.5474 16.0944 12.7158 15.8809L12.7939 15.793L13.4189 15.1661L12.3369 14.9864C12.0608 14.9404 11.8181 14.7815 11.666 14.5508L11.6064 14.4473L11.0009 13.2364L10.3955 14.4473Z"
                fill="currentColor"
            />
            <path
                d="M18.5 7L18.6166 7.00673C19.0757 7.06005 19.44 7.4243 19.4933 7.88338L19.5 8C19.5 8.51284 19.886 8.93551 20.3834 8.99327L20.5 9C21.7874 9 21.8317 10.8644 20.6332 10.993L20.5 11C19.9872 11 19.5645 11.386 19.5067 11.8834L19.5 12C19.5 13.2874 17.6356 13.3317 17.507 12.1332L17.5 12C17.5 11.4872 17.114 11.0645 16.6166 11.0067L16.5 11C15.2126 11 15.1683 9.13555 16.3668 9.00697L16.5 9C17.0128 9 17.4355 8.61396 17.4933 8.11662L17.5 8C17.5 7.48716 17.886 7.06449 18.3834 7.00673L18.5 7Z"
                fill="currentColor"
            />
        </svg>
    )
}

// Modify mode (create-omat's imageToModify): `modifyImage` — handed in by
// "Simplify with AI", a new object each time — puts the image as a thumbnail
// in the prompt box, clears the style and hides its button (unlike
// create-omat, which keeps it), hides the suggestions, swaps the
// placeholder and turns Generate into Modify, and focuses the prompt. Removing
// the thumbnail goes back to generating.
// `modifyImage.prompt` comes filled in, when given.
// `onModify` runs Modify (Generate stays a no-op): while it does, the prompt
// is locked and the button reads GENERATING; once done the panel resets as
// create-omat's does when a stream completes — prompt emptied, modify mode
// left.
export function AIPanel({
    modifyImage = null,
    onModify,
}: {
    modifyImage?: { src: string; prompt?: string } | null
    onModify?: (src: string, prompt: string) => Promise<void>
}) {
    const [prompt, setPrompt] = useState("")
    const [style, setStyle] = useState<AIStyle | null>(null)
    const [showStyles, setShowStyles] = useState(false)
    const [imageToModify, setImageToModify] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const modify = async () => {
        if (!imageToModify || !onModify) return
        setBusy(true)
        try {
            await onModify(imageToModify, prompt)
            setPrompt("")
            setImageToModify(null)
        } catch (err) {
            console.error("Simplifying the design failed", err)
        } finally {
            setBusy(false)
        }
    }

    useEffect(() => {
        if (!modifyImage) return
        setImageToModify(modifyImage.src)
        if (modifyImage.prompt) setPrompt(modifyImage.prompt)
        setShowStyles(false)
    }, [modifyImage])
    // As create-omat: a new image to modify drops the style and takes the
    // focus to the prompt — two frames on, once the panel has laid out.
    useEffect(() => {
        if (!imageToModify) return
        setStyle(null)
        let inner = 0
        const outer = requestAnimationFrame(() => {
            inner = requestAnimationFrame(() => textareaRef.current?.focus())
        })
        return () => {
            cancelAnimationFrame(outer)
            cancelAnimationFrame(inner)
        }
    }, [imageToModify])

    const hasPrompt = prompt.trim() !== ""
    // create-omat's isInputReady: a prompt or a style — an image alone isn't enough.
    const canGenerate = hasPrompt || style !== null

    return (
        // isolate: the chip row's z-indexes stay inside the panel, under the
        // close tab on its edge. Rounded like the panel (12px), so whatever
        // scrolls inside is clipped to its corners.
        <div className="isolate flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[12px]">
            {showStyles ? (
                <StyleGrid
                    selected={style}
                    onBack={() => setShowStyles(false)}
                    onSelect={s => {
                        setStyle(s)
                        setShowStyles(false)
                    }}
                />
            ) : (
                <div className="min-h-[260px] shrink-0 pb-4">
                    <div className="relative p-4">
                        {/* The prompt box, in the kit's gradient border. */}
                        <div className="gradient-border relative flex h-50 max-w-full flex-col justify-between gap-2 p-3">
                            <div className="min-h-0 w-full flex-1 overflow-hidden">
                                <textarea
                                    ref={textareaRef}
                                    value={prompt}
                                    disabled={busy}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder={
                                        imageToModify ? MODIFY_PLACEHOLDER : GENERATE_PLACEHOLDER
                                    }
                                    className="scrollbar-hide block h-full w-full resize-none overflow-y-auto bg-transparent p-0 text-sm font-normal text-black placeholder-neutral-700 caret-black focus:outline-none"
                                />
                            </div>
                            <div className="flex flex-wrap items-end gap-2">
                                {imageToModify && (
                                    <ModifyThumbnail
                                        src={imageToModify}
                                        disabled={busy}
                                        onRemove={() => setImageToModify(null)}
                                    />
                                )}
                                {/* Kit Button, invert, size s. Not while modifying:
                                    the image sets the look. */}
                                {!imageToModify && (
                                    <button
                                        type="button"
                                        onClick={() => setShowStyles(true)}
                                        className="hover:bg-neutral-150 inline-flex min-h-8 w-fit cursor-pointer items-center justify-center gap-2 rounded border border-neutral-300 bg-white px-[8px] py-[6px] text-xs font-semibold text-black"
                                    >
                                        <span className="flex items-center gap-1 leading-none">
                                            <span className="inline-flex items-center">
                                                {style ? `${STYLE_IN} ${style.label}` : CHOOSE_STYLE}
                                            </span>{" "}
                                            <KitChevron size={16} className="mt-px shrink-0 rotate-270" />
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {!imageToModify && (
                        <InspirationChips
                            onPick={s => {
                                setPrompt(s)
                                textareaRef.current?.focus()
                            }}
                        />
                    )}

                    <div className="px-4">
                        {/* Kit Button, primary, size l. Modify runs `onModify`;
                            Generate does nothing yet. */}
                        <button
                            type="button"
                            disabled={!canGenerate || busy}
                            onClick={imageToModify ? modify : undefined}
                            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-900 disabled:pointer-events-none disabled:opacity-50"
                        >
                            <AIIcon />
                            {busy ? GENERATING : imageToModify ? MODIFY : GENERATE}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// The image being modified, in the prompt box — create-omat's ImageThumbnail
// at desktop size (72px, 12px in), its remove button (the kit Close, 12px) in
// the top-right corner. Faded and inert while it's being modified.
function ModifyThumbnail({
    src,
    disabled,
    onRemove,
}: {
    src: string
    disabled: boolean
    onRemove: () => void
}) {
    return (
        <div
            className={cn(
                "group relative flex size-[72px] shrink flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 p-3 hover:bg-neutral-200",
                disabled && "pointer-events-none opacity-50"
            )}
        >
            <button
                type="button"
                aria-label="Remove image"
                onClick={onRemove}
                className="absolute top-0 right-0 cursor-pointer rounded-sm bg-neutral-200 p-0.5 text-black transition-opacity hover:bg-white"
            >
                <CloseIcon className="size-3" />
            </button>
            <img src={src} alt="" className="h-full w-full shrink-0 object-contain" />
        </div>
    )
}

// "Or try:" and the suggestion chips (kit Button, invert, size l), one row
// scrolling under white fades, each with an arrow — the left one once scrolled.
function InspirationChips({ onPick }: { onPick: (prompt: string) => void }) {
    const rowRef = useRef<HTMLDivElement>(null)
    const [canLeft, setCanLeft] = useState(false)
    const [canRight, setCanRight] = useState(true)
    const scrollBy = (dx: number) => rowRef.current?.scrollBy({ left: dx, behavior: "smooth" })
    return (
        <div className="flex items-center gap-3 pb-4">
            <span className="min-w-[36px] shrink-0 pl-4 text-xs leading-none text-neutral-700">
                {OR_TRY}:
            </span>
            <div className="relative flex flex-1 items-center overflow-hidden">
                {canLeft && (
                    <button
                        type="button"
                        aria-label="Scroll suggestions back"
                        onClick={() => scrollBy(-CHIP_SCROLL_PX)}
                        className="absolute left-0 z-30 flex h-full w-10 cursor-pointer items-center justify-center bg-gradient-to-r from-white via-white to-transparent text-[#3C3C3C] outline-none"
                    >
                        <KitChevron size={23} className="rotate-90" />
                    </button>
                )}
                <div
                    ref={rowRef}
                    onScroll={e => {
                        const t = e.currentTarget
                        setCanLeft(t.scrollLeft > 10)
                        setCanRight(t.scrollLeft < t.scrollWidth - t.clientWidth - 10)
                    }}
                    className="scrollbar-hide relative z-10 flex flex-1 items-center gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pr-10 whitespace-nowrap"
                >
                    {INSPIRATION_PROMPTS.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => onPick(s)}
                            className="inline-flex min-h-12 w-fit shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3 text-xs font-semibold whitespace-nowrap text-black hover:bg-neutral-100"
                        >
                            {s}
                        </button>
                    ))}
                </div>
                {canRight && (
                    <button
                        type="button"
                        aria-label="Scroll suggestions"
                        onClick={() => scrollBy(CHIP_SCROLL_PX)}
                        className="absolute -right-0.5 z-30 flex h-full w-10 cursor-pointer items-center justify-center bg-gradient-to-l from-white via-white to-transparent text-[#3C3C3C] outline-none"
                    >
                        <KitChevron size={23} className="rotate-270" />
                    </button>
                )}
            </div>
        </div>
    )
}

// The style grid behind the style button: its title with create-omat's back
// arrow (kit Button, plain, size s), then the styles three across.
function StyleGrid({
    selected,
    onBack,
    onSelect,
}: {
    selected: AIStyle | null
    onBack: () => void
    onSelect: (style: AIStyle) => void
}) {
    return (
        // No background of its own: the panel's white shows through, so its
        // rounded corners stay rounded.
        <div className="flex flex-col">
            <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                <button
                    type="button"
                    aria-label="Back"
                    onClick={onBack}
                    className="inline-flex h-fit w-fit cursor-pointer items-center justify-center gap-2 px-2 py-2 text-black hover:text-neutral-800"
                >
                    <ArrowLeftIcon />
                </button>
                <span className="font-display text-lg font-medium text-black">{STYLES_TITLE}</span>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-3 gap-x-3 gap-y-6">
                    {AI_STYLES.map(s => {
                        const isSelected = selected?.id === s.id
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => onSelect(s)}
                                className="group flex cursor-pointer flex-col items-center gap-2 outline-none"
                            >
                                <div
                                    className={cn(
                                        "relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all",
                                        isSelected
                                            ? "border-black shadow-sm"
                                            : "border-transparent group-hover:border-neutral-200"
                                    )}
                                >
                                    <img
                                        src={`/img/ai-styles/${s.id}.png`}
                                        alt=""
                                        loading="lazy"
                                        className="size-full object-cover"
                                    />
                                </div>
                                <span
                                    className={cn(
                                        "text-xs leading-4",
                                        isSelected ? "font-semibold" : "font-normal"
                                    )}
                                >
                                    {s.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
