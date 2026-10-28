import { format, parseISO, isValid } from 'date-fns'

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return isValid(d) ? format(d, 'dd MMM yyyy') : '—'
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = parseTimestamp(dateStr)
    return isValid(d) ? format(d, 'dd MMM yyyy, HH:mm') : '—'
  } catch {
    return '—'
  }
}

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Parses timestamp string or Date object into a valid Date instant.
 * Handles ISO strings with/without timezone offsets, consistently mapping to UTC instant.
 */
export function parseTimestamp(dateVal) {
  if (!dateVal) return null
  if (dateVal instanceof Date) return dateVal
  let str = String(dateVal).trim()
  if (!str.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(str)) {
    str += 'Z'
  }
  const d = parseISO(str)
  return isValid(d) ? d : new Date(dateVal)
}

/**
 * Computes schedule session status dynamically based on current time and persistence flags.
 * - CANCELLED: session marked as cancelled.
 * - UPCOMING: current instant before start_time.
 * - ONGOING: current instant between start_time and end_time (unless marked not conducted).
 * - COMPLETED: current instant >= end_time and conducted normally (or explicitly conducted).
 * - EXPIRED: start_time passed and marked not conducted (or passed without being conducted).
 */
export function getScheduleStatus(slotOrStartTime, endTime, now = new Date()) {
  let startVal = slotOrStartTime
  let endVal = endTime
  let isCancelled = false
  let isConducted = null

  if (typeof slotOrStartTime === 'object' && slotOrStartTime !== null && !(slotOrStartTime instanceof Date)) {
    startVal = slotOrStartTime.start_time
    endVal = slotOrStartTime.end_time
    isCancelled = Boolean(slotOrStartTime.is_cancelled)
    isConducted = slotOrStartTime.is_conducted
  }

  if (isCancelled) {
    return 'cancelled'
  }

  const start = parseTimestamp(startVal)
  const end = parseTimestamp(endVal)
  if (!start || !end) return 'upcoming'

  const nowMs = now.getTime()
  const startMs = start.getTime()
  const endMs = end.getTime()

  if (nowMs < startMs) {
    return 'upcoming'
  } else if (nowMs >= startMs && nowMs < endMs) {
    if (isConducted === false) {
      return 'expired'
    }
    return 'ongoing'
  } else {
    // Current instant is at or after endMs
    if (isConducted === false) {
      return 'expired'
    }
    return 'completed'
  }
}

