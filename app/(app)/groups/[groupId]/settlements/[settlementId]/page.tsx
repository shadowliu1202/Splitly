'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Camera, Check, Pencil, Trash2, X } from 'lucide-react'
import { useUser } from '@/components/providers/UserProvider'
import { Settlement, User } from '@/types'
import { CURRENCIES, getCurrencySymbol, getRate, convertAmount } from '@/lib/utils/currencies'
import { formatDateTime, toLocalInputDatetime } from '@/lib/utils/date'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function SettlementDetailPage() {
  const { groupId, settlementId } = useParams<{ groupId: string; settlementId: string }>()
  const { user } = useUser()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

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
  const [currency, setCurrency] = useState('TWD')
  const [exchangeRate, setExchangeRate] = useState('1')
  const [fetchingRate, setFetchingRate] = useState(false)
  const [settledAt, setSettledAt] = useState('')
  const [remark, setRemark] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

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
    setCurrency(settlement.currency ?? 'TWD')
    setExchangeRate(String(settlement.exchange_rate ?? 1))
    setSettledAt(toLocalInputDatetime(settlement.settled_at))
    setRemark(settlement.remark ?? '')
    setPhotoUrl(settlement.photo_url)
    setPhotoPreview(settlement.photo_url)
  }, [settlement])

  const groupCurrency = (() => {
    try { return sessionStorage.getItem(`currency_${groupId}`) ?? 'TWD' } catch { return 'TWD' }
  })()

  const isForeign = currency !== groupCurrency
  const rate = parseFloat(exchangeRate) || 1
  const parsedAmount = parseFloat(amount) || 0
  const convertedTotal = isForeign && parsedAmount > 0 ? convertAmount(parsedAmount, rate) : null
  const symbol = getCurrencySymbol(currency)
  const defaultSymbol = getCurrencySymbol(groupCurrency)
  const symbolPadding = `${8 + symbol.length * 12}px`

  // Auto-fetch exchange rate when currency changes in edit mode
  useEffect(() => {
    if (!editing) return
    if (currency === groupCurrency) { setExchangeRate('1'); return }
    setFetchingRate(true)
    getRate(currency, groupCurrency)
      .then((r) => setExchangeRate(String(Math.round(r * 10000) / 10000)))
      .catch(() => {})
      .finally(() => setFetchingRate(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, editing])

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
      setPhotoPreview(settlement?.photo_url ?? null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setError('')
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) { setError('請輸入有效金額'); return }
    if (fromUserId === toUserId) { setError('付款人與收款人不能相同'); return }
    if (uploadingPhoto) { setError('照片上傳中，請稍候'); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
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
          <button onClick={handleSave} disabled={saving} className="p-2 rounded-full active:bg-gray-100 flex-shrink-0 text-line-green">
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
              <select value={fromUserId} onChange={(e) => setFromUserId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green">
                {members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
              </select>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">付給誰</label>
              <select value={toUserId} onChange={(e) => setToUserId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green">
                {members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
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
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0" style={{ paddingLeft: symbolPadding }} min="0" step="any" />
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
              <Input type="datetime-local" value={settledAt} onChange={(e) => setSettledAt(e.target.value)} />
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
                  <button type="button" onClick={() => { setPhotoPreview(null); setPhotoUrl(null) }}
                    className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-400 active:bg-gray-50">
                  <Camera size={24} />
                  <span className="text-sm">拍照或選擇圖片</span>
                </button>
              )}
            </div>

            {/* Remark */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">備註（選填）</label>
              <textarea value={remark} onChange={(e) => setRemark(e.target.value)}
                placeholder="例：還上次的餐費..." rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-line-green resize-none" />
            </div>

            <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
              儲存變更
            </Button>
          </div>
        ) : (
          <>
            {/* Main info card */}
            <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar src={fromUser?.avatar_url} name={fromUser?.display_name ?? '?'} size={44} />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 flex-shrink-0"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <Avatar src={toUser?.avatar_url} name={toUser?.display_name ?? '?'} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{fromUser?.display_name}</span>
                    {' 付給 '}
                    <span className="font-semibold text-gray-900">{toUser?.display_name}</span>
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">
                    {getCurrencySymbol(settlement.currency)}{Number(settlement.amount).toLocaleString()}
                    <span className="text-sm font-normal text-gray-400 ml-1">{settlement.currency ?? 'TWD'}</span>
                  </p>
                  {settlement.currency && settlement.currency !== groupCurrency && (
                    <p className="text-xs text-gray-400">
                      ≈ {getCurrencySymbol(groupCurrency)}{convertAmount(Number(settlement.amount), Number(settlement.exchange_rate ?? 1)).toLocaleString()} {groupCurrency}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-sm text-gray-500">
                <span>📅 日期</span>
                <span className="font-medium text-gray-700">{formatDateTime(settlement.settled_at)}</span>
              </div>

              {settlement.remark && (
                <div className="border-t border-gray-100 pt-3 text-sm text-gray-500">
                  <span>📝 備註</span>
                  <p className="mt-1 text-gray-700">{settlement.remark}</p>
                </div>
              )}
            </div>

            {/* Photo — below detail card */}
            {settlement.photo_url && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={settlement.photo_url} alt="receipt" className="w-full h-full object-cover" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
