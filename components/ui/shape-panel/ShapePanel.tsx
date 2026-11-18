"use client"

import { useEffect, useRef } from "react"

import { ShapeTile } from "./ShapeTile"
import { SHAPES, SHAPES_PANEL_TITLE, type ShapeDef } from "@/lib/shapes"

type ShapePanelProps = {
  open: boolean
  onClose: () => void
  /** The selected image's shape; null when it has none. */
  currentShapeId: string | null
  onChange: (shape: ShapeDef | null) => void
}

// create-omat's desktop Shape panel — GridPanel with ShapeGrid: the left
// drawer the font panel uses, "Shapes" over a two-column grid, "No Shape"
// first, then the shapes. Picking one applies it and leaves the panel open.
export function ShapePanel({ open, onClose, currentShapeId, onChange }: ShapePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)

  // On open, centre the image's current shape in the list (ShapeGrid does the
  // same through its scrollContainer).
  useEffect(() => {
    const container = scrollRef.current
    const el = selectedRef.current
    if (!open || !container || !el) return
    const top =
      el.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      container.clientHeight / 2 +
      el.clientHeight / 2
    container.scrollTop = Math.max(0, top)
  }, [open])

  return (
    <div
      data-shape-panel="true"
      className={`absolute inset-y-[4px] left-[4px] z-40 flex w-[275px] flex-col rounded-[12px] bg-white shadow-[32px_0px_50px_0px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "-translate-x-[calc(100%+100px)]"
      }`}
    >
      <div className="flex-shrink-0 px-7 pt-6">
        <h3 className="font-display mb-6 text-lg leading-[26px] font-medium">
          {SHAPES_PANEL_TITLE}
        </h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <ShapeTile
            ref={currentShapeId === null ? selectedRef : undefined}
            variant="desktop"
            shape={null}
            isSelected={currentShapeId === null}
            onClick={() => onChange(null)}
          />
          {SHAPES.map(shape => (
            <ShapeTile
              key={shape.id}
              ref={shape.id === currentShapeId ? selectedRef : undefined}
              variant="desktop"
              shape={shape}
              isSelected={shape.id === currentShapeId}
              onClick={() => onChange(shape)}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="Close shapes panel"
        onClick={onClose}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 cursor-pointer rounded-2xl border border-neutral-200 bg-white px-0.5 py-3 hover:bg-neutral-50"
      >
        <img src="/icons/icon-chevron-left.svg" alt="" className="size-6" />
      </button>
    </div>
  )
}
