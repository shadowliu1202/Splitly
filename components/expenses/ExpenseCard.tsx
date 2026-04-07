import Link from 'next/link'
import { Expense } from '@/types'
import { formatDateTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import Avatar from '@/components/ui/Avatar'

interface Props {
  expense: Expense
  currentUserId: string
  groupId: string
}

export default function ExpenseCard({ expense, currentUserId, groupId }: Props) {
  const payer = expense.payer
  const myShare = expense.expense_splits?.find((s) => s.user_id === currentUserId)
  const iAmPayer = expense.paid_by === currentUserId

  return (
    <Link href={`/groups/${groupId}/expenses/${expense.id}`}>
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 active:bg-gray-50">
        <Avatar src={payer?.avatar_url} name={payer?.display_name ?? '?'} size={40} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {payer?.display_name ?? '未知'} · ${Number(expense.amount).toLocaleString()}
            {expense.photo_url && <span className="ml-1">📷</span>}
          </p>
          <p className="text-xs text-gray-300 mt-0.5">{formatDateTime(expense.happened_at)}</p>
        </div>

        {myShare && (
          <div className="text-right flex-shrink-0">
            <p className={cn('text-xs mb-0.5', iAmPayer ? 'text-gray-400' : 'text-gray-400')}>
              {iAmPayer ? '你付了' : '你欠'}
            </p>
            <p className={cn('text-sm font-semibold', iAmPayer ? 'text-line-green' : 'text-red-500')}>
              ${Number(myShare.amount).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}
