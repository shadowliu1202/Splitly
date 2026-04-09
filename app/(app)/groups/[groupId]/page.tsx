'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Share2, UserPlus, Pencil, Check, X, Scale, BarChart2 } from 'lucide-react'
import { useScrollDirection } from '@/lib/hooks/useScrollDirection'
import Link from 'next/link'
import { useUser } from '@/components/providers/UserProvider'
import { useLiff } from '@/components/providers/LiffProvider'
import { Group, Expense, Settlement } from '@/types'
import { formatDateLabel, groupByDate } from '@/lib/utils/date'
import ExpenseCard from '@/components/expenses/ExpenseCard'
import TransferCard from '@/components/expenses/TransferCard'
import AddVirtualMemberForm from '@/components/groups/AddVirtualMemberForm'
import Avatar from '@/components/ui/Avatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { buildShareText } from '@/lib/liff/client'

// Module-level cache — survives SPA navigation, no SSR/hydration issues
type PageCache = { group: Group; expenses: Expense[]; settlements: Settlement[] }
const groupPageCache = new Map<string, PageCache>()

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()
  const { liff } = useLiff()
  const router = useRouter()

  const cached = groupPageCache.get(groupId)
  const scrollDir = useScrollDirection()

  const [group, setGroup] = useState<Group | null>(cached?.group ?? null)
  const [expenses, setExpenses] = useState<Expense[]>(cached?.expenses ?? [])
  const [settlements, setSettlements] = useState<Settlement[]>(cached?.settlements ?? [])
  const [loading, setLoading] = useState(!cached)
  const [showAddVirtual, setShowAddVirtual] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const headers = { 'x-user-id': user.id }
    try {
      const [groupRes, expensesRes, settlementsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`, { headers }),
        fetch(`/api/groups/${groupId}/expenses`, { headers }),
        fetch(`/api/groups/${groupId}/settlements`, { headers }),
      ])
      const [{ group }, { expenses }, { settlements }] = await Promise.all([
        groupRes.json(),
        expensesRes.json(),
        settlementsRes.json(),
      ])
      setGroup(group)
      setExpenses(expenses ?? [])
      setSettlements(settlements ?? [])
      groupPageCache.set(groupId, { group, expenses: expenses ?? [], settlements: settlements ?? [] })
      try {
        const memberUsers = (group.group_members ?? []).map((m: { users: unknown }) => m.users).filter(Boolean)
        sessionStorage.setItem(`members_${groupId}`, JSON.stringify(memberUsers))
      } catch {}

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [groupId, user])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleRename = async () => {
    if (!user || !nameInput.trim() || nameInput.trim() === group?.name) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      if (res.ok) {
        const { group: updated } = await res.json()
        setGroup((prev) => prev ? { ...prev, name: updated.name } : prev)
      }
    } finally {
      setSavingName(false)
      setEditingName(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with inline rename */}
      <header className={`sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center h-14 px-2 transition-transform duration-300 ${scrollDir === 'down' ? '-translate-y-full' : 'translate-y-0'}`}>
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-full active:bg-gray-100 flex-shrink-0"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        {editingName ? (
          <div className="flex-1 flex items-center gap-1 px-1">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setEditingName(false)
              }}
              className="flex-1 text-sm font-semibold border-b-2 border-line-green outline-none bg-transparent px-1 py-0.5"
              maxLength={50}
            />
            <button onClick={handleRename} disabled={savingName} className="p-1.5 text-line-green active:opacity-70">
              <Check size={18} />
            </button>
            <button onClick={() => setEditingName(false)} className="p-1.5 text-gray-400 active:opacity-70">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            className="flex-1 flex items-center justify-center gap-1.5 px-2 group"
            onClick={() => { setNameInput(group.name); setEditingName(true) }}
          >
            <span className="text-base font-semibold text-gray-900 truncate">{group.name}</span>
            <Pencil size={13} className="text-gray-400 flex-shrink-0 opacity-0 group-active:opacity-100" />
          </button>
        )}

        <button onClick={handleShare} className="p-2 rounded-full active:bg-gray-100 flex-shrink-0">
          <Share2 size={20} className="text-gray-600" />
        </button>
      </header>

      {/* Members strip */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 space-y-3">
        <div className="flex items-center gap-3 overflow-x-auto">
          {realMembers.map((m) => (
            <div key={m.user_id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <Avatar src={m.users?.avatar_url} name={m.users?.display_name ?? '?'} size={36} />
              <span className="text-[10px] text-gray-500 max-w-[48px] truncate">{m.users?.display_name}</span>
            </div>
          ))}
          {virtualMembers.map((m) => (
            <div key={m.user_id} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <span className="text-[10px] text-gray-400 max-w-[48px] truncate">{m.users?.display_name}</span>
            </div>
          ))}
          <button onClick={() => setShowAddVirtual(true)} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <UserPlus size={14} className="text-gray-400" />
            </div>
            <span className="text-[10px] text-gray-400">新增</span>
          </button>
        </div>

        {showAddVirtual && (
          <AddVirtualMemberForm
            groupId={groupId}
            currentUserId={user?.id ?? ''}
            onAdded={() => { setShowAddVirtual(false); fetchAll() }}
            onCancel={() => setShowAddVirtual(false)}
          />
        )}
      </div>

      {/* Expense list with balance button above */}
      <div className="p-4 pb-28 space-y-3">
        {/* Action buttons row */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push(`/groups/${groupId}/balances`)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-line-green text-line-green text-sm font-medium bg-white active:bg-green-50 transition-colors"
          >
            <Scale size={16} />
            查看結算
          </button>
          <button
            onClick={() => router.push(`/groups/${groupId}/stats`)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-line-green text-line-green text-sm font-medium bg-white active:bg-green-50 transition-colors"
          >
            <BarChart2 size={16} />
            消費統計
          </button>
        </div>

        {/* Activity list — expenses + transfers grouped by date */}
        {expenses.length === 0 && settlements.length === 0 ? (
          <div className="text-center py-16 space-y-2 text-gray-400">
            <p className="text-4xl">🧾</p>
            <p>還沒有支出記錄</p>
            <p className="text-sm">點擊右下角新增支出</p>
          </div>
        ) : (() => {
          type Item =
            | { kind: 'expense'; date: string; item: Expense }
            | { kind: 'transfer'; date: string; item: Settlement }

          const items: Item[] = [
            ...expenses.map((e) => ({ kind: 'expense' as const, date: e.happened_at, item: e })),
            ...settlements.map((s) => ({ kind: 'transfer' as const, date: s.settled_at, item: s })),
          ]

          return groupByDate(items, (i) => i.date).map(([date, group]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 mb-2 px-1">
                {formatDateLabel(date)}
              </p>
              <div className="rounded-2xl overflow-hidden divide-y divide-gray-100">
                {[...group].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'transfer' ? -1 : 1)).map((i) =>
                  i.kind === 'expense' ? (
                    <ExpenseCard
                      key={i.item.id}
                      expense={i.item}
                      currentUserId={user?.id ?? ''}
                      groupId={groupId}
                    />
                  ) : (
                    <TransferCard
                      key={i.item.id}
                      settlement={i.item}
                      currentUserId={user?.id ?? ''}
                      groupId={groupId}
                    />
                  )
                )}
              </div>
            </div>
          ))
        })()}
      </div>

      {/* FAB */}
      <Link
        href={`/groups/${groupId}/expenses/new`}
        className="fixed bottom-6 right-6 w-14 h-14 bg-line-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}
