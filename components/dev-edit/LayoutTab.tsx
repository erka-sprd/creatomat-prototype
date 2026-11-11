"use client"

// The edit mode's Layout tab: per alignment property, the class the element
// has in code and the options to try — a click previews it live (the
// provider sets it inline). "Center both" does flex + justify + items at once.
import {
  CENTER_BOTH,
  LAYOUT_GROUPS,
  type LayoutGroupId,
  type LayoutOption,
  layoutClassesOf,
} from "@/lib/dev-edit/layout-options"

// justify / items only take effect on a flex or grid container.
const CONTAINER_GROUPS: LayoutGroupId[] = ["direction", "justify", "items"]

export default function LayoutTab({
  classes,
  display,
  picked,
  onPick,
}: {
  classes: string[]
  // The element's display as rendered (with any preview applied).
  display: string
  picked: Partial<Record<LayoutGroupId, LayoutOption>>
  onPick: (group: LayoutGroupId, className: string) => void
}) {
  const isContainer = /flex|grid/.test(display)
  return (
    // Groups 20px apart, each label 8px over its options.
    <div className="flex max-h-[380px] flex-col gap-5 overflow-y-auto">
      <button
        type="button"
        onClick={() => CENTER_BOTH.forEach(({ group, className }) => onPick(group, className))}
        className="rounded-md border border-[#00FF9C]/40 px-3 py-2 font-semibold tracking-[0.08em] text-[#00FF9C] uppercase hover:bg-[#00FF9C]/10"
      >
        ⊕ Center both axes
      </button>

      {LAYOUT_GROUPS.map(group => {
        const inCode = layoutClassesOf(classes, group)
        const pick = picked[group.id]
        const inert = CONTAINER_GROUPS.includes(group.id) && !isContainer
        return (
          <div key={group.id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="tracking-[0.08em] text-[#00FF9C]/55 uppercase">{group.label}</span>
              <span className="truncate text-[#C8FFE6]/70">
                {inCode.length > 0 ? inCode.join(" ") : "—"}
                {pick && <span className="text-[#00FF9C]"> → {pick.className}</span>}
              </span>
            </div>
            <div className={`flex gap-1.5 ${inert ? "opacity-40" : ""}`}>
              {group.options.map(option => {
                const active = pick
                  ? pick.className === option.className
                  : inCode.includes(option.className)
                return (
                  <button
                    key={option.className}
                    type="button"
                    title={option.className}
                    onClick={() => onPick(group.id, option.className)}
                    className={`flex-1 rounded-md px-1 py-1.5 font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "bg-[#00FF9C] text-black"
                        : "border border-[#00FF9C]/25 text-[#00FF9C] hover:bg-[#00FF9C]/10"
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            {inert && (
              <span className="text-[#C8FFE6]/50">Needs Flex or Grid to apply.</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
