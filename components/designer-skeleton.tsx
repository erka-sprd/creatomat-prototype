import SiteHeader from "@/components/site-header"

// Full-page fallback shown while the Designer chunk loads. The real header +
// banner render immediately; only the three columns are skeletons, mirroring
// the designer's own staged intro reveal so the transition is seamless.

const Block = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-neutral-200/70 ${className ?? ""}`} />
)

export default function DesignerSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col">
      <SiteHeader />

      <div className="flex min-h-0 flex-1 flex-col px-8 py-[16px]">
        <div className="flex min-h-0 flex-1 items-stretch justify-center gap-2">
          {/* left tools — top (Products), middle (4 tools), bottom (undo/redo) */}
          <div className="flex w-[100px] flex-shrink-0 flex-col items-center rounded-[12px] bg-[#F4F4F4] p-[6px] px-1.5">
            <div className="flex-shrink-0">
              <Block className="h-[68px] w-[88px] rounded-[10px]" />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Block key={i} className="h-[68px] w-[88px] rounded-[10px]" />
              ))}
            </div>
            <div className="flex flex-shrink-0 flex-col gap-[2px] pb-1">
              {Array.from({ length: 2 }).map((_, i) => (
                <Block key={i} className="h-9 w-[88px] rounded-[10px] opacity-60" />
              ))}
            </div>
          </div>
          {/* middle canvas — the loader animation is rendered by the designer
              itself (single instance) so it doesn't restart at the handoff. */}
          <div className="flex-1 rounded-[12px] bg-[#F4F4F4]" />
          {/* right product panel */}
          <div className="flex w-[470px] flex-shrink-0 flex-col gap-4 rounded-[12px] bg-[#F4F4F4] p-[24px]">
            <Block className="h-6 w-3/4" />
            <Block className="h-4 w-1/3" />
            <div className="mt-2 flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Block key={i} className="h-8 w-8 rounded-full" />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Block key={i} className="h-9" />
              ))}
            </div>
            <Block className="mt-auto h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
