"use client"

import {useEffect, useRef} from "react"
// SVG renderer keeps the small icon crisp.
import lottie, {type AnimationItem} from "lottie-web/build/player/lottie_light"

import animationData from "@/components/ui/lottie/graphics.json"

type Props = {
    // Whether the button is currently hovered. On mount / when true it plays
    // forward once; when it flips to false it plays in reverse once and then
    // calls onReverseDone so the parent can swap back to the static icon.
    hovered: boolean
    onReverseDone?: () => void
    className?: string
}

// The graphics-button icon animation. Its artboard matches the whole button
// (88x66), with the shapes where the static icon sits, so it's overlaid to fill
// the button. Plays once forward on hover-in, once reversed on hover-out.
export default function GraphicsHoverIcon({hovered, onReverseDone, className}: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const animRef = useRef<AnimationItem | null>(null)
    const dir = useRef(1)
    const doneRef = useRef(onReverseDone)
    doneRef.current = onReverseDone

    // Load once; play forward on mount (we mount on hover-in).
    useEffect(() => {
        const container = ref.current
        if (!container) return
        const anim = lottie.loadAnimation({
            container,
            renderer: "svg",
            loop: false,
            autoplay: false,
            animationData,
            rendererSettings: {preserveAspectRatio: "xMidYMid meet"},
        })
        animRef.current = anim
        anim.addEventListener("complete", () => {
            // Reverse finished (reached frame 0) -> tell parent to show static.
            if (dir.current === -1) doneRef.current?.()
        })
        dir.current = 1
        anim.setDirection(1)
        anim.goToAndPlay(0, true)
        return () => anim.destroy()
    }, [])

    // Flip direction when hover state changes.
    useEffect(() => {
        const anim = animRef.current
        if (!anim) return
        dir.current = hovered ? 1 : -1
        anim.setDirection(dir.current)
        anim.play()
    }, [hovered])

    return <div ref={ref} className={className} aria-hidden />
}
