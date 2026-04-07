'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@/components/providers/UserProvider'
import { Expense } from '@/types'
import Avatar from '@/components/ui/Avatar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Header from '@/components/layout/Header'

export default function StatsPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExpenses = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        headers: { 'x-user-id': user.id },
      })
      const { expenses } = await res.json()
      setExpenses(expenses ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [groupId, user])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const stats = useMemo(() => {
    if (!user || !expenses.length) return null

    const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

    // My paid & my share
    const myPaid = expenses
      .filter((e) => e.paid_by === user.id)
      .reduce((s, e) => s + Number(e.amount), 0)

    const myShare = expenses
      .flatMap((e) => e.expense_splits ?? [])
      .filter((s) => s.user_id === user.id)
      .reduce((s, sp) => s + Number(sp.amount), 0)

    // Per-member paid amounts
    const paidByMember: Record<string, { name: string; avatarUrl: string | null; amount: number }> = {}
    for (const e of expenses) {
      const id = e.paid_by
      const name = e.payer?.display_name ?? id.slice(0, 6)
      const avatar = e.payer?.avatar_url ?? null
      if (!paidByMember[id]) paidByMember[id] = { name, avatarUrl: avatar, amount: 0 }
      paidByMember[id].amount += Number(e.amount)
    }
    const memberList = Object.entries(paidByMember)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.amount - a.amount)

    // Monthly breakdown (by happened_at)
    const monthMap: Record<string, number> = {}
    for (const e of expenses) {
      const [y, m] = e.happened_at.split('-')
      const key = `${y}-${m}`
      monthMap[key] = (monthMap[key] ?? 0) + Number(e.amount)
    }
    const months = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // last 6 months

    return { total, myPaid, myShare, memberList, months }
  }, [expenses, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="消費統計" showBack />

      <div className="p-4 pb-16 space-y-5">
        {!stats || expenses.length === 0 ? (
          <div className="text-center py-24 text-gray-400 space-y-2">
            <p className="text-4xl">📊</p>
            <p>還沒有支出記錄</p>
          </div>
        ) : (
          <>
            {/* Overview */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="群組總支出" value={`$${stats.total.toLocaleString()}`} />
              <StatCard label="我付了" value={`$${stats.myPaid.toLocaleString()}`} accent="green" />
              <StatCard label="我的份額" value={`$${stats.myShare.toLocaleString()}`} accent="red" />
            </div>

            {/* Member spending */}
            <Section title="成員付款排行">
              <div className="space-y-3">
                {stats.memberList.map((m, i) => {
                  const pct = stats.total > 0 ? (m.amount / stats.total) * 100 : 0
                  return (
                    <div key={m.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                        <Avatar src={m.avatarUrl} name={m.name} size={24} />
                        <span className="text-sm flex-1 truncate">{m.name}</span>
                        <span className="text-sm font-semibold text-gray-800">
                          ${m.amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="ml-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-line-green rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>

            {/* Monthly trend */}
            {stats.months.length > 1 && (
              <Section title="每月支出趨勢">
                <MonthlyChart months={stats.months} />
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'green' | 'red'
}) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <p className="text-[10px] text-gray-400 mb-1 leading-tight">{label}</p>
      <p
        className={`text-base font-bold leading-tight ${
          accent === 'green'
            ? 'text-line-green'
            : accent === 'red'
            ? 'text-red-500'
            : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-2xl shadow-sm p-4">{children}</div>
    </div>
  )
}

function MonthlyChart({ months }: { months: [string, number][] }) {
  const max = Math.max(...months.map(([, v]) => v))
  return (
    <div className="flex items-end gap-2 h-28">
      {months.map(([key, val]) => {
        const [y, m] = key.split('-')
        const label = `${Number(m)}月`
        const heightPct = max > 0 ? (val / max) * 100 : 0
        return (
          <div key={key} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-gray-400">
              ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toLocaleString()}
            </span>
            <div className="w-full flex items-end" style={{ height: 72 }}>
              <div
                className="w-full bg-line-green/80 rounded-t-md transition-all"
                style={{ height: `${heightPct}%`, minHeight: heightPct > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-[10px] text-gray-500">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
