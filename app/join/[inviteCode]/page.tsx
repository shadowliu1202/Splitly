'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/components/providers/UserProvider'
import { User } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'

type Status = 'loading' | 'joining' | 'claim' | 'claiming' | 'success' | 'error'

export default function JoinPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const { user, isLoading: userLoading } = useUser()
  const router = useRouter()

  const [status, setStatus] = useState<Status>('loading')
  const [groupName, setGroupName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [virtualMembers, setVirtualMembers] = useState<User[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (userLoading || !user) return

    const join = async () => {
      setStatus('joining')
      try {
        const res = await fetch(`/api/invite/${inviteCode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? '加入失敗')
          setStatus('error')
          return
        }

        setGroupName(data.group.name)
        setGroupId(data.group.id)

        // Fetch virtual members to offer claim
        const membersRes = await fetch(`/api/groups/${data.group.id}/members`, {
          headers: { 'x-user-id': user.id },
        })
        const membersData = await membersRes.json()
        const virtuals = (membersData.members ?? []).filter(
          (m: User) => m.is_virtual
        )

        if (virtuals.length > 0 && !data.alreadyMember) {
          setVirtualMembers(virtuals)
          setStatus('claim')
        } else {
          setStatus('success')
        }
      } catch {
        setError('網路錯誤，請重試')
        setStatus('error')
      }
    }

    join()
  }, [user, userLoading, inviteCode])

  const handleClaim = async (virtualId: string) => {
    if (!user) return
    setStatus('claiming')
    try {
      await fetch(
        `/api/groups/${groupId}/virtual-members/${virtualId}/claim`,
        {
          method: 'POST',
          headers: { 'x-user-id': user.id },
        }
      )
      setStatus('success')
    } catch {
      setStatus('success') // still go to group even if claim fails
    }
  }

  const goToGroup = () => router.replace(`/groups/${groupId}`)

  // Loading states
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

  // Claim virtual member screen
  if (status === 'claim' || status === 'claiming') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 p-6 space-y-6">
          <div className="text-center space-y-2 pt-8">
            <p className="text-4xl">👋</p>
            <p className="text-xl font-bold text-gray-900">你是哪位？</p>
            <p className="text-sm text-gray-400">
              「{groupName}」裡有虛擬成員，
              <br />
              請選擇你的名字，或直接跳過
            </p>
          </div>

          <div className="space-y-3">
            {virtualMembers.map((vm) => (
              <button
                key={vm.id}
                onClick={() => handleClaim(vm.id)}
                disabled={status === 'claiming'}
                className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:bg-gray-50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">👤</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{vm.display_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">點擊認領這個名字</p>
                </div>
                {status === 'claiming' ? (
                  <LoadingSpinner size={18} />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 pt-0">
          {/* Show current user's identity */}
          <div className="flex items-center gap-3 mb-4 bg-blue-50 rounded-2xl p-3">
            <Avatar
              src={user?.avatar_url}
              name={user?.display_name ?? '?'}
              size={36}
            />
            <div>
              <p className="text-xs text-gray-500">你的 LINE 名字</p>
              <p className="text-sm font-medium text-gray-800">{user?.display_name}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={goToGroup}
            disabled={status === 'claiming'}
          >
            跳過，直接進入群組
          </Button>
        </div>
      </div>
    )
  }

  // Success
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm w-full">
        <p className="text-5xl">🎉</p>
        <p className="font-bold text-xl text-gray-900">成功加入群組！</p>
        <p className="text-gray-500">{groupName}</p>
        <Button onClick={goToGroup} className="w-full" size="lg">
          前往群組
        </Button>
      </div>
    </div>
  )
}
