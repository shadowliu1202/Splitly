import Link from 'next/link'
import { Settlement } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface Props {
  settlement: Settlement
  currentUserId: string
  groupId: string
}

export default function TransferCard({ settlement, groupId }: Props) {
  const { from_user, to_user, amount } = settlement

  return (
    <Link href={`/groups/${groupId}/settlements/${settlement.id}`}>
    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 active:bg-green-100">
      <Avatar src={from_user?.avatar_url} name={from_user?.display_name ?? '?'} size={40} />
      <p className="text-sm text-gray-700 flex-1 min-w-0">
        <span className="font-semibold">{from_user?.display_name ?? '?'}</span>
        <span className="text-gray-500"> 已經付給 </span>
        <span className="font-semibold">{to_user?.display_name ?? '?'}</span>
        <span className="text-gray-500"> ${Number(amount).toLocaleString()}</span>
      </p>
    </div>
    </Link>
  )
}
