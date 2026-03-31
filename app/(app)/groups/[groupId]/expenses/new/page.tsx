'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@/components/providers/UserProvider'
import { User } from '@/types'
import Header from '@/components/layout/Header'
import AddExpenseForm from '@/components/expenses/AddExpenseForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function NewExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    fetch(`/api/groups/${groupId}/members`, {
      headers: { 'x-user-id': user.id },
    })
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [groupId, user])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="新增支出" showBack />

      <div className="p-4 pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size={32} />
          </div>
        ) : (
          <AddExpenseForm
            groupId={groupId}
            members={members}
            currentUserId={user?.id ?? ''}
          />
        )}
      </div>
    </div>
  )
}
