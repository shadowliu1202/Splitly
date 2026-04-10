/**
 * LINE message text builders.
 * Messages are sent via liff.sendMessages() on the client side (personal account).
 */

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
