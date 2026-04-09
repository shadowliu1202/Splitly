import Link from 'next/link'
import { Expense } from '@/types'
import { cn } from '@/lib/utils/cn'
import { getCategoryMeta } from '@/lib/utils/expenseCategories'

interface Props {
  expense: Expense
  currentUserId: string
  groupId: string
}

export default function ExpenseCard({ expense, currentUserId, groupId }: Props) {
  const payer = expense.payer
  const myShare = expense.expense_splits?.find((s) => s.user_id === currentUserId)
  const iAmPayer = expense.paid_by === currentUserId
  const cat = getCategoryMeta(expense.category)
  const Icon = cat.icon

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
            {payer?.display_name ?? '未知'} 先付 ${Number(expense.amount).toLocaleString()}
            {expense.photo_url && <span className="ml-1">📷</span>}
          </p>
        </div>

        {/* My share */}
        {myShare && (
          <p className={cn('text-sm font-semibold flex-shrink-0', iAmPayer ? 'text-line-green' : 'text-red-500')}>
            ${Number(myShare.amount).toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  )
}
