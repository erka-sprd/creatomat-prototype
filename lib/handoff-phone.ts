// The phone every handoff's mobile version is shown on: an iPhone 12 mini
// screen, in CSS px (its points). One size for all handoffs, so their mobile
// demos read alike — components/handoff/phone-frame.tsx draws it.
export const PHONE_SCREEN_W = 375
export const PHONE_SCREEN_H = 812
// The display's own rounded corners: an iPhone 16's.
export const PHONE_SCREEN_RADIUS = 55
// The bezel around the screen, and the whole phone's outer size.
// 3px metal rim + 8px black glass border (components/handoff/phone-frame.tsx).
export const PHONE_BEZEL_PX = 11
export const PHONE_FRAME_W = PHONE_SCREEN_W + 2 * PHONE_BEZEL_PX
export const PHONE_FRAME_H = PHONE_SCREEN_H + 2 * PHONE_BEZEL_PX

// What the browser and the system take of the screen: the status bar around
// the Dynamic Island on top (its safe area), and at the bottom Safari's
// compact tab bar (back, address, more) over the home indicator.
export const PHONE_STATUS_BAR_H = 54
export const PHONE_SAFARI_BAR_H = 86

/** The web page's own height on that screen — what a scene lays out in. */
export const PHONE_VIEWPORT_H = PHONE_SCREEN_H - PHONE_STATUS_BAR_H - PHONE_SAFARI_BAR_H
