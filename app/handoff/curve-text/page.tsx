import type { Metadata } from "next"
import CurveTextHandoff from "@/components/handoff/curve-text"

export const metadata: Metadata = {
  title: "Curve text · Handoff",
  description:
    "Handoff for bending a text along a baseline — the editor bar entry, the Curve panel, and how its presets map onto img.ly's text-on-path API.",
}

export default function Page() {
  return <CurveTextHandoff />
}
