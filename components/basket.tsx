"use client"

import { useEffect, useState } from "react"

export type BasketDesignText = {
  id: string
  content: string
  x: number
  y: number
  z?: number
  color: string
  fontSize: number
  fontFamily: string
}

export type BasketDesignGraphic = {
  id: string
  src: string
  x: number
  y: number
  z?: number
  width: number
  height: number
}

export type BasketDesign = {
  textElements: BasketDesignText[]
  graphicElements: BasketDesignGraphic[]
  printAreaOverlay: { left: number; top: number; width: number; height: number }
  displayWidth: number
  displayHeight: number
}

export type BasketItem = {
  id: string
  productName: string
  appearanceName: string
  image: string
  size: string
  qty: number
  price: number // unit price
  design?: BasketDesign
}

type BasketProps = {
  open: boolean
  onClose: () => void
  items: BasketItem[]
  onQuantityChange: (id: string, qty: number) => void
  onRemove: (id: string) => void
}

const fmt = (n: number) => n.toFixed(2).replace(".", ",")

export function Basket({ open, onClose, items, onQuantityChange, onRemove }: BasketProps) {
  // Keep the panel mounted long enough to play the slide-out animation.
  const [shouldRender, setShouldRender] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (open) {
      setShouldRender(true)
      const t = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(t)
    }
    setMounted(false)
    const t = setTimeout(() => setShouldRender(false), 300)
    return () => clearTimeout(t)
  }, [open])

  if (!shouldRender) return null

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = items.length > 0 ? 7.99 : 0
  const total = subtotal + shipping
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <>
      <div
        className={`fixed inset-0 z-[9998] bg-black/40 transition-opacity duration-200 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-[9999] w-[500px] max-w-[90vw] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          mounted ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="font-display text-[20px] font-bold text-black">Your basket</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer"
          >
            <img src="/icons/icon-close-x.svg" alt="" className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-500">
              Your basket is empty
            </div>
          ) : (
            <>
              <div className="border-t border-neutral-200">
                {items.map(item => (
                  <BasketItemRow
                    key={item.id}
                    item={item}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemove}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
                <span className="text-sm font-medium text-black">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                <span className="text-sm font-medium text-black">{fmt(subtotal)} €</span>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex-shrink-0">
            <div className="border-t border-neutral-200 px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span>{fmt(subtotal)} €</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span>Shipping</span>
                <span>{fmt(shipping)} €</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold mt-3">
                <span>Total</span>
                <span>{fmt(total)} €</span>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                type="button"
                className="w-full h-12 bg-[#007D38] hover:bg-[#006E31] text-white font-semibold text-sm cursor-pointer transition-colors"
              >
                To checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function BasketItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: BasketItem
  onQuantityChange: (id: string, qty: number) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex gap-4 px-6 py-4 border-b border-neutral-200">
      <div className="w-24 h-24 flex-shrink-0 bg-[#f5f5f5] overflow-hidden relative">
        <DesignThumbnail item={item} size={96} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="text-sm font-semibold text-black">
            {fmt(item.price * item.qty)} €
          </div>
          <button
            type="button"
            aria-label="Remove item"
            onClick={() => onRemove(item.id)}
            className="cursor-pointer text-neutral-700 hover:text-black"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.9945 3.85074C15.9182 2.81588 15.0544 2 14 2H10L9.85074 2.00549C8.81588 2.08183 8 2.94564 8 4V6H5.01169H4.99054H4L3.88338 6.00673C3.38604 6.06449 3 6.48716 3 7C3 7.55228 3.44772 8 4 8H4.07987L5.00345 19.083L5.00819 19.2507C5.09634 20.7511 6.40232 22 8 22H16L16.1763 21.9949C17.7511 21.9037 19 20.5977 19 19L19.9199 8H20L20.1166 7.99327C20.614 7.93551 21 7.51284 21 7C21 6.44772 20.5523 6 20 6H16V4L15.9945 3.85074ZM14 6V4H10V6H14ZM9 8H6.08649L7 19C7 19.5128 7.38604 19.9355 7.88338 19.9933L8 20H16C16.5155 20 16.9398 19.61 16.9969 19.0414L17.0035 18.917L17.9132 8H15H9ZM10 10C10.5128 10 10.9355 10.386 10.9933 10.8834L11 11V17C11 17.5523 10.5523 18 10 18C9.48716 18 9.06449 17.614 9.00673 17.1166L9 17V11C9 10.4477 9.44772 10 10 10ZM14.9933 10.8834C14.9355 10.386 14.5128 10 14 10C13.4477 10 13 10.4477 13 11V17L13.0067 17.1166C13.0645 17.614 13.4872 18 14 18C14.5523 18 15 17.5523 15 17V11L14.9933 10.8834Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <div className="text-sm text-black mt-1">{item.productName}</div>
        <div className="text-sm text-neutral-500 capitalize">{item.appearanceName}</div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-bold text-black">{item.size}</span>
          <div className="flex items-center border border-neutral-200">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() =>
                item.qty <= 1 ? onRemove(item.id) : onQuantityChange(item.id, item.qty - 1)
              }
              className="p-1.5 border-r border-neutral-200 cursor-pointer hover:bg-neutral-100"
            >
              {item.qty <= 1 ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.9945 3.85074C15.9182 2.81588 15.0544 2 14 2H10L9.85074 2.00549C8.81588 2.08183 8 2.94564 8 4V6H5.01169H4.99054H4L3.88338 6.00673C3.38604 6.06449 3 6.48716 3 7C3 7.55228 3.44772 8 4 8H4.07987L5.00345 19.083L5.00819 19.2507C5.09634 20.7511 6.40232 22 8 22H16L16.1763 21.9949C17.7511 21.9037 19 20.5977 19 19L19.9199 8H20L20.1166 7.99327C20.614 7.93551 21 7.51284 21 7C21 6.44772 20.5523 6 20 6H16V4L15.9945 3.85074ZM14 6V4H10V6H14ZM9 8H6.08649L7 19C7 19.5128 7.38604 19.9355 7.88338 19.9933L8 20H16C16.5155 20 16.9398 19.61 16.9969 19.0414L17.0035 18.917L17.9132 8H15H9ZM10 10C10.5128 10 10.9355 10.386 10.9933 10.8834L11 11V17C11 17.5523 10.5523 18 10 18C9.48716 18 9.06449 17.614 9.00673 17.1166L9 17V11C9 10.4477 9.44772 10 10 10ZM14.9933 10.8834C14.9355 10.386 14.5128 10 14 10C13.4477 10 13 10.4477 13 11V17L13.0067 17.1166C13.0645 17.614 13.4872 18 14 18C14.5523 18 15 17.5523 15 17V11L14.9933 10.8834Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.8333 9.16663C16.2935 9.16663 16.6666 9.53972 16.6666 9.99996C16.6666 10.4273 16.3449 10.7795 15.9305 10.8277L15.8333 10.8333H4.16665C3.70641 10.8333 3.33331 10.4602 3.33331 9.99996C3.33331 9.5726 3.65501 9.22037 4.06946 9.17223L4.16665 9.16663H15.8333Z"
                  />
                </svg>
              )}
            </button>
            <span className="w-10 text-center text-sm">{item.qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => onQuantityChange(item.id, item.qty + 1)}
              className="p-1.5 border-l border-neutral-200 cursor-pointer hover:bg-neutral-100"
            >
              <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.8277 4.06952C10.7796 3.65507 10.4273 3.33337 9.99998 3.33337C9.53974 3.33337 9.16665 3.70647 9.16665 4.16671V9.16671H4.16665L4.06946 9.17231C3.65501 9.22045 3.33331 9.57268 3.33331 10C3.33331 10.4603 3.70641 10.8334 4.16665 10.8334H9.16665V15.8334L9.17225 15.9306C9.22039 16.345 9.57262 16.6667 9.99998 16.6667C10.4602 16.6667 10.8333 16.2936 10.8333 15.8334V10.8334H15.8333L15.9305 10.8278C16.3449 10.7796 16.6666 10.4274 16.6666 10C16.6666 9.5398 16.2935 9.16671 15.8333 9.16671H10.8333V4.16671L10.8277 4.06952Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DesignThumbnail({ item, size }: { item: BasketItem; size: number }) {
  const { design, image, productName } = item
  if (!design || design.displayWidth <= 0 || design.displayHeight <= 0) {
    return (
      <img
        src={image}
        alt={productName}
        className="w-full h-full object-contain"
      />
    )
  }
  const { textElements, printAreaOverlay, displayWidth, displayHeight } = design
  const graphicElements = design.graphicElements ?? []
  const scale = Math.min(size / displayWidth, size / displayHeight)
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: displayWidth,
        height: displayHeight,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      <img
        src={image}
        alt={productName}
        className="h-full w-full object-contain pointer-events-none select-none"
      />
      <div
        style={{
          position: "absolute",
          left: `${printAreaOverlay.left}%`,
          top: `${printAreaOverlay.top}%`,
          width: `${printAreaOverlay.width}%`,
          height: `${printAreaOverlay.height}%`,
        }}
      >
        {textElements.map(el => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              zIndex: el.z,
              left: `${el.x}%`,
              top: `${el.y}%`,
              color: el.color,
              fontSize: `${el.fontSize}px`,
              fontFamily: `"${el.fontFamily}"`,
              whiteSpace: "pre",
              lineHeight: 1,
            }}
          >
            {el.content}
          </div>
        ))}
        {graphicElements.map(el => (
          <img
            key={el.id}
            src={el.src}
            alt=""
            className="pointer-events-none select-none"
            style={{
              position: "absolute",
              zIndex: el.z,
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.width}%`,
              height: `${el.height}%`,
              objectFit: "contain",
            }}
          />
        ))}
      </div>
    </div>
  )
}
