import type { Metadata } from "next"
import "../../../handoff/handoff.css"
import MobileSceneFrame from "@/components/handoff/mobile-scene-frame"

export const metadata: Metadata = {
  title: "Print-quality handoff · mobile scene",
  // Only ever shown inside the handoff, in its frame.
  robots: { index: false, follow: false },
}

/**
 * One print-quality scene's mobile version, alone on the page — for the
 * handoff's iframe, which is narrow (under 1080px), so the designer's mobile
 * components lay out as they do on a phone.
 */
export default async function Page({ params }: { params: Promise<{ scene: string }> }) {
  const { scene } = await params
  return <MobileSceneFrame scene={scene} frame="print-quality" />
}
