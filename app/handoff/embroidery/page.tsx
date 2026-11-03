import type { Metadata } from "next"
import Embroidery from "@/components/handoff/embroidery"

export const metadata: Metadata = {
  title: "Embroidery, without dead ends · Handoff",
  description:
    "Handoff for embroidery in the designer — checked the moment it's on, every warning named, the hoop frame shown on the design, and a way out of every issue.",
}

export default function Page() {
  return <Embroidery />
}
