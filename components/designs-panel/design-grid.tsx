"use client"

import type { DragEvent } from "react"
import type { PanelDesign } from "@/lib/graphics-library"
import { cn } from "@/lib/utils"

// create-omat's DesignGrid and DesignCard: three columns of bordered cards on
// the light grey, a light design on the dark one. A card drags onto the
// canvas as well as placing on click.

type DesignGridProps = {
    designs: PanelDesign[]
    onPick: (design: PanelDesign) => void
    onDragStart?: (e: DragEvent, design: PanelDesign) => void
}

export function DesignGrid({ designs, onPick, onDragStart }: DesignGridProps) {
    if (designs.length === 0) return null
    return (
        <div className="grid grid-cols-3 gap-2">
            {designs.map(design => (
                <DesignCard key={design.src} design={design} onPick={onPick} onDragStart={onDragStart} />
            ))}
        </div>
    )
}

function DesignCard({
    design,
    onPick,
    onDragStart,
}: {
    design: PanelDesign
    onPick: (design: PanelDesign) => void
    onDragStart?: (e: DragEvent, design: PanelDesign) => void
}) {
    const isLight = Boolean(design.backgroundColor)
    return (
        <div
            onClick={() => onPick(design)}
            className={cn(
                "group cursor-pointer rounded-lg border p-3 transition-colors",
                isLight
                    ? "border-neutral-200 bg-neutral-900 hover:bg-black"
                    : "border-neutral-200 bg-neutral-100 hover:bg-neutral-200"
            )}
        >
            <div className="relative aspect-square w-full">
                <img
                    src={design.src}
                    alt={design.name}
                    loading="lazy"
                    draggable={!!onDragStart}
                    onDragStart={onDragStart ? e => onDragStart(e, design) : undefined}
                    className="absolute inset-0 size-full object-contain select-none"
                />
            </div>
        </div>
    )
}
