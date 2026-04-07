import { Settlement } from '@/types'
import { cn } from '@/lib/utils/cn'
import { ArrowRight } from 'lucide-react'

interface Props {
  settlement: Settlement
  currentUserId: string
}

export default function TransferCard({ settlement, currentUserId }: Props) {
  const { from_user, to_user, amount } = settlement
  const iAmFrom = settlement.from_user_id === currentUserId
  const iAmTo = settlement.to_user_id === currentUserId

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-2xl border border-blue-100">
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className="text-sm font-medium text-gray-800 truncate">{from_user?.display_name ?? '?'}</span>
        <ArrowRight size={13} className="text-blue-300 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-800 truncate">{to_user?.display_name ?? '?'}</span>
        <span className="text-xs text-blue-400 ml-1 flex-shrink-0">轉帳</span>
      </div>

      <p className={cn('text-sm font-semibold flex-shrink-0',
        iAmFrom ? 'text-red-500' : iAmTo ? 'text-line-green' : 'text-blue-500'
      )}>
        {iAmFrom ? '-' : iAmTo ? '+' : ''}${Number(amount).toLocaleString()}
      </p>
    </div>
  )
}
