// Shared by the edit-mode overlay and the write-back route: which class
// tokens set a colour, and the canonical form the editor writes.

export type ColorProperty = "bg" | "text" | "border"

export const COLOR_PROPERTIES: { id: ColorProperty; label: string }[] = [
  { id: "bg", label: "Background" },
  { id: "text", label: "Text" },
  { id: "border", label: "Border" },
]

// A plain (un-variant) colour utility: Tailwind palette (`bg-neutral-100`),
// the kit tokens (`text-sprd-neutral-700`), keywords (`bg-white`), or an
// arbitrary value (`bg-[#F4F4F4]`, `text-[var(--sprd-neutral-600)]`), with an
// optional opacity suffix. Sizes, alignment and widths (`text-xs`,
// `text-center`, `border-t`, `border-2`) don't match.
export const COLOR_CLASS_RE =
  /^(bg|text|border)-(?:white|black|transparent|current|inherit|[a-z]+-\d{2,3}|sprd-[a-z0-9-]+|\[(?:#|var\(|rgba?\(|hsla?\(|oklch\()[^\]]*\])(?:\/\d{1,3})?$/

/** The classes on an element that set `property`'s colour. */
export function colorClassesOf(classes: string[], property: ColorProperty): string[] {
  return classes.filter(token => COLOR_CLASS_RE.exec(token)?.[1] === property)
}

/** The class the editor writes: the kit token registered in app/globals.css. */
export function sprdColorClass(property: ColorProperty, tokenName: string): string {
  return `${property}-sprd-${tokenName}`
}
