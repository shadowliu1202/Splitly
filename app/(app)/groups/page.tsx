'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'
import { useUser } from '@/components/providers/UserProvider'
import { Group } from '@/types'
import GroupCard from '@/components/groups/GroupCard'
import Avatar from '@/components/ui/Avatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function GroupsPage() {
  const { user } = useUser()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    fetch('/api/groups', {
      headers: { 'x-user-id': user.id },
    })
      .then((r) => r.json())
      .then((data) => setGroups(data.groups ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={22} className="text-line-green" />
          <span className="font-bold text-lg text-gray-900">Splitly</span>
        </div>
        {user && (
          <Avatar
            src={user.avatar_url}
            name={user.display_name}
            size={32}
          />
        )}
      </header>

      <div className="p-4 pb-24">
        <h2 className="text-sm font-medium text-gray-400 mb-3">我的群組</h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size={32} />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-5xl">💸</p>
            <p className="font-semibold text-gray-700">還沒有群組</p>
            <p className="text-sm text-gray-400">
              建立新群組或透過邀請連結加入
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/groups/new"
        className="fixed bottom-6 right-6 w-14 h-14 bg-line-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label="建立新群組"
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}
