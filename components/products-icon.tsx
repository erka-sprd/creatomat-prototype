// The "Products" glyph: the folded hoodie and the cap composed the way they sit
// in blankproduct.png, but as two layered cutouts. On hover (the parent carries
// `group`) they slide apart horizontally — hoodie left, cap right — and tilt
// slightly outward, while a mug emerges from behind toward the bottom-right,
// fading and sharpening in. Everything glides back on hover-out.
export default function ProductsIcon({ className = "" }: { className?: string }) {
    return (
        <span className={`relative block ${className}`}>
            {/* mug — tucked small behind the stack, sitting toward the left at
                rest; on hover it pops out to the right, growing and tilting +5°. */}
            <img
                src="/images/product-mug.png"
                alt=""
                style={{
                    transition:
                        "width 300ms ease-out, translate 300ms ease-out, rotate 300ms ease-out",
                }}
                className="absolute bottom-0 right-0 h-auto w-[10px] -scale-x-100 -translate-x-[22px] -translate-y-[10px] rotate-0 group-hover:w-[24px] group-hover:translate-x-0 group-hover:translate-y-[5px] group-hover:rotate-[24deg]"
            />
            {/* hoodie — larger, anchored bottom-left */}
            <img
                src="/images/product-hoodie.png"
                alt=""
                className="absolute bottom-0 left-0 w-[74%] transition-transform duration-300 ease-out group-hover:-translate-x-[8px] group-hover:-rotate-[5deg]"
            />
            {/* cap — smaller, top-right, layered above the hood */}
            <img
                src="/images/product-cap.png"
                alt=""
                className="absolute top-0 right-0 w-[62%] transition-transform duration-300 ease-out group-hover:translate-x-[8px] group-hover:rotate-[5deg]"
            />
        </span>
    )
}
