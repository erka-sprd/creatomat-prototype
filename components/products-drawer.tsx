"use client"

import { Drawer } from "vaul"

import ProductTile, { type ProductTileData } from "@/components/product-tile"

export type SelectedProduct = { id: string; src: string; name: string; appearanceId: string }

type ProductsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (product: SelectedProduct) => void
  tiles: ProductTileData[]
}

export default function ProductsDrawer({ open, onOpenChange, onSelect, tiles }: ProductsDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[9998] bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[9999] flex h-[calc(100dvh-32px)] flex-col rounded-t-2xl bg-white outline-none">
          <Drawer.Title className="sr-only">All products</Drawer.Title>
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <span className="font-display text-[16px] font-medium text-black">All products</span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              <img src="/icons/icon-close-x.svg" alt="" className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="grid grid-cols-5 gap-x-4 gap-y-6">
              {tiles.map(t => {
                const select = () => {
                  onSelect({ id: t.id, src: t.image, name: t.name, appearanceId: t.appearanceId })
                  onOpenChange(false)
                }
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={select}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        select()
                      }
                    }}
                    className="cursor-pointer text-left"
                  >
                    <ProductTile t={t} />
                  </div>
                )
              })}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
