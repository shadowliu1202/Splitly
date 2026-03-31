'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/components/providers/UserProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'

type Status = 'loading' | 'joining' | 'success' | 'already' | 'error'

export default function JoinPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [groupName, setGroupName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (userLoading || !user) return

    const join = async () => {
      setStatus('joining')
      try {
        const res = await fetch(`/api/invite/${inviteCode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? '加入失敗')
          setStatus('error')
          return
        }

        setGroupName(data.group.name)
        setGroupId(data.group.id)
        setStatus(data.alreadyMember ? 'already' : 'success')
      } catch {
        setError('網路錯誤，請重試')
        setStatus('error')
      }
    }

    join()
  }, [user, userLoading, inviteCode])

  const goToGroup = () => router.replace(`/groups/${groupId}`)

  if (status === 'loading' || status === 'joining' || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <LoadingSpinner size={36} />
          <p className="text-sm text-gray-400">
            {status === 'joining' ? '正在加入群組...' : '載入中...'}
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-5xl">❌</p>
          <p className="font-semibold text-gray-800">加入失敗</p>
          <p className="text-sm text-gray-400">{error}</p>
          <Button onClick={() => router.replace('/groups')} variant="secondary">
            回首頁
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm w-full">
        <p className="text-5xl">{status === 'already' ? '👋' : '🎉'}</p>
        <p className="font-bold text-xl text-gray-900">
          {status === 'already' ? '你已經是成員了！' : '成功加入群組！'}
        </p>
        <p className="text-gray-500">{groupName}</p>
        <Button onClick={goToGroup} className="w-full" size="lg">
          前往群組
        </Button>
      </div>
    </div>
  )
}
