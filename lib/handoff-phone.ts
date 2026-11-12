// The phone every handoff's mobile version is shown on: an iPhone 12 mini
// screen, in CSS px (its points). One size for all handoffs, so their mobile
// demos read alike — components/handoff/phone-frame.tsx draws it.
export const PHONE_SCREEN_W = 375
export const PHONE_SCREEN_H = 812
// The display's own rounded corners.
export const PHONE_SCREEN_RADIUS = 44

// What the browser and the system take of the screen: the status bar around
// the notch on top (its safe area), and at the bottom Safari's compact tab bar
// (back, address, more) over the home indicator.
export const PHONE_STATUS_BAR_H = 50
export const PHONE_SAFARI_BAR_H = 86

/** The web page's own height on that screen — what a scene lays out in. */
export const PHONE_VIEWPORT_H = PHONE_SCREEN_H - PHONE_STATUS_BAR_H - PHONE_SAFARI_BAR_H
