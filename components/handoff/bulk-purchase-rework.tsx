"use client"

/**
 * /handoff/bulk-purchase-rework — the designer's right rail, reworked for the
 * bulk buyer. Each section shows one change on a piece of the real rail.
 *
 * Out of scope: the volume-discount calculator behind the red link. It gets its
 * own document.
 */

import { Fragment } from "react"
import {
  Demo,
  HandoffFooter,
  HandoffHeader,
  HandoffShell,
  Kicker,
  Section,
  SectionHead,
  type NavItem,
} from "@/components/handoff/handoff-ui"
import {
  ColorRow,
  DetailsLink,
  LATTE_OUT_OF_STOCK,
  LiveRail,
  MinHeightDemo,
  PriceStateDemo,
  RAIL_WIDTH_PX,
  RailFrame,
  SizeGuideDemo,
  SizeSheetDemo,
  TierHint,
  TierListDemo,
  TitleSlideDemo,
  usePolo,
} from "@/components/handoff/rail-replica"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/add-to-basket-new-1"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

const LAST_UPDATED = "August 28, 2026 · 12:40 PM"

/** The quantities §6 shows the hint at — every state it has. */
const TIER_STATES = [
  { quantity: 0, note: "nothing chosen" },
  { quantity: 3, note: "below the first tier" },
  { quantity: 13, note: "on a tier" },
  { quantity: 100, note: "top tier reached" },
]

const NAV: NavItem[] = [
  { id: "live", mark: "◉", label: "Layout shift" },
  { id: "s1", mark: "§1", label: "Product title" },
  { id: "s2", mark: "§2", label: "Details link" },
  { id: "s3", mark: "§3", label: "Stock signals" },
  { id: "s4", mark: "§4", label: "Size & basket" },
  { id: "s5", mark: "§5", label: "Price & discount" },
  { id: "s6", mark: "§6", label: "Discount tiers" },
  { id: "s7", mark: "§7", label: "Size guide" },
]

export default function BulkPurchaseRework() {
  const polo = usePolo()

  return (
    <HandoffShell
      navTitle="Purchase rail"
      items={NAV}
      links={[
        { label: "Prototype", href: PROTOTYPE },
        { label: "Repo", href: REPO },
      ]}
    >
      <HandoffHeader
        eyebrow="handoff"
        title="The purchase rail, reworked"
        actions={[
          { label: "See prototype", href: PROTOTYPE },
          { label: "See repo", href: REPO, ghost: true },
        ]}
      />

      {/* ------------------------------------------------------------ live */}
      <Section id="live" first>
        <SectionHead title="Layout shift" />
        {/* The rail is 470px wide whatever the page is; on a narrow screen the
            demo scrolls sideways rather than squeezing it out of spec. */}
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <LiveRail />
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §1 */}
      <Section id="s1">
        <Kicker>§1 · Product title</Kicker>
        <SectionHead title="Product title - single line, masked, animated" />
        <p>Product title never gets to second line</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <TitleSlideDemo />
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §2 */}
      <Section id="s2">
        <Kicker>§2 · Details link</Kicker>
        <SectionHead title="Product details link - with ruler icon" />
        <p>Ruler icon added in front of the product details link</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <RailFrame style={{ width: RAIL_WIDTH_PX }}>
              <DetailsLink />
            </RailFrame>
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §3 */}
      <Section id="s3">
        <Kicker>§3 · Stock signals</Kicker>
        <SectionHead title="Out of stock info" />
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            {/* Room above the row for the pinned tooltip, which opens upward. */}
            <RailFrame
              padding="px-[24px] pt-16 pb-[24px]"
              style={{ width: RAIL_WIDTH_PX }}
            >
              <ColorRow
                color="latte"
                sizes={polo.sizes}
                gone={LATTE_OUT_OF_STOCK}
                pinned
                className="mt-0 mb-0"
              />
            </RailFrame>
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §4 */}
      <Section id="s4">
        <Kicker>§4 · Size &amp; basket</Kicker>
        <SectionHead title="New size & quantity selector" />
        <p>See how the buttons interact with selections</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <SizeSheetDemo />
          </div>
        </Demo>
        <p className="ho-caption">Min height</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <MinHeightDemo />
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §5 */}
      <Section id="s5">
        <Kicker>§5 · Price &amp; discount</Kicker>
        <SectionHead title="Per item price and total price" />
        <p>See how the strikethrough pricing is displayed</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <PriceStateDemo quantities={{ M: 5, L: 8 }} />
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §6 */}
      <Section id="s6">
        <Kicker>§6 · Discount tiers</Kicker>
        <SectionHead title="Volume discount hint" />
        <p>How the hint reads at each quantity</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            {/* One grid, not a row each: the arrow column is shared, so the
                arrows line up exactly however long the labels get. */}
            <div className="grid w-[422px] grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-5 rounded-[12px] bg-white px-6 py-5">
              {TIER_STATES.map(({ quantity, note }) => (
                <Fragment key={quantity}>
                  <span className="text-right font-[family-name:var(--ho-mono)] text-[12px] text-[var(--ho-muted)]">
                    {note}
                  </span>
                  <span aria-hidden className="text-[13px] text-[var(--ho-line-strong)]">
                    →
                  </span>
                  {/* Wording only here — the chevron keeps its place but
                      previews nothing. */}
                  <TierHint quantity={quantity} preview={false} />
                </Fragment>
              ))}
            </div>
          </div>
        </Demo>
        <p className="ho-caption">5-step volume tier dropdown on hover</p>
        <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
          <div className="flex justify-center">
            <TierListDemo quantities={{ M: 5, L: 8 }} />
          </div>
        </Demo>
      </Section>

      {/* -------------------------------------------------------------- §7 */}
      <Section id="s7">
        <Kicker>§7 · Size guide</Kicker>
        <SectionHead title="Size guide" />
        {/* overflow-visible, not -auto: the panel hangs off the sheet's left
            edge and is meant to escape the frame, like the rail's own popovers
            in the live section. */}
        <Demo padding="px-3.5 py-[46px]" className="overflow-visible">
          <div className="flex justify-center">
            <SizeGuideDemo />
          </div>
        </Demo>
      </Section>

      <HandoffFooter
        source="source of truth: creatomat-prototype · /add-to-basket-new-1"
        updated={LAST_UPDATED}
      />
    </HandoffShell>
  )
}
