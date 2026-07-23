"use client"

import { ScopedDialog, ScopedDialogClose, ScopedDialogTitle } from "@/components/ui/scoped-dialog"
import { ChevronDown, GripVertical, Image as ImageIcon, Settings, Type, X } from "lucide-react"
import { PointerEvent as ReactPointerEvent, ReactNode, useEffect, useRef, useState } from "react"

// Customer-service mode: a draggable gear button that floats over the canvas
// area and opens a settings modal (Print / Layers tabs). Rendered inside
// #canvas-section (position: relative), so it covers exactly the canvas area —
// dragging is clamped to those bounds.
const BTN = 52
// Keep the same gap from the canvas edges as the other floating controls
// (zoom / model / print sit at bottom-6 left-6 = 24px).
const MARGIN = 24
const DRAG_THRESHOLD = 3 // px before a press counts as a drag (not a click)

type CsObject = { id: string; kind: "text" | "graphic"; label: string; z: number }
type CsView = { id: string; name: string; objects: CsObject[] }
type Point = { x: number; y: number }

type Props = {
    views: CsView[]
    activeViewId: string
    container: HTMLElement | null
    onReorderLayers: (viewId: string, orderedTopFirstIds: string[]) => void
}

const TECHNIQUES = [1, 2, 3]
const PRINT_TYPES = [1, 2, 3]

function Pill({
    selected,
    onClick,
    children,
}: {
    selected: boolean
    onClick: () => void
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                "cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
                (selected
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-neutral-500")
            }
        >
            {children}
        </button>
    )
}

export default function CustomerServiceMode({
    views,
    activeViewId,
    container,
    onReorderLayers,
}: Props) {
    const areaRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<Point | null>(null)
    const [open, setOpen] = useState(false)
    const drag = useRef<{ offsetX: number; offsetY: number; moved: boolean } | null>(null)

    // modal state
    const [tab, setTab] = useState<"print" | "layers">("print")
    const [technique, setTechnique] = useState(1)
    const [printTypeByView, setPrintTypeByView] = useState<Record<string, number>>({})
    const [layersView, setLayersView] = useState(activeViewId)
    // Local top->bottom order of layer ids for the selected view (drag reorder).
    const [order, setOrder] = useState<string[]>([])
    const orderRef = useRef<string[]>([])
    const layerDrag = useRef<string | null>(null)
    const applyOrder = (next: string[]) => {
        orderRef.current = next
        setOrder(next)
    }

    // Start in the top-right corner of the canvas area once we can measure it.
    useEffect(() => {
        const area = areaRef.current
        if (!area) return
        const r = area.getBoundingClientRect()
        setPos({
            x: Math.max(MARGIN, r.width - BTN - MARGIN),
            y: Math.max(MARGIN, r.height - BTN - MARGIN),
        })
    }, [])

    const clamp = (x: number, y: number): Point => {
        const area = areaRef.current
        if (!area) return { x, y }
        const r = area.getBoundingClientRect()
        return {
            x: Math.min(Math.max(MARGIN, x), Math.max(MARGIN, r.width - BTN - MARGIN)),
            y: Math.min(Math.max(MARGIN, y), Math.max(MARGIN, r.height - BTN - MARGIN)),
        }
    }

    const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
        const area = areaRef.current
        if (!area || !pos) return
        e.currentTarget.setPointerCapture(e.pointerId)
        const r = area.getBoundingClientRect()
        drag.current = {
            offsetX: e.clientX - (r.left + pos.x),
            offsetY: e.clientY - (r.top + pos.y),
            moved: false,
        }
    }

    const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
        const d = drag.current
        const area = areaRef.current
        if (!d || !area) return
        const r = area.getBoundingClientRect()
        const nx = e.clientX - r.left - d.offsetX
        const ny = e.clientY - r.top - d.offsetY
        if (
            Math.abs(nx - (pos?.x ?? 0)) > DRAG_THRESHOLD ||
            Math.abs(ny - (pos?.y ?? 0)) > DRAG_THRESHOLD
        ) {
            d.moved = true
        }
        setPos(clamp(nx, ny))
    }

    const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }
        const moved = drag.current?.moved
        drag.current = null
        if (!moved) setOpen(true) // a press without a drag opens the modal
    }

    const handleSave = () => {
        // Prototype: no backend yet — capture the current selections and close.
        console.log("[cs-mode] saved", { printTechnique: technique, printTypeByView, layersView })
        setOpen(false)
    }

    const sectionTitle = "text-[12px] font-bold uppercase tracking-[0.06em] text-neutral-600"
    const layerView = views.find(v => v.id === layersView) ?? views[0]
    const layers = layerView?.objects ?? []
    const layerIdsKey = layers.map(o => o.id).join("|")
    // Keep the local drag order in sync with the real layers (initial + after commit).
    useEffect(() => {
        const ids = layers.map(o => o.id)
        orderRef.current = ids
        setOrder(ids)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layersView, layerIdsKey])
    const orderedLayers =
        order.length === layers.length
            ? order.map(id => layers.find(o => o.id === id)).filter((o): o is CsObject => !!o)
            : layers

    return (
        <>
            <div ref={areaRef} className="pointer-events-none absolute inset-0 z-[25]">
                {pos && (
                    <button
                        type="button"
                        aria-label="Customer service"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        style={{
                            left: pos.x,
                            top: pos.y,
                            width: BTN,
                            height: BTN,
                            background: "linear-gradient(145deg, #1c2029, #0d0e13)",
                        }}
                        className="cs-spin-host pointer-events-auto absolute flex touch-none cursor-grab items-center justify-center rounded-[16px] border border-white/10 text-[#63f5cb] shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] transition-shadow duration-200 hover:shadow-[0_6px_26px_rgba(99,245,203,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] active:cursor-grabbing"
                    >
                        <Settings size={22} className="cs-gear" />
                    </button>
                )}
            </div>

            <ScopedDialog
                open={open}
                onOpenChange={setOpen}
                container={container}
                overlayClassName="rounded-[12px]"
                className="flex h-[560px] max-h-[85%] w-[520px] max-w-[92%] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            >
                        {/* header */}
                        <div className="flex items-start justify-between gap-4 px-[20px] pt-[20px] pb-[10px]">
                            <ScopedDialogTitle className="font-display text-[18px] leading-tight font-[800] text-black">
                                Customer Service Administration
                            </ScopedDialogTitle>
                            <ScopedDialogClose
                                aria-label="Close"
                                className="shrink-0 cursor-pointer text-neutral-500 outline-none hover:text-black focus:outline-none focus-visible:outline-none"
                            >
                                <X size={20} />
                            </ScopedDialogClose>
                        </div>

                        {/* tabs */}
                        <div className="flex gap-5 border-b border-neutral-200 px-[20px]">
                            {(["print", "layers"] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTab(t)}
                                    className={
                                        "-mb-px cursor-pointer border-b-2 py-[10px] text-[14px] font-semibold capitalize transition-colors " +
                                        (tab === t
                                            ? "border-black text-black"
                                            : "border-transparent text-neutral-500 hover:text-black")
                                    }
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* content */}
                        <div className="flex-1 overflow-y-auto p-[20px]">
                            {tab === "print" ? (
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <h3 className={sectionTitle}>Print technique</h3>
                                        <p className="mt-1 mb-2.5 text-[12px] text-neutral-500">
                                            Applies to all views
                                        </p>
                                        <div className="relative">
                                            <select
                                                value={technique}
                                                onChange={e => setTechnique(Number(e.target.value))}
                                                className="w-full cursor-pointer appearance-none rounded-lg border border-neutral-300 bg-white py-2.5 pr-9 pl-3 text-[14px] text-black focus:border-black focus:outline-none"
                                            >
                                                {TECHNIQUES.map(n => (
                                                    <option key={n} value={n}>
                                                        Print technique {n}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown
                                                size={16}
                                                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-neutral-200" />

                                    <div className="flex flex-col gap-3">
                                        <h3 className={sectionTitle}>Print Types</h3>
                                        {views.length === 0 && (
                                            <span className="text-[13px] text-neutral-400">
                                                No product loaded.
                                            </span>
                                        )}
                                        <div className="flex flex-col gap-2">
                                            {views.map(v => (
                                                <div
                                                    key={v.id}
                                                    className="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[14px] font-semibold text-black">
                                                            {v.name}
                                                        </span>
                                                        {v.objects.length === 0 && (
                                                            <span className="text-[12px] text-neutral-400">
                                                                No design
                                                            </span>
                                                        )}
                                                    </div>
                                                    {v.objects.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {PRINT_TYPES.map(n => (
                                                                <Pill
                                                                    key={n}
                                                                    selected={(printTypeByView[v.id] ?? 1) === n}
                                                                    onClick={() =>
                                                                        setPrintTypeByView(p => ({ ...p, [v.id]: n }))
                                                                    }
                                                                >
                                                                    Print type {n}
                                                                </Pill>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <h3 className={sectionTitle}>View</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {views.map(v => (
                                                <Pill
                                                    key={v.id}
                                                    selected={(layerView?.id ?? "") === v.id}
                                                    onClick={() => setLayersView(v.id)}
                                                >
                                                    {v.name}
                                                </Pill>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-neutral-200" />

                                    <div className="flex flex-col gap-2">
                                        <h3 className={sectionTitle}>Layers</h3>
                                        {layers.length === 0 ? (
                                            <span className="text-[13px] text-neutral-400">
                                                No layers in this view.
                                            </span>
                                        ) : (
                                            <div className="flex flex-col gap-1.5">
                                                {orderedLayers.map(o => (
                                                    <div
                                                        key={o.id}
                                                        draggable
                                                        onDragStart={() => {
                                                            layerDrag.current = o.id
                                                        }}
                                                        onDragOver={e => {
                                                            e.preventDefault()
                                                            const dId = layerDrag.current
                                                            if (!dId || dId === o.id) return
                                                            const from = orderRef.current.indexOf(dId)
                                                            const to = orderRef.current.indexOf(o.id)
                                                            if (from === -1 || to === -1) return
                                                            const next = [...orderRef.current]
                                                            next.splice(from, 1)
                                                            next.splice(to, 0, dId)
                                                            applyOrder(next)
                                                        }}
                                                        onDragEnd={() => {
                                                            layerDrag.current = null
                                                            if (layerView) onReorderLayers(layerView.id, orderRef.current)
                                                        }}
                                                        className="flex cursor-grab items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 select-none active:cursor-grabbing"
                                                    >
                                                        <GripVertical size={16} className="shrink-0 text-neutral-400" />
                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700">
                                                            {o.kind === "text" ? (
                                                                <Type size={15} />
                                                            ) : (
                                                                <ImageIcon size={15} />
                                                            )}
                                                        </span>
                                                        <span className="truncate text-[14px] text-black">
                                                            {o.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* footer */}
                        <div className="flex justify-end border-t border-neutral-200 px-[20px] py-[14px]">
                            <button
                                type="button"
                                onClick={handleSave}
                                className="cursor-pointer rounded-full bg-black px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800"
                            >
                                Save
                            </button>
                        </div>
            </ScopedDialog>
        </>
    )
}
