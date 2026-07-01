"use client"

// Mirrors create-omat's useFonts: module-level Set + Promise map so the same
// font is never requested twice. Loads Google Fonts via a stylesheet <link>
// and resolves once document.fonts reports the family available.

const loadedFonts = new Set<string>()
const loadingPromises = new Map<string, Promise<string>>()

// Request regular + bold + italic (both weights). Google Fonts silently omits
// variants a family doesn't have, so this is safe for every font and lets us
// detect availability afterwards via getFontVariants().
const buildGoogleFontsUrl = (family: string) =>
  `https://fonts.googleapis.com/css2?family=${family.replace(
    / /g,
    "+"
  )}:ital,wght@0,400;0,700;1,400;1,700&display=swap`

/**
 * Which style variants a (loaded) font actually provides, read from the
 * registered FontFace objects. Returns optimistic { true, true } for a family
 * that hasn't registered any faces yet (unknown → don't disable prematurely).
 */
export const getFontVariants = (family: string): { bold: boolean; italic: boolean } => {
  if (typeof document === "undefined") return { bold: true, italic: true }
  let found = false
  let bold = false
  let italic = false
  document.fonts.forEach(f => {
    const fam = f.family.replace(/^["']|["']$/g, "")
    if (fam !== family) return
    found = true
    // Variable fonts report a weight range like "100 900" — take the upper bound.
    const weights = String(f.weight)
      .split(/\s+/)
      .map(Number)
      .filter(n => !Number.isNaN(n))
    if (weights.length && Math.max(...weights) >= 600) bold = true
    if (/italic|oblique/i.test(f.style)) italic = true
  })
  return found ? { bold, italic } : { bold: true, italic: true }
}

export const useFonts = () => {
  const loadFont = (family: string): Promise<string> => {
    if (typeof document === "undefined") return Promise.resolve(family)
    if (loadedFonts.has(family)) return Promise.resolve(family)
    if (loadingPromises.has(family)) return loadingPromises.get(family)!

    const promise = new Promise<string>(resolve => {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = buildGoogleFontsUrl(family)
      link.onload = () => {
        // Best-effort load of the regular, bold and italic faces so their
        // FontFace entries are registered for getFontVariants().
        Promise.allSettled([
          document.fonts.load(`16px "${family}"`),
          document.fonts.load(`700 16px "${family}"`),
          document.fonts.load(`italic 16px "${family}"`),
        ]).finally(() => {
          loadedFonts.add(family)
          loadingPromises.delete(family)
          resolve(family)
        })
      }
      link.onerror = () => {
        console.error("Failed to load font:", family)
        loadingPromises.delete(family)
        resolve(family)
      }
      document.head.appendChild(link)
    })

    loadingPromises.set(family, promise)
    return promise
  }

  return { loadFont }
}
