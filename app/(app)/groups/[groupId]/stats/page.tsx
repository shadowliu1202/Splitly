'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@/components/providers/UserProvider'
import { Expense } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Header from '@/components/layout/Header'

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

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
    const myPaid = expenses
      .filter((e) => e.paid_by === user.id)
      .reduce((s, e) => s + Number(e.amount), 0)
    const myShare = expenses
      .flatMap((e) => e.expense_splits ?? [])
      .filter((s) => s.user_id === user.id)
      .reduce((s, sp) => s + Number(sp.amount), 0)

    // My personal spend list: expenses where I have a split, sorted by date desc
    const myItems = expenses
      .filter((e) => e.expense_splits?.some((s) => s.user_id === user.id))
      .map((e) => ({
        id: e.id,
        description: e.description,
        happenedAt: e.happened_at,
        myAmount: Number(e.expense_splits?.find((s) => s.user_id === user.id)?.amount ?? 0),
        iAmPayer: e.paid_by === user.id,
      }))
      .sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))

    // Monthly trend
    const monthMap: Record<string, number> = {}
    for (const e of expenses) {
      const [y, m] = e.happened_at.split('-')
      const key = `${y}-${m}`
      monthMap[key] = (monthMap[key] ?? 0) + Number(e.amount)
    }
    const months = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)

    return { total, myPaid, myShare, myItems, months }
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

            {/* Monthly trend */}
            {stats.months.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">每月支出趨勢</p>
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <MonthlyChart months={stats.months} />
                </div>
              </div>
            )}

            {/* Personal spend list */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                我的消費明細
              </p>
              <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
                {stats.myItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                      <p className="text-xs text-gray-400">{fmtDate(item.happenedAt)}</p>
                    </div>
                    <p className={`text-sm font-semibold flex-shrink-0 ${item.iAmPayer ? 'text-line-green' : 'text-red-500'}`}>
                      {item.iAmPayer ? '+' : '−'}${item.myAmount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <p className="text-[10px] text-gray-400 mb-1 leading-tight">{label}</p>
      <p className={`text-base font-bold leading-tight ${
        accent === 'green' ? 'text-line-green' : accent === 'red' ? 'text-red-500' : 'text-gray-900'
      }`}>
        {value}
      </p>
    </div>
  )
}

function MonthlyChart({ months }: { months: [string, number][] }) {
  const max = Math.max(...months.map(([, v]) => v))
  return (
    <div className="flex items-end gap-2 h-28">
      {months.map(([key, val]) => {
        const [, m] = key.split('-')
        const heightPct = max > 0 ? (val / max) * 100 : 0
        return (
          <div key={key} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-gray-400">
              ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
            </span>
            <div className="w-full flex items-end" style={{ height: 72 }}>
              <div
                className="w-full bg-line-green/80 rounded-t-md"
                style={{ height: `${heightPct}%`, minHeight: heightPct > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-[10px] text-gray-500">{Number(m)}月</span>
          </div>
        )
      })}
    </div>
  )
}
