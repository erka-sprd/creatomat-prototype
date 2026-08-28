---
name: handoff-page
description: Rules for building and editing the handoff/QA pages under /handoff in creatomat-prototype — how a section is structured, how demos are built from the real rail, and when a drawn cursor is required. Use when adding a handoff, adding or changing a section, or building a demo of a designer behaviour.
---

# Handoff pages

Handoffs live in this repo as routes, not as artifacts, so they can use the real
components, icons, fonts, catalogue data and pricing code.

```
app/handoff/page.tsx                    index of documents
app/handoff/<slug>/page.tsx             one document (server, exports metadata)
app/handoff/handoff.css                 --ho-* tokens, demo keyframes
components/handoff/handoff-index.tsx    the index list
components/handoff/handoff-ui.tsx       shell, nav, section chrome, code-tip drawer
components/handoff/rail-replica.tsx     the product replicas and their demos
components/handoff/<slug>.tsx           the document body (client)
```

## The document

Two typographic worlds share the page and must stay distinguishable: the
document (paper ground, mono kickers, thread-red accent — the `--ho-*` tokens)
and the product replicas inside it, which keep the app's own classes. Never
style a replica with document tokens, and never let document CSS reach into one.

## A section

Sections are terse by default. Unless asked for more, a section is exactly:

1. `<Kicker>` — `§n · Short label`
2. `<SectionHead title="…" />` — names the change, no trailing explainer
3. one line of copy in a `<p>` — a sentence, not a paragraph
4. one `<Demo>` holding the thing itself

No chips, no gesture callouts, no file links, no code tips unless the user asks
for them. When a section loses its last code-tip button, delete the tip from the
`TIPS` record too, and drop imports that fall out of use.

Standard demo frame: `<Demo padding="px-3.5 py-[46px]" className="overflow-x-auto">`
wrapping `<div className="flex justify-center">`. The rail is `RAIL_WIDTH_PX`
(470) wide — its real width, so the swatch grid resolves to its real cell size —
and `RAIL_HEIGHT_PX` (600) tall.

A panel that hangs off the rail in the product should hang off the demo frame
here too — `className="overflow-visible"` rather than `-auto`. Escaping the
white frame is the honest geometry; laying the panel out beside the rail to make
it fit is not.

Keep the left nav labels in step with the section headings.

## Demos are the real thing

- Markup and class names are lifted verbatim from `components/designer.tsx`.
- The product comes from `loadCatalog()`, with a fallback so an unreachable
  catalogue host degrades instead of breaking the page.
- Money is computed by the app's own code — `lib/print-area-pricing.ts`,
  `lib/volume-discount.ts`. **Never type a number into a handoff.** If the copy
  mentions a percentage or a price, derive it too.
- One implementation per piece. If a demo and a live surface both need the size
  sheet, extract the shared part (`SizeSheetBody`, `SizeTrigger`, `TierHint`,
  `StagedRail`) rather than copying markup that will drift.
- State the few things that are faked, in a comment at the top of the file.

## Cursors — required for any fixed hover state

**If a demo shows something that only appears on hover, and shows it fixed
rather than animated, it must carry a drawn cursor.** Without one the reader
takes the tooltip or panel to be permanently visible.

Use `<ParkedCursor>`; in the replicas, passing `pinned` already draws it, so
that the two cannot come apart.

**Which glyph: mirror the product.** Read `components/designer.tsx` and find
what the element actually sets:

| Product's cursor | Glyph |
|---|---|
| `cursor-pointer` (buttons, swatches, the size trigger, steppers) | `CursorHand` |
| default / `cursor-default` (the sold-out list, the tier chevron span) | `CursorArrow` |

Two known cases: the sold-out size list and the volume-discount chevron are both
plain spans at `cursor: default` — arrow, not hand. Check before assuming; a
hand on something that isn't clickable is a lie about the interface.

**Put the cursor ON the target, not beside it.** A cursor parked under or next
to an element reads as pointing at nothing. `ParkedCursor` offsets the glyph so
its *tip* lands where you position it — the arrow's tip sits at (4,2) inside its
24px box, the hand's fingertip near (11,3) — so position the tip somewhere
inside the element's box. Anywhere on it will do; it need not be the centre.

## Scripted walkthroughs

When a section shows a sequence rather than a state:

- 1–2 seconds of stillness on each beat — a developer has to be able to follow.
- Loop, and reset cleanly at the top.
- Nothing interactive: `[&_*]:pointer-events-none` on the container. A
  half-driven surface that also accepts clicks fights its own script.
- **Measure the pointer's targets at runtime** (`data-demo`, `data-demo-row`
  hooks + `getBoundingClientRect`). Hardcoded coordinates go stale silently the
  first time a padding value moves.
- A plain panel, not a Radix portal, so the drawn cursor can sit above it
  without a stacking-context fight.
- Honour `prefers-reduced-motion` for CSS-driven loops.
- Give a long loop an **Auto play** switch (`KitSwitch`, under the demo).
  Switching it off stops the loop where it stands rather than resetting it — a
  reader who paused to study something should keep looking at it.

## Traps already hit

- `app/handoff/handoff.css` is **not** in a Tailwind layer, so it outranks
  utility classes wherever it reaches. Keep prose rules to direct children
  (`.ho-prose > :where(p)`), or they resize text inside the replicas.
- `--ho-*` tokens live on `:root`, not on `.handoff` — Radix portals render
  outside the wrapper and would resolve none of them.
- Scripted triggers have no Radix `data-state`, so `data-[state=open]:` styling
  never fires. State the open look from the prop as well.
- Tailwind v4 compiles `translate-x` and `rotate-180` to standalone properties:
  `transition-[translate]` / `transition-[rotate]`, never `transition-transform`.
- House style is semicolon-free. A bare `npx prettier` run adds them — there is
  no config in this repo.

## Before handing it over

- Refresh `LAST_UPDATED` in the document component.
- `./node_modules/.bin/next build` from the repo root (the working directory can
  drift — check `pwd`).
- Never commit or push unless asked in that moment.
