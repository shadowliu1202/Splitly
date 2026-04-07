import Link from 'next/link'
import { Expense } from '@/types'
import { formatDateTime } from '@/lib/utils/date'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'

interface Props {
  expense: Expense
  currentUserId: string
  groupId: string
}

export default function ExpenseCard({ expense, currentUserId, groupId }: Props) {
  const payer = expense.payer
  const myShare = expense.expense_splits?.find((s) => s.user_id === currentUserId)
  const iAmPayer = expense.paid_by === currentUserId

  const dateLabel = formatDateTime(expense.happened_at)

  return (
    <Link href={`/groups/${groupId}/expenses/${expense.id}`}>
      <Card className="p-4 active:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          {/* Payer avatar */}
          <Avatar src={payer?.avatar_url} name={payer?.display_name ?? '?'} size={40} />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{expense.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {payer?.display_name ?? '未知'} 付了{' '}
                  <span className="font-semibold text-gray-700">
                    ${Number(expense.amount).toLocaleString()}
                  </span>
                  {expense.photo_url && (
                    <span className="ml-1.5 text-gray-300">📷</span>
                  )}
                </p>
              </div>

              {/* My share badge */}
              <div className="text-right flex-shrink-0">
                {myShare && (
                  <p className={`text-sm font-semibold ${iAmPayer ? 'text-line-green' : 'text-red-500'}`}>
                    {iAmPayer ? '你付了' : '你欠'}
                    <br />
                    ${Number(myShare.amount).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Split breakdown */}
            {expense.expense_splits && expense.expense_splits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {expense.expense_splits.map((split) => (
                  <span
                    key={split.user_id}
                    className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                  >
                    {split.users?.display_name ?? split.user_id.slice(0, 6)} $
                    {Number(split.amount).toLocaleString()}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-300 mt-1.5">{dateLabel}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
