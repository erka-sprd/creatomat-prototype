// Volume discounts — the single source of truth for the whole prototype.
//
// These are the REAL tiers, not invented ones. create-omat fetches them from
// GET /api/v1/shops/{shopId}/discountScales?fullData=true (see
// src/services/Shop.ts → getDiscounts, consumed by src/hooks/useDiscount.ts),
// keeps the entries with credit.value > 0 and sorts them by valueRange.from.
// The table below is that response for shop 1133169 — the CYO shop create-omat's
// own tooling points at — captured from the public API.
//
// The applicable tier is the one whose range contains the quantity (`to: null`
// means open-ended), exactly as useDiscount resolves it.

export const VOLUME_DISCOUNT_MAX_QUANTITY = 100_000

export type VolumeDiscountTier = {
    from: number
    /** Inclusive upper bound; null for the open-ended top tier. */
    to: number | null
    percentage: number
}

export const VOLUME_DISCOUNT_TIERS: VolumeDiscountTier[] = [
    { from: 5, to: 9, percentage: 10 },
    { from: 10, to: 14, percentage: 15 },
    { from: 15, to: 19, percentage: 20 },
    { from: 20, to: 24, percentage: 25 },
    { from: 25, to: 29, percentage: 30 },
    { from: 30, to: 39, percentage: 35 },
    { from: 40, to: 49, percentage: 40 },
    { from: 50, to: 99, percentage: 45 },
    { from: 100, to: 349, percentage: 50 },
    { from: 350, to: 499, percentage: 55 },
    { from: 500, to: null, percentage: 60 },
]

export const VOLUME_DISCOUNT_MIN_QUANTITY = VOLUME_DISCOUNT_TIERS[0].from
export const VOLUME_DISCOUNT_MAX_PERCENTAGE =
    VOLUME_DISCOUNT_TIERS[VOLUME_DISCOUNT_TIERS.length - 1].percentage

/** Integer discount percentage for an order quantity (0 below the first tier). */
export function volumeDiscountPercentage(quantity: number): number {
    return (
        VOLUME_DISCOUNT_TIERS.find(
            t => t.from <= quantity && (t.to ?? Infinity) >= quantity
        )?.percentage ?? 0
    )
}

/** The next tier a buyer could reach, or null once on the top one. */
export function nextVolumeDiscountTier(quantity: number): VolumeDiscountTier | null {
    return VOLUME_DISCOUNT_TIERS.find(t => t.from > quantity) ?? null
}

/**
 * The five rows create-omat shows in its volume-discount dialog: first, last and
 * three evenly spaced in between. Port of getMajorThresholds in
 * src/components/ui/volume-discount/VolumeDiscountContent.tsx — a real scale has
 * far too many tiers (this one has 11) to list them all.
 */
export function majorVolumeDiscountTiers(
    tiers: VolumeDiscountTier[] = VOLUME_DISCOUNT_TIERS
): VolumeDiscountTier[] {
    if (tiers.length <= 5) return tiers
    const step = Math.floor((tiers.length - 2) / 3)
    return [
        tiers[0],
        ...Array.from({ length: 3 }, (_, i) => tiers[1 + i * step]),
        tiers[tiers.length - 1],
    ]
}

/**
 * Applies a whole-percentage discount, rounding the discount to whole cents —
 * port of create-omat's getDiscountedPrice.
 */
export function discountedPrice(price: number, percentage: number): number {
    const discount = percentage ? Math.round(price * percentage) / 100 : 0
    return price - discount
}
