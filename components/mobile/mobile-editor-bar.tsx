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
import { EditorBarShell } from "@/components/ui/editor-bar/EditorBarShell"

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

export default function MobileEditorBar({
    show,
    color,
    colorSet,
    onWrite,
    onPanel,
    onDuplicate,
    onDelete,
}: MobileEditorBarProps) {
    if (!show) return null

    const item =
        "flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 text-xs font-semibold transition-colors active:bg-neutral-100"
    const line = <div className="-my-1.5 w-px shrink-0 self-stretch bg-[#e9e9e9]" />
    return (
        <EditorBarShell data-mobile-editor-bar="true">
            <>
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
                <button type="button" onClick={() => onPanel("Color")} className={item}>
                    <ColorDotIcon color={color} isDefault={!colorSet} />
                    Color
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
            </>
        </EditorBarShell>
    )
}
