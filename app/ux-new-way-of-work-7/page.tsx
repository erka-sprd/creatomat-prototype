import type { Metadata } from "next"
import EmbroideryBuild from "@/components/way-of-work/embroidery-build"
import "../handoff/handoff.css"

export const metadata: Metadata = {
  title: "UX — building together · embroidery",
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <div className="handoff">
      <EmbroideryBuild />
    </div>
  )
}
