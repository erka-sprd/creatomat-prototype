// Edit mode freezes the page in time as well as in hover: anything on a
// timer (a notice that lingers 2s, a toast, a delayed close) stays on screen
// while you inspect it. setTimeout is wrapped once, when this dev-only module
// loads: a timeout that comes due while frozen is held, and runs once edit
// mode turns off. A held timeout the app clears is dropped, as it would have
// been. setInterval is left alone: ticking things keep ticking.

// The browser's own, kept on the window so a hot reload of this module
// wraps them again instead of wrapping its previous wrapper.
type Real = { setTimeout: typeof window.setTimeout; clearTimeout: typeof window.clearTimeout }
const w = window as typeof window & { __devEditRealTimers?: Real }
w.__devEditRealTimers ??= {
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
}
const realSetTimeout = w.__devEditRealTimers.setTimeout
const realClearTimeout = w.__devEditRealTimers.clearTimeout

let frozen = false
// Timeouts that came due while frozen, by id, in the order they came due.
const held = new Map<number, () => void>()

window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  if (typeof handler !== "function") return realSetTimeout(handler, timeout, ...args)
  const id: number = realSetTimeout(() => {
    if (frozen) held.set(id, () => handler(...args))
    else handler(...args)
  }, timeout)
  return id
}) as typeof window.setTimeout

window.clearTimeout = ((id?: number) => {
  if (id !== undefined) held.delete(id)
  realClearTimeout(id)
}) as typeof window.clearTimeout

/** Holds every timeout that comes due from now on; returns the thaw. */
export function freezeTimers(): () => void {
  frozen = true
  return () => {
    frozen = false
    const due = [...held.values()]
    held.clear()
    due.forEach(run => realSetTimeout(run, 0))
  }
}
