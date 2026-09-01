"use client"

import type { ReactElement, ReactNode } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * The editor bar's hover tooltip, matched to create-omat's
 * (src/components/ui/editor-bar/EditorBarItem.tsx, which passes the kit's
 * <Tooltip variant="dark" isRound className="z-40 !p-1.5 text-xs" /> with
 * side="top", align="center" and a -4 offset on both axes).
 *
 * The kit's "dark" variant resolves to bg-neutral-900 / text-neutral-100 and
 * "isRound" to rounded-sm; the arrow is filled to match, since this project's
 * TooltipContent hardcodes it to --foreground, a slightly different black.
 *
 * The negative sideOffset is deliberate: the bubble tucks over the bar's own
 * edge instead of floating clear of it, exactly as in create-omat.
 *
 * Touch needs no special case — Radix only opens on non-touch pointers.
 */
export function EditorBarTooltip({
  content,
  children,
}: {
  content: ReactNode
  children: ReactElement
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={-4}
        collisionPadding={-4}
        className="z-40 rounded-sm bg-neutral-900 p-1.5 text-xs whitespace-nowrap text-neutral-100 [&_svg]:bg-neutral-900 [&_svg]:fill-neutral-900"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
