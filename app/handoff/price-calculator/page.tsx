import type { Metadata } from "next"
import PriceCalculator from "@/components/handoff/price-calculator"

export const metadata: Metadata = {
  title: "Price calculator, polished · Handoff",
  description:
    "Handoff for the volume-discount calculator and the product tiles it prices — the sale display, the quantity field, and how prices update.",
}

export default function Page() {
  return <PriceCalculator />
}
