// Print-area pricing, ported from create-omat's CYO price strategy
// (src/hooks/usePriceBreakdown.ts → getPrintAreaPricesCyo).
//
// How the real thing works:
//   · The shop publishes a print-area price table. create-omat reads
//     priceStrategy.cyoProductTypeBasedPrintAreaPrices[productTypeId], falling
//     back to the ['DEFAULT'] entry.
//   · Each entry is { firstPrintAreaAmount, otherPrintAreasAmount } — the FIRST
//     decorated print area is billed at the first amount, every additional one
//     at the "other" amount, which may be cheaper.
//   · An entry may carry cyoPrintTypeBasedPrintAreaPrices, overriding both
//     amounts per print type (embroidery costs more than digital print).
//   · Configurations are deduped by print area first, so two designs on the
//     same area are billed once.
//   · Designs, uploads and texts are free under this strategy — the print area
//     is the cost driver. (The marketplace strategy inverts that: areas are
//     free and each design carries its print type's price.)
//
// The amounts below are the real published values of the CYO shop create-omat's
// own catalogue tooling points at (shop 1133169, fetched from
// api.spreadshirt.net/api/v1/shops/1133169?fullData=true):
//     DEFAULT              first 9.00  other 9.00
//     print type 46 (embroidery)  first 15.00  other 15.00
//     print type 45 (DTF neck)    first  4.00  other  3.00
// The proto has no neck area, so only the first two are modelled; the tiering is
// kept because it is the part of the logic that actually matters.

export type PrintAreaPrices = {
    firstPrintAreaAmount: number
    otherPrintAreasAmount: number
}

/** Per-technique amounts, mirroring the shop's print-type overrides. */
export const PRINT_AREA_PRICES: Record<"standard" | "embroidery", PrintAreaPrices> = {
    standard: { firstPrintAreaAmount: 9, otherPrintAreasAmount: 9 },
    embroidery: { firstPrintAreaAmount: 15, otherPrintAreasAmount: 15 },
}

/**
 * Price each decorated print area: the first at the "first" amount, the rest at
 * the "other" amount. Pass area ids already deduped and in the order they
 * should be billed — create-omat bills them in configuration order, so the
 * cheaper "other" rate lands on whatever was decorated later.
 */
export function printAreaCosts(
    areaIds: string[],
    technique: "standard" | "embroidery"
): { id: string; price: number; isFirstArea: boolean }[] {
    const prices = PRINT_AREA_PRICES[technique]
    return areaIds.map((id, index) => ({
        id,
        price: index === 0 ? prices.firstPrintAreaAmount : prices.otherPrintAreasAmount,
        isFirstArea: index === 0,
    }))
}

/** Total print-area cost for one item. */
export function printAreaTotal(areaIds: string[], technique: "standard" | "embroidery"): number {
    return printAreaCosts(areaIds, technique).reduce((sum, a) => sum + a.price, 0)
}
