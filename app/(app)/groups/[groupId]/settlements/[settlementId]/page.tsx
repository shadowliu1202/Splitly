'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useUser } from '@/components/providers/UserProvider'
import { Settlement, User } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SettlementDetailPage() {
  const { groupId, settlementId } = useParams<{ groupId: string; settlementId: string }>()
  const { user } = useUser()
  const router = useRouter()

  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // edit state
  const [fromUserId, setFromUserId] = useState('')
  const [toUserId, setToUserId] = useState('')
  const [amount, setAmount] = useState('')

  const fetchData = useCallback(async () => {
    if (!user) return
    const headers = { 'x-user-id': user.id }
    const [settRes, memRes] = await Promise.all([
      fetch(`/api/groups/${groupId}/settlements/${settlementId}`, { headers }),
      fetch(`/api/groups/${groupId}/members`, { headers }),
    ])
    const [{ settlement: s }, { members: mems }] = await Promise.all([
      settRes.json(),
      memRes.json(),
    ])
    setSettlement(s)
    setMembers(mems ?? [])
    setLoading(false)
  }, [groupId, settlementId, user])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!settlement) return
    setFromUserId(settlement.from_user_id)
    setToUserId(settlement.to_user_id)
    setAmount(String(settlement.amount))
  }, [settlement])

  const handleSave = async () => {
    if (!user) return
    setError('')
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) { setError('請輸入有效金額'); return }
    if (fromUserId === toUserId) { setError('付款人與收款人不能相同'); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ fromUserId, toUserId, amount: parsed }),
      })
      if (!res.ok) throw new Error('儲存失敗')
      await fetchData()
      setEditing(false)
    } catch {
      setError('儲存失敗，請重試')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !confirm('確定要刪除這筆轉帳？')) return
    setDeleting(true)
    try {
      await fetch(`/api/groups/${groupId}/settlements/${settlementId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      })
      router.back()
    } catch {
      setError('刪除失敗，請重試')
      setDeleting(false)
    }
  }

  if (loading || !settlement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  const fromUser = settlement.from_user
  const toUser = settlement.to_user

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center h-14 px-2 gap-1">
        <button
          onClick={() => { if (editing) { setEditing(false); setError('') } else router.back() }}
          className="p-2 rounded-full active:bg-gray-100 flex-shrink-0"
        >
          {editing ? (
            <X size={20} className="text-gray-700" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="m15 18-6-6 6-6"/></svg>
          )}
        </button>

        <span className="flex-1 text-base font-semibold text-gray-900 text-center truncate px-1">
          {editing ? '編輯轉帳' : '轉帳詳情'}
        </span>

        {editing ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-2 rounded-full active:bg-gray-100 flex-shrink-0 text-line-green"
          >
            <Check size={20} />
          </button>
        ) : (
          <div className="flex">
            <button onClick={() => setEditing(true)} className="p-2 rounded-full active:bg-gray-100 flex-shrink-0">
              <Pencil size={18} className="text-gray-600" />
            </button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 rounded-full active:bg-gray-100 flex-shrink-0">
              <Trash2 size={18} className="text-red-400" />
            </button>
          </div>
        )}
      </header>

      <div className="p-4 pb-16 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        {editing ? (
          <div className="space-y-5">
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
                />
              </div>
            </div>

            <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
              儲存變更
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 space-y-4 shadow-sm">
            {/* From → To */}
            <div className="flex items-center gap-3">
              <Avatar src={fromUser?.avatar_url} name={fromUser?.display_name ?? '?'} size={44} />
              <div className="flex flex-col items-center gap-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <Avatar src={toUser?.avatar_url} name={toUser?.display_name ?? '?'} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{fromUser?.display_name}</span>
                  {' 付給 '}
                  <span className="font-semibold text-gray-900">{toUser?.display_name}</span>
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${Number(settlement.amount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
