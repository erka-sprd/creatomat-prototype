"use client"

// Mobile top action header — replica of create-omat's DesignerActionHeader:
// a 60px pointer-events-none overlay across the top of the canvas with
// undo/redo joined pills (left), a Color pill with the current swatch (centre)
// and a "more" button (right). Hidden while an element is selected — the
// editor bar takes over the top of the canvas then.
//
// Sizing/colours are taken 1:1 from create-omat:
//   undo/redo/more  px-2 py-2, bg --neutral-100, active --neutral-200,
//                   disabled text-neutral-500, 24px currentColor icons
//   colour pill     kit Button variant="invert" size="m" + overrides:
//                   min-h-10 px-4 py-2, gap-1, rounded-full, bg --neutral-100;
//                   AppearanceSelectorOption size="s" = 24px ring / 20px swatch;
//                   label text-xs font-medium capitalize; Caret 24px
// Icons are the create-omat Icon set glyphs (undo / redo / more) inlined, so
// currentColor drives the disabled state.

type MobileActionHeaderProps = {
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    colorName: string
    colorHex: string
    onColorClick: () => void
    onMoreClick: () => void
}

const UndoIcon = () => (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M9.70711 13.2929C10.0676 13.6534 10.0953 14.2206 9.7903 14.6129L9.70711 14.7071C9.34662 15.0676 8.77939 15.0953 8.3871 14.7903L8.29289 14.7071L4.29289 10.7071C4.2575 10.6717 4.22531 10.6343 4.19633 10.5953L4.12467 10.4841L4.07123 10.3713L4.03585 10.266L4.01102 10.1485L4.00398 10.0898L4 10L4.00279 9.92476L4.02024 9.79927L4.04974 9.68786L4.09367 9.57678L4.146 9.47929L4.2097 9.3871L4.29289 9.29289L8.29289 5.29289C8.68342 4.90237 9.31658 4.90237 9.70711 5.29289C10.0676 5.65338 10.0953 6.22061 9.7903 6.6129L9.70711 6.70711L7.415 9H16C18.7614 9 21 11.2386 21 14C21 16.6888 18.8777 18.8818 16.2169 18.9954L16 19H15C14.4477 19 14 18.5523 14 18C14 17.4872 14.386 17.0645 14.8834 17.0067L15 17H16C17.6569 17 19 15.6569 19 14C19 12.4023 17.7511 11.0963 16.1763 11.0051L16 11H7.415L9.70711 13.2929Z"
            fill="currentColor"
        />
    </svg>
)

const RedoIcon = () => (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M10 19H9C6.23 19 4 16.7618 4 14.0039C4 11.2361 6.23 9.00785 9 9.00785H17.59L15.29 6.71965V6.71865C14.89 6.31896 14.89 5.68946 15.29 5.29976C15.68 4.90008 16.31 4.90008 16.71 5.29976L20.71 9.29662V9.29563C20.8 9.38555 20.87 9.49547 20.92 9.62537C20.97 9.74527 20.99 9.86518 21 10.0051C20.99 10.135 20.97 10.2549 20.92 10.3848C20.87 10.5047 20.8 10.6146 20.71 10.7145L16.71 14.7114C16.31 15.1011 15.68 15.1011 15.29 14.7114C14.89 14.3117 14.89 13.6822 15.289 13.2925L17.589 11.0043H8.99C7.33 11.0043 5.99 12.3432 5.99 14.0019C5.99 15.6506 7.33 16.9996 8.99 16.9996H9.99C10.54 16.9996 10.99 17.4392 10.99 17.9988C10.99 18.5484 10.54 18.998 9.99 18.998L10 19Z"
            fill="currentColor"
        />
    </svg>
)

const MoreIcon = () => (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12C3 10.8954 3.89543 10 5 10ZM12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10ZM19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12C17 10.8954 17.8954 10 19 10Z"
            fill="currentColor"
        />
    </svg>
)

// The kit's v2 Caret — a small filled triangle pointing down (NOT the v1
// caret, which is a large right-pointing arrow). Rendered at fontSize 24 like
// create-omat's `<Caret fontSize={24} />`.
const CaretIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" style={{ fontSize: 24 }} aria-hidden>
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.9994 13.9998L16 10.0003H8L11.9994 13.9998Z"
            fill="currentColor"
        />
    </svg>
)

export default function MobileActionHeader({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    colorName,
    colorHex,
    onColorClick,
    onMoreClick,
}: MobileActionHeaderProps) {
    const iconButton =
        "flex cursor-pointer bg-[var(--sprd-neutral-100)] px-2 py-2 text-black transition-all duration-200 active:bg-[var(--sprd-neutral-200)] disabled:text-neutral-500"

    return (
        <div className="dlg:hidden pointer-events-none absolute top-0 left-1/2 z-[14] flex h-[60px] w-full -translate-x-1/2 px-2">
            <div className="flex w-full items-center justify-between gap-1">
                {/* Undo / redo joined pills */}
                <div className="pointer-events-auto flex">
                    <button
                        type="button"
                        aria-label="Undo"
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`${iconButton} rounded-tl-full rounded-bl-full`}
                    >
                        <UndoIcon />
                    </button>
                    <button
                        type="button"
                        aria-label="Redo"
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`${iconButton} rounded-tr-full rounded-br-full`}
                    >
                        <RedoIcon />
                    </button>
                </div>

                {/* Colour pill: current swatch + label, opens the colour drawer */}
                <div className="pointer-events-auto flex items-center text-center">
                    <button
                        type="button"
                        aria-label={`Product colour${colorName ? `: ${colorName}` : ""}`}
                        onClick={onColorClick}
                        className="inline-flex h-fit min-h-10 w-fit cursor-pointer items-center justify-center gap-1 rounded-full bg-[var(--sprd-neutral-100)] px-4 py-2 text-sm font-semibold text-black transition-all duration-200 active:bg-[var(--sprd-neutral-200)]"
                    >
                        {/* AppearanceSelectorOption size="s": 24px ring, 20px swatch */}
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 p-px">
                            <span
                                className="block size-5 rounded-full border border-transparent"
                                style={{ backgroundColor: colorHex }}
                            />
                        </span>
                        {/* create-omat shows the static word, not the colour
                            name — the swatch carries the colour. */}
                        <p className="max-w-23 truncate text-xs font-medium text-black capitalize">
                            Color
                        </p>
                        <CaretIcon />
                    </button>
                </div>

                {/* More actions */}
                <div className="pointer-events-auto flex">
                    <button
                        type="button"
                        aria-label="More actions"
                        onClick={onMoreClick}
                        className={`${iconButton} rounded-full`}
                    >
                        <MoreIcon />
                    </button>
                </div>
            </div>
        </div>
    )
}
