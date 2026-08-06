// The prototype's stock artwork, split into the two panels that offer it.
//
// Desktop (designer.tsx) and mobile (mobile-panels-drawer.tsx) both read from
// here so the two surfaces can never drift apart.

// AI artwork is generated at a resolution that only prints cleanly small, so it
// may never cover more than a sixth of the print area. Enlarging past that is
// allowed while the resize handle is held; releasing snaps it back to the cap.
export const AI_MAX_PRINT_AREA_FRACTION = 1 / 6

// Three pieces moved out of the Graphics panel and presented as AI-generated
// output. They carry the print-quality restriction above once placed.
export const AI_IMAGE_SRCS = [
    "/img/graphics/graphics7.png",
    "/img/graphics/graphics23.webp",
    "/img/graphics/graphics41.webp",
]

const AI_IMAGE_SET = new Set(AI_IMAGE_SRCS)

/** True for artwork that came out of the AI panel, so it is size-restricted. */
export function isAiImage(src: string): boolean {
    return AI_IMAGE_SET.has(src)
}

export const GRAPHIC_SRCS = [
    "/img/graphics/croco.png",
    ...Array.from({ length: 16 }, (_, i) => `/img/graphics/graphics${i + 1}.png`),
    ...Array.from({ length: 32 }, (_, i) => `/img/graphics/graphics${i + 17}.webp`),
].filter(src => !AI_IMAGE_SET.has(src))
