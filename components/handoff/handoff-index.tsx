"use client"

/**
 * /handoff — the index. One card per document; the list is the whole page, so
 * it stays a list rather than growing a hero it does not need. Each card leads
 * with a moving picture of its one characteristic change.
 */

import {
  ArtFrame,
  CARD_CLASS,
  ENTRIES,
  TRAY_CLASS,
  TrayLip,
  trayStyle,
} from "@/components/handoff/handoff-entries"

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
          const card = (
            <>
              {/* Portrait: the picture on top, the words under it. */}
              <div className={`${CARD_CLASS} flex-1 gap-5`}>
                <ArtFrame entry={entry} className="py-8" />
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
              <TrayLip entry={entry} />
            </>
          )
          const tray = trayStyle(entry)

          return (
            <li key={entry.slug}>
              {planned ? (
                <div className={`${TRAY_CLASS} h-full border-dashed opacity-70`} style={tray}>
                  {card}
                </div>
              ) : (
                <a
                  href={`/handoff/${entry.slug}`}
                  className={`${TRAY_CLASS} h-full no-underline transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]`}
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
          className="text-green-700 underline"
        >
          creatomat-prototype
        </a>
      </p>
    </div>
  )
}
