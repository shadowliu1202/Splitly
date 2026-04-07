'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'

interface Props {
  groupId: string
  members: User[]
  currentUserId: string
}

export default function AddTransferForm({ groupId, members, currentUserId }: Props) {
  const router = useRouter()

  const othersDefault = members.find((m) => m.id !== currentUserId)?.id ?? ''

  const [fromUserId, setFromUserId] = useState(currentUserId)
  const [toUserId, setToUserId] = useState(othersDefault)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) { setError('請輸入有效金額'); return }
    if (fromUserId === toUserId) { setError('付款人與收款人不能相同'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId },
        body: JSON.stringify({ fromUserId, toUserId, amount: parsed }),
      })
      if (!res.ok) throw new Error('新增失敗')
      router.back()
    } catch {
      setError('新增轉帳失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  const fromUser = members.find((m) => m.id === fromUserId)
  const toUser = members.find((m) => m.id === toUserId)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {/* From */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">誰付錢</label>
        <select
          value={fromUserId}
          onChange={(e) => setFromUserId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.display_name}</option>
          ))}
        </select>
      </div>

      {/* To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">付給誰</label>
        <select
          value={toUserId}
          onChange={(e) => setToUserId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.display_name}</option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="pl-7"
            min="0"
            step="1"
            required
          />
        </div>
      </div>

      {/* Summary */}
      {fromUser && toUser && parseFloat(amount) > 0 && fromUserId !== toUserId && (
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <Avatar src={fromUser.avatar_url} name={fromUser.display_name} size={32} />
          <span className="text-sm text-gray-500">付</span>
          <span className="text-sm font-semibold text-gray-900">${parseFloat(amount).toLocaleString()}</span>
          <span className="text-sm text-gray-500">給</span>
          <Avatar src={toUser.avatar_url} name={toUser.display_name} size={32} />
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        新增轉帳
      </Button>
    </form>
  )
}
