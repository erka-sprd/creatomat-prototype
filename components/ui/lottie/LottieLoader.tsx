"use client"

import { useEffect, useRef } from "react"
// Canvas renderer: rasterises each frame to a bitmap instead of building a
// large <mask>/<clipPath> SVG tree. Chrome's first-paint of that tree was the
// start hitch — canvas avoids it, so the animation starts smooth in Chrome too.
import lottie from "lottie-web/build/player/lottie_canvas"

import animationData from "@/components/ui/lottie/preloader-2.json"

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
    const rafs: number[] = []
    const queue = (fn: () => void) => rafs.push(requestAnimationFrame(fn))

    // (1) Wait two paints so the designer's mount commits first, then (2) build
    // with autoplay OFF and draw a static frame 0 (the first rasterise), then
    // (3) start motion a couple frames later on a settled thread — smooth start.
    queue(() =>
      queue(() => {
        anim = lottie.loadAnimation({
          container,
          renderer: "canvas",
          loop: true,
          autoplay: false,
          animationData,
          rendererSettings: {
            // Build every layer up front and clear between frames.
            progressiveLoad: false,
            clearCanvas: true,
          },
        })
        anim.addEventListener("DOMLoaded", () => {
          anim?.goToAndStop(0, true) // first rasterise while static
          queue(() => queue(() => anim?.play())) // then start motion, settled
        })
      })
    )
    return () => {
      rafs.forEach(cancelAnimationFrame)
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
