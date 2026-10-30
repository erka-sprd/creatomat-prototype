"use client"

/**
 * /handoff/price-calculator — the volume-discount calculator and the product
 * tiles it prices, polished: the sale display, the quantity field, and how the
 * prices update.
 *
 * Every demo is the shipping component — ProductTile, QuantityField and
 * VolumeDiscountPanel from components/ — fed real catalogue products and priced
 * by lib/volume-discount.ts. Faked: the update itself. Pricing is client-side
 * here, so the "fetch" is the same held window the product panel simulates.
 */

import { useEffect, useRef, useState } from "react"
import { buildTiles } from "product-catalog-client"
import {
  Brief,
  BriefCard,
  Demo,
  HandoffEnd,
  HandoffHeader,
  HandoffShell,
  Kicker,
  Section,
  SectionHead,
  type NavItem,
} from "@/components/handoff/handoff-ui"
import ProductTile from "@/components/product-tile"
import VolumeDiscountPanel, { QuantityField } from "@/components/product-type/volume-discount-panel"
import { AUTO_APPLY_DEBOUNCE_MS, PRICE_UPDATE_SPINNER_MS } from "@/components/products-drawer"
import { loadCatalog } from "@/lib/catalog"
import {
  VOLUME_DISCOUNT_MAX_QUANTITY,
  discountedPrice,
  majorVolumeDiscountTiersForProduct,
  tileSale,
} from "@/lib/volume-discount"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

const TSHIRT_ID = "812" // Men's Premium Organic T-Shirt — the designer's default
const HOODIE_ID = "20" // Men's Premium Organic Hoodie

const NAV: NavItem[] = [
  { id: "brief", mark: "◆", label: "Problem & Hypotheses" },
  { id: "s1", mark: "1", label: "Sale price" },
  { id: "s2", mark: "2", label: "Quantity field" },
  { id: "s3", mark: "3", label: "Updating" },
]

const eur = (n: number) => n.toFixed(2).replace(".", ",") + " €"

/* ------------------------------------------------------------------- data */

type Tile = ReturnType<typeof buildTiles>["allTiles"][number]

/** Catalogue products as the product panel tiles them, in the order asked for; empty until loaded. */
function useTiles(ids: string[]): Tile[] {
  const [tiles, setTiles] = useState<Tile[]>([])
  const key = ids.join(",")
  useEffect(() => {
    let live = true
    loadCatalog()
      .then(catalog => {
        const all = buildTiles(catalog.products).allTiles
        const found = key
          .split(",")
          .map(id => all.find(t => t.id === id))
          .filter((t): t is Tile => !!t)
        if (live) setTiles(found)
      })
      // A document should degrade, not break: the demos just stay empty.
      .catch(() => {})
    return () => {
      live = false
    }
  }, [key])
  return tiles
}

/** The tile's sale props at a quantity — the drawer's own wiring. */
function saleAt(tile: Tile, quantity: number) {
  const sale = tileSale(tile.id, quantity)
  return sale
    ? {
        price: sale.pct > 0 ? eur(discountedPrice(tile.priceValue, sale.pct)) : undefined,
        original: tile.price,
        caption: sale.caption,
      }
    : undefined
}

/* ------------------------------------------------------------------ demos */

/** One state, labelled underneath. */
function StateCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {children}
      <span className="font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
        {label}
      </span>
    </div>
  )
}

/** §2 — the quantity field, live. */
function LiveField() {
  const [quantity, setQuantity] = useState(1)
  return (
    <div className="flex w-[240px] flex-col">
      <label htmlFor="ho-pc-quantity" className="mb-2 text-sm text-black">
        Order quantity
      </label>
      <QuantityField id="ho-pc-quantity" quantity={quantity} onQuantityChange={setQuantity} />
    </div>
  )
}

/**
 * §3 — the panel and two tiles, wired as the product panel wires them: the
 * stepper value is live and takes effect AUTO_APPLY_DEBOUNCE_MS after it stops
 * changing; the button commits at once. Either way the button spins and the
 * tiles skeleton for the update's window.
 */
function UpdateFlow({ tiles }: { tiles: Tile[] }) {
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [applied, setApplied] = useState(1)
  const [updating, setUpdating] = useState(false)
  const spinTimer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (spinTimer.current !== null) window.clearTimeout(spinTimer.current)
    },
    []
  )

  const refresh = (quantity: number) => {
    setApplied(quantity)
    setUpdating(true)
    if (spinTimer.current !== null) window.clearTimeout(spinTimer.current)
    spinTimer.current = window.setTimeout(() => setUpdating(false), PRICE_UPDATE_SPINNER_MS)
  }

  useEffect(() => {
    if (orderQuantity === applied) return
    const t = window.setTimeout(() => refresh(orderQuantity), AUTO_APPLY_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
    // refresh only closes over setters and a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderQuantity, applied])

  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <VolumeDiscountPanel
        className="w-[260px] shrink-0"
        fieldId="ho-pc-panel-quantity"
        quantity={orderQuantity}
        onQuantityChange={setOrderQuantity}
        onUpdatePrices={() => refresh(orderQuantity)}
        isUpdating={updating}
      />
      <div className="flex gap-4">
        {tiles.map(t => (
          <div key={t.id} className="w-[165px]">
            <ProductTile t={t} priceLoading={updating} sale={saleAt(t, applied)} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- page */

export default function PriceCalculator() {
  const tiles = useTiles([TSHIRT_ID, HOODIE_ID])
  const tshirt = tiles[0]
  // A quantity on the product's own scale, past its first tier.
  const bulkQuantity = majorVolumeDiscountTiersForProduct(TSHIRT_ID)[1]?.from ?? 1

  return (
    <HandoffShell
      slug="price-calculator"
      items={NAV}
      links={[
        { label: "Prototype", href: PROTOTYPE },
        { label: "Repo", href: REPO },
      ]}
    >
      <HandoffHeader
        title="Price calculator, polished"
        actions={[
          { label: "See prototype", href: PROTOTYPE, live: true },
          { label: "See repo", href: REPO, ghost: true },
        ]}
      />

      {/* ----------------------------------------------------------- brief */}
      <Section id="brief" first>
        <Brief>
          <BriefCard tone="problem" label="Problem">
            <ul>
              <li>
                On a sale price the &ldquo;from&rdquo; stays black beside a red price, and the
                caption under it is too light to read.
              </li>
              <li>
                The quantity field is fiddly: no pointer on the steppers, no focus state, only the
                digits themselves are clickable, and it can&rsquo;t be cleared or drag-selected.
              </li>
              <li>
                Prices update only on a button press, with no sign that anything is happening
                while they do.
              </li>
            </ul>
          </BriefCard>
          <BriefCard tone="hypothesis" label="Hypothesis">
            We believe a field that behaves like every other input, prices that update on their
            own once the quantity settles, and a visible update make the calculator trustworthy —
            so users try quantities instead of guessing at their discount.
          </BriefCard>
          <BriefCard tone="win" label="What win looks like">
            <ul>
              <li>More quantities tried per session, and more bulk orders placed from the panel.</li>
            </ul>
          </BriefCard>
          <BriefCard tone="result" label="Result">
            Will follow.
          </BriefCard>
        </Brief>
      </Section>

      {/* -------------------------------------------------------------- §1 */}
      <Section id="s1">
        <Kicker>§1 · Sale price</Kicker>
        <SectionHead title="Sale price - red from, struck original, darker caption" />
        <p>
          On a bulk quantity &ldquo;from&rdquo; and the price go red together, the original is
          struck, and the caption sits one step darker
        </p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center gap-10">
            {tshirt && (
              <>
                <StateCell label="one product">
                  <div className="w-[180px]">
                    <ProductTile t={tshirt} />
                  </div>
                </StateCell>
                <StateCell label={`${bulkQuantity} products`}>
                  <div className="w-[180px]">
                    <ProductTile t={tshirt} sale={saleAt(tshirt, bulkQuantity)} />
                  </div>
                </StateCell>
              </>
            )}
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §2 */}
      <Section id="s2">
        <Kicker>§2 · Quantity field</Kicker>
        <SectionHead title="The quantity field behaves like an input" />
        <p>
          Pointer on the steppers, a black frame on focus, the whole area clickable and
          drag-selectable; empty or 0 falls back to 1 on blur, and the value is capped at{" "}
          {VOLUME_DISCOUNT_MAX_QUANTITY.toLocaleString("en-GB")}
        </p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <LiveField />
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §3 */}
      <Section id="s3">
        <Kicker>§3 · Updating</Kicker>
        <SectionHead title="Prices update on their own, visibly" />
        <p>
          {AUTO_APPLY_DEBOUNCE_MS / 1000} s after the quantity stops changing the prices update
          by themselves; the button updates them at once. While they do, the button spins and the
          tile prices skeleton
        </p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <UpdateFlow tiles={tiles} />
        </Demo>
      </Section>

      <HandoffEnd />
    </HandoffShell>
  )
}
