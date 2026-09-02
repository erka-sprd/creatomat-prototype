"use client"

import MobileDrawer from "@/components/mobile/mobile-drawer"
import { UploadPanel } from "@/components/ui/upload-panel/UploadPanel"
import { AI_IMAGE_SRCS, GRAPHIC_SRCS } from "@/lib/graphics-library"

// Mobile presentation of the designer's add panels — the same Graphics /
// Uploads / AI content the desktop left slide-in panels show, re-housed as a
// vaul bottom drawer (create-omat presents these via ResponsiveDrawer below
// the breakpoint). Driven by the shared `activePanel` state.

export type MobilePanel = "graphics" | "uploads" | "ai"

type MobilePanelsDrawerProps = {
    panel: MobilePanel | null
    onClose: () => void
    onPlaceImage: (src: string) => void
    pendingUpload?: { dataUrl: string; name: string } | null
    onPendingUploadConsumed?: () => void
}

const PANEL_TITLES: Record<MobilePanel, string> = {
    graphics: "Graphics",
    uploads: "Uploads",
    ai: "AI design",
}

export default function MobilePanelsDrawer({
    panel,
    onClose,
    onPlaceImage,
    pendingUpload,
    onPendingUploadConsumed,
}: MobilePanelsDrawerProps) {
    return (
        <MobileDrawer
            open={panel !== null}
            onOpenChange={open => {
                if (!open) onClose()
            }}
            title={panel ? PANEL_TITLES[panel] : ""}
            heightClassName="h-[70dvh]"
        >
            {panel === "graphics" && (
                <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                    <div className="grid grid-cols-3 gap-0">
                        {GRAPHIC_SRCS.map(src => (
                            <button
                                key={src}
                                type="button"
                                onClick={() => {
                                    onPlaceImage(src)
                                    onClose()
                                }}
                                className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden border-r border-b border-neutral-100 p-3 transition-colors active:bg-neutral-50"
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className="max-h-full max-w-full object-contain select-none"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {panel === "uploads" && (
                <UploadPanel
                    onPlaceImage={src => {
                        onPlaceImage(src)
                        onClose()
                    }}
                    pending={pendingUpload}
                    onPendingConsumed={onPendingUploadConsumed}
                />
            )}

            {panel === "ai" && (
                <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                    <div className="grid grid-cols-3 gap-0">
                        {AI_IMAGE_SRCS.map(src => (
                            <button
                                key={src}
                                type="button"
                                onClick={() => {
                                    onPlaceImage(src)
                                    onClose()
                                }}
                                className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden border-r border-b border-neutral-100 p-3 transition-colors active:bg-neutral-50"
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className="max-h-full max-w-full object-contain select-none"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </MobileDrawer>
    )
}
