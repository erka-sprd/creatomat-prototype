"use client"

/** Keyboard stepping and the benefit line, shared by the way-of-work page's pieces. */

import { useEffect, type ReactNode } from "react"

/**
 * → ↓ space enter page-down: next · ← ↑ page-up: back · home / end.
 * Ignored while typing in a field.
 */
export function useKeyNav(next: () => void, prev: () => void, first?: () => void, last?: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      if (["ArrowRight", "ArrowDown", " ", "Enter", "PageDown"].includes(e.key)) {
        e.preventDefault()
        next()
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault()
        prev()
      } else if (e.key === "Home" && first) {
        e.preventDefault()
        first()
      } else if (e.key === "End" && last) {
        e.preventDefault()
        last()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev, first, last])
}

/** One benefit line, in green. */
export function Brings({ children, shown = true, delayMs = 0 }: { children: ReactNode; shown?: boolean; delayMs?: number }) {
  return (
    <li
      className={`flex gap-3 rounded-xl bg-green-100 px-4 py-3 text-[15px] leading-[1.45] text-green-900 transition-[opacity,translate] duration-500 ease-out ${
        shown ? "opacity-100" : "translate-y-2 opacity-0"
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <span aria-hidden className="shrink-0 font-bold text-green-700">
        →
      </span>
      {children}
    </li>
  )
}
