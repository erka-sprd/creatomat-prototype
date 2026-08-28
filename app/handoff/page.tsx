import type { Metadata } from "next"
import HandoffIndex from "@/components/handoff/handoff-index"

export const metadata: Metadata = {
  title: "Handoffs · Creatomat prototype",
  description: "Design and QA handoffs for the Creatomat prototype.",
}

export default function Page() {
  return <HandoffIndex />
}
