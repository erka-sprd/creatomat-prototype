import type { Metadata } from "next"
import BulkPurchaseRework from "@/components/handoff/bulk-purchase-rework"

export const metadata: Metadata = {
  title: "The purchase rail, reworked · Handoff",
  description:
    "Handoff for the designer's right rail — one-line title, stock signals, size & basket row, discount link and price details.",
}

export default function Page() {
  return <BulkPurchaseRework />
}
