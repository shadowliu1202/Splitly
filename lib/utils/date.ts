const pad = (n: number) => String(n).padStart(2, '0')

/** Returns local YYYY-MM-DD from a Date object. */
function localDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Extracts local YYYY-MM-DD from an ISO timestamp for date grouping.
 */
export function toLocalDateKey(iso: string): string {
  return localDateStr(new Date(iso))
}

/**
 * Returns a value string for a datetime-local input (YYYY-MM-DDTHH:MM) in local time.
 * Pass an ISO string to convert an existing value, or omit for "now".
 */
export function toLocalInputDatetime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  return `${localDateStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Formats an ISO timestamp as a localized date + time string.
 * e.g. "2025/4/7 下午02:30"
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a YYYY-MM-DD date key as a human-readable label.
 * Today → "今天", Yesterday → "昨天", same year → "M月D日", else → "YYYY年M月D日"
 */
export function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const now = new Date()

  if (date.getFullYear() === now.getFullYear()) return `${m}月${d}日`
  return `${y}年${m}月${d}日`
}

/**
 * Groups an array of items by local date, returning [YYYY-MM-DD, items[]] pairs
 * sorted by date descending.
 */
export function groupByDate<T>(items: T[], getDate: (item: T) => string): [string, T[]][] {
  const map: Record<string, T[]> = {}
  for (const item of items) {
    const key = toLocalDateKey(getDate(item))
    if (!map[key]) map[key] = []
    map[key].push(item)
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
}

/**
 * Returns a human-readable relative time string.
 * e.g. "3 分鐘前", "昨天", "2 天前"
 */
export function formatDistanceToNow(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return '剛剛'
  if (diffMinutes < 60) return `${diffMinutes} 分鐘前`
  if (diffHours < 24) return `${diffHours} 小時前`
  if (diffDays === 1) return '昨天'
  if (diffDays < 30) return `${diffDays} 天前`

  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  })
}
