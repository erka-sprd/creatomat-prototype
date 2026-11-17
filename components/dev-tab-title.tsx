"use client"

// `next dev` only: the browser tab shows the page's address
// (localhost:3004/handoff/print-quality) instead of "Spreadshirt", so local
// tabs tell themselves apart. A page that sets its own title is overridden
// too: the <title> is watched, and put back to the address whenever it moves.

import { usePathname } from "next/navigation"
import { useEffect } from "react"

const addressTitle = () => `${location.host}${location.pathname}${location.search}`

export default function DevTabTitle() {
  const pathname = usePathname()

  useEffect(() => {
    const apply = () => {
      const title = addressTitle()
      if (document.title !== title) document.title = title
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.head, { subtree: true, childList: true, characterData: true })
    return () => observer.disconnect()
  }, [pathname])

  return null
}
