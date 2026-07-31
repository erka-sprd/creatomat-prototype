// Volume-discount model for the products drawer price calculator.
//
// Production fetches per-product discount scales from the Spreadshirt API; the
// prototype has no backend, so this reuses the prototype's established tier
// table (same tiers as designer.tsx getDiscountPercentage and the B2B price
// calculator) with integer percentages, applied uniformly to all products.

export const VOLUME_DISCOUNT_MAX_QUANTITY = 100_000

const TIERS: { minQuantity: number; percentage: number }[] = [
    { minQuantity: 100, percentage: 50 },
    { minQuantity: 60, percentage: 40 },
    { minQuantity: 40, percentage: 30 },
    { minQuantity: 20, percentage: 20 },
    { minQuantity: 5, percentage: 10 },
]

export const VOLUME_DISCOUNT_MAX_PERCENTAGE = TIERS[0].percentage

/** Integer discount percentage for an order quantity (0 when below all tiers). */
export function volumeDiscountPercentage(quantity: number): number {
    return TIERS.find(t => quantity >= t.minQuantity)?.percentage ?? 0
}

/**
 * Applies a whole-percentage discount, rounding the discount to whole cents —
 * port of create-omat's getDiscountedPrice.
 */
export function discountedPrice(price: number, percentage: number): number {
    const discount = percentage ? Math.round(price * percentage) / 100 : 0
    return price - discount
}
