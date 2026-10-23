import DesignerClient from "@/components/designer-client"

export const dynamic = "force-dynamic"

// Same designer as "/", trying a merged bottom row on desktop: one row under
// the canvas holding the zoom (horizontal now), the product views (a
// fixed-width strip, centred on the canvas, scrolling when there are more)
// and the print technique switcher, all in one style.
export default function Page() {
  return <DesignerClient mergedDesigner />
}
