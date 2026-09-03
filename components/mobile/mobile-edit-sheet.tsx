"use client"

import MobileDrawer from "@/components/mobile/mobile-drawer"
import {
    COLOR_PALETTE,
    ColorBubble,
    RainbowBubble,
} from "@/components/mobile/color-bubbles"
import CustomColorPanel from "@/components/mobile/custom-color-panel"
import { CurvePreview, STRAIGHT_PATH } from "@/components/ui/text-path/curve-tiles"
import {
    DeleteIcon,
    DuplicateIcon,
    KeyboardIcon,
    MinusIcon,
    PlusIcon,
} from "@/components/mobile/icons"
import { AlignIcon, BoldIcon, ItalicIcon, UnderlineIcon } from "@/components/ui/editor-bar"
import { WedgeSlider } from "@/components/ui/editor-bar/WedgeSlider"
import { FontButton } from "@/components/ui/font-panel/FontButton"
import { FONTS, MAX_FONT_SIZE, MIN_FONT_SIZE } from "@/lib/fonts"
import { TEXT_CURVES, type TextCurveId } from "@/lib/text-path"
import { ArrowLeft } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

// Mobile edit bottom sheet — replica of create-omat's MobileEditDrawer
// (src/components/ui/mobile-edit/): pill tabs across the top (Write / Font /
// Size / Color / Format) with duplicate/delete at the row's end, a fixed
// 184px panel area under them, and no dim overlay / non-modal so the canvas
// stays visible while editing. Each panel mirrors its create-omat counterpart:
//   Font    a horizontal strip of 96px tiles (FontGrid mobile), not a grid
//   Format  bordered B / I / U buttons over the labelled alignment box
//   Color   the 8-column COLOR_PALETTE bubble grid + rainbow bubble that swaps
//           the sheet to the custom picker (back arrow in the title)
//   Size    minus / WedgeSlider / plus across the full width, the slider
//           reading out its percentage above the handle as create-omat does
//   Curve   the desktop panel's presets in one horizontal strip
// A selected graphic gets the same sheet with its two actions.

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
    canBold: boolean
    canItalic: boolean
    onFontFamilyChange: (family: string) => void
    /** Largest size the print area allows — see the editor bar's maxFontSize. */
    maxFontSize: number
    onFontSizeChange: (size: number) => void
    /** The size gesture is over — see the editor bar's onFontSizeCommit. */
    onFontSizeCommit?: () => void
    onColorChange: (color: string) => void
    onTextAlignChange: (align: "left" | "center" | "right") => void
    onToggleBold: () => void
    onToggleItalic: () => void
    onToggleUnderline: () => void
    onDuplicate: () => void
    onDelete: () => void
    /** Enter inline text editing (create-omat's "Write" keyboard pill). */
    onWrite: () => void
    /** Which panel to show — set by whichever editor-bar item opened the sheet. */
    initialTab?: TextTab
    /** Active curve preset, or null while the text is on a straight baseline. */
    curveId: TextCurveId | null
    /** null clears the baseline — CE.SDK's setTextOnPath(id, null). */
    onCurveChange: (id: TextCurveId | null) => void
}

const TEXT_TABS = ["Font", "Format", "Color", "Size", "Curve"] as const
export type TextTab = (typeof TEXT_TABS)[number]

export default function MobileEditSheet({
    open,
    onClose,
    blockType,
    text,
    canBold,
    canItalic,
    maxFontSize,
    onFontFamilyChange,
    onFontSizeChange,
    onFontSizeCommit,
    onColorChange,
    onTextAlignChange,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
    onDuplicate,
    onDelete,
    onWrite,
    initialTab = "Font",
    curveId,
    onCurveChange,
}: MobileEditSheetProps) {
    const [activeTab, setActiveTab] = useState<TextTab>("Font")
    // The custom colour view replaces the whole sheet body, create-omat style;
    // the last colour picked there becomes the rainbow bubble's centre dot.
    const [showCustomPicker, setShowCustomPicker] = useState(false)
    const [lastCustomColor, setLastCustomColor] = useState<string | null>(null)

    // Open on whichever panel the editor bar asked for.
    useEffect(() => {
        if (open) setActiveTab(initialTab)
    }, [open, blockType, initialTab])

    // Leaving the tab (or the sheet) drops the picker view, as create-omat does
    // when activeMobilePanel changes.
    useEffect(() => {
        setShowCustomPicker(false)
    }, [activeTab, open])

    // The size slider paints an SVG track, so it needs a pixel width rather than
    // a flex rule. Measured through a CALLBACK ref, not an effect: the drawer
    // mounts its content on its own schedule, so an effect keyed on the open
    // state could run while the cell did not exist yet and never measure again
    // — which left the slider missing whenever the sheet opened straight onto
    // Size. A callback ref fires when the node actually appears, whenever that
    // is, and the observer keeps it right through rotation and resizes.
    const [sliderWidth, setSliderWidth] = useState(0)
    const sliderObserverRef = useRef<ResizeObserver | null>(null)
    const sliderCellRef = useCallback((node: HTMLDivElement | null) => {
        sliderObserverRef.current?.disconnect()
        sliderObserverRef.current = null
        if (!node) {
            setSliderWidth(0)
            return
        }
        const measure = () => setSliderWidth(node.clientWidth)
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(node)
        sliderObserverRef.current = ro
    }, [])

    // No rounding to whole pixels: the readout and the step buttons both work
    // in percent, and snapping the size to integers would make a "1%" step land
    // on anything but 1%.
    const sizeMax = Math.max(
        MIN_FONT_SIZE + 1,
        Math.min(MAX_FONT_SIZE, Math.floor(maxFontSize))
    )
    const clampSize = (v: number) => Math.min(sizeMax, Math.max(MIN_FONT_SIZE, v))
    const sizeValue = clampSize(text?.fontSize ?? MIN_FONT_SIZE)
    /** Move the size by whole percentage points of the slider's range. */
    const stepSizePercent = (delta: number) => {
        const range = sizeMax - MIN_FONT_SIZE
        const pct = ((sizeValue - MIN_FONT_SIZE) / range) * 100
        const next = Math.min(100, Math.max(0, Math.round(pct) + delta))
        onFontSizeChange(clampSize(MIN_FONT_SIZE + (next / 100) * range))
        onFontSizeCommit?.()
    }

    const title =
        blockType === "text" ? (
            showCustomPicker ? (
                <span className="flex h-full items-center gap-2 pt-1">
                    <button
                        type="button"
                        aria-label="Back"
                        onClick={() => setShowCustomPicker(false)}
                        className="-ml-1 cursor-pointer p-1"
                    >
                        <ArrowLeft className="size-6" strokeWidth={1.8} />
                    </button>
                    Custom color
                </span>
            ) : (
                "Text style"
            )
        ) : (
            "Edit image"
        )

    return (
        <MobileDrawer
            open={open}
            onOpenChange={o => {
                if (!o) onClose()
            }}
            overlay={false}
            modal={false}
            title={title}
        >
            {blockType === "text" && text && showCustomPicker ? (
                <div className="pb-[calc(8px+env(safe-area-inset-bottom))]">
                    <CustomColorPanel
                        currentColor={text.colorSet ? text.color : "#000000"}
                        onColorChange={color => {
                            onColorChange(color)
                            setLastCustomColor(color)
                        }}
                    />
                </div>
            ) : blockType === "text" && text ? (
                <div className="flex flex-col pb-[calc(8px+env(safe-area-inset-bottom))]">
                    {/* Pill tabs + duplicate/delete at the row's end, one scroller. */}
                    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 whitespace-nowrap">
                        <button
                            type="button"
                            onClick={onWrite}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full py-2 pr-4 pl-0 text-sm font-semibold transition"
                        >
                            <KeyboardIcon className="h-3 w-[17px]" />
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
                        <div className="flex items-center gap-1 bg-white pl-2">
                            <button
                                type="button"
                                aria-label="Duplicate text"
                                onClick={onDuplicate}
                                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors active:bg-neutral-100"
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
                                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-red-600 transition-colors active:bg-neutral-50"
                            >
                                <DeleteIcon className="size-5" />
                            </button>
                        </div>
                    </div>

                    {/* Panel area — the fixed height create-omat's drawer keeps
                        (184px), panels centred inside it. */}
                    <div className="flex h-[184px] items-center justify-center">
                        {activeTab === "Font" && (
                            /* create-omat's FontGrid mobile: one horizontal
                               strip of 96px-wide tiles. */
                            <div className="no-scrollbar flex w-full items-center overflow-x-auto">
                                <div className="flex items-center gap-2 pr-4 pl-4">
                                    {FONTS.map(font => (
                                        <FontButton
                                            key={font.family}
                                            font={font}
                                            isSelected={font.family === text.fontFamily}
                                            onClick={f => onFontFamilyChange(f.family)}
                                            className="h-[100px] w-24 shrink-0"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "Size" && (
                            /* Minus / slider / plus across the full width inside
                               the panel's padding, with create-omat's percentage
                               readout riding the handle. The slider draws an SVG
                               track and so needs a pixel width — the middle cell
                               flexes and reports its own. */
                            <div className="flex w-full items-center gap-2 px-4">
                                <button
                                    type="button"
                                    aria-label="Decrease font size"
                                    onClick={() => stepSizePercent(-1)}
                                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors active:bg-neutral-100"
                                >
                                    <MinusIcon className="size-6" />
                                </button>
                                <div ref={sliderCellRef} className="min-w-0 flex-1">
                                    {sliderWidth > 0 && (
                                        <WedgeSlider
                                            min={MIN_FONT_SIZE}
                                            max={sizeMax}
                                            value={sizeValue}
                                            onChange={v => onFontSizeChange(clampSize(v))}
                                            onCommit={onFontSizeCommit}
                                            width={sliderWidth}
                                            jumpOnTrackClick
                                            showPercentage
                                        />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    aria-label="Increase font size"
                                    onClick={() => stepSizePercent(1)}
                                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors active:bg-neutral-100"
                                >
                                    <PlusIcon className="size-6" />
                                </button>
                            </div>
                        )}

                        {activeTab === "Curve" && (
                            /* The desktop Curve panel's presets, in one
                               horizontal strip like the Font tab — a mobile
                               sheet has width to scroll, not height to grid. */
                            <div className="no-scrollbar flex w-full items-center overflow-x-auto">
                                <div className="flex items-center gap-2 pr-4 pl-4">
                                    {[null, ...TEXT_CURVES].map(curve => {
                                        const id = curve?.id ?? null
                                        const active = id === curveId
                                        return (
                                            <button
                                                key={id ?? "none"}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => onCurveChange(id)}
                                                className={
                                                    "flex h-[100px] w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xs border bg-neutral-100 px-2 transition " +
                                                    (active
                                                        ? "border-black"
                                                        : "border-transparent active:bg-[#e9e9e9]")
                                                }
                                            >
                                                <CurvePreview
                                                    path={
                                                        curve
                                                            ? (curve.iconPath ?? curve.path)
                                                            : STRAIGHT_PATH
                                                    }
                                                />
                                                <span className="text-[12px] font-semibold">
                                                    {curve?.label ?? "Do not curve"}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === "Color" && (
                            /* create-omat's text ColorPanel: COLOR_PALETTE in
                               an 8-column bubble grid, rainbow bubble last. */
                            <div className="grid w-full grid-cols-8 justify-items-center gap-y-2 px-4">
                                {COLOR_PALETTE.map(color => (
                                    <ColorBubble
                                        key={color}
                                        color={color}
                                        isActive={
                                            text.colorSet &&
                                            text.color.toLowerCase() === color.toLowerCase()
                                        }
                                        onClick={() => onColorChange(color)}
                                    />
                                ))}
                                <RainbowBubble
                                    lastCustomColor={lastCustomColor}
                                    onClick={() => setShowCustomPicker(true)}
                                />
                            </div>
                        )}

                        {activeTab === "Format" && (
                            /* create-omat's FormatPanel: bordered B / I / U
                               buttons, then the labelled alignment box. */
                            <div className="animate-in fade-in slide-in-from-bottom-2 flex w-full flex-col gap-4 px-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Bold"
                                        onClick={onToggleBold}
                                        disabled={!canBold}
                                        className={
                                            "flex h-[52px] max-w-[62px] flex-1 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 transition-colors " +
                                            (text.bold && canBold ? "bg-neutral-100" : "bg-white") +
                                            (!canBold ? " cursor-not-allowed opacity-30" : "")
                                        }
                                    >
                                        <BoldIcon />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Italic"
                                        onClick={onToggleItalic}
                                        disabled={!canItalic}
                                        className={
                                            "flex h-[52px] max-w-[62px] flex-1 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 transition-colors " +
                                            (text.italic && canItalic
                                                ? "bg-neutral-100"
                                                : "bg-white") +
                                            (!canItalic ? " cursor-not-allowed opacity-30" : "")
                                        }
                                    >
                                        <ItalicIcon />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Underline"
                                        onClick={onToggleUnderline}
                                        className={
                                            "flex h-[52px] max-w-[62px] flex-1 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 transition-colors " +
                                            (text.underline ? "bg-neutral-100" : "bg-white")
                                        }
                                    >
                                        <UnderlineIcon />
                                    </button>
                                </div>

                                <div className="flex min-h-[81px] max-w-[342px] items-center overflow-hidden rounded-lg border border-neutral-200 bg-white px-1">
                                    {(["left", "center", "right"] as const).map(align => (
                                        <button
                                            key={align}
                                            type="button"
                                            aria-label={`Align ${align}`}
                                            onClick={() => onTextAlignChange(align)}
                                            className={
                                                "relative flex min-h-[69px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg py-2 transition-all duration-300 " +
                                                (text.textAlign === align
                                                    ? "bg-neutral-100"
                                                    : "active:bg-neutral-50")
                                            }
                                        >
                                            <AlignIcon align={align} />
                                            <span className="text-[11px] leading-tight font-normal text-black capitalize">
                                                {align}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

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
