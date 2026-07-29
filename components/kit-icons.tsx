// Generic Spreadshirt component-kit glyphs (v2), inlined because the kit isn't
// a dependency of this proto. Filled paths on currentColor — the weight comes
// from the glyph itself, so there's no strokeWidth to tune.

export type KitIconProps = { className?: string }

// Kit v2 Checkmark — used for copy/share confirmations.
export const CheckmarkIcon = ({ className }: KitIconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M19.2929 6.29289C19.6834 5.90237 20.3166 5.90237 20.7071 6.29289C21.0676 6.65338 21.0953 7.22061 20.7903 7.6129L20.7071 7.70711L10.7071 17.7071C10.3466 18.0676 9.77939 18.0953 9.3871 17.7903L9.29289 17.7071L4.29289 12.7071C3.90237 12.3166 3.90237 11.6834 4.29289 11.2929C4.65338 10.9324 5.22061 10.9047 5.6129 11.2097L5.70711 11.2929L10 15.585L19.2929 6.29289Z"
            fill="currentColor"
        />
    </svg>
)
