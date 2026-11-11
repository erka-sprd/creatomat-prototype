"use client"

// The edit mode's Color tab: which colour property (background, text,
// border), the class the element has for it in code, and the kit's palette —
// a click previews the colour live (the provider sets it inline).
import {
  COLOR_PROPERTIES,
  type ColorProperty,
  colorClassesOf,
  sprdColorClass,
} from "@/lib/dev-edit/color-tokens"

export type Token = { name: string; value: string }

const FAMILY_ORDER = ["neutral", "black", "white", "blue", "red", "green", "orange", "brand", "focus"]

function groupTokens(tokens: Token[]): [string, Token[]][] {
  const groups = new Map<string, Token[]>()
  for (const token of tokens) {
    const family = token.name.split("-")[0]
    groups.set(family, [...(groups.get(family) ?? []), token])
  }
  return [...groups.entries()].sort(
    ([a], [b]) => FAMILY_ORDER.indexOf(a) - FAMILY_ORDER.indexOf(b)
  )
}

export default function ColorTab({
  classes,
  tokens,
  property,
  onPropertyChange,
  picked,
  onPick,
}: {
  classes: string[]
  tokens: Token[]
  property: ColorProperty
  onPropertyChange: (property: ColorProperty) => void
  picked: Token | undefined
  onPick: (token: Token) => void
}) {
  const inCode = colorClassesOf(classes, property)
  return (
    // The property switch and its "In code" line sit together (8px); the
    // palette 20px below them, its families 16px apart.
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5">
          {COLOR_PROPERTIES.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPropertyChange(p.id)}
              className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${
                property === p.id
                  ? "bg-[#00FF9C] text-black"
                  : "border border-[#00FF9C]/25 text-[#00FF9C] hover:bg-[#00FF9C]/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="text-[#C8FFE6]/70">
          In code:{" "}
          <span className="text-[#00FF9C]">{inCode.length > 0 ? inCode.join(" ") : "—"}</span>
          {picked && (
            <>
              {" "}
              → <span className="text-[#00FF9C]">{sprdColorClass(property, picked.name)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex max-h-[340px] flex-col gap-4 overflow-y-auto">
        {groupTokens(tokens).map(([family, group]) => (
          <div key={family} className="flex flex-col gap-2">
            <span className="tracking-[0.08em] text-[#00FF9C]/55 uppercase">{family}</span>
            <div className="flex flex-wrap gap-1.5">
              {group.map(token => (
                <button
                  key={token.name}
                  type="button"
                  title={`${token.name} ${token.value}`}
                  onClick={() => onPick(token)}
                  className={`size-6 rounded-md border transition-transform hover:scale-110 ${
                    picked?.name === token.name
                      ? "border-[#00FF9C] ring-2 ring-[#00FF9C] ring-offset-1 ring-offset-black"
                      : "border-white/15"
                  }`}
                  style={{ backgroundColor: token.value }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
