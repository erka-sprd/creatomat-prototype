"use client"

/**
 * §5's breakdown demo: the rail's price row with its popover held open, and a
 * button that puts the old and new panels side by side over the whole page —
 * the comparison needs more width than the document column has.
 */

import { useState } from "react"
import {
  COMPARE_ORDER,
  PriceDetailsCompare,
} from "@/components/handoff/price-details-compare"
import {
  BOTH_PRINT_AREAS,
  EXCLUSIVE_DESIGN_PRICE,
  LiveRail,
} from "@/components/handoff/rail-replica"
import { ScopedDialog, ScopedDialogClose, ScopedDialogTitle } from "@/components/ui/scoped-dialog"

export function PriceDetailsDemo() {
  const [compareOpen, setCompareOpen] = useState(false)

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => setCompareOpen(true)}
        className="mb-8 cursor-pointer rounded-full border border-[var(--ho-line)] bg-[var(--ho-ground)] px-4 py-2 font-[family-name:var(--ho-mono)] text-[13px] font-bold text-[var(--ho-thread-ink)] transition-colors hover:border-[var(--ho-thread-ink)]"
      >
        Compare with the old version
      </button>

      {/* The full column, as tall as the one at the top of the page. The
          popover's collision boundary is the rail, so it resolves inside it and
          holds its place as the page scrolls instead of shifting against a
          viewport edge — the same boundary the designer gives it. */}
      {/* Read, not operated — only the compare button above it responds. */}
      <div className="select-none [&_*]:pointer-events-none">
        <LiveRail
          decorated
          areaIds={BOTH_PRINT_AREAS}
          designCost={EXCLUSIVE_DESIGN_PRICE}
          initialQuantities={COMPARE_ORDER}
          // Closed while the comparison is up: the popover carries z-[9999] so
          // it would otherwise paint straight over the dialog.
          detailsOpen={!compareOpen}
        />
      </div>

      <ScopedDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        // Light grey ground, so the two white panels read as cards on it.
        className="flex max-h-[92%] w-auto max-w-[96%] flex-col overflow-auto rounded-2xl bg-[var(--sprd-neutral-100)] p-8 shadow-xl"
      >
        <div className="mb-6 flex items-start justify-between gap-6">
          <ScopedDialogTitle className="text-[20px] font-[640] tracking-[-0.015em] text-[var(--ho-ink)]">
            Price breakdown — old vs new
          </ScopedDialogTitle>
          <ScopedDialogClose
            aria-label="Close"
            className="shrink-0 cursor-pointer text-[26px] leading-none text-[var(--ho-muted)] outline-none hover:text-[var(--ho-ink)]"
          >
            ×
          </ScopedDialogClose>
        </div>
        <PriceDetailsCompare />
      </ScopedDialog>
    </div>
  )
}
