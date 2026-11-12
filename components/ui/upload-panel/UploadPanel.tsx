"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { KitButton } from "@/components/kit-button"
import { hasImageDrag, startImageDrag } from "@/lib/canvas-drop"
import { pixelSizeLabel } from "@/lib/print-quality"
import { cn } from "@/lib/utils"

// Ported from create-omat's upload panel (desktop). Self-contained: native
// drag-and-drop + file input, local object URLs, simulated upload progress.
// Placing an upload on the canvas reuses the designer's graphic-placement.

const SUPPORTED_MIME_TYPES = new Set([
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/svg+xml",
    "image/bmp",
])
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const MAX_FILES_LIMIT = 10

type UploadStatus = "uploading" | "uploaded" | "error"
type UploadError = "size_too_large" | "unsupported"

export type UploadEntry = {
    id: string
    name: string
    url: string
    status: UploadStatus
    progress: number
    error?: UploadError
    sizeMB?: number
    // An SVG: prints sharp at any size.
    vector?: boolean
}

const UploadIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M9 5C9.55228 5 10 5.44772 10 6C10 6.51284 9.61396 6.93551 9.11662 6.99327L9 7H3C2.44772 7 2 6.55228 2 6C2 5.48716 2.38604 5.06449 2.88338 5.00673L3 5H9Z"
            fill="currentColor"
        />
        <path
            d="M6.15039 2C6.66323 2 7.0859 2.38604 7.14366 2.88338L7.15039 3V9C7.15039 9.55228 6.70268 10 6.15039 10C5.63755 10 5.21488 9.61396 5.15712 9.11662L5.15039 9V3C5.15039 2.44772 5.59811 2 6.15039 2Z"
            fill="currentColor"
        />
        <path
            d="M6 13V19C6 20.6569 7.34315 22 9 22H19C20.6569 22 22 20.6569 22 19V9C22 7.34315 20.6569 6 19 6H13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M17.01 10C17.5623 10 18.01 10.4477 18.01 11C18.01 11.5128 17.624 11.9355 17.1266 11.9933L17 12C16.4477 12 16 11.5523 16 11C16 10.4872 16.386 10.0645 16.8834 10.0067L17.01 10Z"
            fill="currentColor"
        />
        <path
            d="M9.30662 13.2797C10.5733 12.0608 12.2485 12.0157 13.5577 13.1563L13.7071 13.2931L18.7071 18.2931C19.0976 18.6836 19.0976 19.3168 18.7071 19.7073C18.3466 20.0678 17.7794 20.0955 17.3871 19.7905L17.2929 19.7073L12.3066 14.7208C11.8017 14.2349 11.3053 14.2025 10.8126 14.6127L10.7071 14.7073L6.70711 18.7073C6.31658 19.0979 5.68342 19.0979 5.29289 18.7073C4.93241 18.3468 4.90468 17.7796 5.2097 17.3873L5.29289 17.2931L9.30662 13.2797Z"
            fill="currentColor"
        />
        <path
            d="M16.3066 15.2797C17.5733 14.0608 19.2485 14.0157 20.5577 15.1563L20.7071 15.2931L22.7071 17.2931C23.0976 17.6836 23.0976 18.3168 22.7071 18.7073C22.3466 19.0678 21.7794 19.0955 21.3871 18.7905L21.2929 18.7073L19.3066 16.7208C18.8017 16.2349 18.3053 16.2025 17.8126 16.6127L17.7071 16.7073L16.7071 17.7073C16.3166 18.0979 15.6834 18.0979 15.2929 17.7073C14.9324 17.3469 14.9047 16.7796 15.2097 16.3873L15.2929 16.2931L16.3066 15.2797Z"
            fill="currentColor"
        />
    </svg>
)

const CloseIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M6 6L18 18M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
)

const CheckIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M5 12.5L10 17.5L19 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

// create-omat's contrast check (app/api/image-quality, isLightImage): an image
// whose average colour is brighter than this (0–255, perceived) gets a dark
// tile, so a white logo doesn't vanish into the light grey.
const LIGHT_IMAGE_BRIGHTNESS = 150

// The image is averaged from a copy at most this many pixels a side — plenty
// for an average, and cheap for a 4000 px upload.
const CONTRAST_SAMPLE_PX = 128

/**
 * Whether an image is light — create-omat's check, in the browser: the
 * image's average colour, each pixel weighted by its opacity (as sharp's
 * resize to one pixel does), its perceived brightness against
 * LIGHT_IMAGE_BRIGHTNESS. Averaged by hand: a canvas drawn down to one pixel
 * samples only a few.
 */
function isLightImage(img: HTMLImageElement): boolean {
    const scale = Math.min(1, CONTRAST_SAMPLE_PX / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return false
    try {
        ctx.drawImage(img, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h).data
        let r = 0
        let g = 0
        let b = 0
        let alpha = 0
        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3] ?? 0
            r += (data[i] ?? 0) * a
            g += (data[i + 1] ?? 0) * a
            b += (data[i + 2] ?? 0) * a
            alpha += a
        }
        if (alpha === 0) return false
        return (r * 299 + g * 587 + b * 114) / 1000 / alpha > LIGHT_IMAGE_BRIGHTNESS
    } catch (e) {
        // A cross-origin image taints the canvas; the tile just stays light.
        console.warn("Upload contrast check failed", e)
        return false
    }
}

// The tile's background, by contrast check and hover — the pixel size's chip
// shares it. The kit's greys (--sprd-neutral-*), as create-omat's neutral-*
// resolve — not Tailwind's own, whose neutral-900 is near-black.
const TILE_BG = {
    light: { rest: "bg-[var(--sprd-neutral-100)]", hover: "bg-[var(--sprd-neutral-200)]" },
    dark: { rest: "bg-[var(--sprd-neutral-900)]", hover: "bg-black" },
}

// An upload's tile: the pixel size bottom left, on the tile's own background.
// No print-quality badge — the canvas's "Maximum size" says it where it matters.
// Exported for the print-quality handoff, which shows two tiles at rest.
export function UploadCard({
    image,
    onRemove,
    onPlace,
}: {
    image: UploadEntry
    onRemove: () => void
    onPlace: () => void
}) {
    const uploading = image.status === "uploading"
    const error = image.status === "error"
    const done = image.status === "uploaded"
    const [size, setSize] = useState<{ w: number; h: number } | null>(null)
    // An SVG's pixel size says nothing about how it prints.
    const sizeLabel = image.vector ? "Vector" : size && pixelSizeLabel(size)
    // A light image sits on a dark tile (isLightImage).
    const [light, setLight] = useState(false)
    // Anywhere on the tile, the remove button shows and the tile darkens.
    const [tileHover, setTileHovered] = useState(false)
    const tone = TILE_BG[light ? "dark" : "light"]
    const bg = tileHover ? tone.hover : tone.rest
    // The image's pixel size and contrast, once it's loaded.
    const imgRef = useRef<HTMLImageElement>(null)
    const measure = (img: HTMLImageElement) => {
        setSize({ w: img.naturalWidth, h: img.naturalHeight })
        setLight(isLightImage(img))
    }
    // An image already in the cache can finish before React listens for its
    // load, and then never fires it: measure it on mount instead.
    useEffect(() => {
        const img = imgRef.current
        if (img?.complete && img.naturalWidth) measure(img)
    }, [image.url])
    return (
        <div
            className={cn(
                // Radii in px, as create-omat's: its rounded-lg is Tailwind's
                // 8px, this app's (shadcn's --radius) 10px. Below md, as
                // create-omat's: a fixed 140px tile in a sideways row.
                "relative flex h-[140px] min-w-[140px] flex-shrink-0 cursor-pointer flex-col gap-2 rounded-[8px] px-0 py-3 md:h-auto md:min-w-0 md:flex-shrink md:p-3",
                error ? "items-center border-2 border-red-600" : cn("border border-neutral-200", bg)
            )}
            onMouseEnter={() => setTileHovered(true)}
            onMouseLeave={() => setTileHovered(false)}
            onClick={() => done && onPlace()}
        >
            {!error && (
                <img
                    ref={imgRef}
                    src={image.url}
                    alt={image.name}
                    // Draggable onto the canvas once uploaded — a half-uploaded
                    // image has nothing to place yet.
                    draggable={done}
                    onDragStart={e => startImageDrag(e, { src: image.url, source: "image-upload" })}
                    onLoad={e => measure(e.currentTarget)}
                    className={cn(
                        "mx-3 h-[116px] w-[116px] flex-shrink-0 object-contain md:mx-0 md:h-[130px] md:w-full",
                        uploading && "opacity-50"
                    )}
                />
            )}

            {/* Only once the upload is in — not while loading. On the tile's
                own background, solid; its text follows the tile's tone. */}
            {done && sizeLabel && (
                <span
                    className={cn(
                        // Flush in the corner: inside the 1px border, so its
                        // corner takes the tile's inner radius (8px − 1px).
                        "absolute bottom-0 left-0 z-[2] rounded-tr-[4px] rounded-bl-[7px] pt-0.5 pr-1 pb-1.5 pl-2 text-xs",
                        light ? "text-[var(--sprd-neutral-200)]" : "text-neutral-500",
                        bg
                    )}
                >
                    {sizeLabel}
                </span>
            )}

            {uploading && (
                <div className="absolute bottom-0 left-0 h-2 w-full rounded bg-neutral-200">
                    <div
                        className="h-2 rounded bg-blue-500 transition-[width] duration-150"
                        style={{ width: `${image.progress}%` }}
                    />
                </div>
            )}

            {error && (
                <p className="px-1 text-xs whitespace-pre-line text-red-600">
                    {image.error === "size_too_large"
                        ? `Your file is ${Math.floor(image.sizeMB ?? 0)}MB. Maximum allowed size is ${
                              MAX_FILE_SIZE / (1024 * 1024)
                          }MB.`
                        : "We don’t support this file type. Please upload PNG, JPG, WEBP or SVG."}
                </p>
            )}

            {done && image.progress === 100 && (
                <div className="absolute top-0 right-0 z-[2] rounded-[8px] bg-neutral-200 p-1.5">
                    <span className="text-green-700">
                        <CheckIcon size={20} />
                    </span>
                </div>
            )}

            {/* Remove: the ✕ in the top-right corner, with the tile's radius —
                from md shown on any hover of the tile; below it, as in
                create-omat, always (a phone has no hover). */}
            <button
                type="button"
                aria-label="Remove"
                onClick={e => {
                    e.stopPropagation()
                    onRemove()
                }}
                className={cn(
                    "absolute top-0 right-0 z-[4] cursor-pointer rounded-[6px] bg-neutral-200 p-1.5 transition-opacity hover:bg-white",
                    uploading
                        ? "opacity-100"
                        : tileHover
                          ? "pointer-events-auto bg-neutral-300 opacity-100"
                          : "md:pointer-events-none md:opacity-0",
                    error && "bg-red-600 text-white opacity-100 hover:bg-red-600 hover:text-black"
                )}
            >
                <CloseIcon size={20} />
            </button>
        </div>
    )
}

export function UploadPanel({
    onPlaceImage,
    pending,
    onPendingConsumed,
}: {
    onPlaceImage: (url: string) => void
    // A logo handed in from the landing page (data URL + name). Processed exactly
    // like a normal upload so it appears in the panel and auto-places.
    pending?: { dataUrl: string; name: string } | null
    onPendingConsumed?: () => void
}) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [images, setImages] = useState<UploadEntry[]>([])
    const [dragActive, setDragActive] = useState(false)
    const dragDepth = useRef(0)
    // Keep the latest placement callback without re-creating addFiles.
    const onPlaceRef = useRef(onPlaceImage)
    onPlaceRef.current = onPlaceImage
    // Mirror images in a ref (to read count at completion) and track which
    // uploads have already been auto-placed, so placement happens exactly once.
    const imagesRef = useRef<UploadEntry[]>([])
    useEffect(() => {
        imagesRef.current = images
    }, [images])
    const placedRef = useRef<Set<string>>(new Set())

    // Newest at the top: each upload goes in front of the list.
    const addFiles = useCallback((files: File[]) => {
        const accepted = files.slice(0, MAX_FILES_LIMIT)
        accepted.forEach((file, i) => {
            const id = `${file.name}-${i}-${performance.now()}`
            if (!SUPPORTED_MIME_TYPES.has(file.type)) {
                setImages(prev => [
                    { id, name: file.name, url: "", status: "error", progress: 0, error: "unsupported" },
                    ...prev,
                ])
                return
            }
            if (file.size > MAX_FILE_SIZE) {
                setImages(prev => [
                    {
                        id,
                        name: file.name,
                        url: "",
                        status: "error",
                        progress: 0,
                        error: "size_too_large",
                        sizeMB: file.size / (1024 * 1024),
                    },
                    ...prev,
                ])
                return
            }
            const url = URL.createObjectURL(file)
            const vector = file.type === "image/svg+xml"
            setImages(prev => [
                { id, name: file.name, url, status: "uploading", progress: 0, vector },
                ...prev,
            ])
            // Simulate an upload. Progress lives in a local so the state updater
            // stays pure; completion side-effects run once, outside the updater.
            let prog = 0
            const iv = setInterval(() => {
                prog += 14 + Math.random() * 18
                if (prog < 100) {
                    setImages(prev => prev.map(im => (im.id === id ? { ...im, progress: prog } : im)))
                    return
                }
                clearInterval(iv)
                setImages(prev =>
                    prev.map(im => (im.id === id ? { ...im, progress: 100, status: "uploaded" } : im))
                )
                // Hide the success tick after a moment (like create-omat).
                setTimeout(() => {
                    setImages(prev => prev.map(im => (im.id === id ? { ...im, progress: 0 } : im)))
                }, 2000)
                // Auto-place exactly once, only when this is the single design.
                if (!placedRef.current.has(id) && imagesRef.current.length === 1) {
                    placedRef.current.add(id)
                    onPlaceRef.current(url)
                }
            }, 90)
        })
    }, [])

    // Register a logo handed in from the landing page: add it to the list as an
    // already-uploaded image (the designer places it on the canvas itself, so no
    // auto-place here). It stays in the panel for re-adding later.
    const pendingDoneRef = useRef(false)
    useEffect(() => {
        if (!pending || pendingDoneRef.current) return
        pendingDoneRef.current = true
        const id = `${pending.name}-${performance.now()}`
        setImages(prev => [
            {
                id,
                name: pending.name,
                url: pending.dataUrl,
                status: "uploaded",
                progress: 0,
                vector: pending.dataUrl.startsWith("data:image/svg+xml"),
            },
            ...prev,
        ])
        onPendingConsumed?.()
    }, [pending, onPendingConsumed])

    const removeImage = (id: string) =>
        setImages(prev => {
            const target = prev.find(im => im.id === id)
            if (target?.url) URL.revokeObjectURL(target.url)
            return prev.filter(im => im.id !== id)
        })

    const openFilePicker = () => inputRef.current?.click()
    // While an upload runs, the mobile button reads "Uploading…" and opens nothing.
    const uploadingAny = images.some(im => im.status === "uploading")

    const onDrop = (e: React.DragEvent) => {
        if (hasImageDrag(e)) return
        e.preventDefault()
        dragDepth.current = 0
        setDragActive(false)
        const files = Array.from(e.dataTransfer.files ?? [])
        if (files.length) addFiles(files)
    }

    return (
        <div
            className="relative flex flex-1 flex-col overflow-hidden"
            // Dragging one of the panel's own thumbnails out to the canvas must
            // not raise the "Drop your design here" overlay over the panel —
            // this dropzone is for files coming from outside the app.
            onDragEnter={e => {
                if (hasImageDrag(e)) return
                e.preventDefault()
                dragDepth.current += 1
                setDragActive(true)
            }}
            onDragOver={e => {
                if (hasImageDrag(e)) return
                e.preventDefault()
            }}
            onDragLeave={e => {
                if (hasImageDrag(e)) return
                e.preventDefault()
                dragDepth.current -= 1
                if (dragDepth.current <= 0) setDragActive(false)
            }}
            onDrop={onDrop}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                accept={[...SUPPORTED_MIME_TYPES].join(",")}
                className="hidden"
                onChange={e => {
                    const files = Array.from(e.target.files ?? [])
                    if (files.length) addFiles(files)
                    e.target.value = ""
                }}
            />

            {/* Below md, as create-omat's mobile panel: reversed — the uploads
                in one sideways row on top, a divider, then the big Upload
                button and the policies line; no drop text, icon or "How to
                optimise". From md, the desktop panel. */}
            <div
                className={cn(
                    "flex flex-1 flex-col-reverse overflow-y-auto pb-4 md:flex-col md:gap-0 md:px-6 md:pb-6",
                    images.length > 0 ? "gap-2" : "gap-0"
                )}
            >
                <div className="flex w-full flex-col items-center gap-4 md:gap-9">
                    <div
                        className="flex w-full cursor-pointer flex-col items-center gap-9"
                        onClick={openFilePicker}
                    >
                        <span className="mt-4 hidden text-neutral-200 md:inline">
                            <UploadIcon size={64} />
                        </span>
                        <div className="hidden w-full flex-col items-center gap-3 md:flex">
                            <p className="text-sm leading-5 text-black">Drop your design here</p>
                            <p className="text-xs font-semibold text-neutral-600 uppercase">or</p>
                            <button
                                type="button"
                                onClick={e => {
                                    e.stopPropagation()
                                    openFilePicker()
                                }}
                                className="w-full cursor-pointer rounded-none bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                            >
                                Upload
                            </button>
                            <p className="text-sm leading-5 text-neutral-500">
                                SVG, JPEG, PNG, WEBP allowed
                            </p>
                        </div>
                        {/* create-omat's mobile button: the kit's primary, size l,
                            its icon before the word — "Uploading…" while one is. */}
                        <div className="w-full px-4 md:hidden">
                            <KitButton
                                variant="primary"
                                size="l"
                                onClick={e => {
                                    e.stopPropagation()
                                    if (!uploadingAny) openFilePicker()
                                }}
                                className="mt-2 flex w-full items-end gap-2"
                            >
                                {uploadingAny ? (
                                    "Uploading…"
                                ) : (
                                    <>
                                        <UploadIcon /> Upload
                                    </>
                                )}
                            </KitButton>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 px-4 text-center md:px-0">
                        <a
                            className="hidden cursor-pointer text-xs leading-4 font-semibold text-neutral-700 underline md:inline"
                            href="#"
                            target="_blank"
                            rel="noreferrer"
                        >
                            How to optimise your file for print
                        </a>
                        <p className="text-xs leading-4 text-neutral-700">
                            Designs must follow{" "}
                            <a className="cursor-pointer underline" href="#" target="_blank" rel="noreferrer">
                                Spreadshirt policies
                            </a>
                            .
                        </p>
                    </div>
                </div>

                {images.length > 0 && (
                    <>
                        {/* Below md only: the line between the row and the button. */}
                        <span className="block h-px w-full bg-gray-200 md:hidden" />
                        <div className="w-full md:mt-6 md:border-t md:border-neutral-200 md:pt-6">
                            <div className="mb-2 flex w-full flex-row gap-2 overflow-x-auto pl-4 sm:grid sm:grid-cols-2 sm:overflow-x-visible md:mb-0 md:pl-0">
                                {images.map(img => (
                                    <UploadCard
                                        key={img.id}
                                        image={img}
                                        onRemove={() => removeImage(img.id)}
                                        onPlace={() => onPlaceImage(img.url)}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {dragActive && (
                <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-[10px] border-2 border-dashed border-black bg-white/85">
                    <div className="flex flex-col items-center gap-3 text-black">
                        <UploadIcon size={48} />
                        <p className="text-sm font-medium">Drop your design here</p>
                    </div>
                </div>
            )}
        </div>
    )
}
