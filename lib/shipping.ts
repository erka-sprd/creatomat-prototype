export type ShippingId = "standard" | "premium" | "express"

// Order value from which shipping is free. create-omat keeps one of these per
// domain (FREE_SHIPPING_THRESHOLDS in src/lib/Constants.ts); the prototype only
// ever renders the German storefront, so the DE figure stands alone.
export const FREE_SHIPPING_THRESHOLD = 80

export const SHIPPING_OPTIONS: {
  id: ShippingId
  label: string
  price: number
  minDays: number
  maxDays: number
  color: string
}[] = [
  { id: "standard", label: "Standard", price: 3.99, minDays: 5, maxDays: 7, color: "text-neutral-500" },
  { id: "premium", label: "Premium", price: 7.99, minDays: 2, maxDays: 3, color: "text-indigo-500" },
  { id: "express", label: "Express", price: 15.99, minDays: 1, maxDays: 2, color: "text-green-500" },
]

// Delivery window calculated from today + min/max days. Runs client-side.
export function deliveryDateRange(minDays: number, maxDays: number): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const from = new Date()
  from.setDate(from.getDate() + minDays)
  const to = new Date()
  to.setDate(to.getDate() + maxDays)
  return from.getMonth() === to.getMonth()
    ? `${fmt(from)} – ${to.getDate()}`
    : `${fmt(from)} – ${fmt(to)}`
}
