// Size/quantity selector helpers. Kept out of designer.tsx so that file exports
// only React components — otherwise these non-component exports make the module
// ineligible for React Fast Refresh and every edit triggers a full page reload.

export function getVolumeDiscountText(totalSelected: number) {
  const n = Math.max(0, Math.floor(totalSelected || 0))

  if (n <= 5) return "From 5 items -10% reduction"
  if (n <= 19) return "From 20 items -15% reduction"
  if (n <= 49) return "From 50 items -25% reduction"
  return `For ${n} items -50% reduction`
}

export function onlyDigits(input: string) {
  // Keep digits only, max 5 chars.
  const digits = input.replace(/[^0-9]+/g, "").slice(0, 5)
  if (digits === "") return ""

  // Remove leading zeros if there's a non-zero number at the end (e.g. 01 -> 1, 004 -> 4).
  const trimmed = digits.replace(/^0+/, "")

  // If input was all zeros, keep a single 0.
  return trimmed === "" ? "0" : trimmed
}

export function shouldTriggerRemoveOnBlur(rawValue: string) {
  const v = rawValue.trim()
  // Empty OR any all-zero value should behave like selecting "Remove".
  return v === "" || /^0+$/.test(v)
}

export function applyDropdownPick(opt: string): { removed: boolean; value: string } {
  if (opt === "Remove") return { removed: true, value: "" }
  return { removed: false, value: opt }
}
