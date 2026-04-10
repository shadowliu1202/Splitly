/**
 * LINE Messaging API push helper.
 * Requires LINE_CHANNEL_ACCESS_TOKEN in server environment.
 */

interface LineTextMessage {
  type: 'text'
  text: string
}

export async function pushLineMessage(
  lineGroupId: string,
  messages: LineTextMessage[]
): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    console.warn('[lineNotify] LINE_CHANNEL_ACCESS_TOKEN is not set — skipping push')
    return
  }

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: lineGroupId, messages }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[lineNotify] Push failed:', res.status, body)
  }
}

export function buildExpenseNotifyText(opts: {
  groupName: string
  description: string
  amount: number
  currency: string
  payerName: string
  splitCount: number
}): string {
  const { groupName, description, amount, currency, payerName, splitCount } = opts
  return [
    `💰 ${groupName} ─ 新增支出`,
    `📝 ${description}`,
    `💵 ${payerName} 付了 ${currency} ${Number(amount).toLocaleString()}`,
    `👥 分攤給 ${splitCount} 人`,
  ].join('\n')
}

export function buildTransferNotifyText(opts: {
  groupName: string
  fromName: string
  toName: string
  amount: number
  currency: string
}): string {
  const { groupName, fromName, toName, amount, currency } = opts
  return [
    `💸 ${groupName} ─ 轉帳記錄`,
    `${fromName} 付給 ${toName}`,
    `金額：${currency} ${Number(amount).toLocaleString()}`,
  ].join('\n')
}
