import DesignerClient from "@/components/designer-client"

export const dynamic = "force-dynamic"

// Same designer as "/", with the first add-to-basket hypotheses variant
// enabled (desktop):
//   H1  size guide opens beside the open size dropdown, not instead of it
//   H2  live per-item price in the dropdown's sticky footer
//   H3  volume discount visible before any selection, connected to the price
//   H4  price details expand inline, reachable while the dropdown is open
export default function Page() {
  return <DesignerClient basketHypotheses />
}
