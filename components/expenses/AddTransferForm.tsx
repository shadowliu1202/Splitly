'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X } from 'lucide-react'
import { User } from '@/types'
import { toLocalInputDatetime } from '@/lib/utils/date'
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
  const fileRef = useRef<HTMLInputElement>(null)

  const othersDefault = members.find((m) => m.id !== currentUserId)?.id ?? ''

  const [fromUserId, setFromUserId] = useState(currentUserId)
  const [toUserId, setToUserId] = useState(othersDefault)
  const [amount, setAmount] = useState('')
  const [settledAt, setSettledAt] = useState(toLocalInputDatetime())
  const [remark, setRemark] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    const parsed = parseFloat(amount)
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

      {/* Date & time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日期與時間</label>
        <Input
          type="datetime-local"
          value={settledAt}
          onChange={(e) => setSettledAt(e.target.value)}
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
