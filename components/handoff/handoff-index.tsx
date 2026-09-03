"use client"

/**
 * /handoff — the index. One card per document; the list is the whole page, so
 * it stays a list rather than growing a hero it does not need.
 */

type Entry = {
  slug: string
  title: string
  summary: string
  /** What the document actually specifies, for scanning without opening it. */
  covers: string[]
  updated: string
  status: "live" | "planned"
}

const ENTRIES: Entry[] = [
  {
    slug: "bulk-purchase-rework",
    title: "Bulk purchase rail, reworked",
    summary:
      "The designer's right column for the bulk buyer — title, stock signals, the size-and-basket row, the money band and the volume-discount calculator.",
    covers: [
      "Product title",
      "Details link",
      "Stock signals",
      "Size & basket",
      "Price & discount",
      "Discount tiers",
      "Size guide",
      "Discount calculator",
    ],
    updated: "August 28, 2026",
    status: "live",
  },
  {
    slug: "curve-text",
    title: "Curve text",
    summary:
      "Bending a text along a baseline — where it is reached from, the panel it opens, and how its presets sit on img.ly's own text-on-path API.",
    covers: ["Editor bar", "Curve panel", "Presets", "img.ly mapping"],
    updated: "September 3, 2026",
    status: "live",
  },
]

export default function HandoffIndex() {
  return (
    <div className="mx-auto max-w-[760px] pt-[68px]">
      <p className="mb-[18px] font-[family-name:var(--ho-mono)] text-[14px] tracking-[0.12em] text-[var(--ho-thread-ink)] uppercase">
        handoffs
      </p>
      <h1 className="mb-4 max-w-[16ch] text-[clamp(30px,5.5vw,44px)] leading-[1.05] font-[680] tracking-[-0.02em] text-balance">
        What changed, and why
      </h1>
      <p className="m-0 max-w-[var(--ho-measure)] text-[18px] text-[var(--ho-muted)]">
        Working documents for the Creatomat prototype: each one specifies a slice of the designer
        against live pieces of it, so the spec and the thing it describes cannot drift apart.
      </p>

      <ul className="mt-11 mb-0 flex list-none flex-col gap-3 p-0">
        {ENTRIES.map(entry => {
          const planned = entry.status === "planned"
          const card = (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="m-0 text-[21px] font-[640] tracking-[-0.01em]">{entry.title}</h2>
                <span className="font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
                  {planned ? "planned" : `updated ${entry.updated}`}
                </span>
              </div>
              <p className="mt-2 mb-0 max-w-[var(--ho-measure)] text-[15px] text-[var(--ho-muted)]">
                {entry.summary}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {entry.covers.map(c => (
                  <span
                    key={c}
                    className="rounded-full border border-[var(--ho-line)] px-2.5 py-0.5 font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-slate)]"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <p className="mt-4 mb-0 font-[family-name:var(--ho-mono)] text-[12.5px] text-[var(--ho-line-strong)]">
                /handoff/{entry.slug}
              </p>
            </>
          )

          return (
            <li key={entry.slug}>
              {planned ? (
                <div className="rounded-[18px] border border-dashed border-[var(--ho-line-strong)] bg-transparent p-6 opacity-70">
                  {card}
                </div>
              ) : (
                <a
                  href={`/handoff/${entry.slug}`}
                  className="block rounded-[18px] border border-[var(--ho-line)] bg-[var(--ho-paper)] p-6 no-underline transition-colors hover:border-[var(--ho-thread-ink)]"
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
