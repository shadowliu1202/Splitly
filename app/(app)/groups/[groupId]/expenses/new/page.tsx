'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@/components/providers/UserProvider'
import { User } from '@/types'
import Header from '@/components/layout/Header'
import AddExpenseForm from '@/components/expenses/AddExpenseForm'
import AddTransferForm from '@/components/expenses/AddTransferForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type Tab = 'expense' | 'transfer'

export default function NewExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()
  const [members, setMembers] = useState<User[]>(() => {
    try {
      const cached = sessionStorage.getItem(`members_${groupId}`)
      return cached ? JSON.parse(cached) : []
    } catch { return [] }
  })
  const [groupCurrency] = useState<string>(() => {
    try { return sessionStorage.getItem(`currency_${groupId}`) ?? 'TWD' } catch { return 'TWD' }
  })
  const [loading, setLoading] = useState(members.length === 0)
  const [tab, setTab] = useState<Tab>('expense')

  useEffect(() => {
    if (!user) return

    fetch(`/api/groups/${groupId}/members`, {
      headers: { 'x-user-id': user.id },
    })
      .then((r) => r.json())
      .then((data) => {
        const fresh = data.members ?? []
        setMembers(fresh)
        try { sessionStorage.setItem(`members_${groupId}`, JSON.stringify(fresh)) } catch {}
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [groupId, user])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={tab === 'expense' ? '新增支出' : '新增轉帳'} showBack />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex gap-0">
          {(['expense', 'transfer'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-line-green text-line-green'
                  : 'border-transparent text-gray-400'
              }`}
            >
              {t === 'expense' ? '支出' : '轉帳'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size={32} />
          </div>
        ) : tab === 'expense' ? (
          <AddExpenseForm
            groupId={groupId}
            members={members}
            currentUserId={user?.id ?? ''}
            groupCurrency={groupCurrency}
          />
        ) : (
          <AddTransferForm
            groupId={groupId}
            members={members}
            currentUserId={user?.id ?? ''}
            groupCurrency={groupCurrency}
          />
        )}
      </div>
    </div>
  )
}
