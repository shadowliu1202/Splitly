'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@/components/providers/UserProvider'
import { UserBalance, Transfer } from '@/types'
import Avatar from '@/components/ui/Avatar'
import SettlementCard from '@/components/settlements/SettlementCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Header from '@/components/layout/Header'

export default function BalancesPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()

  const [balances, setBalances] = useState<UserBalance[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBalances = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/balances`, {
        headers: { 'x-user-id': user.id },
      })
      const { balances: b, transfers: t } = await res.json()
      setBalances(b ?? [])
      setTransfers(t ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [groupId, user])

  useEffect(() => { fetchBalances() }, [fetchBalances])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  const allSettled = transfers.length === 0
  const sorted = [...balances].sort((a, b) => b.amount - a.amount)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="群組結算" showBack />

      <div className="p-4 pb-16 space-y-5">
        {/* Member balance list */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            成員餘額
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {sorted.map((b) => {
              const isMe = b.userId === user?.id
              return (
                <div key={b.userId} className="flex items-center gap-3 px-4 py-3">
                  <Avatar
                    src={b.user.avatar_url}
                    name={b.user.display_name}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {b.user.display_name}
                      {isMe && (
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">（你）</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {b.amount > 0 ? '別人欠你' : b.amount < 0 ? '你欠別人' : '已結清'}
                    </p>
                  </div>
                  <p
                    className={`text-base font-bold ${
                      b.amount > 0
                        ? 'text-line-green'
                        : b.amount < 0
                        ? 'text-red-500'
                        : 'text-gray-300'
                    }`}
                  >
                    {b.amount > 0
                      ? `+$${b.amount.toLocaleString()}`
                      : b.amount < 0
                      ? `-$${Math.abs(b.amount).toLocaleString()}`
                      : '$0'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Settlement transfers */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            建議轉帳
          </p>
          {allSettled ? (
            <div className="text-center py-12 space-y-2 text-gray-400">
              <p className="text-4xl">🎉</p>
              <p className="font-medium text-gray-600">所有帳已結清！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer, i) => (
                <SettlementCard
                  key={i}
                  transfer={transfer}
                  currentUserId={user?.id ?? ''}
                  groupId={groupId}
                  onSettled={fetchBalances}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
