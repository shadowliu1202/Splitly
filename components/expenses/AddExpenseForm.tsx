'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X } from 'lucide-react'
import { User, SplitType, ExpenseCategory } from '@/types'
import { toLocalInputDatetime } from '@/lib/utils/date'
import { EXPENSE_CATEGORIES } from '@/lib/utils/expenseCategories'
import { CURRENCIES, getCurrencySymbol, getRate, convertAmount } from '@/lib/utils/currencies'
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
  groupCurrency?: string
}

export default function AddExpenseForm({
  groupId,
  members,
  currentUserId,
  groupCurrency = 'TWD',
}: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [currency, setCurrency] = useState(groupCurrency)
  const [exchangeRate, setExchangeRate] = useState('1')
  const [fetchingRate, setFetchingRate] = useState(false)
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [happenedAt, setHappenedAt] = useState(toLocalInputDatetime())
  const [remark, setRemark] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
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

  const isForeign = currency !== groupCurrency
  const totalAmount = parseFloat(amount) || 0
  const rate = parseFloat(exchangeRate) || 1
  const convertedTotal = isForeign && totalAmount > 0 ? convertAmount(totalAmount, rate) : null

  const includedSplits = splits.filter((s) => s.included)
  const perPerson =
    includedSplits.length > 0
      ? Math.round((totalAmount / includedSplits.length) * 100) / 100
      : 0

  // Auto-fetch exchange rate when currency changes
  useEffect(() => {
    if (currency === groupCurrency) { setExchangeRate('1'); return }
    setFetchingRate(true)
    getRate(currency, groupCurrency)
      .then((r) => setExchangeRate(String(Math.round(r * 10000) / 10000)))
      .catch(() => setExchangeRate(''))
      .finally(() => setFetchingRate(false))
  }, [currency, groupCurrency])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoPreview(URL.createObjectURL(file))
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-user-id': currentUserId },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setPhotoUrl(data.url)
    } catch {
      setError('照片上傳失敗，請重試')
      setPhotoPreview(null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        setError(
          `分帳總計 ${getCurrencySymbol(currency)}${splitTotal.toFixed(0)} 與支出金額 ${getCurrencySymbol(currency)}${totalAmount.toFixed(0)} 不符`
        )
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId },
        body: JSON.stringify({
          description,
          amount: totalAmount,
          paidBy,
          splitType,
          category,
          currency,
          exchangeRate: rate,
          happenedAt: new Date(happenedAt).toISOString(),
          photoUrl,
          remark: remark.trim() || null,
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

  const symbol = getCurrencySymbol(currency)
  const defaultSymbol = getCurrencySymbol(groupCurrency)
  // Dynamic left padding: 8px base + ~12px per character
  const symbolPadding = `${8 + symbol.length * 12}px`

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例：晚餐、計程車費..."
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green"
        >
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Currency + Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">貨幣與金額</label>
        <div className="flex gap-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green w-28 flex-shrink-0"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{symbol}</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={{ paddingLeft: symbolPadding }}
              min="0"
              step="any"
              required
            />
          </div>
        </div>
      </div>

      {/* Exchange rate (only shown for foreign currency) */}
      {isForeign && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            匯率 <span className="text-gray-400 font-normal">(1 {currency} = ? {groupCurrency})</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder={fetchingRate ? '取得中...' : '0'}
                min="0"
                step="any"
              />
              {fetchingRate && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">載入中...</span>
              )}
            </div>
            {convertedTotal !== null && (
              <span className="text-sm text-gray-500 whitespace-nowrap">
                ≈ {defaultSymbol}{convertedTotal.toLocaleString()} {groupCurrency}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Date & time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日期與時間</label>
        <Input
          type="datetime-local"
          value={happenedAt}
          onChange={(e) => setHappenedAt(e.target.value)}
        />
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

      {/* Splits */}
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
              <input
                type="checkbox"
                checked={split.included}
                onChange={() =>
                  setSplits((prev) => {
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
                  })
                }
                className="accent-line-green w-4 h-4"
              />
              <Avatar src={split.avatarUrl} name={split.displayName} size={32} />
              <span className="text-sm flex-1 truncate">{split.displayName}</span>

              {splitType === 'custom' && split.included && (
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{symbol}</span>
                  <input
                    type="number"
                    value={split.customAmount}
                    onChange={(e) =>
                      setSplits((prev) =>
                        prev.map((s) => s.userId === split.userId ? { ...s, customAmount: e.target.value } : s)
                      )
                    }
                    placeholder="0"
                    className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:border-line-green"
                    min="0"
                    step="any"
                  />
                </div>
              )}
              {splitType === 'equal' && split.included && totalAmount > 0 && (
                <span className="text-sm text-gray-400 w-20 text-right">
                  {symbol}{perPerson.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">附上照片（選填）</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />
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

      <Button type="submit" loading={loading} className="w-full" size="lg">
        新增支出
      </Button>
    </form>
  )
}
