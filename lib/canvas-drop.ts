// Dragging a panel image (graphics / uploads / AI) onto the canvas.
//
// Mirrors create-omat's contract: the card writes a JSON payload on
// dragstart (DesignCard/ImageUploadCard/AIImageCard) and the canvas reads it
// back on drop (Designer.handleEditorDrop). Keeping the mime type and the
// parsing in one place stops the producer and the consumer drifting apart.

import type { DragEvent } from "react"

export const CANVAS_DROP_MIME = "application/json"

/** Which panel the image came from — same tags create-omat uses. */
export type CanvasDropSource = "marketplace-design" | "image-upload" | "ai-panel"

export type CanvasDropPayload = {
    src: string
    source: CanvasDropSource
}

export function startImageDrag(e: DragEvent, payload: CanvasDropPayload) {
    e.dataTransfer.setData(CANVAS_DROP_MIME, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = "copy"
}

/**
 * True when the drag carries one of our panel images. Reads `types` rather than
 * the data itself because browsers withhold dataTransfer contents during
 * dragenter/dragover ("protected mode") — only the type list is readable there.
 */
export function hasImageDrag(e: DragEvent) {
    return Array.from(e.dataTransfer.types).includes(CANVAS_DROP_MIME)
}

/** Payload of a completed drop, or null if this drag isn't one of ours. */
export function readImageDrag(e: DragEvent): CanvasDropPayload | null {
    const raw = e.dataTransfer.getData(CANVAS_DROP_MIME)
    if (!raw) return null
    try {
        const parsed: unknown = JSON.parse(raw)
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            typeof (parsed as CanvasDropPayload).src === "string"
        ) {
            return parsed as CanvasDropPayload
        }
        return null
    } catch {
        // Some other app's JSON payload — not ours to handle.
        return null
    }
}
