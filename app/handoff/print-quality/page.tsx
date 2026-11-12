import type { Metadata } from "next"
import PrintQuality from "@/components/handoff/print-quality"

export const metadata: Metadata = {
  title: "Print quality: max. size · Handoff",
  description:
    "Handoff for the print-quality limit — an uploaded image stops resizing at the largest size its pixels print sharp.",
}

export default function Page() {
  return <PrintQuality />
}
