// Carrying placed designs across a product-type switch.
//
// Mirrors create-omat's behaviour (SceneContext → createOrUpdateSceneForProductConfig
// → createPrintAreaPageBlocks): the scene is NOT rebuilt from scratch on a
// product change. For each view of the new product, the old print-area block
// with the SAME VIEW ID is looked up (`print-area-${view.id}` — Spreadshirt
// view ids are stable across product types: 1=Front, 2=Back, 3=Right, 4=Left,
// 13=Neck Label…), its content is resized content-aware — a uniform scale of
// the children relative to the area — and the children are reparented into the
// new area. Old areas with no counterpart in the new product are destroyed
// WITH their children: a hood design does not jump onto a mug.
//
// The proto stores element geometry as percentages of the print area, so the
// equivalent here is arithmetic on the areas' physical (mm) sizes from the
// catalogue's viewMaps rather than engine blocks.

import type { StaticView } from "product-catalog-client"

type SizeMm = { width: number; height: number }

export type CarryTarget = {
    /** Print area id in the NEW product. */
    printAreaId: string
    /** Uniform content scale, in physical units — imgly's resizeContentAware. */
    scale: number
    oldSize: SizeMm
    newSize: SizeMm
}

/**
 * Old printAreaId → where (and how) its content lands on the new product.
 * Views the new product does not have simply produce no entry — their
 * elements are dropped, exactly like create-omat destroying the orphaned
 * print-area block.
 */
export function buildCarryMap(
    prevViews: StaticView[],
    nextViews: StaticView[]
): Map<string, CarryTarget> {
    const nextByViewId = new Map<string, { printAreaId: string; size: SizeMm }>()
    for (const view of nextViews) {
        const vm = view.viewMaps[0]
        if (vm) nextByViewId.set(view.id, { printAreaId: vm.printAreaId, size: vm.size })
    }

    const map = new Map<string, CarryTarget>()
    for (const view of prevViews) {
        const vm = view.viewMaps[0]
        const target = nextByViewId.get(view.id)
        if (!vm || !target) continue
        if (vm.size.width <= 0 || vm.size.height <= 0) continue
        map.set(vm.printAreaId, {
            printAreaId: target.printAreaId,
            scale: Math.min(
                target.size.width / vm.size.width,
                target.size.height / vm.size.height
            ),
            oldSize: vm.size,
            newSize: target.size,
        })
    }
    return map
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/**
 * Re-express a graphic's percentage box in the new print area: physical size
 * scales uniformly (so nothing distorts when the area's aspect changes), the
 * centre keeps its relative position, and the box is clamped fully inside —
 * the same guarantee the print-area restriction enforces on every edit.
 */
export function carryBox(
    box: { x: number; y: number; width: number; height: number },
    t: CarryTarget
): { x: number; y: number; width: number; height: number } {
    // % → mm → uniform scale → % of the new area.
    const width = clamp((box.width / 100) * t.oldSize.width * t.scale, 0, t.newSize.width)
    const height = clamp((box.height / 100) * t.oldSize.height * t.scale, 0, t.newSize.height)
    const widthPct = (width / t.newSize.width) * 100
    const heightPct = (height / t.newSize.height) * 100
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2
    return {
        width: widthPct,
        height: heightPct,
        x: clamp(centerX - widthPct / 2, 0, 100 - widthPct),
        y: clamp(centerY - heightPct / 2, 0, 100 - heightPct),
    }
}

/**
 * Text carries its anchor point (already a percentage of the area) and scales
 * its size by the same uniform factor the graphics use — create-omat's design
 * unit is millimetres, so text there rides the content-aware resize too.
 */
export function carryTextPoint(
    point: { x: number; y: number; fontSize: number },
    t: CarryTarget
): { x: number; y: number; fontSize: number } {
    return {
        x: clamp(point.x, 0, 100),
        y: clamp(point.y, 0, 100),
        fontSize: point.fontSize * t.scale,
    }
}
