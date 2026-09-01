"use client"

import { useId } from "react"
import { curvedLayout } from "@/lib/text-path"

type CurvedTextProps = {
  text: string
  /** The baseline, as CE.SDK's `text/path` would carry it. */
  path: string
  /** CE.SDK's `text/pathOffset`: a proportion of path length in [-1, 1]. */
  offset: number
  fontSize: number
  fontFamily: string
  color: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  /**
   * Draw the baseline itself as a thin blue guide, the way CE.SDK's editor
   * shows the path a run is sitting on. On while the text is being edited, so
   * the curve being adjusted is visible; off in the finished artwork.
   */
  showPath?: boolean
}

/**
 * A text element laid on its baseline path — the rendering half of the
 * text-on-path mock (see lib/text-path.ts for the model it follows).
 *
 * Drawn with SVG <textPath>, which is the same primitive CE.SDK's renderer uses
 * conceptually: real glyphs in the element's own face, rotated along the curve,
 * not a picture of them.
 *
 * Sizing differs from CE.SDK on purpose. The engine sizes the block to the
 * path's bounding box and lets text longer than the path overrun it; here the
 * path is scaled to the text (times PATH_SLACK), so the word always sits on its
 * curve whatever its length — the behaviour that reads correctly in a prototype
 * where nobody is dragging block handles to fit a path.
 *
 * Everything lives in the path's own user units and is scaled by the viewBox →
 * width/height mapping, so one number (`scale`) relates the two spaces and the
 * font size is expressed back in user units.
 */
export function CurvedText({
  text,
  path,
  offset,
  fontSize,
  fontFamily,
  color,
  bold,
  italic,
  underline,
  showPath = false,
}: CurvedTextProps) {
  // Colons are not valid in an XML id; useId emits ":r1:"-style values.
  const pathId = `textpath-${useId().replace(/:/g, "")}`

  // Shared with the edit caret (curvedLayout), so caret and glyphs can never
  // disagree about where the run sits. Null on the server's first paint or a
  // degenerate path: fall back to flat text rather than dividing by zero.
  const layout = curvedLayout(text, path, offset, fontSize, fontFamily)
  if (!layout) {
    return <>{text}</>
  }
  const { scale, fontSizeUser, viewX, viewY } = layout
  const viewW = layout.width / scale
  const viewH = layout.height / scale

  // renderPath, not `path`: on the closed circle the offset rotates the
  // baseline rather than sliding the run along it, so what gets drawn and
  // measured is that rotated circle. startOffset is the fraction of it where
  // the middle of the run sits (textAnchor="middle") — a constant 50% for the
  // circle, and CE.SDK's [-1, 1] → [0%, 100%] remap for the open curves.
  const drawPath = layout.renderPath
  const startOffset = `${layout.startOffset * 100}%`

  return (
    <svg
      // Hook for the editor's pointer hit-testing: getScreenCTM() on this svg
      // maps client coords into path user units through every ancestor
      // transform (wrapper rotation, zoom) without any manual matrix work.
      data-curved-text="true"
      width={layout.width}
      height={layout.height}
      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
      // The element is measured and clipped by its parent; nothing here
      // should catch a pointer of its own.
      style={{ display: "block", overflow: "visible", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <path id={pathId} d={drawPath} fill="none" />
      </defs>
      {showPath && (
        // The WHOLE path, not just the stretch under the run: it is the track
        // the text rides on, so it has to stay put while the offset slides the
        // text along it (CE.SDK draws it the same way). The element is anchored
        // to the path for exactly this reason — see anchorDX in curvedLayout.
        //
        // Stroke width in user units (1/scale = 1px on screen) rather than
        // vector-effect: non-scaling-stroke, which behaves inconsistently once
        // the path is scaled this hard.
        <path d={drawPath} fill="none" stroke="#3355FF" strokeWidth={1 / scale} />
      )}
      <text
        fill={color}
        fontSize={fontSizeUser}
        fontFamily={`"${fontFamily}"`}
        fontWeight={bold ? 700 : 400}
        fontStyle={italic ? "italic" : "normal"}
        textDecoration={underline ? "underline" : "none"}
        textAnchor="middle"
      >
        <textPath href={`#${pathId}`} startOffset={startOffset}>
          {text}
        </textPath>
      </text>
    </svg>
  )
}
