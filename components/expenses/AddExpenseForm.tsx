'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, SplitType } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'

interface SplitRow {
  userId: string
  displayName: string
  avatarUrl: string | null
  included: boolean
  customAmount: string
}

interface Props {
  groupId: string
  members: User[]
  currentUserId: string
}

export default function AddExpenseForm({
  groupId,
  members,
  currentUserId,
}: Props) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [splits, setSplits] = useState<SplitRow[]>(
    members.map((m) => ({
      userId: m.id,
      displayName: m.display_name,
      avatarUrl: m.avatar_url,
      included: true,
      customAmount: '',
    }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const includedSplits = splits.filter((s) => s.included)
  const totalAmount = parseFloat(amount) || 0
  const perPerson =
    includedSplits.length > 0
      ? Math.round((totalAmount / includedSplits.length) * 100) / 100
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!description.trim()) {
      setError('請輸入描述')
      return
    }
    if (!totalAmount || totalAmount <= 0) {
      setError('請輸入有效金額')
      return
    }
    if (includedSplits.length === 0) {
      setError('請選擇至少一位分帳成員')
      return
    }

    let splitData: { userId: string; amount: number }[]

    if (splitType === 'equal') {
      splitData = includedSplits.map((s) => ({
        userId: s.userId,
        amount: perPerson,
      }))
    } else {
      splitData = includedSplits.map((s) => ({
        userId: s.userId,
        amount: parseFloat(s.customAmount) || 0,
      }))
      const splitTotal = splitData.reduce((sum, s) => sum + s.amount, 0)
      if (Math.abs(splitTotal - totalAmount) > 0.01) {
        setError(
          `分帳總計 $${splitTotal.toFixed(0)} 與支出金額 $${totalAmount.toFixed(0)} 不符`
        )
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({
          description,
          amount: totalAmount,
          paidBy,
          splitType,
          splits: splitData,
        }),
      })
      if (!res.ok) throw new Error('新增失敗')
      router.back()
    } catch {
      setError('新增支出失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          描述
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例：晚餐、計程車費..."
          required
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          金額
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            $
          </span>
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

      {/* Paid by */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          誰付錢
        </label>
        <div className="space-y-2">
          {members.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer active:bg-gray-50"
            >
              <input
                type="radio"
                name="paidBy"
                value={member.id}
                checked={paidBy === member.id}
                onChange={() => setPaidBy(member.id)}
                className="accent-line-green"
              />
              <Avatar
                src={member.avatar_url}
                name={member.display_name}
                size={32}
              />
              <span className="text-sm flex-1">{member.display_name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Split type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          分帳方式
        </label>
        <div className="flex gap-2">
          {(
            [
              { value: 'equal', label: '均分' },
              { value: 'custom', label: '自訂金額' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSplitType(opt.value)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                splitType === opt.value
                  ? 'bg-line-green text-white border-line-green'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split among */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          分帳給
        </label>
        <div className="space-y-2">
          {splits.map((split) => (
            <div
              key={split.userId}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200"
            >
              <input
                type="checkbox"
                checked={split.included}
                onChange={() =>
                  setSplits((prev) =>
                    prev.map((s) =>
                      s.userId === split.userId
                        ? { ...s, included: !s.included }
                        : s
                    )
                  )
                }
                className="accent-line-green w-4 h-4"
              />
              <Avatar
                src={split.avatarUrl}
                name={split.displayName}
                size={32}
              />
              <span className="text-sm flex-1 truncate">{split.displayName}</span>

              {splitType === 'custom' && split.included && (
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    value={split.customAmount}
                    onChange={(e) =>
                      setSplits((prev) =>
                        prev.map((s) =>
                          s.userId === split.userId
                            ? { ...s, customAmount: e.target.value }
                            : s
                        )
                      )
                    }
                    placeholder="0"
                    className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:border-line-green"
                    min="0"
                    step="1"
                  />
                </div>
              )}
              {splitType === 'equal' && split.included && totalAmount > 0 && (
                <span className="text-sm text-gray-400 w-16 text-right">
                  ${perPerson.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        新增支出
      </Button>
    </form>
  )
}
