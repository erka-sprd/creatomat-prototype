"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

// create-omat Icon-set glyphs used by the dock, inlined at the kit's 24px /
// currentColor defaults. cart-gradient carries the same red→blue→green gradient
// as the Add-to-basket button's border.
const CartGradientIcon = () => (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6 2C6.51284 2 6.93551 2.38604 6.99327 2.88338L7 3V4.06888L20.0712 5.00254C20.6113 5.04111 21.015 5.49956 20.9997 6.02738L20.9899 6.14142L19.9899 13.1414C19.925 13.5962 19.5605 13.943 19.1134 13.9936L19 14H7V16H17C18.6569 16 20 17.3431 20 19C20 20.6569 18.6569 22 17 22C15.3431 22 14 20.6569 14 19C14 18.6494 14.0602 18.3128 14.1707 18H8.82929C8.93985 18.3128 9 18.6494 9 19C9 20.6569 7.65685 22 6 22C4.34315 22 3 20.6569 3 19C3 17.6938 3.83481 16.5825 5 16.1707V13V4H4C3.48716 4 3.06449 3.61396 3.00673 3.11662L3 3C3 2.48716 3.38604 2.06449 3.88338 2.00673L4 2H6ZM7 12H18.133L18.858 6.921L7 6.07398V12ZM16 19C16 18.4477 16.4477 18 17 18C17.5523 18 18 18.4477 18 19C18 19.5523 17.5523 20 17 20C16.4477 20 16 19.5523 16 19ZM5 19C5 18.4477 5.44772 18 6 18C6.55228 18 7 18.4477 7 19C7 19.5523 6.55228 20 6 20C5.44772 20 5 19.5523 5 19Z"
            fill="url(#dock-cart-gradient)"
        />
        <defs>
            <linearGradient
                id="dock-cart-gradient"
                x1="4.34986"
                y1="12"
                x2="21.7312"
                y2="12"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#DC2626" />
                <stop offset="0.497041" stopColor="#4D52D2" />
                <stop offset="1" stopColor="#16A34A" />
            </linearGradient>
        </defs>
    </svg>
)

const TagIcon = () => (
    <svg width={24} height={24} viewBox="0 0 25 24" fill="none" aria-hidden>
        <path
            d="M11.5586 2.00195L11.6162 2.00684L11.6768 2.01562L11.7295 2.02637L11.8369 2.05859L11.9043 2.08496L12.0361 2.15527L12.125 2.21973L12.207 2.29297L21.2451 11.333C22.0534 12.2367 22.0923 13.5818 21.3281 14.5625L21.207 14.707L15.167 20.7451C14.2633 21.5534 12.9182 21.5923 11.9375 20.8281L11.793 20.707L2.79297 11.707C2.63678 11.5508 2.53759 11.3484 2.50879 11.1318L2.5 11V7C2.5 4.23858 4.73858 2 7.5 2L11.5586 2.00195ZM7.5 4C5.90248 4 4.59636 5.24866 4.50488 6.82324L4.5 7V10.585L13.167 19.2549C13.3329 19.4031 13.573 19.4215 13.7305 19.3359L13.793 19.293L19.7549 13.333C19.9031 13.1671 19.9215 12.927 19.8359 12.7695L19.793 12.707L11.085 4H7.5ZM9.5 6C11.1569 6 12.5 7.34315 12.5 9C12.5 10.6569 11.1569 12 9.5 12C7.84315 12 6.5 10.6569 6.5 9C6.5 7.34315 7.84315 6 9.5 6ZM9.5 8C8.94772 8 8.5 8.44772 8.5 9C8.5 9.55228 8.94772 10 9.5 10C10.0523 10 10.5 9.55228 10.5 9C10.5 8.44772 10.0523 8 9.5 8Z"
            fill="currentColor"
        />
    </svg>
)

const CheckIcon = () => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
            d="M19.2929 6.29289C19.6834 5.90237 20.3166 5.90237 20.7071 6.29289C21.0676 6.65338 21.0953 7.22061 20.7903 7.6129L20.7071 7.70711L10.7071 17.7071C10.3466 18.0676 9.77939 18.0953 9.3871 17.7903L9.29289 17.7071L4.29289 12.7071C3.90237 12.3166 3.90237 11.6834 4.29289 11.2929C4.65338 10.9324 5.22061 10.9047 5.6129 11.2097L5.70711 11.2929L10 15.585L19.2929 6.29289Z"
            fill="currentColor"
        />
    </svg>
)

const AddIcon = () => (
    <svg width={24} height={24} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.8277 4.06952C10.7796 3.65507 10.4273 3.33337 9.99998 3.33337C9.53974 3.33337 9.16665 3.70647 9.16665 4.16671V9.16671H4.16665L4.06946 9.17231C3.65501 9.22045 3.33331 9.57268 3.33331 10C3.33331 10.4603 3.70641 10.8334 4.16665 10.8334H9.16665V15.8334L9.17225 15.9306C9.22039 16.345 9.57262 16.6667 9.99998 16.6667C10.4602 16.6667 10.8333 16.2936 10.8333 15.8334V10.8334H15.8333L15.9305 10.8278C16.3449 10.7796 16.6666 10.4274 16.6666 10C16.6666 9.5398 16.2935 9.16671 15.8333 9.16671H10.8333V4.16671L10.8277 4.06952Z"
        />
    </svg>
)

// Mobile bottom dock — replica of create-omat's dock-v2 (Dock/MainDock/SubDock):
// a floating white card with Products + Add, a gradient-bordered Finish button,
// and an expandable sub-dock row (Graphics / Text / Uploads / AI) above. When an
// element is selected on the canvas, the whole dock swaps to the "Done ✓" pill
// (create-omat's DockUnselectButton — its general.unselect string reads "Done").

type MobileDockProps = {
    inspectorMode: boolean
    actionDisabled: boolean
    onProductsClick: () => void
    onGraphicsClick: () => void
    onTextClick: () => void
    onUploadsClick: () => void
    onAIClick: () => void
    onFinish: () => void
    onUnselect: () => void
}

function DockItem({
    icon,
    label,
    onClick,
    active = false,
    disabled = false,
    className = "",
}: {
    icon: ReactNode
    label: string
    onClick: () => void
    active?: boolean
    disabled?: boolean
    className?: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={
                "flex flex-col items-center justify-center text-black transition-all duration-200 focus:bg-[var(--sprd-neutral-100)] focus:outline-none focus-visible:bg-[var(--sprd-neutral-100)] focus-visible:outline-none " +
                "max-w-[120px] min-w-[68px] hover:bg-[var(--sprd-neutral-200)] active:bg-[var(--sprd-neutral-200)] " +
                "rounded-lg px-3 py-2 " +
                (active ? "bg-neutral-100 " : "bg-transparent ") +
                (disabled ? "cursor-not-allowed opacity-30 " : "cursor-pointer ") +
                className
            }
        >
            <div className="mb-1.5 flex h-6 w-6 items-center justify-center">{icon}</div>
            <span className="w-full overflow-hidden text-center text-xs leading-4 font-semibold text-ellipsis whitespace-nowrap">
                {label}
            </span>
        </button>
    )
}

export default function MobileDock({
    inspectorMode,
    actionDisabled,
    onProductsClick,
    onGraphicsClick,
    onTextClick,
    onUploadsClick,
    onAIClick,
    onFinish,
    onUnselect,
}: MobileDockProps) {
    const [showSubDock, setShowSubDock] = useState(false)
    const dockRef = useRef<HTMLDivElement>(null)

    // Close the sub-dock when tapping anywhere outside the dock.
    useEffect(() => {
        if (!showSubDock) return
        const onOutside = (e: MouseEvent | TouchEvent) => {
            if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
                setShowSubDock(false)
            }
        }
        document.addEventListener("mousedown", onOutside)
        document.addEventListener("touchstart", onOutside)
        return () => {
            document.removeEventListener("mousedown", onOutside)
            document.removeEventListener("touchstart", onOutside)
        }
    }, [showSubDock])

    // Selecting an element on the canvas collapses the sub-dock.
    useEffect(() => {
        if (inspectorMode) setShowSubDock(false)
    }, [inspectorMode])

    const runAndClose = (fn: () => void) => () => {
        setShowSubDock(false)
        fn()
    }

    const cardShadow = { boxShadow: "0px 2px 4px 0px #25211F0D" }

    return (
        <div
            ref={dockRef}
            className="dlg:hidden fixed bottom-2 left-1/2 z-40 flex w-full max-w-[386px] -translate-x-1/2 items-center justify-center gap-1 px-2 pb-[env(safe-area-inset-bottom)]"
        >
            {inspectorMode ? (
                <div
                    key="unselect"
                    className="animate-in fade-in slide-in-from-bottom-4 flex h-[70px] items-center duration-200"
                >
                    <button
                        type="button"
                        onClick={onUnselect}
                        className="inline-flex h-fit min-h-10 w-fit cursor-pointer items-center justify-center gap-2 rounded-3xl bg-black px-4 py-3 text-xs font-semibold text-white active:bg-black"
                        style={cardShadow}
                    >
                        Done
                        <CheckIcon />
                    </button>
                </div>
            ) : (
                <div
                    key="main"
                    className="animate-in fade-in slide-in-from-bottom-4 flex w-full flex-col-reverse items-center gap-1 duration-200"
                >
                    {/* Main row: Products + Add card, Finish card */}
                    <div className="flex items-center justify-center gap-1">
                        <div
                            className="relative flex max-w-full items-center justify-center rounded-xl bg-white p-1"
                            style={cardShadow}
                        >
                            <DockItem
                                icon={<TagIcon />}
                                label="Products"
                                onClick={runAndClose(onProductsClick)}
                                className="min-w-[100px]"
                            />
                            <DockItem
                                icon={<AddIcon />}
                                label="Add"
                                onClick={() => setShowSubDock(prev => !prev)}
                                active={showSubDock}
                                disabled={actionDisabled}
                                className="min-w-[100px]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={runAndClose(onFinish)}
                            disabled={actionDisabled}
                            className={
                                "relative flex h-[70px] flex-col items-center justify-center rounded-xl border-2 border-transparent px-3 py-2 text-black transition-all duration-200 " +
                                (actionDisabled ? "cursor-not-allowed opacity-30" : "cursor-pointer")
                            }
                            style={{
                                background:
                                    "linear-gradient(white, white) padding-box, linear-gradient(45deg, #DC2626, #4D52D2, #16A34A) border-box",
                                ...cardShadow,
                            }}
                        >
                            <div className="mb-1.5 flex h-6 w-6 items-center justify-center">
                                <CartGradientIcon />
                            </div>
                            <span className="w-full overflow-hidden text-center text-xs leading-4 font-semibold text-ellipsis whitespace-nowrap">
                                Add to basket
                            </span>
                        </button>
                    </div>

                    {/* Sub-dock: the four add tools, slides in above the main row */}
                    {showSubDock && (
                        <div className="animate-in slide-in-from-bottom-4 fade-in flex items-center justify-center gap-1 duration-300 ease-out">
                            <div
                                className="relative flex max-w-full items-center justify-center rounded-xl bg-white p-1"
                                style={cardShadow}
                            >
                                <DockItem
                                    icon={<img src="/icons/icon-graphics.svg" alt="" className="h-6 w-6" />}
                                    label="Graphics"
                                    onClick={runAndClose(onGraphicsClick)}
                                    disabled={actionDisabled}
                                />
                                <DockItem
                                    icon={<img src="/icons/icon-text.svg" alt="" className="h-6 w-6" />}
                                    label="Text"
                                    onClick={runAndClose(onTextClick)}
                                    disabled={actionDisabled}
                                />
                                <DockItem
                                    icon={<img src="/icons/icon-upload.svg" alt="" className="h-6 w-6" />}
                                    label="Uploads"
                                    onClick={runAndClose(onUploadsClick)}
                                    disabled={actionDisabled}
                                />
                                <DockItem
                                    icon={<img src="/icons/icon-sparkles-ai.svg" alt="" className="h-6 w-6" />}
                                    label="AI design"
                                    onClick={runAndClose(onAIClick)}
                                    disabled={actionDisabled}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
