'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Props {
  groupId: string
  currentUserId: string
  onAdded: () => void
  onCancel: () => void
}

export default function AddVirtualMemberForm({
  groupId,
  currentUserId,
  onAdded,
  onCancel,
}: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/groups/${groupId}/virtual-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) throw new Error('新增失敗')
      onAdded()
    } catch {
      setError('新增虛擬成員失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">新增虛擬成員</p>
      <p className="text-xs text-gray-400">
        沒有 LINE 帳號的人也可以先佔位，之後加入時再認領
      </p>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="輸入名字，例：小明、爸爸..."
        maxLength={20}
        autoFocus
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          className="flex-1"
        >
          取消
        </Button>
        <Button
          type="submit"
          size="sm"
          loading={loading}
          disabled={!name.trim()}
          className="flex-1"
        >
          新增
        </Button>
      </div>
    </form>
  )
}
