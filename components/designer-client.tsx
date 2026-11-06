"use client"

import dynamic from "next/dynamic"

import DesignerSkeleton from "@/components/designer-skeleton"

// The Designer is a fully client-side, interactive canvas app (no SEO value,
// already force-dynamic). Loading it with ssr:false skips server rendering, so
// there's no hydration step to mismatch — this avoids Radix useId hydration
// errors, including ones caused by browser extensions mutating the SSR HTML.
// The skeleton fallback flows into the designer's own staged intro reveal.
const Designer = dynamic(() => import("@/components/designer"), {
    ssr: false,
    loading: () => <DesignerSkeleton />,
})

export default function DesignerClient({
    csMode = false,
    basketHypotheses = false,
    dtf = false,
    startOnEmbroidery = false,
    embroideryResizeGuide = false,
    mergedDesigner = true,
}: {
    csMode?: boolean
    basketHypotheses?: boolean
    dtf?: boolean
    startOnEmbroidery?: boolean
    embroideryResizeGuide?: boolean
    mergedDesigner?: boolean
}) {
    return (
        <Designer
            csMode={csMode}
            basketHypotheses={basketHypotheses}
            dtf={dtf}
            startOnEmbroidery={startOnEmbroidery}
            embroideryResizeGuide={embroideryResizeGuide}
            mergedDesigner={mergedDesigner}
        />
    )
}
