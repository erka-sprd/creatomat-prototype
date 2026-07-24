import HelpMenu from "@/components/help-menu"
import PromoBanner from "@/components/promo-banner"

type SiteHeaderProps = {
  hidden?: boolean
  onCartClick?: () => void
  cartCount?: number
}

export default function SiteHeader({
  hidden = false,
  onCartClick,
  cartCount = 0,
}: SiteHeaderProps) {
  return (
    <header
      className={`${hidden ? "hidden" : "flex"} flex-none w-full flex-col shadow-[0_2px_4px_rgba(0,0,0,0.04)] bg-white`}
    >
      <PromoBanner />
      <div className="w-full px-8">
        <div className="mx-auto flex h-16 w-full max-w-[1920px] items-center justify-between">
          <img src="/icons/Logo.svg" alt="Spreadshirt" className="h-[28px]" />
          <div className="flex items-center gap-6">
            <HelpMenu />
            <button
              type="button"
              aria-label="Cart"
              onClick={onCartClick}
              className="relative cursor-pointer"
            >
              <img src="/icons/icon-cart.svg" alt="" className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#007D38] px-[5px] text-[11px] font-semibold leading-none text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button type="button" aria-label="Menu" className="cursor-pointer">
              <img src="/icons/icon-hamburger-menu.svg" alt="" className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
