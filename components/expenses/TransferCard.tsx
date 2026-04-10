import Link from 'next/link'
import { Settlement } from '@/types'
import { getCurrencySymbol, convertAmount } from '@/lib/utils/currencies'
import Avatar from '@/components/ui/Avatar'

interface Props {
  settlement: Settlement
  currentUserId: string
  groupId: string
  groupCurrency?: string
}

export default function TransferCard({ settlement, groupId, groupCurrency = 'TWD' }: Props) {
  const { from_user, to_user, amount } = settlement
  const currency = settlement.currency ?? groupCurrency
  const symbol = getCurrencySymbol(currency)
  const isForeign = currency !== groupCurrency
  const convertedTotal = isForeign
    ? convertAmount(Number(amount), Number(settlement.exchange_rate ?? 1))
    : null

  return (
    <Link href={`/groups/${groupId}/settlements/${settlement.id}`}>
      <div className="flex items-center gap-3 px-4 py-3 bg-green-50 active:bg-green-100">
        <Avatar src={from_user?.avatar_url} name={from_user?.display_name ?? '?'} size={40} />
        <p className="text-sm text-gray-700 flex-1 min-w-0">
          <span className="font-semibold">{from_user?.display_name ?? '?'}</span>
          <span className="text-gray-500"> 已經付給 </span>
          <span className="font-semibold">{to_user?.display_name ?? '?'}</span>
          <span className="text-gray-500"> {symbol}{Number(amount).toLocaleString()}</span>
          {isForeign && convertedTotal !== null && (
            <span className="text-gray-400 text-xs"> ≈ {getCurrencySymbol(groupCurrency)}{convertedTotal.toLocaleString()}</span>
          )}
        </p>
      </div>
    </Link>
  )
}
