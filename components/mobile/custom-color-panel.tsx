"use client"

import { useEffect, useState } from "react"
import { HexColorPicker } from "react-colorful"

// Replica of create-omat's mobile custom colour view
// (src/components/ui/mobile-edit/CustomColorPanel.tsx): react-colorful's
// picker restyled by .custom-picker-wrapper (globals.css), a hex field with a
// live swatch, and — where the browser has one — the native EyeDropper.
// data-vaul-no-drag keeps a drag on the hue strip from dismissing the sheet.

const isValidHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v)

function PipetteIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m2 22 1-1h3l9-9" />
            <path d="M3 21v-3l9-9" />
            <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
        </svg>
    )
}

export default function CustomColorPanel({
    currentColor,
    onColorChange,
}: {
    currentColor: string
    onColorChange: (color: string) => void
}) {
    const [isSupported, setIsSupported] = useState(false)
    const [hexInput, setHexInput] = useState(currentColor)
    useEffect(() => setHexInput(currentColor), [currentColor])

    useEffect(() => {
        setIsSupported(typeof window !== "undefined" && "EyeDropper" in window)
    }, [])

    // Chrome/Edge/Opera only — the same caveat create-omat carries. Elsewhere
    // the button simply isn't offered.
    const handlePipetteClick = async () => {
        if (!isSupported) return
        try {
            // @ts-expect-error - EyeDropper is a newer browser API
            const eyeDropper = new window.EyeDropper()
            const result = await eyeDropper.open()
            onColorChange(result.sRGBHex)
        } catch {
            // Picking cancelled — nothing to do.
        }
    }

    return (
        <div className="animate-in slide-in-from-right flex h-[232px] flex-col gap-2 duration-200">
            <div className="custom-picker-wrapper" data-vaul-no-drag>
                <HexColorPicker
                    color={currentColor}
                    onChange={onColorChange}
                    className="h-full w-full"
                />
            </div>

            <div className="flex w-full items-center gap-2 px-4">
                <div className="flex h-12 flex-1 items-center gap-3 rounded-lg border border-neutral-300 bg-white px-2 py-2">
                    <div
                        className="size-8 flex-shrink-0 rounded-full border border-black/5"
                        style={{ backgroundColor: currentColor }}
                    />
                    <input
                        className="w-full text-xs leading-4 font-normal uppercase outline-none"
                        value={hexInput}
                        onChange={e => {
                            // Any '#' typed anywhere is stripped, then one is
                            // put back in front — as in create-omat.
                            const value = `#${e.target.value.replace(/#/g, "")}`
                            if (value.length > 7) return // '#' + 6 hex digits, no alpha
                            setHexInput(value)
                            if (isValidHex(value)) onColorChange(value)
                        }}
                        maxLength={7}
                        pattern="^#[0-9A-Fa-f]{6}$"
                        aria-label="Hex color"
                    />
                </div>

                {isSupported && (
                    <button
                        type="button"
                        aria-label="Pick color from screen"
                        onClick={handlePipetteClick}
                        className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-neutral-300 bg-white transition-colors active:bg-neutral-50"
                    >
                        <PipetteIcon />
                    </button>
                )}
            </div>
        </div>
    )
}
