"use client"

import { forwardRef } from "react"

import { CloseIcon } from "@/components/kit-icons"
import { NO_EFFECT_LABEL, type EffectDef } from "@/lib/effects"

type EffectTileProps = {
  /** null is the "No Effect" tile. */
  effect: EffectDef | null
  isSelected: boolean
  onClick: () => void
  /**
   * desktop — create-omat's EffectsButton: fills its grid cell, ≥116px tall.
   * mobile  — its mobile EffectsPanel tile: 96 × 120px, the label in a fixed
   *           two-line slot.
   */
  variant: "desktop" | "mobile"
  /**
   * Mobile only: the picked tile shows a black sliders button over its
   * thumbnail (popping in), which opens the effect's controls.
   */
  onShowControls?: () => void
}

// create-omat's sliders glyph (the kit's Filter icon).
function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 7H11.1707C11.5825 8.16519 12.6938 9 14 9C15.3062 9 16.4175 8.16519 16.8293 7H20L20.1166 6.99327C20.614 6.93551 21 6.51284 21 6C21 5.44772 20.5523 5 20 5H16.8293C16.4175 3.83481 15.3062 3 14 3C12.6938 3 11.5825 3.83481 11.1707 5H4L3.88338 5.00673C3.38604 5.06449 3 5.48716 3 6C3 6.55228 3.44772 7 4 7ZM15 6C15 5.44772 14.5523 5 14 5C13.4477 5 13 5.44772 13 6C13 6.55228 13.4477 7 14 7C14.5523 7 15 6.55228 15 6ZM5.17071 11C5.58254 9.83481 6.69378 9 8 9C9.30622 9 10.4175 9.83481 10.8293 11H20C20.5523 11 21 11.4477 21 12C21 12.5128 20.614 12.9355 20.1166 12.9933L20 13H10.8293C10.4175 14.1652 9.30622 15 8 15C6.69378 15 5.58254 14.1652 5.17071 13H4C3.44772 13 3 12.5523 3 12C3 11.4872 3.38604 11.0645 3.88338 11.0067L4 11H5.17071ZM8 11C8.55228 11 9 11.4477 9 12C9 12.5523 8.55228 13 8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11ZM17 15C15.6938 15 14.5825 15.8348 14.1707 17H4L3.88338 17.0067C3.38604 17.0645 3 17.4872 3 18C3 18.5523 3.44772 19 4 19H14.1707C14.5825 20.1652 15.6938 21 17 21C18.3062 21 19.4175 20.1652 19.8293 19H20L20.1166 18.9933C20.614 18.9355 21 18.5128 21 18C21 17.4477 20.5523 17 20 17H19.8293C19.4175 15.8348 18.3062 15 17 15ZM18 18C18 17.4477 17.5523 17 17 17C16.4477 17 16 17.4477 16 18C16 18.5523 16.4477 19 17 19C17.5523 19 18 18.5523 18 18Z"
        fill="currentColor"
      />
    </svg>
  )
}

// One tile of the Effects panels: the effect's thumbnail on a neutral-100 card,
// a black border when it's the image's effect, the name under it.
export const EffectTile = forwardRef<HTMLDivElement, EffectTileProps>(
  ({ effect, isSelected, onClick, variant, onShowControls }, ref) => {
    const label = effect?.label ?? NO_EFFECT_LABEL
    const mobile = variant === "mobile"
    const showControlsButton = mobile && isSelected && !!effect?.params.length && !!onShowControls
    return (
      <div
        ref={ref}
        className={
          mobile ? "flex shrink-0 flex-col items-center gap-2" : "flex flex-col items-center"
        }
      >
        <div className={mobile ? "relative h-[120px] w-[96px]" : "relative w-full"}>
          <button
            type="button"
            title={label}
            onClick={onClick}
            className={`flex cursor-pointer items-center justify-center rounded-xs border-2 bg-neutral-100 bg-clip-padding p-1.5 transition ${
              mobile ? "h-full w-full" : "min-h-[116px] w-full"
            } ${isSelected ? "border-black" : "border-transparent hover:bg-neutral-150"}`}
          >
            {effect ? (
              <span className={`relative block ${mobile ? "h-full w-full" : "h-[100px] w-full"}`}>
                <img
                  src={effect.thumbnail}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </span>
            ) : (
              <CloseIcon className={mobile ? "size-9" : "size-[50px]"} />
            )}
          </button>
          {showControlsButton && (
            <button
              type="button"
              aria-label={`${label} settings`}
              onClick={e => {
                e.stopPropagation()
                onShowControls?.()
              }}
              className="animate-effect-controls absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md bg-black text-white"
            >
              <SlidersIcon />
            </button>
          )}
        </div>
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
EffectTile.displayName = "EffectTile"
