"use client"

// Exported so the mobile edit sheet shares the same palette.
export const MASTER_COLOR_PALETTE = [
  ["#000000", "#686868", "#9C9C9C", "#E3E3E3", "#FFFFFF"],
  ["#0027BF", "#0044F7", "#3669F8", "#88A6FC", "#B8C9FF"],
  ["#510B94", "#8B3DD2", "#AA6BDE", "#CDA1ED", "#DFC5F2"],
  ["#B5095E", "#FF249B", "#FF5EB9", "#FF94D2", "#FFBBE2"],
  ["#BD060B", "#FF2D30", "#FF4E50", "#FF9495", "#FFBABB"],
  ["#CF6F1E", "#FF9B32", "#FFB55A", "#FFD299", "#FFE3BD"],
  ["#B28217", "#FFCB3A", "#FFD95E", "#FFE899", "#FAECBC"],
  ["#5EC42E", "#72ED38", "#B3FE75", "#CBFE9B", "#DEFEBF"],
  ["#298C27", "#60D553", "#85DC77", "#B6F2AB", "#D7F4D0"],
  ["#00A371", "#00EBA9", "#3BEDBE", "#89F7D9", "#BBFCEA"],
  ["#0087A1", "#00B6D6", "#1BE5FF", "#AEF1FA"],
]

type TextColorPanelProps = {
  open: boolean
  onClose: () => void
  currentColor: string
  onChange: (color: string) => void
}

export function TextColorPanel({ open, onClose, currentColor, onChange }: TextColorPanelProps) {
  const palette = MASTER_COLOR_PALETTE.flat()

  return (
    <div
      data-text-color-panel="true"
      className={`absolute z-10 inset-y-[4px] left-[4px] w-[275px] rounded-[12px] bg-white shadow-[32px_0px_50px_0px_rgba(0,0,0,0.05)] flex flex-col transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "-translate-x-[calc(100%+100px)]"
      }`}
    >
      <div className="px-6 pt-6 flex-shrink-0">
        <h3 className="text-lg leading-[26px] font-medium">Text color</h3>
        <span className="text-sm leading-5 font-medium text-neutral-700">
          {currentColor.toUpperCase()}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <div className="grid max-w-[232px] grid-cols-5 gap-y-2">
          {palette.map(color => {
            const isActive = color.toLowerCase() === currentColor.toLowerCase()
            return (
              <button
                key={color}
                type="button"
                aria-label={color}
                onClick={() => onChange(color)}
                className={`flex size-10 items-center justify-center rounded-full cursor-pointer transition-colors ${
                  isActive ? "ring-2 ring-black" : "hover:bg-neutral-100"
                }`}
              >
                <span
                  className="block size-7 rounded-full border border-neutral-300"
                  style={{ backgroundColor: color }}
                />
              </button>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        aria-label="Close text color panel"
        onClick={onClose}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-2xl border border-neutral-200 bg-white px-0.5 py-3 hover:bg-neutral-50"
      >
        <img src="/icons/icon-chevron-left.svg" alt="" className="size-6" />
      </button>
    </div>
  )
}
