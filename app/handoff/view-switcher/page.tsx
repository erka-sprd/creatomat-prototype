import type { Metadata } from "next"
import ViewSwitcher from "@/components/handoff/view-switcher"

export const metadata: Metadata = {
  title: "Product views, easier to explore · Handoff",
  description:
    "Handoff for the desktop views strip's label — cut into the strip, following the selected and the hovered view.",
}

export default function Page() {
  return <ViewSwitcher />
}
