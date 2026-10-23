import type { Metadata } from "next"
import CanvasBottomRow from "@/components/handoff/canvas-bottom-row"

export const metadata: Metadata = {
  title: "Canvas controls, in one row · Handoff",
  description:
    "Handoff for desktop's canvas controls merged into one row — zoom, product views and print technique.",
}

export default function Page() {
  return <CanvasBottomRow />
}
