"use client"

import { useEffect, useRef } from "react"
// SVG-only ("light") build — smaller, renders the animation as inline SVG.
import lottie from "lottie-web/build/player/lottie_light"

import animationData from "@/components/ui/lottie/designer-loader.json"

type LottieLoaderProps = {
  size?: number
  className?: string
}

// Renders the Lottie JSON as a looping inline-SVG animation.
export default function LottieLoader({ size = 180, className }: LottieLoaderProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    let anim: ReturnType<typeof lottie.loadAnimation> | undefined
    // Building this animation (27 layers, keyframe-heavy) is main-thread work.
    // If it runs during the designer's initial mount + catalog parse it fights
    // for the thread and the first frames drop ("laggy start"). Wait two paints
    // so the heavy mount commits first, then build + play on a calmer thread.
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        anim = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData,
          // Build every layer up front so the first loop doesn't hitch.
          rendererSettings: { progressiveLoad: false },
        })
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      anim?.destroy()
    }
  }, [])

  return (
    <div
      ref={ref}
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={className}
    />
  )
}
