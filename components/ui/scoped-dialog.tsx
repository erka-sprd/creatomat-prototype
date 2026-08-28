"use client"

import * as RadixDialog from "@radix-ui/react-dialog"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

export const ScopedDialogTitle = RadixDialog.Title
export const ScopedDialogClose = RadixDialog.Close

// Anything else (style, data-* hooks, event handlers) is handed straight to the
// dialog's content element.
type ScopedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  /** When provided, the dialog portals into this element and uses absolute positioning. */
  container?: HTMLElement | null
  className?: string
  overlayClassName?: string
  /**
   * Off for a dialog that is only being displayed, not operated — a handoff
   * demo, say. Radix's modal mode locks body scroll and aria-hides the rest of
   * the document, which an always-open dialog would impose on the whole page.
   */
  modal?: boolean
} & Omit<ComponentPropsWithoutRef<typeof RadixDialog.Content>, "className" | "children">

export function ScopedDialog({
  open,
  onOpenChange,
  children,
  container,
  className,
  overlayClassName,
  modal = true,
  ...contentProps
}: ScopedDialogProps) {
  const pos = container ? "absolute" : "fixed"
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      <RadixDialog.Portal container={container}>
        <RadixDialog.Overlay
          className={
            `${pos} inset-0 z-50 bg-black/70 ` +
            "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 " +
            "motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 " +
            (overlayClassName ?? "")
          }
        />
        <RadixDialog.Content
          aria-describedby={undefined}
          {...contentProps}
          className={
            `${pos} left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 duration-200 ` +
            "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:zoom-in-95 " +
            "motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0 motion-safe:data-[state=closed]:zoom-out-95 " +
            (className ?? "")
          }
        >
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
