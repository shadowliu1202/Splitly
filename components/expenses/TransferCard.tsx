import { Settlement } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
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
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar src={from_user?.avatar_url} name={from_user?.display_name ?? '?'} size={36} />
          <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
          <Avatar src={to_user?.avatar_url} name={to_user?.display_name ?? '?'} size={36} />
          <div className="min-w-0 ml-1">
            <p className="text-sm text-gray-800 truncate">
              <span className="font-medium">{from_user?.display_name ?? '?'}</span>
              <span className="text-gray-400"> 轉帳給 </span>
              <span className="font-medium">{to_user?.display_name ?? '?'}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">轉帳結算</p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-semibold ${
            iAmFrom ? 'text-red-500' : iAmTo ? 'text-line-green' : 'text-gray-600'
          }`}>
            {iAmFrom ? '-' : iAmTo ? '+' : ''}
            ${Number(amount).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  )
}
