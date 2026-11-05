// The prototype's stock artwork, split into the two panels that offer it.
//
// Desktop (designer.tsx) and mobile (mobile-panels-drawer.tsx) both read from
// here so the two surfaces can never drift apart.

import { HOT_TOPICS, MARKETPLACE_DESIGNS, type MarketplaceDesign } from "@/lib/marketplace-designs"

export { HOT_TOPICS }

/** One entry of the Designs & Graphics panel. */
export type PanelDesign = MarketplaceDesign

// AI artwork is generated at a resolution that only prints cleanly small, so it
// may never cover more than a sixth of the print area. Enlarging past that is
// allowed while the resize handle is held; releasing snaps it back to the cap.
export const AI_MAX_PRINT_AREA_FRACTION = 1 / 6

// Three pieces presented as AI-generated output. They carry the print-quality
// restriction above once placed.
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

/** The tag every embroidery-rule design carries, so they can be searched as a group. */
export const EMBROIDERY_TAG = "Embroidery"

// The designs the embroidery rules in designer.tsx are written against — thin
// lines, too complex, a minimum stitchable size, the hoop-frame demo. They
// lead the panel so the rules can always be reached.
export const EMBROIDERY_RULE_DESIGNS: PanelDesign[] = [
    { src: "/img/graphics/graphics1.png", designId: 1, name: "Cat", tags: [EMBROIDERY_TAG, "Line"] },
    { src: "/img/graphics/graphics2.png", designId: 2, name: "Mountains", tags: [EMBROIDERY_TAG, "Travel"] },
    { src: "/img/graphics/graphics8.png", designId: 8, name: "Boy and fish", tags: [EMBROIDERY_TAG] },
    { src: "/img/graphics/graphics9.png", designId: 9, name: "Beaver", tags: [EMBROIDERY_TAG] },
    { src: "/img/graphics/graphics11.png", designId: 11, name: "Rose", tags: [EMBROIDERY_TAG, "Rose"] },
    { src: "/img/graphics/graphics5.png", designId: 5, name: "Mushroom", tags: [EMBROIDERY_TAG] },
    {
        src: "/img/marketplace/314234417.png",
        designId: 314234417,
        name: "Team Marathon Viewing FR red",
        tags: [EMBROIDERY_TAG, "Team"],
    },
]

/** Everything the Designs & Graphics panel lists, in its "Most popular" order. */
export const PANEL_DESIGNS: PanelDesign[] = [...EMBROIDERY_RULE_DESIGNS, ...MARKETPLACE_DESIGNS]

export const GRAPHIC_SRCS = PANEL_DESIGNS.map(d => d.src)

/**
 * The designs matching a search — every word of the query has to be found in
 * the design's name or one of its tags, as the marketplace search treats a
 * query made of several hot topics.
 */
export function searchDesigns(query: string): PanelDesign[] {
    const terms = query.toLowerCase().split(" ").map(t => t.trim()).filter(Boolean)
    if (terms.length === 0) return PANEL_DESIGNS
    return PANEL_DESIGNS.filter(d => {
        const haystack = [d.name, ...d.tags].join(" ").toLowerCase()
        return terms.every(t => haystack.includes(t))
    })
}
