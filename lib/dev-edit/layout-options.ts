// The edit mode's Layout tab: alignment and centring, as Tailwind utilities.
// Each group is one CSS property — the overlay previews an option by setting
// it inline, and the hand-off names the class to write and the one it
// replaces.

export type LayoutGroupId = "display" | "direction" | "justify" | "items" | "self" | "text"

export type LayoutOption = { label: string; className: string; value: string }

export type LayoutGroup = {
  id: LayoutGroupId
  label: string
  // The CSS property the preview sets (kebab-case, for style.setProperty).
  cssProp: string
  // The classes on an element that already set it.
  classRe: RegExp
  options: LayoutOption[]
}

export const LAYOUT_GROUPS: LayoutGroup[] = [
  {
    id: "display",
    label: "Display",
    cssProp: "display",
    classRe: /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden|contents)$/,
    options: [
      { label: "Block", className: "block", value: "block" },
      { label: "Flex", className: "flex", value: "flex" },
      { label: "Inline flex", className: "inline-flex", value: "inline-flex" },
      { label: "Grid", className: "grid", value: "grid" },
    ],
  },
  {
    id: "direction",
    label: "Direction",
    cssProp: "flex-direction",
    classRe: /^flex-(row|col|row-reverse|col-reverse)$/,
    options: [
      { label: "Row", className: "flex-row", value: "row" },
      { label: "Column", className: "flex-col", value: "column" },
    ],
  },
  {
    // Main axis. justify-items / justify-self are other properties.
    id: "justify",
    label: "Justify",
    cssProp: "justify-content",
    classRe: /^justify-(normal|start|end|center|between|around|evenly|stretch)$/,
    options: [
      { label: "Start", className: "justify-start", value: "flex-start" },
      { label: "Center", className: "justify-center", value: "center" },
      { label: "End", className: "justify-end", value: "flex-end" },
      { label: "Between", className: "justify-between", value: "space-between" },
    ],
  },
  {
    // Cross axis.
    id: "items",
    label: "Align items",
    cssProp: "align-items",
    classRe: /^items-(start|end|center|baseline|stretch)$/,
    options: [
      { label: "Start", className: "items-start", value: "flex-start" },
      { label: "Center", className: "items-center", value: "center" },
      { label: "End", className: "items-end", value: "flex-end" },
      { label: "Stretch", className: "items-stretch", value: "stretch" },
    ],
  },
  {
    // The element itself, within its flex/grid parent.
    id: "self",
    label: "Align self",
    cssProp: "align-self",
    classRe: /^self-(auto|start|end|center|stretch|baseline)$/,
    options: [
      { label: "Start", className: "self-start", value: "flex-start" },
      { label: "Center", className: "self-center", value: "center" },
      { label: "End", className: "self-end", value: "flex-end" },
      { label: "Stretch", className: "self-stretch", value: "stretch" },
    ],
  },
  {
    id: "text",
    label: "Text align",
    cssProp: "text-align",
    classRe: /^text-(left|center|right|justify|start|end)$/,
    options: [
      { label: "Left", className: "text-left", value: "left" },
      { label: "Center", className: "text-center", value: "center" },
      { label: "Right", className: "text-right", value: "right" },
    ],
  },
]

// One click for the common case: centred on both axes.
export const CENTER_BOTH: { group: LayoutGroupId; className: string }[] = [
  { group: "display", className: "flex" },
  { group: "justify", className: "justify-center" },
  { group: "items", className: "items-center" },
]

/** The classes on an element that set `group`'s property (plain, no variants). */
export function layoutClassesOf(classes: string[], group: LayoutGroup): string[] {
  return classes.filter(token => group.classRe.test(token))
}

export function layoutOption(groupId: LayoutGroupId, className: string) {
  const group = LAYOUT_GROUPS.find(g => g.id === groupId)
  const option = group?.options.find(o => o.className === className)
  return group && option ? { group, option } : null
}
