"use client"

/**
 * /handoff/print-quality — an uploaded image can't be resized past the size
 * its pixels still print sharp at, and the designer says why. Every rule is a
 * scene: its "If → Then" steps, played on the canvas and the Uploads panel
 * (the scripts are print-quality-scripts.tsx, the engine
 * print-quality-scene.tsx), with a Desktop / Mobile switch under each.
 *
 * The message, the panel and its tiles are the shipping components, and every
 * size is computed by lib/print-quality.ts. Faked are the script and the
 * uploads themselves (files from /public); the 150 dpi the limit uses is the
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
  ClickOutsideScene,
  HoverScene,
  KeepSizeScene,
  LingerScene,
  MadeSmallerScene,
  QUALITY_PRODUCT_COLOR,
  ResizeStopScene,
  UploadLargerScene,
} from "@/components/handoff/print-quality-scripts"
import { SECOND_UPLOAD_SRC, UPLOAD_SRC } from "@/components/handoff/print-quality-scene"
import { UploadCard, type UploadEntry } from "@/components/ui/upload-panel/UploadPanel"
import {
  PRINT_MAX_SIZE_ACTION,
  PRINT_MAX_SIZE_KEEP,
  PRINT_MAX_SIZE_LINGER_MS,
} from "@/lib/designer-constants"

const PROTOTYPE = "https://creatomat-prototype.vercel.app/"
const REPO = "https://github.com/erka-sprd/creatomat-prototype"

const NAV: NavItem[] = [
  { id: "brief", mark: "◆", label: "Problem & Hypotheses" },
  { id: "s1", mark: "1", label: "Resize stop" },
  { id: "s2", mark: "2", label: "Made smaller" },
  { id: "s3", mark: "3", label: "How long it stays" },
  { id: "s4", mark: "4", label: "Pointer on it" },
  { id: "s5", mark: "5", label: "Click outside" },
  { id: "s6", mark: "6", label: "Keep this size" },
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
 * §6 — the pixel size on the Uploads panel's tiles, standing still: the real
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
        title="Print quality: max. size"
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
            We believe stopping an upload at the largest size it prints sharp, saying so on the
            canvas with the image&rsquo;s own pixels, and offering to upload a larger one lets users
            either accept the size or come back with a better file — so fewer blurry prints are
            ordered.
          </BriefCard>
          <BriefCard tone="win" label="What win looks like">
            <WinTable
              rows={[
                {
                  win: "Fewer blurry prints reach our customers.",
                  signals: "Fewer complaints and reprints about blurry uploads",
                },
                {
                  win: "People at the maximum size make a clear choice.",
                  signals: `“${PRINT_MAX_SIZE_ACTION}” and “${PRINT_MAX_SIZE_KEEP}” clicks per message shown`,
                },
                {
                  win: "One message is enough — it rarely comes back.",
                  signals: "How often the message comes back for the same upload",
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
        kicker="Resize stop"
        title="The resize stops where the print would blur"
        line="The same stop as embroidery's minimum size, from above — in print only"
      >
        <DeviceDemo frame="print-quality" scene="resize">
          {device => <ResizeStopScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s2"
        n={2}
        kicker="Made smaller"
        title="Made smaller, the message goes at once"
        line="No countdown while the handle is still held"
      >
        <DeviceDemo frame="print-quality" scene="smaller">
          {device => <MadeSmallerScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s3"
        n={3}
        kicker="How long it stays"
        title={`Released, the message stays ${PRINT_MAX_SIZE_LINGER_MS / 1000} seconds`}
        line="Long enough to read and act on, then it goes by itself"
      >
        <DeviceDemo frame="print-quality" scene="linger">
          {device => <LingerScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s4"
        n={4}
        kicker="Pointer on it"
        title="The pointer on the message stops its countdown"
        line="Desktop only — a phone has no pointer to rest on it"
      >
        <HoverScene product={product} />
      </Rule>

      <Rule
        id="s5"
        n={5}
        kicker="Click outside"
        title="A click outside ends it at once"
        line="Anywhere outside the message"
      >
        <DeviceDemo frame="print-quality" scene="outside">
          {device => <ClickOutsideScene product={product} device={device} />}
        </DeviceDemo>
      </Rule>

      <Rule
        id="s6"
        n={6}
        kicker="Keep this size"
        title="Keep this size closes the message"
        line="The size is fine as it is — nothing else changes"
      >
        <DeviceDemo frame="print-quality" scene="keep">
          {device => <KeepSizeScene product={product} device={device} />}
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
