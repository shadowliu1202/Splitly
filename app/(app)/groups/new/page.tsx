'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/providers/UserProvider'
import Header from '@/components/layout/Header'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function NewGroupPage() {
  const router = useRouter()
  const { user } = useUser()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')

    if (!name.trim()) {
      setError('請輸入群組名稱')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!res.ok) throw new Error('建立失敗')

      const data = await res.json()
      router.replace(`/groups/${data.group.id}`)
    } catch {
      setError('建立群組失敗，請重試')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="建立新群組" showBack />

      <div className="p-4 space-y-6">
        <div className="text-center py-6">
          <p className="text-5xl mb-2">👥</p>
          <p className="text-sm text-gray-400">建立群組後可邀請朋友一起分帳</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              群組名稱
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：墾丁旅遊、每週聚餐..."
              maxLength={50}
              autoFocus
            />
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            建立群組
          </Button>
        </form>
      </div>
    </div>
  )
}
