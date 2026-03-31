import type { User, UserBalance, Transfer } from '@/types'

/**
 * Given a list of net balances, compute the minimum set of transfers
 * needed to settle all debts (greedy algorithm).
 *
 * balance > 0 → person is owed money (creditor)
 * balance < 0 → person owes money   (debtor)
 */
export function calculateSettlements(
  balances: UserBalance[]
): Transfer[] {
  const EPSILON = 0.005

  // Work with mutable copies rounded to 2 decimal places
  const debtors = balances
    .filter((b) => b.amount < -EPSILON)
    .map((b) => ({ ...b, amount: Math.round(-b.amount * 100) / 100 })) // make positive

  const creditors = balances
    .filter((b) => b.amount > EPSILON)
    .map((b) => ({ ...b, amount: Math.round(b.amount * 100) / 100 }))

  const transfers: Transfer[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const transferAmount = Math.min(debtors[i].amount, creditors[j].amount)
    const rounded = Math.round(transferAmount * 100) / 100

    if (rounded > EPSILON) {
      transfers.push({
        fromUserId: debtors[i].userId,
        toUserId: creditors[j].userId,
        fromUser: debtors[i].user,
        toUser: creditors[j].user,
        amount: rounded,
      })
    }

    debtors[i].amount -= transferAmount
    creditors[j].amount -= transferAmount

    if (debtors[i].amount < EPSILON) i++
    if (creditors[j].amount < EPSILON) j++
  }

  return transfers
}

/**
 * Compute each member's net balance from a list of expenses + settlements.
 *
 * Expenses:
 *   - payer gets credit for total splits amount
 *   - each split person is debited their share
 *
 * Settlements (recorded transfers):
 *   - from_user paid → gets credit (+amount)
 *   - to_user received → loses credit (-amount)
 */
export function computeBalances(
  expenses: Array<{
    paid_by: string
    expense_splits: Array<{ user_id: string; amount: number }>
  }>,
  settlements: Array<{ from_user_id: string; to_user_id: string; amount: number }>,
  memberMap: Record<string, User>
): UserBalance[] {
  const balanceMap: Record<string, number> = {}

  // Init all members at 0
  for (const userId of Object.keys(memberMap)) {
    balanceMap[userId] = 0
  }

  // Apply expenses
  for (const expense of expenses) {
    const total = expense.expense_splits.reduce((sum, s) => sum + Number(s.amount), 0)
    balanceMap[expense.paid_by] = (balanceMap[expense.paid_by] ?? 0) + total

    for (const split of expense.expense_splits) {
      balanceMap[split.user_id] = (balanceMap[split.user_id] ?? 0) - Number(split.amount)
    }
  }

  // Apply settlements
  for (const s of settlements) {
    balanceMap[s.from_user_id] = (balanceMap[s.from_user_id] ?? 0) + Number(s.amount)
    balanceMap[s.to_user_id] = (balanceMap[s.to_user_id] ?? 0) - Number(s.amount)
  }

  return Object.entries(balanceMap).map(([userId, amount]) => ({
    userId,
    user: memberMap[userId],
    amount: Math.round(amount * 100) / 100,
  }))
}
