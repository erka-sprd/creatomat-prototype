"use client"

import { forwardRef } from "react"

import { CloseIcon } from "@/components/kit-icons"
import { NO_SHAPE_LABEL, shapeThumbStyle, type ShapeDef } from "@/lib/shapes"

type ShapeTileProps = {
  /** null is the "No Shape" tile. */
  shape: ShapeDef | null
  isSelected: boolean
  onClick: () => void
  /**
   * desktop — create-omat's ShapeButton: fills its grid cell, ≥116px tall, 64px
   *           silhouette, 50px cross.
   * mobile  — its mobile ShapePanel tile: 96 × 120px, 56px silhouette, 36px
   *           cross, the label in a fixed two-line slot.
   */
  variant: "desktop" | "mobile"
}

// One tile of the Shape panels: the shape's silhouette in neutral-700 on a
// neutral-100 card, a black border when it's the image's shape, the name under it.
export const ShapeTile = forwardRef<HTMLDivElement, ShapeTileProps>(
  ({ shape, isSelected, onClick, variant }, ref) => {
    const label = shape?.label ?? NO_SHAPE_LABEL
    const mobile = variant === "mobile"
    return (
      <div
        ref={ref}
        className={
          mobile ? "flex shrink-0 flex-col items-center gap-2" : "flex flex-col items-center"
        }
      >
        <button
          type="button"
          title={label}
          onClick={onClick}
          className={`flex cursor-pointer items-center justify-center rounded-xs border-2 bg-neutral-100 bg-clip-padding transition ${
            mobile ? "h-[120px] w-[96px]" : "min-h-[116px] w-full"
          } ${isSelected ? "border-black" : "border-transparent hover:bg-neutral-150"}`}
        >
          {shape ? (
            <span
              aria-hidden="true"
              className={`block bg-neutral-700 ${mobile ? "size-14" : "size-16"}`}
              style={shapeThumbStyle(shape)}
            />
          ) : (
            <CloseIcon className={mobile ? "size-9" : "size-[50px]"} />
          )}
        </button>
        <span
          className={`line-clamp-2 text-center text-xs ${
            mobile ? "h-8 w-[96px]" : "mt-2 w-full"
          } ${isSelected ? "font-semibold text-black" : "text-neutral-600"}`}
        >
          {label}
        </span>
      </div>
    )
  }
)
ShapeTile.displayName = "ShapeTile"
