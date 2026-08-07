// Estimated delivery window shown in the rail: a 5–7 day span counted from the
// day the shopper is looking at the page, rather than a fixed date that goes
// stale. Production derives this from the shipping service; the proto only
// needs the shape of the promise to be right.

export const DELIVERY_MIN_DAYS = 5
export const DELIVERY_MAX_DAYS = 7

function addDays(date: Date, days: number) {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

// en-US, not en-GB: "Sep", not en-GB's "Sept", so every month abbreviates to
// three letters and the line keeps a stable width.
const shortMonth = (date: Date) => date.toLocaleDateString("en-US", { month: "short" })

/**
 * "Aug. 12-14" within one month, "Aug. 30 - Sep. 1" when the window straddles
 * two — the second month is only named when it actually changes.
 */
export function formatDeliveryWindow(from: Date) {
    const start = addDays(from, DELIVERY_MIN_DAYS)
    const end = addDays(from, DELIVERY_MAX_DAYS)
    if (start.getMonth() === end.getMonth()) {
        return `${shortMonth(start)}. ${start.getDate()}-${end.getDate()}`
    }
    return `${shortMonth(start)}. ${start.getDate()} - ${shortMonth(end)}. ${end.getDate()}`
}
