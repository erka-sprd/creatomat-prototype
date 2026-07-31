"use client"

import { cn } from "@/lib/utils"

// Mirrors @sprd/sprd-component-kit v2 Switch, size="s" variant="success"
// labelPosition="left" — as used inside the toggle filter chips in
// create-omat's product-type dialog.

type KitSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

export default function KitSwitch({ checked, onChange, label, className }: KitSwitchProps) {
  return (
    <label
      className={cn(
        // The kit uses a (broken) `align-center` class here; production centers
        // the track via a `[&>span:nth-child(2)]:m-auto` override — items-center
        // achieves the same, actually vertically centering label and track.
        "inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold",
        className
      )}
    >
      <span>{label}</span>
      <span className="relative block h-4 w-[26px] shrink-0">
        <input
          className="peer sr-only"
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <span
          aria-hidden
          className={cn(
            "flex h-full items-center rounded-full bg-neutral-200 inset-ring-1 inset-ring-neutral-600 duration-200 ease-in-out peer-checked:bg-[#2EBB6E] peer-checked:inset-ring-black peer-checked:*:translate-x-[10px] motion-safe:transition-[background-color]"
          )}
        >
          <span className="block size-4 rounded-full border border-black bg-white transition-transform" />
        </span>
      </span>
    </label>
  )
}
