// Edit mode freezes the page as it was hovered. CSS :hover follows the
// pointer, and edit mode's shield takes the pointer — so the moment it turns
// on, everything then matching :hover is marked, and every :hover rule on the
// page is copied with :hover swapped for that mark. The hovered look (incl.
// Tailwind's hover: and group-hover:) then holds until edit mode turns off.

const ATTR = "data-dev-hover"
const FROZEN = `[${ATTR}]`
const STYLE_ID = "dev-edit-frozen-hover"

// The rules in `list` that use :hover, rewritten — grouping rules (@layer,
// @media, @supports…) re-wrapped around the ones inside them.
function frozenRules(list: CSSRuleList): string[] {
  const out: string[] = []
  for (const rule of Array.from(list)) {
    if (!rule.cssText.includes(":hover")) continue
    if (rule instanceof CSSStyleRule) {
      // Its own nested rules (Tailwind v4's `&:hover { @media … }`) come along.
      out.push(rule.cssText.replaceAll(":hover", FROZEN))
    } else if ("cssRules" in rule) {
      const inner = frozenRules((rule as CSSGroupingRule).cssRules)
      if (inner.length > 0) {
        const prelude = rule.cssText.slice(0, rule.cssText.indexOf("{"))
        out.push(`${prelude}{\n${inner.join("\n")}\n}`)
      }
    }
  }
  return out
}

/** Freezes what's hovered right now; returns the undo. Call before the shield mounts. */
export function freezeHover(): () => void {
  const hovered = Array.from(document.querySelectorAll<HTMLElement>(":hover"))
  if (hovered.length === 0) return () => {}

  const rules: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      rules.push(...frozenRules(sheet.cssRules))
    } catch {
      // A cross-origin sheet can't be read — its hover styles just drop.
    }
  }

  hovered.forEach(el => el.setAttribute(ATTR, ""))
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = rules.join("\n")
  document.head.appendChild(style)

  return () => {
    hovered.forEach(el => el.removeAttribute(ATTR))
    style.remove()
  }
}
