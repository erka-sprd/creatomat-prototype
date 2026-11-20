"use client"

/**
 * /handoff/print-quality — an uploaded image resized past the size its pixels
 * still print sharp at is "too large", and the designer treats it as it
 * treats a design past embroidery's hoop frame: a message in the bottom
 * row's place, the upload held selected, no editor bar, no add to basket.
 * Every rule is a scene: its "If → Then" steps, played on the canvas (the
 * scripts are print-quality-scripts.tsx, on the embroidery handoff's engine;
 * "Upload larger" on print-quality-scene.tsx, with the Uploads panel), with a
 * Desktop / Mobile switch under each.
 *
 * The messages, the editor bar, the panel and its tiles are the shipping
 * components, and every size is computed by lib/print-quality.ts. Faked are
 * the script and the uploads themselves (files from /public); the 150 dpi the
 * limit uses is the
 * prototype's own pick — production gets it per print technique from the
 * decoration service.
 */

import { DeviceDemo } from "@/components/handoff/device-demo"
import { Rule } from "@/components/handoff/embroidery"
import { TSHIRT_ID, useCanvasProduct } from "@/components/handoff/embroidery-canvas"
import {
  Brief,
  BriefCard,
  Demo,
  HandoffEnd,
  HandoffHeader,
  HandoffShell,
  Section,
  WinTable,
  type NavItem,
} from "@/components/handoff/handoff-ui"
import {
  BackToGoodSizeScene,
  BasketScene,
  EditorBarScene,
  FitScene,
  QUALITY_PRODUCT_COLOR,
  StaysSelectedScene,
  TooLargeScene,
  UploadLargerScene,
} from "@/components/handoff/print-quality-scripts"
import { SECOND_UPLOAD_SRC, UPLOAD_SRC } from "@/components/handoff/print-quality-scene"
import { UploadCard, type UploadEntry } from "@/components/ui/upload-panel/UploadPanel"
import { PRINT_FIT_LABEL, PRINT_UPLOAD_LARGER_LABEL } from "@/lib/designer-constants"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

const NAV: NavItem[] = [
  { id: "brief", mark: "◆", label: "Problem & Hypotheses" },
  { id: "s1", mark: "1", label: "Too large" },
  { id: "s2", mark: "2", label: "Stays selected" },
  { id: "s3", mark: "3", label: "No editor bar" },
  { id: "s4", mark: "4", label: "Add to basket" },
  { id: "s5", mark: "5", label: "Back to a good size" },
  { id: "s6", mark: "6", label: "Fit to good size" },
  { id: "s7", mark: "7", label: "Upload larger" },
  { id: "s8", mark: "8", label: "Dimensions on the tiles" },
]

/* ------------------------------------------------------------------ demos */

const MONO = "font-[family-name:var(--ho-mono)] text-[12px] leading-snug text-[var(--ho-muted)]"
/** The two tiles at rest — the panel's own, as uploaded — and what each says. */
const TILES: { entry: UploadEntry; note: string }[] = [
  {
    entry: { id: "light", name: "", url: UPLOAD_SRC, status: "uploaded", progress: 0 },
    note: "a light image: dark tile, light text",
  },
  {
    entry: { id: "other", name: "", url: SECOND_UPLOAD_SRC, status: "uploaded", progress: 0 },
    note: "any other: light tile, grey text",
  },
]

/**
 * §8 — the pixel size on the Uploads panel's tiles, standing still: the real
 * tiles in the panel's own width and padding, a light image's and another's,
 * each captioned with its colours.
 */
function TileSizes() {
  return (
    <Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">
      <div className="flex justify-center">
        <div className="flex w-[407px] flex-col gap-3">
          {/* The desktop add panel's white, its 24px sides, on the canvas grey. */}
          <div className="rounded-[12px] bg-[#F4F4F4] p-4">
          <div className="grid grid-cols-2 gap-2 rounded-[12px] bg-white px-6 py-6 [&_*]:pointer-events-none">
            {TILES.map(({ entry }) => (
              <UploadCard key={entry.id} image={entry} onRemove={() => {}} onPlace={() => {}} />
            ))}
          </div>
          </div>
          <div className="grid grid-cols-2 gap-2 px-10">
            {TILES.map(({ entry, note }) => (
              <span key={entry.id} className={MONO}>
                {note}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Demo>
  )
}

/* -------------------------------------------------------------------- page */

export default function PrintQuality() {
  const product = useCanvasProduct(TSHIRT_ID, QUALITY_PRODUCT_COLOR)

  return (
    <HandoffShell
      slug="print-quality"
      items={NAV}
      links={[
        { label: "Prototype", href: PROTOTYPE },
        { label: "Repo", href: REPO },
      ]}
    >
      <HandoffHeader
        title="Print quality: too large"
        actions={[
          { label: "See prototype", href: PROTOTYPE, live: true },
          { label: "See repo", href: REPO, ghost: true },
        ]}
      />

      {/* ----------------------------------------------------------- brief */}
      <Section id="brief" first>
        <Brief>
          <BriefCard tone="problem" label="Problem">
            <ul>
              <li>
                Users enlarge their upload as big as the print area allows, without knowing it
                will print blurry at that size.
              </li>
              <li>
                They get no warning in the designer — the first sign is the blurry print on their
                product.
              </li>
            </ul>
          </BriefCard>
          <BriefCard tone="hypothesis" label="Hypothesis">
            We believe telling users the moment their upload is too large to print sharp, and
            letting them fit it or upload a larger one before add to basket, means fewer blurry
            prints are ordered.
          </BriefCard>
          <BriefCard tone="win" label="What win looks like">
            <WinTable
              rows={[
                {
                  win: "Fewer blurry prints reach our customers.",
                  signals: "Fewer complaints and reprints about blurry uploads",
                },
                {
                  win: "People who see the message fix their upload.",
                  signals: `“${PRINT_FIT_LABEL}” and “${PRINT_UPLOAD_LARGER_LABEL}” clicks per message shown`,
                },
                {
                  win: "Nobody gets stuck at add to basket.",
                  signals: "How often add to basket is refused with the message up",
                },
                {
                  win: "The limit doesn't hurt conversion.",
                  signals: "Conversion rate of those who saw the message vs. those who didn't",
                },
              ]}
            />
          </BriefCard>
          <BriefCard tone="result" label="Result">
            Will follow.
          </BriefCard>
        </Brief>
      </Section>

      <Rule
        id="s1"
        n={1}
        kicker="Too large"
        title="Past its sharp size, the upload is too large"
        line="Nothing stops the resize — embroidery's “too large” message instead"
      >
        <DeviceDemo frame="print-quality" scene="resize">
          {device => <TooLargeScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s2"
        n={2}
        kicker="Stays selected"
        title="A too-large upload can't be unselected"
        line="It can still be moved, resized, rotated and removed"
      >
        <DeviceDemo frame="print-quality" scene="selected">
          {device => <StaysSelectedScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s3"
        n={3}
        kicker="No editor bar"
        title="No editor bar while the upload is too large"
        line="The message is the only thing to act on"
      >
        <DeviceDemo frame="print-quality" scene="bar">
          {device => <EditorBarScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s4"
        n={4}
        kicker="Add to basket"
        title="Add to basket is refused while it's too large"
        line="On a phone, Finish does the same"
      >
        <BasketScene product={product} />
      </Rule>

      <Rule
        id="s5"
        n={5}
        kicker="Back to a good size"
        title="Resized back, it snaps onto its sharp size"
        line="No green message: only the frame stays green for a moment"
      >
        <DeviceDemo frame="print-quality" scene="back">
          {device => <BackToGoodSizeScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s6"
        n={6}
        kicker="Fit to good size"
        title="Fit to good size shrinks it to its sharp size"
        line="About its centre, as embroidery's “Fit to best size”, then straight back to the bottom row"
      >
        <DeviceDemo frame="print-quality" scene="fit">
          {device => <FitScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s7"
        n={7}
        kicker="Upload larger"
        title="Upload larger opens the Uploads panel"
        line="As it was left — nothing scrolled to or marked. On a phone, the uploads drawer"
      >
        <DeviceDemo frame="print-quality" scene="larger">
          {device => <UploadLargerScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s8"
        n={8}
        kicker="Dimensions"
        title="Dimensions on the tiles"
        line="On the tile's colour, once loaded"
      >
        <TileSizes />
      </Rule>

      <HandoffEnd />
    </HandoffShell>
  )
}
