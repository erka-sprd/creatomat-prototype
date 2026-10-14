"use client"

import { useLayoutEffect, useState } from "react"

// Replica of create-omat's ResizePopoverPlugin (src/lib/plugins/ResizePopoverPlugin.ts
// + the .resize-popover styles in globals.scss): while an object is being
// resized, its size shows in two small black labels — the width centred above
// the selection, the height rotated -90° and centred on its left. Like
// create-omat, the size is the object's own (unrotated) box, positioned against
// the selection's on-screen bounds, and shown in cm with one decimal.

// create-omat's gaps between the labels and the selection frame.
const WIDTH_LABEL_GAP_PX = 4
const HEIGHT_LABEL_GAP_PX = 16

const LABEL_CLASS =
  "pointer-events-none fixed z-[9999] bg-black px-1.5 py-0.5 text-xs whitespace-nowrap text-white"

type Placement = {
  width: string
  height: string
  widthLeft: number
  widthTop: number
  heightLeft: number
  heightTop: number
}

const formatCm = (mm: number) => `${(mm / 10).toFixed(1)} cm`

export function ResizeSizeLabels({
  target,
  printArea,
  boundaryMm,
}: {
  // The object being resized and the print-area box it is laid out in. Its
  // size in % of that box maps onto the print area's real size in mm.
  target: HTMLElement | null
  printArea: HTMLElement | null
  boundaryMm: { width: number; height: number } | null
}) {
  const [placement, setPlacement] = useState<Placement | null>(null)

  // Measured after every render: each resize step re-renders the designer, so
  // the labels follow the object frame by frame.
  useLayoutEffect(() => {
    if (!target || !printArea || !boundaryMm || printArea.offsetWidth <= 0) {
      setPlacement(null)
      return
    }
    // offsetWidth/Height ignore the object's rotation and the canvas zoom, so
    // the ratio is the object's own size relative to the print area.
    const widthMm = (target.offsetWidth / printArea.offsetWidth) * boundaryMm.width
    const heightMm = (target.offsetHeight / printArea.offsetHeight) * boundaryMm.height
    const rect = target.getBoundingClientRect()
    const width = formatCm(widthMm)
    const height = formatCm(heightMm)
    setPlacement(prev =>
      prev &&
      prev.width === width &&
      prev.height === height &&
      prev.widthLeft === rect.left + rect.width / 2 &&
      prev.widthTop === rect.top - WIDTH_LABEL_GAP_PX &&
      prev.heightLeft === rect.left - HEIGHT_LABEL_GAP_PX &&
      prev.heightTop === rect.top + rect.height / 2
        ? prev
        : {
            width,
            height,
            widthLeft: rect.left + rect.width / 2,
            widthTop: rect.top - WIDTH_LABEL_GAP_PX,
            heightLeft: rect.left - HEIGHT_LABEL_GAP_PX,
            heightTop: rect.top + rect.height / 2,
          }
    )
  })

  if (!placement) return null

  return (
    <>
      <div
        className={LABEL_CLASS}
        style={{
          left: placement.widthLeft,
          top: placement.widthTop,
          transform: "translate(-50%, -100%)",
        }}
      >
        {placement.width}
      </div>
      <div
        className={LABEL_CLASS}
        style={{
          left: placement.heightLeft,
          top: placement.heightTop,
          transform: "translate(-50%, -50%) rotate(-90deg)",
        }}
      >
        {placement.height}
      </div>
    </>
  )
}
