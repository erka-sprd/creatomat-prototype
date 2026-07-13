"use client"

import { useState } from "react"

type WedgeSliderProps = {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  width?: number
}

export function WedgeSlider({ min, max, value, onChange, width = 140 }: WedgeSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const percentage = Math.round(((value - min) / (max - min)) * 100)

  return (
    <div className="group relative flex h-6 items-center" style={{ minWidth: width, width }}>
      <svg
        className="absolute"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height="7"
        viewBox="0 0 140 7"
        fill="none"
      >
        <path
          d="M0 4.17231L136.482 0.00201946C138.407 -0.0568061 140 1.48787 140 3.41397C140 5.32519 138.431 6.86402 136.52 6.82687L0 4.17231Z"
          fill="#DEDEDE"
        />
      </svg>
      <div
        className="pointer-events-none absolute"
        style={{ left: `${percentage}%`, transform: `translateX(-${percentage}%)` }}
      >
        <div className="h-5 w-5" />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step="any"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        className={
          "absolute m-0 size-full cursor-pointer appearance-none bg-none p-0 outline-none " +
          "[&::-webkit-slider-thumb]:appearance-none " +
          "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full " +
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black " +
          "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer " +
          "[&::-webkit-slider-thumb]:pointer-events-auto " +
          "[&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:duration-300 " +
          "[&::-moz-range-thumb]:transition-shadow [&::-moz-range-thumb]:duration-300 " +
          "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full " +
          "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black " +
          "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer " +
          "[&::-webkit-slider-thumb]:hover:shadow-[0_0_0_6px_rgba(0,0,0,0.1)] " +
          "[&::-moz-range-thumb]:hover:shadow-[0_0_0_6px_rgba(0,0,0,0.1)] " +
          (isDragging
            ? "[&::-webkit-slider-thumb]:shadow-[0_0_0_6px_rgba(0,0,0,0.1)] [&::-moz-range-thumb]:shadow-[0_0_0_6px_rgba(0,0,0,0.1)]"
            : "")
        }
      />
    </div>
  )
}
