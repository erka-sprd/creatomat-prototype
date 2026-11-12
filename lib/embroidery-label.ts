// The plain values behind components/embroidery-label.tsx, kept out of it so
// that file exports components only — Next's Fast Refresh then swaps an edit
// to it in place instead of reloading the whole page.

// The preview pill's two statements per language. create-omat already
// translates "creating-preview"; "Checking quality" has no key there yet, so
// those are placeholders. The prototype is English-only — `?lang=de|fi|es` swaps them in
// to check the fixed width and the font fit with longer languages.
export type PreviewStatements = { creating: string; checking: string }
export const PREVIEW_STATEMENTS: Record<string, PreviewStatements> = {
  en: { creating: "Creating preview...", checking: "Checking quality..." },
  de: { creating: "Vorschau erstellen...", checking: "Qualität wird geprüft..." },
  fi: { creating: "Esikatselun luominen...", checking: "Laatua tarkistetaan..." },
  es: { creating: "Creación de vista previa...", checking: "Comprobando la calidad..." },
}
export const PREVIEW_LANGS = Object.keys(PREVIEW_STATEMENTS)

// How long a dock arriving in place of another waits, so the two pass rather
// than overlap (the docks in components/embroidery-label.tsx).
export const SWAP_DELAY_MS = 150
