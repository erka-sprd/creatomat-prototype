import type { Metadata } from "next"
import "./handoff.css"

export const metadata: Metadata = {
  title: "Handoffs · Creatomat prototype",
  description: "Design and QA handoffs for the Creatomat prototype.",
  // These are internal working documents, not shop pages.
  robots: { index: false, follow: false },
}

export default function HandoffLayout({ children }: { children: React.ReactNode }) {
  return <div className="handoff min-h-dvh px-[22px] pb-[88px]">{children}</div>
}
