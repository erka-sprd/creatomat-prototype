"use client"

import { useEffect, useMemo, useState } from "react"
import { Drawer } from "vaul"

import type { StaticProduct } from "product-catalog-client"

import { KitButton } from "@/components/kit-button"
import { ArrowIcon, CloseIcon, DiscountIcon, FilterIcon, SortIcon } from "@/components/kit-icons"
import ProductTile, { type ProductTileData } from "@/components/product-tile"
import CategoryChipBar from "@/components/product-type/category-chip-bar"
import CategoryTree from "@/components/product-type/category-tree"
import FilterBar, { SearchField } from "@/components/product-type/filter-bar"
import MobileFilterDrawer from "@/components/product-type/mobile-filter-drawer"
import MobileProductPanel from "@/components/product-type/mobile-product-panel"
import MobileSortDrawer from "@/components/product-type/mobile-sort-drawer"
import MobileVolumeDiscountDrawer from "@/components/product-type/mobile-volume-discount-drawer"
import VolumeDiscountPanel from "@/components/product-type/volume-discount-panel"
import { useDlgMobile } from "@/hooks/use-dlg-mobile"
import { useProductFilters } from "@/hooks/use-product-filters"
import { findCategory, type CategoryNode } from "@/lib/assortment"
import {
  VOLUME_DISCOUNT_MAX_PERCENTAGE,
  discountedPrice,
  volumeDiscountPercentage,
} from "@/lib/volume-discount"

const eur = (n: number) => n.toFixed(2).replace(".", ",") + " €"

// Per production: auto-apply the stepper 1s after it stops changing; hold the
// button spinner for at least 300ms so the (client-side) update is noticeable.
const AUTO_APPLY_DEBOUNCE_MS = 1000
const PRICE_UPDATE_SPINNER_MS = 300

/** ids from the root down to `id` (inclusive), or [] when not found */
function pathTo(nodes: CategoryNode[], id: string): string[] {
  for (const node of nodes) {
    if (node.id === id) return [node.id]
    const childPath = node.children ? pathTo(node.children, id) : []
    if (childPath.length) return [node.id, ...childPath]
  }
  return []
}

export type SelectedProduct = { id: string; src: string; name: string; appearanceId: string }

type ProductsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (product: SelectedProduct) => void
  tiles: ProductTileData[]
  /** raw catalogue — categories and filters are derived from it */
  products: StaticProduct[]
}

export default function ProductsDrawer({
  open,
  onOpenChange,
  onSelect,
  tiles,
  products,
}: ProductsDrawerProps) {
  const isMobile = useDlgMobile()
  const filters = useProductFilters(products)

  // Mobile second-level drawers (filter accordion, sort, price calculator).
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [volumeDiscountOpen, setVolumeDiscountOpen] = useState(false)

  // Mobile chip bar shows top-level categories, or the selected category's
  // children; the header back arrow walks one level up (like production).
  const chipCategories = (
    filters.selectedCategoryId
      ? (findCategory(filters.categoryTree, filters.selectedCategoryId)?.children ?? [])
      : filters.categoryTree
  ).map(c => ({ id: c.id, label: c.label, disabled: filters.isCategoryDisabled(c) }))

  const handleCategoryBack = () => {
    if (!filters.selectedCategoryId) return
    const path = pathTo(filters.categoryTree, filters.selectedCategoryId)
    filters.setSelectedCategoryId(path.length > 1 ? path[path.length - 2] : undefined)
  }

  // Price calculator (production's orderQuantity/appliedQuantity split): the
  // stepper value is live and auto-applies 1s after it stops changing on
  // desktop; the "Update prices" button commits instantly.
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [appliedQuantity, setAppliedQuantity] = useState(1)
  useEffect(() => {
    if (isMobile) return
    const t = setTimeout(() => setAppliedQuantity(orderQuantity), AUTO_APPLY_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [orderQuantity, isMobile])

  // Reset the calculator when the drawer closes, like production.
  useEffect(() => {
    if (!open) {
      setOrderQuantity(1)
      setAppliedQuantity(1)
    }
  }, [open])

  // Production shows a spinner while the discount fetch runs (held ≥300ms).
  // Pricing is client-side here, so simulate that window per applied change.
  const [isPriceUpdating, setIsPriceUpdating] = useState(false)
  useEffect(() => {
    if (appliedQuantity <= 1) return
    setIsPriceUpdating(true)
    const t = setTimeout(() => setIsPriceUpdating(false), PRICE_UPDATE_SPINNER_MS)
    return () => clearTimeout(t)
  }, [appliedQuantity])

  const discountPct = appliedQuantity > 1 ? volumeDiscountPercentage(appliedQuantity) : 0

  // Category + filters narrow the id set; "Most popular" keeps the curated
  // tile order, the price sorts reorder by tile price. Each tile also gets
  // per-colour swatches from the raw catalogue so hovering a swatch previews
  // that colour (production's onAppearanceHover).
  const visibleTiles = useMemo(() => {
    const productById = new Map(products.map(p => [p.id, p]))
    const idSet = new Set(filters.filteredIds)
    const list = tiles
      .filter(t => idSet.has(t.id))
      .map(t => {
        const swatches = productById
          .get(t.id)
          ?.appearances.map(a => ({ color: a.color, image: a.image }))
        return swatches?.length ? { ...t, swatches } : t
      })
    if (filters.sortId === "price") return [...list].sort((a, b) => a.priceValue - b.priceValue)
    if (filters.sortId === "priceReverse")
      return [...list].sort((a, b) => b.priceValue - a.priceValue)
    return list
  }, [tiles, products, filters.filteredIds, filters.sortId])

  const title = filters.selectedCategory?.label ?? "All products"

  // Sale display per production: caption whenever a bulk quantity is applied;
  // red discounted price + struck original only when a tier is reached.
  const sale =
    appliedQuantity > 1
      ? {
          caption: `Estimated price per item for ${appliedQuantity} products`,
          pct: discountPct,
        }
      : undefined

  const tileButton = (t: ProductTileData) => {
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
        <ProductTile
          t={t}
          priceLoading={isPriceUpdating}
          sale={
            sale
              ? {
                  price: sale.pct > 0 ? eur(discountedPrice(t.priceValue, sale.pct)) : undefined,
                  original: t.price,
                  caption: sale.caption,
                }
              : undefined
          }
        />
      </div>
    )
  }

  const emptyState = (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="font-display text-[16px] font-medium text-black">No products found</p>
      <p className="text-sm text-neutral-600">
        Nothing matches your search or filters. Try removing some of them.
      </p>
      <KitButton variant="primary" className="mt-1" onClick={filters.resetFilters}>
        Reset filters
      </KitButton>
    </div>
  )

  return (
    <>
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        {/* Overlay + height per create-omat: kit Drawer overlay is bg-black/80;
            content is h-full capped at calc(100% - 96px) — the kit's mt-24
            default, as on live create-omat. (develop recently switched to 32px
            in DEV-230457; flip the 96px below when that ships.) */}
        <Drawer.Overlay className="fixed inset-0 z-[9998] bg-black/80" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[9999] flex h-full max-h-[calc(100%-96px)] flex-col rounded-t-2xl border border-gray-200 bg-white outline-none">
          <Drawer.Title className="sr-only">All products</Drawer.Title>
          {isMobile ? (
            // Mobile (<1080px), per create-omat's MobileProductTypeDrawer:
            // back-arrow header, search, category chips, filter/sort buttons
            // (opening second-level drawers) and the filtered 2-col grid.
            <>
              <div className="flex items-center justify-between py-1 pr-1.5 pl-4">
                <div className="flex min-h-11 items-center gap-2">
                  {filters.selectedCategoryId && (
                    <button
                      type="button"
                      aria-label="Back"
                      onClick={handleCategoryBack}
                      className="flex cursor-pointer items-center"
                    >
                      <ArrowIcon className="size-5 rotate-180" />
                    </button>
                  )}
                  {/* Kit Drawer titles render in the display font (font-made). */}
                  <span className="font-display text-base font-bold text-black">{title}</span>
                  <span className="font-sans text-sm text-neutral-700">
                    ({visibleTiles.length})
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer p-2.5"
                >
                  <img src="/icons/icon-close-x.svg" alt="" className="h-6 w-6" />
                </button>
              </div>
              <MobileProductPanel
                search={
                  <SearchField value={filters.searchQuery} onChange={filters.setSearchQuery} />
                }
                categories={
                  chipCategories.length > 0 ? (
                    <CategoryChipBar
                      categories={chipCategories}
                      selectedId={filters.selectedCategoryId}
                      onSelect={filters.setSelectedCategoryId}
                    />
                  ) : null
                }
                volumeDiscountBtn={
                  <KitButton
                    variant="plain"
                    // Icon inherits the button's text colour, so it picks up the
                    // same discount red as the label.
                    startIcon={<DiscountIcon className="size-5" />}
                    onClick={() => setVolumeDiscountOpen(true)}
                    // Same discount red as the panel it opens.
                    className="w-full rounded-full bg-[#FFEEEB] text-sm text-[#DC2626]"
                  >
                    Calculate volume discount
                  </KitButton>
                }
                filterBtn={
                  <KitButton
                    variant="plain"
                    startIcon={<FilterIcon className="size-6" />}
                    onClick={() => setFilterOpen(true)}
                    className="flex items-center gap-1.5 px-0 text-sm"
                  >
                    Filters
                    {filters.activeFilterCount > 0 && (
                      <span className="flex items-center justify-center bg-black px-2 py-1 text-xs font-bold text-white">
                        {filters.activeFilterCount}
                      </span>
                    )}
                  </KitButton>
                }
                sortBtn={
                  <KitButton
                    variant="plain"
                    startIcon={<SortIcon className="size-5" />}
                    onClick={() => setSortOpen(true)}
                    className="flex items-center gap-1.5 px-0 text-sm"
                  >
                    Sort by
                  </KitButton>
                }
                productList={
                  visibleTiles.length === 0 ? (
                    emptyState
                  ) : (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                      {visibleTiles.map(tileButton)}
                    </div>
                  )
                }
              />
            </>
          ) : (
            // Desktop, per create-omat: no header row at all — a floating close
            // button (kit Drawer spec: top-6 right-7, p-2.5, 24px icon) and the
            // DesktopProductTypePanel grid with its own pt-8.
            <>
              <button
                type="button"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
                className="absolute top-6 right-7 z-10 cursor-pointer p-2.5 hover:text-neutral-800"
              >
                <CloseIcon className="size-6" />
              </button>
              {/* Column logic per create-omat: outer 5 cols (6 at ≥1920px, sidebar
                  always 1), product grid 4 cols → 5 at ≥1920px. NOTE: the kit
                  preset redefines xl=1920px in create-omat, so its xl: classes
                  translate to min-[1920px]: here (this proto keeps Tailwind
                  defaults, where xl would be 1280px). */}
              <div className="grid min-h-0 flex-1 grid-cols-5 gap-6 px-10 pt-8 min-[1920px]:grid-cols-6">
              <aside className="col-span-1 overflow-y-auto pb-6">
                <div className="mb-9">
                  <VolumeDiscountPanel
                    quantity={orderQuantity}
                    onQuantityChange={setOrderQuantity}
                    // Only block the button while the value on screen is the one
                    // being applied; a newer value stays committable mid-update.
                    isUpdating={isPriceUpdating && orderQuantity === appliedQuantity}
                    onUpdatePrices={() => setAppliedQuantity(orderQuantity)}
                  />
                </div>
                <CategoryTree
                  tree={filters.categoryTree}
                  selectedId={filters.selectedCategoryId}
                  onSelect={filters.setSelectedCategoryId}
                  isDisabled={filters.isCategoryDisabled}
                />
              </aside>
              <section className="col-span-4 flex min-h-0 flex-col min-[1920px]:col-span-5">
                {/* Title per production: display font, medium, base size; count
                    in Inter, sm, neutral-700. */}
                <h2 className="font-display shrink-0 pl-px text-base font-medium text-black">
                  {title}{" "}
                  <span className="font-sans text-sm text-neutral-700">
                    ({visibleTiles.length})
                  </span>
                </h2>
                <div className="min-h-0 flex-1 overflow-y-auto pt-4">
                  <FilterBar filters={filters} />
                  {visibleTiles.length === 0 ? (
                    emptyState
                  ) : (
                    <div className="grid grid-cols-4 gap-x-4 gap-y-6 pb-6 min-[1920px]:grid-cols-5">
                      {visibleTiles.map(tileButton)}
                    </div>
                  )}
                </div>
              </section>
              </div>
            </>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>

    {/* Mobile second-level drawers — siblings of the main drawer, like
        production renders MobileFilterDrawer/MobileSortDrawer. */}
    {isMobile && (
      <>
        <MobileFilterDrawer open={filterOpen} onOpenChange={setFilterOpen} filters={filters} />
        <MobileSortDrawer
          open={sortOpen}
          onOpenChange={setSortOpen}
          selectedSortId={filters.sortId}
          onSortChange={filters.setSortId}
        />
        <MobileVolumeDiscountDrawer
          open={volumeDiscountOpen}
          onOpenChange={next => {
            setVolumeDiscountOpen(next)
            // Like production: the picked quantity applies when the drawer
            // closes (both via "Update prices" and swipe/X dismiss).
            if (!next) setAppliedQuantity(orderQuantity)
          }}
          quantity={orderQuantity}
          onQuantityChange={setOrderQuantity}
          maxDiscountPercentage={VOLUME_DISCOUNT_MAX_PERCENTAGE}
        />
      </>
    )}
    </>
  )
}
