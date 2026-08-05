"use client"

import {
  ScopedDialog,
  ScopedDialogClose,
  ScopedDialogTitle,
} from "@/components/ui/scoped-dialog"

import { majorVolumeDiscountTiers } from "@/lib/volume-discount"

// The real scale is 11 tiers deep, so — like create-omat's
// VolumeDiscountContent — show the five major thresholds rather than all of them.
const TIERS = majorVolumeDiscountTiers()

export default function VolumeDiscountDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <ScopedDialog
      open={open}
      onOpenChange={onOpenChange}
      overlayClassName="rounded-[12px]"
      className="flex max-h-[80%] w-[480px] max-w-[90%] flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-xl"
    >
      <div className="flex items-start justify-between gap-4 p-[24px] pb-[16px]">
        <ScopedDialogTitle className="font-display text-[18px] leading-tight font-[800] text-black">
          Our volume discount
        </ScopedDialogTitle>
        <ScopedDialogClose
          aria-label="Close"
          className="shrink-0 cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
        >
          <img src="/icons/icon-close-x.svg" alt="" className="h-6 w-6" />
        </ScopedDialogClose>
      </div>

      <div className="overflow-y-auto px-[24px] pb-[24px]">
        <div className="border border-neutral-200">
          {TIERS.map(t => (
            <div
              key={t.from}
              className="border-b border-neutral-200 py-4 text-center text-base last:border-b-0"
            >
              <span className="font-bold text-black">{t.from}+ products</span>
              <span className="font-bold text-[#DC2626]"> −{t.percentage}% off</span>
            </div>
          ))}
        </div>
      </div>
    </ScopedDialog>
  )
}
