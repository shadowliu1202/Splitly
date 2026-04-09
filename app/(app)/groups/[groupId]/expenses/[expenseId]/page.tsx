'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Camera, Check, Pencil, Trash2, X } from 'lucide-react'
import { useUser } from '@/components/providers/UserProvider'
import { Expense, ExpenseCategory, SplitType, User } from '@/types'
import { EXPENSE_CATEGORIES, getCategoryMeta } from '@/lib/utils/expenseCategories'
import { formatDateTime, toLocalInputDatetime } from '@/lib/utils/date'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// ── types ─────────────────────────────────────────────────────────────────────

interface SplitRow {
  userId: string
  displayName: string
  avatarUrl: string | null
  included: boolean
  customAmount: string
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function ExpenseDetailPage() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()
  const { user } = useUser()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [expense, setExpense] = useState<Expense | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // edit state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [happenedAt, setHappenedAt] = useState('')
  const [remark, setRemark] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [splits, setSplits] = useState<SplitRow[]>([])

  const fetchData = useCallback(async () => {
    if (!user) return
    const headers = { 'x-user-id': user.id }
    const [expRes, memRes] = await Promise.all([
      fetch(`/api/groups/${groupId}/expenses/${expenseId}`, { headers }),
      fetch(`/api/groups/${groupId}/members`, { headers }),
    ])
    const [{ expense: exp }, { members: mems }] = await Promise.all([
      expRes.json(),
      memRes.json(),
    ])
    setExpense(exp)
    setMembers(mems ?? [])
    setLoading(false)
  }, [groupId, expenseId, user])

  useEffect(() => { fetchData() }, [fetchData])

  // Seed edit fields whenever expense loads
  useEffect(() => {
    if (!expense || !members.length) return
    setDescription(expense.description)
    setAmount(String(expense.amount))
    setPaidBy(expense.paid_by)
    setCategory((expense.category as ExpenseCategory) ?? 'other')
    setSplitType(expense.split_type as SplitType)
    setHappenedAt(toLocalInputDatetime(expense.happened_at))
    setRemark(expense.remark ?? '')
    setPhotoUrl(expense.photo_url)
    setPhotoPreview(expense.photo_url)

    const existingSplitMap: Record<string, number> = {}
    expense.expense_splits?.forEach((s) => {
      existingSplitMap[s.user_id] = Number(s.amount)
    })
    setSplits(
      members.map((m) => ({
        userId: m.id,
        displayName: m.display_name,
        avatarUrl: m.avatar_url,
        included: m.id in existingSplitMap,
        customAmount: existingSplitMap[m.id]?.toString() ?? '',
      }))
    )
  }, [expense, members])

  const includedSplits = splits.filter((s) => s.included)
  const totalAmount = parseFloat(amount) || 0
  const perPerson =
    includedSplits.length > 0
      ? Math.round((totalAmount / includedSplits.length) * 100) / 100
      : 0

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setPhotoPreview(URL.createObjectURL(file))
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-user-id': user.id },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPhotoUrl(data.url)
    } catch {
      setError('照片上傳失敗，請重試')
      setPhotoPreview(expense?.photo_url ?? null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setError('')
    if (!description.trim()) { setError('請輸入描述'); return }
    if (!totalAmount || totalAmount <= 0) { setError('請輸入有效金額'); return }
    if (includedSplits.length === 0) { setError('請選擇至少一位分帳成員'); return }
    if (uploadingPhoto) { setError('照片上傳中，請稍候'); return }

    let splitData: { userId: string; amount: number }[]
    if (splitType === 'equal') {
      splitData = includedSplits.map((s) => ({ userId: s.userId, amount: perPerson }))
    } else {
      splitData = includedSplits.map((s) => ({
        userId: s.userId,
        amount: parseFloat(s.customAmount) || 0,
      }))
      const splitTotal = splitData.reduce((sum, s) => sum + s.amount, 0)
      if (Math.abs(splitTotal - totalAmount) > 0.01) {
        setError(`分帳總計 $${splitTotal.toFixed(0)} 與支出金額 $${totalAmount.toFixed(0)} 不符`)
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          description: description.trim(),
          amount: totalAmount,
          paidBy,
          splitType,
          category,
          happenedAt: new Date(happenedAt).toISOString(),
          photoUrl,
          remark: remark.trim() || null,
          splits: splitData,
        }),
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
    if (!user || !confirm('確定要刪除這筆支出？')) return
    setDeleting(true)
    try {
      await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      })
      router.back()
    } catch {
      setError('刪除失敗，請重試')
      setDeleting(false)
    }
  }

  if (loading || !expense) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  const payerUser = expense.payer
  const cat = getCategoryMeta(expense.category)

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
          {editing ? '編輯支出' : '支出詳情'}
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
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-full active:bg-gray-100 flex-shrink-0"
            >
              <Pencil size={18} className="text-gray-600" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-full active:bg-gray-100 flex-shrink-0"
            >
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
          /* ── EDIT MODE ───────────────────────────────────────────────── */
          <div className="space-y-5">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">類型</label>
              <div className="grid grid-cols-4 gap-2">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  const selected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-colors ${
                        selected ? 'border-line-green bg-green-50' : 'border-gray-100 bg-white active:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.bg}`}>
                        <Icon size={16} className={cat.text} />
                      </div>
                      <span className={`text-xs ${selected ? 'text-line-green font-medium' : 'text-gray-500'}`}>
                        {cat.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-7" min="0" step="1" />
              </div>
            </div>

            {/* Date & time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期與時間</label>
              <Input type="datetime-local" value={happenedAt} onChange={(e) => setHappenedAt(e.target.value)} />
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">附件照片</label>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              {photoPreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="receipt" className="w-full h-full object-cover" />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs">上傳中...</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoUrl(null) }}
                    className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-400 active:bg-gray-50"
                >
                  <Camera size={24} />
                  <span className="text-sm">拍照或選擇圖片</span>
                </button>
              )}
            </div>

            {/* Remark */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備註（選填）</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="例：AA制、不含酒水..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green resize-none"
              />
            </div>

            {/* Paid by — dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">誰付錢</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.display_name}</option>
                ))}
              </select>
            </div>

            {/* Splits — with inline split-type dropdown in the header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">分帳給</label>
                <select
                  value={splitType}
                  onChange={(e) => setSplitType(e.target.value as SplitType)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:border-line-green"
                >
                  <option value="equal">均分</option>
                  <option value="custom">自訂金額</option>
                </select>
              </div>
              <div className="space-y-2">
                {splits.map((split) => (
                  <div key={split.userId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
                    <input type="checkbox" checked={split.included}
                      onChange={() => setSplits((prev) => {
                        const next = prev.map((s) =>
                          s.userId === split.userId
                            ? { ...s, included: !s.included, customAmount: s.included ? '' : s.customAmount }
                            : s
                        )
                        if (splitType !== 'custom' || totalAmount <= 0) return next
                        const setTotal = next
                          .filter((s) => s.included && s.customAmount !== '')
                          .reduce((sum, s) => sum + (parseFloat(s.customAmount) || 0), 0)
                        const unset = next.filter((s) => s.included && s.customAmount === '')
                        if (unset.length === 0) return next
                        const per = Math.round((totalAmount - setTotal) / unset.length)
                        return next.map((s) => ({
                          ...s,
                          customAmount: s.included && s.customAmount === '' ? String(per) : s.customAmount,
                        }))
                      })}
                      className="accent-line-green w-4 h-4" />
                    <Avatar src={split.avatarUrl} name={split.displayName} size={32} />
                    <span className="text-sm flex-1 truncate">{split.displayName}</span>
                    {splitType === 'custom' && split.included && (
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" value={split.customAmount}
                          onChange={(e) => setSplits((prev) => prev.map((s) => s.userId === split.userId ? { ...s, customAmount: e.target.value } : s))}
                          placeholder="0" className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:border-line-green" min="0" step="1" />
                      </div>
                    )}
                    {splitType === 'equal' && split.included && totalAmount > 0 && (
                      <span className="text-sm text-gray-400 w-16 text-right">${perPerson.toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
              儲存變更
            </Button>
          </div>
        ) : (
          /* ── VIEW MODE ───────────────────────────────────────────────── */
          <>
            {/* Main info card */}
            <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.bg}`}>
                  <cat.icon size={20} className={cat.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-base">{expense.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {payerUser?.display_name ?? '未知'} 付了{' '}
                    <span className="font-semibold text-gray-700 text-sm">
                      ${Number(expense.amount).toLocaleString()}
                    </span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-gray-900">
                    ${Number(expense.amount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-sm text-gray-500">
                <span>🏷 類型</span>
                <span className="font-medium text-gray-700">{cat.label}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>📅 日期</span>
                <span className="font-medium text-gray-700">{formatDateTime(expense.happened_at)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>💳 分帳方式</span>
                <span className="font-medium text-gray-700">
                  {expense.split_type === 'equal' ? '均分' : '自訂金額'}
                </span>
              </div>

              {expense.remark && (
                <div className="border-t border-gray-100 pt-3 text-sm text-gray-500">
                  <span>📝 備註</span>
                  <p className="mt-1 text-gray-700">{expense.remark}</p>
                </div>
              )}
            </div>

            {/* Splits card */}
            {expense.expense_splits && expense.expense_splits.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <p className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-500">分帳明細</p>
                {expense.expense_splits.map((split, i) => {
                  const splitUser = Array.isArray(split.users) ? split.users[0] : split.users
                  const isLast = i === expense.expense_splits!.length - 1
                  return (
                    <div
                      key={split.user_id}
                      className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-gray-50' : ''}`}
                    >
                      <Avatar src={splitUser?.avatar_url} name={splitUser?.display_name ?? '?'} size={36} />
                      <span className="flex-1 text-sm text-gray-800">{splitUser?.display_name ?? split.user_id.slice(0, 6)}</span>
                      <span className={`text-sm font-semibold ${split.user_id === expense.paid_by ? 'text-line-green' : 'text-red-500'}`}>
                        ${Number(split.amount).toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Photo — below split detail */}
            {expense.photo_url && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={expense.photo_url} alt="receipt" className="w-full h-full object-cover" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
