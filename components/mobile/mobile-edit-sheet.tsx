"use client"

import MobileDrawer from "@/components/mobile/mobile-drawer"
import { FontButton } from "@/components/ui/font-panel/FontButton"
import { MASTER_COLOR_PALETTE } from "@/components/ui/text-color-panel/TextColorPanel"
import { FONTS } from "@/lib/fonts"
import { DeleteIcon, DuplicateIcon, MinusIcon, PlusIcon } from "@/components/mobile/icons"
import { AlignIcon, BoldIcon, ItalicIcon, UnderlineIcon } from "@/components/ui/editor-bar"
import { Keyboard } from "lucide-react"
import { useEffect, useState } from "react"

// Mobile edit bottom sheet — replica of create-omat's MobileEditDrawer:
// opens when a canvas element is selected, pill tabs across the top
// (text: Font / Size / Color / Format), a fixed-height panel area under them
// (184px, like create-omat's drawer panels) and no dim overlay / non-modal so
// the canvas stays visible and interactive while editing. A selected graphic
// gets the same sheet with its two actions (duplicate / delete).

type TextValues = {
    fontFamily: string
    fontSize: number
    color: string
    colorSet: boolean
    textAlign: "left" | "center" | "right"
    bold: boolean
    italic: boolean
    underline: boolean
}

type MobileEditSheetProps = {
    open: boolean
    onClose: () => void
    blockType: "text" | "graphic" | null
    text: TextValues | null
    maxFontSize: number
    canBold: boolean
    canItalic: boolean
    onFontFamilyChange: (family: string) => void
    onFontSizeChange: (size: number) => void
    onColorChange: (color: string) => void
    onTextAlignChange: (align: "left" | "center" | "right") => void
    onToggleBold: () => void
    onToggleItalic: () => void
    onToggleUnderline: () => void
    onDuplicate: () => void
    onDelete: () => void
    /** Enter inline text editing (create-omat's "Write" keyboard pill). */
    onWrite: () => void
}

const TEXT_TABS = ["Font", "Size", "Color", "Format"] as const
type TextTab = (typeof TEXT_TABS)[number]

const MIN_FONT_SIZE = 8

export default function MobileEditSheet({
    open,
    onClose,
    blockType,
    text,
    maxFontSize,
    canBold,
    canItalic,
    onFontFamilyChange,
    onFontSizeChange,
    onColorChange,
    onTextAlignChange,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
    onDuplicate,
    onDelete,
    onWrite,
}: MobileEditSheetProps) {
    const [activeTab, setActiveTab] = useState<TextTab>("Font")

    // Reset to the first tab whenever a new element is selected.
    useEffect(() => {
        if (open) setActiveTab("Font")
    }, [open, blockType])

    const stepFontSize = (delta: number) => {
        if (!text) return
        const next = Math.min(maxFontSize, Math.max(MIN_FONT_SIZE, text.fontSize + delta))
        onFontSizeChange(next)
    }

    return (
        <MobileDrawer
            open={open}
            onOpenChange={o => {
                if (!o) onClose()
            }}
            overlay={false}
            modal={false}
            title={blockType === "text" ? "Text style" : "Edit image"}
        >
            {blockType === "text" && text && (
                <div className="flex flex-col pb-[calc(8px+env(safe-area-inset-bottom))]">
                    {/* Pill tabs + duplicate/delete on the right */}
                    <div className="flex items-center gap-1 overflow-x-auto px-4 pb-1">
                        <button
                            type="button"
                            onClick={onWrite}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full py-2 pr-4 text-sm font-semibold"
                        >
                            <Keyboard className="size-5" strokeWidth={1.7} />
                            Write
                        </button>
                        {TEXT_TABS.map(tab => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={
                                    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition " +
                                    (activeTab === tab ? "bg-neutral-100" : "")
                                }
                            >
                                {tab}
                            </button>
                        ))}
                        <div className="mx-1 h-6 w-px shrink-0 bg-neutral-200" aria-hidden />
                        <button
                            type="button"
                            aria-label="Duplicate text"
                            onClick={onDuplicate}
                            className="shrink-0 cursor-pointer rounded-full p-2 active:bg-neutral-100"
                        >
                            <DuplicateIcon className="size-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Delete text"
                            onClick={() => {
                                onDelete()
                                onClose()
                            }}
                            className="shrink-0 cursor-pointer rounded-full p-2 text-[#DC2626] active:bg-neutral-100"
                        >
                            <DeleteIcon className="size-5" />
                        </button>
                    </div>

                    {/* Panel area — fixed height like create-omat's drawer panels */}
                    <div className="h-[184px] px-4 pt-2">
                        {activeTab === "Font" && (
                            <div className="no-scrollbar grid h-full grid-cols-2 content-start gap-2 overflow-y-auto">
                                {FONTS.map(font => (
                                    <FontButton
                                        key={font.family}
                                        font={font}
                                        isSelected={font.family === text.fontFamily}
                                        onClick={f => onFontFamilyChange(f.family)}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === "Size" && (
                            <div className="flex h-full flex-col items-center justify-center gap-4">
                                <div className="flex items-center gap-6">
                                    <button
                                        type="button"
                                        aria-label="Decrease font size"
                                        disabled={text.fontSize <= MIN_FONT_SIZE}
                                        onClick={() => stepFontSize(-2)}
                                        className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200 disabled:opacity-30"
                                    >
                                        <MinusIcon className="size-6" />
                                    </button>
                                    <span className="w-20 text-center text-2xl font-semibold text-black tabular-nums">
                                        {Math.round(text.fontSize)}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Increase font size"
                                        disabled={text.fontSize >= maxFontSize}
                                        onClick={() => stepFontSize(2)}
                                        className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-neutral-100 active:bg-neutral-200 disabled:opacity-30"
                                    >
                                        <PlusIcon className="size-6" />
                                    </button>
                                </div>
                                <input
                                    type="range"
                                    min={MIN_FONT_SIZE}
                                    max={Math.max(MIN_FONT_SIZE + 1, Math.floor(maxFontSize))}
                                    value={Math.min(text.fontSize, maxFontSize)}
                                    onChange={e => onFontSizeChange(Number(e.target.value))}
                                    className="w-64 accent-black"
                                    aria-label="Font size"
                                />
                            </div>
                        )}

                        {activeTab === "Color" && (
                            <div className="no-scrollbar flex h-full flex-col gap-2 overflow-y-auto py-1">
                                {MASTER_COLOR_PALETTE.map((row, i) => (
                                    <div key={i} className="flex shrink-0 gap-2">
                                        {row.map(color => {
                                            const active =
                                                text.colorSet &&
                                                text.color.toLowerCase() === color.toLowerCase()
                                            return (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    aria-label={`Text color ${color}`}
                                                    onClick={() => onColorChange(color)}
                                                    className={
                                                        "size-9 shrink-0 cursor-pointer rounded-full border border-black/10 " +
                                                        (active
                                                            ? "ring-2 ring-black ring-offset-2"
                                                            : "")
                                                    }
                                                    style={{ backgroundColor: color }}
                                                />
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "Format" && (
                            <div className="flex h-full flex-col items-center justify-center gap-5">
                                <div className="flex items-center gap-2">
                                    {(["left", "center", "right"] as const).map(align => (
                                        <button
                                            key={align}
                                            type="button"
                                            aria-label={`Align ${align}`}
                                            onClick={() => onTextAlignChange(align)}
                                            className={
                                                "flex size-11 cursor-pointer items-center justify-center rounded-lg " +
                                                (text.textAlign === align
                                                    ? "bg-neutral-100"
                                                    : "active:bg-neutral-100")
                                            }
                                        >
                                            <AlignIcon align={align} />
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Bold"
                                        disabled={!canBold}
                                        onClick={onToggleBold}
                                        className={
                                            "flex size-11 cursor-pointer items-center justify-center rounded-lg disabled:opacity-30 " +
                                            (text.bold ? "bg-neutral-100" : "active:bg-neutral-100")
                                        }
                                    >
                                        <BoldIcon />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Italic"
                                        disabled={!canItalic}
                                        onClick={onToggleItalic}
                                        className={
                                            "flex size-11 cursor-pointer items-center justify-center rounded-lg disabled:opacity-30 " +
                                            (text.italic
                                                ? "bg-neutral-100"
                                                : "active:bg-neutral-100")
                                        }
                                    >
                                        <ItalicIcon />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Underline"
                                        onClick={onToggleUnderline}
                                        className={
                                            "flex size-11 cursor-pointer items-center justify-center rounded-lg " +
                                            (text.underline
                                                ? "bg-neutral-100"
                                                : "active:bg-neutral-100")
                                        }
                                    >
                                        <UnderlineIcon />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {blockType === "graphic" && (
                <div className="flex items-center justify-center gap-3 px-4 pt-2 pb-[calc(24px+env(safe-area-inset-bottom))]">
                    <button
                        type="button"
                        onClick={onDuplicate}
                        className="flex cursor-pointer items-center gap-2 rounded-full bg-neutral-100 px-5 py-3 text-sm font-semibold text-black active:bg-neutral-200"
                    >
                        <DuplicateIcon className="size-5" />
                        Duplicate
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onDelete()
                            onClose()
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-full bg-neutral-100 px-5 py-3 text-sm font-semibold text-[#DC2626] active:bg-neutral-200"
                    >
                        <DeleteIcon className="size-5" />
                        Delete
                    </button>
                </div>
            )}
        </MobileDrawer>
    )
}
