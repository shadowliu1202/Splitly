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
