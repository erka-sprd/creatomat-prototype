import type { Metadata } from "next"
import EmbPreviewTest from "@/components/handoff/emb-preview-test"

export const metadata: Metadata = {
  title: "Embroidery preview tuning · Handoff",
  description:
    "Every design from the Graphics panel rendered by the embroidery shader, with its knobs and a copy button for the configuration.",
}

export default function Page() {
  return <EmbPreviewTest />
}
