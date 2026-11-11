"use client"

// Mounts the Cmd+E edit mode in `next dev` only — loaded on the client, after
// hydration, and never part of a production page.
import dynamic from "next/dynamic"

const DevEditProvider = dynamic(() => import("./DevEditProvider"), { ssr: false })

export default function DevEditMount() {
  if (process.env.NODE_ENV !== "development") return null
  return <DevEditProvider />
}
