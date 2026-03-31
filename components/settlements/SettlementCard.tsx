'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Transfer } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface Props {
  transfer: Transfer
  currentUserId: string
  groupId: string
  onSettled: () => void
}

export default function SettlementCard({
  transfer,
  currentUserId,
  groupId,
  onSettled,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [settled, setSettled] = useState(false)

  const iAmDebtor = transfer.fromUserId === currentUserId
  const iAmCreditor = transfer.toUserId === currentUserId

  const handleSettle = async () => {
    setLoading(true)
    try {
      await fetch(`/api/groups/${groupId}/settlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({
          fromUserId: transfer.fromUserId,
          toUserId: transfer.toUserId,
          amount: transfer.amount,
        }),
      })
      setSettled(true)
      setTimeout(onSettled, 800)
    } catch {
      alert('操作失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  if (settled) {
    return (
      <Card className="flex items-center gap-3 p-4 bg-green-50 border-green-200">
        <CheckCircle2 size={20} className="text-line-green" />
        <span className="text-sm text-green-700">已標記結清！</span>
      </Card>
    )
  }

  return (
    <Card className="p-4 space-y-3">
      {/* Transfer visualisation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar
            src={transfer.fromUser?.avatar_url}
            name={transfer.fromUser?.display_name ?? '?'}
            size={36}
          />
          <div className="min-w-0">
            <p className="text-xs text-gray-400">付款給</p>
            <p className="text-sm font-medium truncate">
              {transfer.fromUser?.display_name}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <span className="text-base font-bold text-gray-900">
            ${transfer.amount.toLocaleString()}
          </span>
          <ArrowRight size={16} className="text-gray-400" />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <div className="min-w-0 text-right">
            <p className="text-xs text-gray-400">收款人</p>
            <p className="text-sm font-medium truncate">
              {transfer.toUser?.display_name}
            </p>
          </div>
          <Avatar
            src={transfer.toUser?.avatar_url}
            name={transfer.toUser?.display_name ?? '?'}
            size={36}
          />
        </div>
      </div>

      {/* Action – only show to parties involved */}
      {(iAmDebtor || iAmCreditor) && (
        <Button
          variant={iAmDebtor ? 'primary' : 'secondary'}
          size="sm"
          loading={loading}
          onClick={handleSettle}
          className="w-full"
        >
          {iAmDebtor ? '我已付款 ✓' : '確認收到款項 ✓'}
        </Button>
      )}
    </Card>
  )
}
