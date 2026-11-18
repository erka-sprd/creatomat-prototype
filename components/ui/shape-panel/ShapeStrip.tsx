"use client"

import { useEffect, useRef } from "react"

import { ShapeTile } from "./ShapeTile"
import { SHAPES, type ShapeDef } from "@/lib/shapes"

type ShapeStripProps = {
  currentShapeId: string | null
  onChange: (shape: ShapeDef | null) => void
}

// create-omat's mobile ShapePanel (MobileEditDrawer → Shapes): one horizontal
// strip of 96 × 120px tiles, "No Shape" first, the current shape scrolled into
// the middle when the tab opens.
export function ShapeStrip({ currentShapeId, onChange }: ShapeStripProps) {
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "instant",
      block: "nearest",
      inline: "center",
    })
    // Only on mount: picking a shape shouldn't jump the strip under the finger.
  }, [])

  return (
    <div className="no-scrollbar flex w-full items-center overflow-x-auto py-1">
      <div className="flex w-max shrink-0 items-center gap-3 px-4">
        <ShapeTile
          ref={currentShapeId === null ? selectedRef : undefined}
          variant="mobile"
          shape={null}
          isSelected={currentShapeId === null}
          onClick={() => onChange(null)}
        />
        {SHAPES.map(shape => (
          <ShapeTile
            key={shape.id}
            ref={shape.id === currentShapeId ? selectedRef : undefined}
            variant="mobile"
            shape={shape}
            isSelected={shape.id === currentShapeId}
            onClick={() => onChange(shape)}
          />
        ))}
      </div>
    </div>
  )
}
