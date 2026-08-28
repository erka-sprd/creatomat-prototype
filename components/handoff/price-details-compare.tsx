"use client"

/**
 * §5 — the price breakdown, create-omat's version beside the prototype's.
 *
 * The left panel is a faithful replica of create-omat's CyoPriceDetails
 * (src/components/ui/price-details/*): Your Product, Printing Costs with its
 * help link, then Design Prices listing every design, upload and text — free
 * ones included.
 *
 * The right panel is the prototype's own PriceDetails, the same component the
 * rail's popover renders, so the comparison cannot drift from the thing it is
 * comparing.
 *
 * NOTE — the exclusive-design row is a proposal, not shipped code: the
 * prototype prices no designs, so EXCLUSIVE_DESIGN_PRICE is illustrative.
 * Everything else is computed by the app's own pricing code.
 */

import {
  BOTH_PRINT_AREAS,
  DESIGN_THUMBNAIL,
  EXCLUSIVE_DESIGN_PRICE,
  PriceDetails,
  usePolo,
} from "@/components/handoff/rail-replica"
import { printAreaCosts } from "@/lib/print-area-pricing"
import { discountedPrice, volumeDiscountPercentage } from "@/lib/volume-discount"

/** The order both panels are priced on — and the one the rail starts with. */
export const COMPARE_ORDER = { M: 5, L: 8 }
export const COMPARE_QUANTITY = Object.values(COMPARE_ORDER).reduce((sum, n) => sum + n, 0)

const fmt = (n: number) => n.toFixed(2).replace(".", ",")
const eur = (n: number) => `${fmt(n)} €`

/** A panel under its own label, so the pair reads as a comparison. */
function Labelled({
  label,
  tone,
  children,
}: {
  label: string
  tone: "old" | "new"
  children: React.ReactNode
}) {
  return (
    <div className="flex w-[420px] shrink-0 flex-col gap-2">
      <span
        className={`self-start rounded-full px-3 py-1 font-[family-name:var(--ho-mono)] text-[12px] font-bold ${
          tone === "old"
            ? "bg-[var(--ho-ground)] text-[var(--ho-muted)]"
            : "bg-[var(--ho-thread-soft)] text-[var(--ho-thread-ink)]"
        }`}
      >
        {label}
      </span>
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">{children}</div>
    </div>
  )
}

/** create-omat's PriceDetailRow. */
function OldRow({
  label,
  price,
  chip,
}: {
  label: string
  price: number
  chip?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {chip}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm">{price === 0 ? "Free" : eur(price)}</span>
    </div>
  )
}

/** create-omat's design chip: the artwork on a blue ground, 24px. */
const DesignChip = ({ src }: { src?: string }) => (
  <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs">
    {src ? <img src={src} alt="" className="h-6 w-6 rounded object-contain" /> : "🎨"}
  </div>
)

export function PriceDetailsCompare() {
  const polo = usePolo()
  const thumb = polo.latte?.image

  // Front and back both decorated, so the comparison has two printing rows.
  const areas = printAreaCosts(BOTH_PRINT_AREAS, "standard")
  const printing = areas.reduce((sum, a) => sum + a.price, 0)
  const unit = polo.price + printing + EXCLUSIVE_DESIGN_PRICE
  const percent = volumeDiscountPercentage(COMPARE_QUANTITY, polo.id)
  const unitDiscounted = discountedPrice(unit, percent)
  const total = unit * COMPARE_QUANTITY
  const totalDiscounted = discountedPrice(total, percent)
  const areaRows = areas.map((a, i) => ({
    id: a.id,
    name: i === 0 ? "Front" : "Back",
    price: a.price,
  }))

  return (
    <div className="flex w-max items-start gap-4">
      {/* ----------------------------------------------------------- old */}
      <Labelled label="OLD · create-omat" tone="old">
        <div className="flex flex-col">
          <div className="flex-1">
            <div className="border-b border-neutral-200">
              <div className="px-10 pt-6 pb-4">
                <p className="mb-2 text-sm font-semibold">Your Product</p>
                <div className="flex gap-3">
                  <div className="flex h-20 w-20 shrink-0 items-start rounded-md bg-[#F2F2F2] p-1 shadow-[0_1px_1px_0_rgba(37,33,31,0.05)]">
                    {thumb && (
                      <img
                        src={thumb}
                        alt=""
                        width={80}
                        className="flex-1 self-stretch object-contain"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 items-center gap-[36px] self-stretch">
                    <p className="flex-1 text-sm">{polo.name}</p>
                    <span className="text-sm">{eur(polo.price)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-neutral-200 px-10 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Printing Costs</p>
                <span className="text-sm text-gray-500">Calculated per print area</span>
              </div>
              <div className="mb-2">
                <span className="cursor-pointer text-sm leading-5 underline underline-offset-auto">
                  Learn More
                </span>
              </div>
              <div className="space-y-1">
                {areaRows.map(a => (
                  <OldRow key={a.id} label={a.name} price={a.price} />
                ))}
              </div>
            </div>

            {/* Every design, upload and text — free ones included. */}
            <div className="px-10 py-4">
              <p className="mb-2 text-sm font-semibold">Design Prices</p>
              <div className="space-y-2">
                <OldRow
                  label="Exclusive Design"
                  price={EXCLUSIVE_DESIGN_PRICE}
                  chip={<DesignChip src={DESIGN_THUMBNAIL} />}
                />
                <OldRow label="Uploaded Image" price={0} chip={<DesignChip />} />
                <OldRow
                  label="Text: Team 2026"
                  price={0}
                  chip={
                    <span className="flex h-6 w-6 items-center justify-center text-[13px] font-bold">
                      T
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 px-10 pt-6 pb-2 shadow-[0_-4px_8px_0_rgba(37,33,31,0.05)]">
            <div className="flex items-center justify-between text-sm">
              <p>Single item</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-neutral-700 line-through">{eur(unit)}</span>
                <span className="pr-1">{eur(unitDiscounted)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-black">
                Total price ({COMPARE_QUANTITY} items)
              </p>
              <span className="flex items-center justify-between gap-2">
                <span className="text-lg text-neutral-700 line-through">{eur(total)}</span>
                <span className="flex rounded-xs bg-red-600 px-1 py-0.5 text-sm text-white">
                  %{percent}
                </span>
                <span className="pr-1 text-lg font-semibold text-red-600">
                  {eur(totalDiscounted)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </Labelled>

      {/* ----------------------------------------------------------- new */}
      <Labelled label="NEW" tone="new">
        <div className="pt-6">
          <PriceDetails
            polo={polo}
            quantity={COMPARE_QUANTITY}
            areaIds={BOTH_PRINT_AREAS}
            designCost={EXCLUSIVE_DESIGN_PRICE}
          />
        </div>
      </Labelled>
    </div>
  )
}
