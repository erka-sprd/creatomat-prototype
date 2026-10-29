"use client"

/**
 * /handoff — the index. One card per document; the list is the whole page, so
 * it stays a list rather than growing a hero it does not need. Each card leads
 * with a moving picture of its one characteristic change.
 */

import {
  BulkDiscountArt,
  CanvasRowArt,
  CurveTextArt,
} from "@/components/handoff/handoff-card-art"

type Entry = {
  /** The document's one characteristic change, drawn. */
  Art: () => React.ReactNode
  slug: string
  title: string
  /** The problem it solves, as the user meets it. */
  problem: string
  /** When the document was first written (YYYY-MM-DD) — what the list is ordered by. */
  created: string
  updated: string
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

const ENTRIES: Entry[] = [
  {
    Art: BulkDiscountArt,
    slug: "bulk-purchase-rework",
    title: "Bulk purchase rail, reworked",
    problem:
      "“How much do I save if I order more? What does one shirt really cost me?” — the discounts and the per-item price are hard to find and hard to work out.",
    created: "2026-08-28",
    updated: "August 28, 2026",
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
    updated: "September 3, 2026",
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
    updated: "October 23, 2026",
    status: "live",
    tint: TINTS.mauve,
  },
]

export default function HandoffIndex() {
  return (
    <div className="mx-auto max-w-[1120px] pt-[68px]">
      <h1 className="mb-4 max-w-[16ch] text-[clamp(30px,5.5vw,44px)] leading-[1.05] font-[680] tracking-[-0.02em] text-balance">
        Handoffs
      </h1>
      <p className="m-0 max-w-[var(--ho-measure)] text-[18px] text-[var(--ho-muted)]">
        Development handoff, UX specifications and so on.
      </p>

      <ul className="mt-11 mb-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {/* Newest first, by when each was written — an update doesn't move it. */}
        {[...ENTRIES].sort((a, b) => b.created.localeCompare(a.created)).map(entry => {
          const planned = entry.status === "planned"
          // A white card resting in a tray of its own tint, the date on the
          // tray's lip underneath.
          const card = (
            <>
              {/* Portrait: the picture on top, the words under it. The pictures
                  are drawn at 240px wide, so they're centred, not stretched. */}
              <div className="flex flex-1 flex-col gap-5 rounded-[18px] bg-[var(--ho-paper)] p-2.5 shadow-[0_2px_10px_rgba(26,24,19,0.06)]">
                {/* The loader frame's glass: its washes, its 1px light rim.
                    On the white card the rim is drawn in the picture's own
                    hue, faintly, so it still reads. */}
                <div
                  className="rounded-[14px] py-8"
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
                <div className="min-w-0 px-3.5 pb-4">
                  {/* MADE Outer Sans ships Medium and Black only — Medium here. */}
                  <h2 className="m-0 font-display text-[21px] leading-tight font-medium">
                    {entry.title}
                  </h2>
                  <p className="mt-2 mb-0 max-w-[var(--ho-measure)] text-[15px] text-[var(--ho-muted)]">
                    {entry.problem}
                  </p>
                </div>
              </div>
              <p
                className="m-0 py-2.5 text-center text-[12px] font-semibold tracking-[0.08em] uppercase"
                style={{ color: entry.tint.ink }}
              >
                {planned ? "Planned" : `Updated ${entry.updated}`}
              </p>
            </>
          )
          const tray = {
            background: entry.tint.tray,
            borderColor: entry.tint.line,
          }

          return (
            <li key={entry.slug}>
              {planned ? (
                <div
                  className="flex h-full flex-col rounded-[24px] border border-dashed p-1.5 pb-0 opacity-70"
                  style={tray}
                >
                  {card}
                </div>
              ) : (
                <a
                  href={`/handoff/${entry.slug}`}
                  className="flex h-full flex-col rounded-[24px] border p-1.5 pb-0 no-underline transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(26,24,19,0.08)]"
                  style={tray}
                >
                  {card}
                </a>
              )}
            </li>
          )
        })}
      </ul>

      <p className="mt-14 mb-0 font-[family-name:var(--ho-mono)] text-[14px] text-[var(--ho-muted)]">
        source of truth:{" "}
        <a
          href="https://github.com/erka-sprd/creatomat-prototype"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--ho-thread-ink)] underline"
        >
          creatomat-prototype
        </a>
      </p>
    </div>
  )
}
