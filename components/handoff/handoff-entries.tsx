"use client"

/**
 * The handoff documents, as the index lists them — and each one's moving
 * picture, which the index cards lead with and the document's nav repeats.
 */

import {
  BulkDiscountArt,
  CanvasRowArt,
  CurveTextArt,
} from "@/components/handoff/handoff-card-art"

export type Entry = {
  /** The document's one characteristic change, drawn. */
  Art: () => React.ReactNode
  slug: string
  title: string
  /** The problem it solves, as the user meets it. */
  problem: string
  /** When the document was first written (YYYY-MM-DD) — what the list is ordered by. */
  created: string
  /** When the document last changed — refresh it with every edit. */
  updated: { date: string; time: string }
  status: "live" | "planned"
  /** A light tone of the picture's own colour, for the card's tray and its date. */
  tint: Tint
}

/**
 * `wash`: the faint gradient behind the picture. `glow`: the hues it is mixed
 * from, as RGB triplets — the picture's own colour first, then its neighbours.
 */
type Tint = { tray: string; line: string; ink: string; glow: string[] }

// Where each hue's wash sits, after the designer's loader frame: soft radial
// pools from the corners and the bottom, fading out before the middle.
const GLOW_SPOTS = ["0% 0%", "100% 12%", "55% 120%", "-10% 90%"]
const GLOW_ALPHA = 0.08

function wash(glow: string[]) {
  return glow
    .map(
      (rgb, i) =>
        `radial-gradient(120% 120% at ${GLOW_SPOTS[i]}, rgba(${rgb}, ${GLOW_ALPHA}), transparent 58%)`
    )
    .join(", ")
}

// Each a light tone of its picture's characteristic colour.
const TINTS = {
  // The discount red, #DC2626, with orange, amber and pink.
  red: {
    tray: "#FEF0F0",
    line: "#FBDADA",
    ink: "#B4403A",
    glow: ["220, 38, 38", "249, 115, 22", "245, 158, 11", "236, 72, 153"],
  },
  // The curved text's indigo, #4F46E5, with sky, teal and violet.
  indigo: {
    tray: "#EFEFFE",
    line: "#DEDDFB",
    ink: "#5650C8",
    glow: ["79, 70, 229", "56, 189, 248", "45, 212, 191", "167, 139, 250"],
  },
  // The catalogue's mauve shirt, #BA7283, with lilac, peach and rose.
  mauve: {
    tray: "#F8EDF0",
    line: "#EFD9DF",
    ink: "#9A5468",
    glow: ["186, 114, 131", "167, 139, 250", "251, 146, 120", "244, 114, 182"],
  },
} satisfies Record<string, Tint>

export const ENTRIES: Entry[] = [
  {
    Art: BulkDiscountArt,
    slug: "bulk-purchase-rework",
    title: "Bulk purchase rail, reworked",
    problem:
      "“How much do I save if I order more? What does one shirt really cost me?” — the discounts and the per-item price are hard to find and hard to work out.",
    created: "2026-08-28",
    updated: { date: "October 29, 2026", time: "12:01 PM" },
    status: "live",
    tint: TINTS.red,
  },
  {
    Art: CurveTextArt,
    slug: "curve-text",
    title: "Curve text",
    problem:
      "“I want my text in an arc, like on a team or college shirt.” — there's no way to bend a text in the designer.",
    created: "2026-09-03",
    updated: { date: "October 29, 2026", time: "12:01 PM" },
    status: "live",
    tint: TINTS.indigo,
  },
  {
    Art: CanvasRowArt,
    slug: "canvas-bottom-row",
    title: "Canvas controls, in one row",
    problem:
      "“Where do I switch to embroidery?” — the canvas controls are scattered across its corners, and print technique has no clear place among them.",
    created: "2026-10-23",
    updated: { date: "October 29, 2026", time: "12:01 PM" },
    status: "live",
    tint: TINTS.mauve,
  },
]

// A white card resting in a tray of its entry's tint, the date on the tray's
// lip underneath — the index card, and the document's nav column.
export const TRAY_CLASS = "flex flex-col rounded-[24px] border p-1.5 pb-0"
export const CARD_CLASS =
  "flex flex-col rounded-[18px] bg-[var(--ho-paper)] p-2.5 shadow-[0_2px_10px_rgba(26,24,19,0.06)]"

export function trayStyle(entry: Entry) {
  return { background: entry.tint.tray, borderColor: entry.tint.line }
}

/** The date on the tray's lip, in the picture's ink — the hour on a line under it. */
export function TrayLip({ entry, className = "" }: { entry: Entry; className?: string }) {
  return (
    <p
      className={`m-0 py-2.5 text-center text-[12px] font-semibold tracking-[0.08em] uppercase ${className}`}
      style={{ color: entry.tint.ink }}
    >
      {entry.status === "planned" ? (
        "Planned"
      ) : (
        <>
          Updated {entry.updated.date}
          <br />
          <span className="opacity-60">{entry.updated.time}</span>
        </>
      )}
    </p>
  )
}

/**
 * The picture in its glass: the loader frame's washes and its 1px light rim.
 * On the white card the rim is drawn in the picture's own hue, faintly, so it
 * still reads. The pictures are drawn at 240px wide, so they're centred, not
 * stretched.
 */
export function ArtFrame({ entry, className = "" }: { entry: Entry; className?: string }) {
  return (
    <div
      className={`rounded-[14px] ${className}`}
      style={{
        background: wash(entry.tint.glow),
        border: `1px solid rgba(${entry.tint.glow[0]}, 0.1)`,
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.6)",
      }}
    >
      <div className="mx-auto w-[240px]">
        <entry.Art />
      </div>
    </div>
  )
}
