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
    const anim = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData,
      // Build every layer up front so the first loop doesn't hitch.
      rendererSettings: { progressiveLoad: false },
    })
    return () => anim.destroy()
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
