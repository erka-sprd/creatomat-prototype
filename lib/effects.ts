// The effects an image can take — create-omat's Effects panels (EffectsGrid on
// desktop, EffectsPanel + EffectControlsPanel on mobile): the same list and
// order, the same sliders with their ranges, defaults and labels, and its own
// cat thumbnails (public/img/effects). The rendering is this project's own —
// lib/effect-render.ts.

export type EffectParam = {
  key: string
  label: string
  type: "Int" | "Float"
  min: number
  max: number
  defaultValue: number
}

export type EffectDef = {
  id: string
  label: string
  thumbnail: string
  params: readonly EffectParam[]
}

const p = (
  key: string,
  label: string,
  type: EffectParam["type"],
  min: number,
  max: number,
  defaultValue: number
): EffectParam => ({ key, label, type, min, max, defaultValue })

const effect = (id: string, label: string, params: EffectParam[] = []): EffectDef => ({
  id,
  label,
  thumbnail: `/img/effects/${id}.png`,
  params,
})

// Posterize … Mirror first (EFFECTS_ORDER), the rest after.
export const EFFECTS: readonly EffectDef[] = [
  effect("posterize", "Posterize", [p("levels", "Number of levels", "Float", 1, 10, 2.1)]),
  effect("dot-pattern", "Dot Pattern", [
    p("blur", "Global blur", "Float", 0, 1, 0),
    p("dots", "Number of dots", "Float", 1, 100, 40),
    p("size", "Size of dots", "Float", 0, 1, 0.48),
  ]),
  effect("radial-pixel", "Radial Pixel", [
    p("radius", "Radius per row", "Float", 0, 1, 0.09),
    p("segments", "Size per row", "Float", 0.001, 0.1, 0.01),
  ]),
  effect("linocut", "Linocut", [p("scale", "Scale of pattern", "Float", 0, 1, 0.28)]),
  effect("pixelize", "Pixelize", [
    p("horizontal", "Horizontal count", "Int", 1, 100, 47),
    p("vertical", "Vertical count", "Int", 1, 100, 36),
  ]),
  effect("liquid", "Liquid", [
    p("amount", "Intensity", "Float", 0, 0.3, 0.08),
    p("scale", "Scale", "Float", 0, 2, 0.3),
    p("time", "Variation", "Float", 0, 2, 0.3),
  ]),
  effect("cross-cut", "Cross Cut", [
    p("offset", "Horizontal offset", "Float", 0, 0.3, 0.22),
    p("slices", "Horizontal cuts", "Float", 1, 20, 4.8),
    p("speedV", "Vertical offset", "Float", 0, 2, 0.4),
    p("time", "Variation", "Float", 0, 5, 2.2),
  ]),
  effect("half-tone", "Half Tone", [
    p("angle", "Angle of pattern", "Float", 0, 360, 11.6),
    p("scale", "Scale of pattern", "Float", 0, 1, 0.33),
  ]),
  effect("tv-glitch", "TV Glitch", [
    p("distortion", "Rough distortion", "Float", 0, 10, 5.1),
    p("distortion2", "Fine distortion", "Float", 0, 5, 2.3),
    p("rollSpeed", "Vertical offset", "Float", 0, 5, 2),
    p("speed", "Variance", "Float", 0, 10, 6.2),
  ]),
  effect("mirror", "Mirror", [p("side", "Mirrored side", "Int", 0, 3, 2)]),
  effect("outliner", "Outliner", [
    p("amount", "Intensity", "Float", 0, 1, 1),
    p("passthrough", "Blending", "Float", 0, 1, 0.55),
  ]),
  effect("glow", "Glow", [
    p("amount", "Intensity", "Float", 0, 1, 0.85),
    p("darkness", "Darkening", "Float", 0, 1, 0.41),
    p("size", "Bloom", "Float", 1, 20, 4.4),
  ]),
  effect("vignette", "Vignette", [
    p("darkness", "Colour", "Float", 0, 1, 1),
    p("offset", "Size", "Float", 0, 2, 1.8),
  ]),
  effect("sharpie", "Sharpie"),
  effect("recolor", "Recolor", [
    p("colorMatch", "Colour match", "Float", 0, 1, 0.22),
    p("brightnessMatch", "Brightness match", "Float", 0, 2, 2),
    p("smoothness", "Smoothness", "Float", 0, 0.5, 0.43),
  ]),
  effect("green-screen", "Green Screen", [
    p("colorMatch", "Colour match", "Float", 0, 1, 0.78),
    p("smoothness", "Smoothness", "Float", 0, 0.5, 0.5),
    p("spill", "Spill", "Float", 0, 1, 1),
  ]),
]

export const NO_EFFECT_LABEL = "No Effect"
export const EFFECTS_PANEL_TITLE = "Effects"

const EFFECTS_BY_ID = new Map(EFFECTS.map(e => [e.id, e]))

export const effectById = (id: string | null | undefined): EffectDef | null =>
  (id && EFFECTS_BY_ID.get(id)) || null

// What an image carries once an effect is applied: which one, and its sliders.
export type AppliedEffect = { id: string; values: Record<string, number> }

export const defaultEffectValues = (def: EffectDef): Record<string, number> =>
  Object.fromEntries(def.params.map(param => [param.key, param.defaultValue]))

// create-omat's sliderStep: whole steps for Int, hundredths on a 0–1 scale,
// tenths otherwise.
export const effectSliderStep = (param: EffectParam): number =>
  param.type === "Int" ? 1 : param.max <= 1 ? 0.01 : 0.1
