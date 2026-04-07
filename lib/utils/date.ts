/**
 * Format a YYYY-MM-DD string as a human-readable date label.
 * Today → "今天", Yesterday → "昨天", same year → "M月D日", else → "YYYY年M月D日"
 */
export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const yestStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

  if (iso === todayStr) return '今天'
  if (iso === yestStr) return '昨天'
  if (date.getFullYear() === now.getFullYear()) return `${m}月${d}日`
  return `${y}年${m}月${d}日`
}

/**
 * Groups an array of items by a YYYY-MM-DD key, returning ordered [dateKey, items[]] pairs
 * sorted by date descending.
 */
export function groupByDate<T>(items: T[], getDate: (item: T) => string): [string, T[]][] {
  const map: Record<string, T[]> = {}
  for (const item of items) {
    const key = getDate(item)
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
