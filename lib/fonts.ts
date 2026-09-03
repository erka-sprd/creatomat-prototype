// 50 Google Fonts used by the FontPanel.
// Each entry's `family` is the Google Fonts family name and the value used
// as the CSS `font-family` after loading.
//
// Order note: this is a one-time fixed shuffle across categories (not grouped),
// trending from heavier/thicker faces at the top toward lighter/thinner ones.

export type FontCategory =
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "monospace"

export type FontDef = {
  family: string
  category: FontCategory
}

export const FONTS: FontDef[] = [
  // create-omat's DEFAULT_FONT (Constants.ts), so a new text arrives in the
  // same face there and here. First in the list because it is the default —
  // the panel preloads the opening rows.
  { family: "Lobster Two", category: "handwriting" },
  { family: "Anton", category: "display" },
  { family: "Archivo Black", category: "display" },
  { family: "Alfa Slab One", category: "display" },
  { family: "Abril Fatface", category: "display" },
  { family: "Bebas Neue", category: "display" },
  { family: "Permanent Marker", category: "handwriting" },
  { family: "DM Serif Display", category: "serif" },
  { family: "Russo One", category: "display" },
  { family: "Oswald", category: "display" },
  { family: "Fjalla One", category: "display" },
  { family: "Righteous", category: "display" },
  { family: "Playfair Display", category: "serif" },
  { family: "Yeseva One", category: "display" },
  { family: "Montserrat", category: "sans-serif" },
  { family: "Poppins", category: "sans-serif" },
  { family: "Merriweather", category: "serif" },
  { family: "Ubuntu", category: "sans-serif" },
  { family: "Pacifico", category: "handwriting" },
  { family: "Space Mono", category: "monospace" },
  { family: "Inter", category: "sans-serif" },
  { family: "Roboto", category: "sans-serif" },
  { family: "Work Sans", category: "sans-serif" },
  { family: "DM Sans", category: "sans-serif" },
  { family: "Lora", category: "serif" },
  { family: "Nunito", category: "sans-serif" },
  { family: "Manrope", category: "sans-serif" },
  { family: "Kalam", category: "handwriting" },
  { family: "Roboto Mono", category: "monospace" },
  { family: "PT Serif", category: "serif" },
  { family: "Satisfy", category: "handwriting" },
  { family: "JetBrains Mono", category: "monospace" },
  { family: "Lato", category: "sans-serif" },
  { family: "Open Sans", category: "sans-serif" },
  { family: "Karla", category: "sans-serif" },
  { family: "Quicksand", category: "sans-serif" },
  { family: "Raleway", category: "sans-serif" },
  { family: "Spectral", category: "serif" },
  { family: "Libre Baskerville", category: "serif" },
  { family: "Crimson Text", category: "serif" },
  { family: "EB Garamond", category: "serif" },
  { family: "Cormorant Garamond", category: "serif" },
  { family: "Source Code Pro", category: "monospace" },
  { family: "Fira Code", category: "monospace" },
  { family: "Inconsolata", category: "monospace" },
  { family: "Caveat", category: "handwriting" },
  { family: "Dancing Script", category: "handwriting" },
  { family: "Indie Flower", category: "handwriting" },
  { family: "Shadows Into Light", category: "handwriting" },
  { family: "Sacramento", category: "handwriting" },
  { family: "Great Vibes", category: "handwriting" },
]

/**
 * The range every size control offers — create-omat's MIN_FONT_SIZE and
 * MAX_FONT_SIZE (src/lib/Constants.ts), shared by its editor bar and its mobile
 * SizePanel alike.
 *
 * Fixed, and deliberately not derived from what is typed. The range belongs to
 * the control, not to the content: a max computed from the current string moves
 * its own end as characters are added, so the thumb slides and the step size
 * changes under a hand that never touched it. Text too big for the print area
 * is dealt with where create-omat deals with it — the block is scaled back to
 * fit after the change (see the print-area fit in designer.tsx), which leaves
 * the control still.
 */
export const MIN_FONT_SIZE = 14
export const MAX_FONT_SIZE = 320
