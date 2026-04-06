'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Share2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/components/providers/UserProvider'
import { useLiff } from '@/components/providers/LiffProvider'
import { Group, Expense, UserBalance, Transfer } from '@/types'
import Header from '@/components/layout/Header'
import ExpenseCard from '@/components/expenses/ExpenseCard'
import SettlementCard from '@/components/settlements/SettlementCard'
import AddVirtualMemberForm from '@/components/groups/AddVirtualMemberForm'
import Avatar from '@/components/ui/Avatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { buildShareText } from '@/lib/liff/client'

type Tab = 'expenses' | 'balances'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()
  const { liff } = useLiff()

  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<UserBalance[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('expenses')
  const [loading, setLoading] = useState(true)
  const [showAddVirtual, setShowAddVirtual] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const headers = { 'x-user-id': user.id }

    try {
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`, { headers }),
        fetch(`/api/groups/${groupId}/expenses`, { headers }),
        fetch(`/api/groups/${groupId}/balances`, { headers }),
      ])

      const [{ group }, { expenses }, { balances, transfers }] =
        await Promise.all([
          groupRes.json(),
          expensesRes.json(),
          balancesRes.json(),
        ])

      setGroup(group)
      setExpenses(expenses ?? [])
      setBalances(balances ?? [])
      setTransfers(transfers ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [groupId, user])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleShare = async () => {
    if (!group) return
    const text = buildShareText(group.name, group.invite_code)
    if (liff?.isApiAvailable('shareTargetPicker')) {
      await liff.shareTargetPicker([{ type: 'text', text }])
    } else {
      await navigator.clipboard.writeText(text)
      alert('邀請連結已複製！')
    }
  }

  if (loading || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  const members = group.group_members ?? []
  const realMembers = members.filter((m) => !m.users?.is_virtual)
  const virtualMembers = members.filter((m) => m.users?.is_virtual)
  const myBalance = balances.find((b) => b.userId === user?.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={group.name}
        showBack
        rightAction={
          <button onClick={handleShare} className="p-2 rounded-full active:bg-gray-100">
            <Share2 size={20} className="text-gray-600" />
          </button>
        }
      />

      {/* Members strip */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 space-y-3">
        {/* Real members */}
        <div className="flex items-center gap-3 overflow-x-auto">
          {realMembers.map((m) => (
            <div key={m.user_id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <Avatar
                src={m.users?.avatar_url}
                name={m.users?.display_name ?? '?'}
                size={36}
              />
              <span className="text-[10px] text-gray-500 max-w-[48px] truncate">
                {m.users?.display_name}
              </span>
            </div>
          ))}

          {/* Virtual members */}
          {virtualMembers.map((m) => (
            <div key={m.user_id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <span className="text-[10px] text-gray-400 max-w-[48px] truncate">
                {m.users?.display_name}
              </span>
            </div>
          ))}

          {/* Add virtual member button */}
          <button
            onClick={() => setShowAddVirtual(true)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <UserPlus size={14} className="text-gray-400" />
            </div>
            <span className="text-[10px] text-gray-400">新增</span>
          </button>
        </div>

        {/* Add virtual member form */}
        {showAddVirtual && (
          <AddVirtualMemberForm
            groupId={groupId}
            currentUserId={user?.id ?? ''}
            onAdded={() => {
              setShowAddVirtual(false)
              fetchAll()
            }}
            onCancel={() => setShowAddVirtual(false)}
          />
        )}
      </div>

      {/* My balance summary */}
      {myBalance && (
        <div
          className={`mx-4 mt-4 rounded-2xl p-4 ${
            myBalance.amount > 0
              ? 'bg-green-50 border border-green-200'
              : myBalance.amount < 0
              ? 'bg-red-50 border border-red-200'
              : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <p className="text-xs text-gray-500 mb-0.5">我的餘額</p>
          <p
            className={`text-2xl font-bold ${
              myBalance.amount > 0
                ? 'text-line-green'
                : myBalance.amount < 0
                ? 'text-red-500'
                : 'text-gray-400'
            }`}
          >
            {myBalance.amount > 0
              ? `+$${myBalance.amount.toLocaleString()}`
              : myBalance.amount < 0
              ? `-$${Math.abs(myBalance.amount).toLocaleString()}`
              : '已結清 🎉'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {myBalance.amount > 0
              ? '別人欠你的'
              : myBalance.amount < 0
              ? '你欠別人的'
              : ''}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 mt-4">
        {(['expenses', 'balances'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-line-green border-b-2 border-line-green'
                : 'text-gray-400'
            }`}
          >
            {tab === 'expenses' ? `支出 (${expenses.length})` : `結算 (${transfers.length})`}
          </button>
        ))}
      </div>

      <div className="p-4 pb-28 space-y-3">
        {activeTab === 'expenses' ? (
          expenses.length === 0 ? (
            <div className="text-center py-16 space-y-2 text-gray-400">
              <p className="text-4xl">🧾</p>
              <p>還沒有支出記錄</p>
              <p className="text-sm">點擊右下角新增支出</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currentUserId={user?.id ?? ''}
              />
            ))
          )
        ) : transfers.length === 0 ? (
          <div className="text-center py-16 space-y-2 text-gray-400">
            <p className="text-4xl">🎉</p>
            <p className="font-medium text-gray-600">所有帳已結清！</p>
          </div>
        ) : (
          transfers.map((transfer, i) => (
            <SettlementCard
              key={i}
              transfer={transfer}
              currentUserId={user?.id ?? ''}
              groupId={groupId}
              onSettled={fetchAll}
            />
          ))
        )}
      </div>

      {activeTab === 'expenses' && (
        <Link
          href={`/groups/${groupId}/expenses/new`}
          className="fixed bottom-6 right-6 w-14 h-14 bg-line-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </Link>
      )}
    </div>
  )
}
