'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X } from 'lucide-react'
import { User } from '@/types'
import { toLocalInputDatetime } from '@/lib/utils/date'
import { CURRENCIES, getCurrencySymbol, getRate, convertAmount } from '@/lib/utils/currencies'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'

interface Props {
  groupId: string
  members: User[]
  currentUserId: string
  groupCurrency?: string
}

export default function AddTransferForm({ groupId, members, currentUserId, groupCurrency = 'TWD' }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const othersDefault = members.find((m) => m.id !== currentUserId)?.id ?? ''

  const [fromUserId, setFromUserId] = useState(currentUserId)
  const [toUserId, setToUserId] = useState(othersDefault)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(groupCurrency)
  const [exchangeRate, setExchangeRate] = useState('1')
  const [fetchingRate, setFetchingRate] = useState(false)

  // Sync when groupCurrency resolves from API after mount
  useEffect(() => { setCurrency(groupCurrency) }, [groupCurrency])
  const [settledAt, setSettledAt] = useState(toLocalInputDatetime())
  const [remark, setRemark] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isForeign = currency !== groupCurrency
  const parsed = parseFloat(amount) || 0
  const rate = parseFloat(exchangeRate) || 1
  const convertedTotal = isForeign && parsed > 0 ? convertAmount(parsed, rate) : null
  const symbol = getCurrencySymbol(currency)
  const defaultSymbol = getCurrencySymbol(groupCurrency)
  const symbolPadding = `${8 + symbol.length * 12}px`

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

    if (!parsed || parsed <= 0) { setError('請輸入有效金額'); return }
    if (fromUserId === toUserId) { setError('付款人與收款人不能相同'); return }
    if (uploadingPhoto) { setError('照片上傳中，請稍候'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId },
        body: JSON.stringify({
          fromUserId,
          toUserId,
          amount: parsed,
          currency,
          exchangeRate: rate,
          settledAt: new Date(settledAt).toISOString(),
          remark: remark.trim() || null,
          photoUrl,
        }),
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

      {/* Exchange rate (only for foreign currency) */}
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
          value={settledAt}
          onChange={(e) => setSettledAt(e.target.value)}
        />
      </div>

      {/* Remark */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">備註（選填）</label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="例：還上次的餐費..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green resize-none"
        />
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

      {/* Summary */}
      {fromUser && toUser && parsed > 0 && fromUserId !== toUserId && (
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <Avatar src={fromUser.avatar_url} name={fromUser.display_name} size={32} />
          <span className="text-sm text-gray-500">付</span>
          <div className="text-sm font-semibold text-gray-900">
            {symbol}{parsed.toLocaleString()}
            {isForeign && convertedTotal !== null && (
              <span className="text-xs text-gray-400 ml-1">≈ {defaultSymbol}{convertedTotal.toLocaleString()}</span>
            )}
          </div>
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
