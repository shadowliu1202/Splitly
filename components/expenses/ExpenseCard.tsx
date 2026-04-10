import Link from 'next/link'
import { Expense } from '@/types'
import { cn } from '@/lib/utils/cn'
import { getCategoryMeta } from '@/lib/utils/expenseCategories'
import { getCurrencySymbol, convertAmount } from '@/lib/utils/currencies'

interface Props {
  expense: Expense
  currentUserId: string
  groupId: string
  groupCurrency?: string
}

export default function ExpenseCard({ expense, currentUserId, groupId, groupCurrency = 'TWD' }: Props) {
  const payer = expense.payer
  const myShare = expense.expense_splits?.find((s) => s.user_id === currentUserId)
  const iAmPayer = expense.paid_by === currentUserId
  const cat = getCategoryMeta(expense.category)
  const Icon = cat.icon

  const expCurrency = expense.currency ?? groupCurrency
  const isForeign = expCurrency !== groupCurrency
  const symbol = getCurrencySymbol(expCurrency)
  const defaultSymbol = getCurrencySymbol(groupCurrency)
  const convertedTotal = isForeign
    ? convertAmount(Number(expense.amount), Number(expense.exchange_rate ?? 1))
    : null

  return (
    <Link href={`/groups/${groupId}/expenses/${expense.id}`}>
      <div className="flex items-center gap-3 px-4 py-3 bg-white active:bg-gray-50">
        {/* Category icon */}
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cat.bg)}>
          <Icon size={18} className={cat.text} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{expense.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {payer?.display_name ?? '未知'} 先付 {symbol}{Number(expense.amount).toLocaleString()}
            {isForeign && convertedTotal !== null && (
              <span className="ml-1 text-gray-300">
                ≈ {defaultSymbol}{convertedTotal.toLocaleString()}
              </span>
            )}
            {expense.photo_url && <span className="ml-1">📷</span>}
          </p>
        </div>

        {/* My share */}
        {myShare && (
          <p className="text-sm font-semibold flex-shrink-0 text-red-500">
            {symbol}{Number(myShare.amount).toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  )
}
