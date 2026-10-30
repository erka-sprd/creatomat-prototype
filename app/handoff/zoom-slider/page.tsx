import type { Metadata } from "next"
import ZoomSlider from "@/components/handoff/zoom-slider"

export const metadata: Metadata = {
  title: "Zoom slider, under control · Handoff",
  description:
    "Handoff for the desktop zoom dock — a press on the track jumps the handle, + and − step through fixed stops, and every change eases.",
}

export default function Page() {
  return <ZoomSlider />
}
