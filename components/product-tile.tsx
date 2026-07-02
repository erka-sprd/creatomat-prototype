"use client"

import { useState, type CSSProperties, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
} from "@/components/ui/carousel"

export type ProductTileData = {
  id: string
  image: string
  /** appearance (colour) id shown as the tile preview */
  appearanceId: string
  /** model / mood images shown in the hover carousel (absolute URLs). */
  modelImages?: string[]
  price: string
  priceValue: number
  brand: string
  name: string
  colors: string[]
}

type ProductTileProps = {
  t: ProductTileData
  selected?: boolean
  quantity?: number
  topLeft?: ReactNode
  bottomCenter?: ReactNode
}

const eur = (n: number) => n.toFixed(2).replace(".", ",") + " €"

// The kit chevron SVGs are fill="black"; mask them so the shape paints in the
// button's currentColor (white on the black arrow buttons) instead.
const chevronMask = (icon: string): CSSProperties => ({
  maskImage: `url(${icon})`,
  WebkitMaskImage: `url(${icon})`,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
  maskSize: "contain",
  WebkitMaskSize: "contain",
})

// Shared product tile (kit ProductCard style): gray image area, price,
// brand + name, and a row of colour swatches (+N). Width is controlled by
// the parent so it works in both the carousel and the drawers' grids.
// Optional overlays render inside the gray image box.
export default function ProductTile({
  t,
  selected = false,
  quantity,
  topLeft,
  bottomCenter,
}: ProductTileProps) {
  const shown = t.colors.slice(0, 5)
  const extra = t.colors.length - shown.length
  const models = t.modelImages ?? []
  const [hovered, setHovered] = useState(false)
  return (
    <div className="w-full">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "group relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-neutral-100",
          selected && "border-2 border-black"
        )}
      >
        <img src={t.image} alt={t.name} className="h-full w-full object-contain" />
        {models.length > 0 && (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-200",
              hovered ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            {hovered &&
              (models.length === 1 ? (
                <img src={models[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <Carousel
                  className="h-full [&_[data-slot=carousel-content]]:h-full"
                  opts={{ loop: true }}
                >
                  <CarouselContent className="ml-0 h-full">
                    {models.map((src, i) => (
                      <CarouselItem key={i} className="h-full pl-0">
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {/* Controls layer: clicks here don't select the product. */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <CarouselPrevious className="pointer-events-auto left-2 size-10 cursor-pointer border-none bg-black text-white shadow-md hover:bg-neutral-800 hover:text-white">
                      <span
                        aria-hidden
                        className="size-6 bg-current"
                        style={chevronMask("/icons/icon-chevron-left.svg")}
                      />
                    </CarouselPrevious>
                    <CarouselNext className="pointer-events-auto right-2 size-10 cursor-pointer border-none bg-black text-white shadow-md hover:bg-neutral-800 hover:text-white">
                      <span
                        aria-hidden
                        className="size-6 bg-current"
                        style={chevronMask("/icons/icon-chevron-right.svg")}
                      />
                    </CarouselNext>
                    <CarouselDots className="pointer-events-auto" />
                  </div>
                </Carousel>
              ))}
          </div>
        )}
        {topLeft && <div className="absolute top-2 left-2 z-10">{topLeft}</div>}
        {bottomCenter && <div className="absolute inset-x-0 bottom-0 z-10">{bottomCenter}</div>}
      </div>
      <p className="mt-3 text-base font-medium text-black">
        {t.price}
        {quantity && quantity > 1 ? (
          <span className="text-neutral-400">
            {" "}
            x {quantity} = {eur(t.priceValue * quantity)}
          </span>
        ) : null}
      </p>
      <p className="mt-1.5 text-base font-bold text-black">{t.brand}</p>
      <p className="truncate text-base text-neutral-700">{t.name}</p>
      <ul className="mt-2 flex items-center gap-1">
        {shown.map((c, i) => (
          <li key={i}>
            <span
              className="block h-4 w-4 rounded-full border border-black/15"
              style={{ backgroundColor: c }}
            />
          </li>
        ))}
        {extra > 0 && <li className="ml-1 text-sm text-neutral-700">+{extra}</li>}
      </ul>
    </div>
  )
}
