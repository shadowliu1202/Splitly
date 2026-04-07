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

    // Only expenses where I have a split
    const myItems = expenses
      .flatMap((e) => {
        const split = e.expense_splits?.find((s) => s.user_id === user.id)
        if (!split) return []
        return [{
          id: e.id,
          description: e.description,
          happenedAt: e.happened_at,
          myAmount: Number(split.amount),
        }]
      })
      .sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))

    const myTotal = myItems.reduce((s, i) => s + i.myAmount, 0)

    // Monthly trend of my spend
    const monthMap: Record<string, number> = {}
    for (const item of myItems) {
      const [y, m] = item.happenedAt.split('-')
      const key = `${y}-${m}`
      monthMap[key] = (monthMap[key] ?? 0) + item.myAmount
    }
    const months = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)

    return { myTotal, myItems, months }
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
      <Header title="我的消費統計" showBack />

      <div className="p-4 pb-16 space-y-5">
        {!stats || stats.myItems.length === 0 ? (
          <div className="text-center py-24 text-gray-400 space-y-2">
            <p className="text-4xl">📊</p>
            <p>還沒有消費記錄</p>
          </div>
        ) : (
          <>
            {/* My total */}
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
              <p className="text-sm text-gray-400 mb-1">我的總消費</p>
              <p className="text-3xl font-bold text-gray-900">
                ${stats.myTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">{stats.myItems.length} 筆支出</p>
            </div>

            {/* Monthly trend of my spend */}
            {stats.months.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">每月消費趨勢</p>
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <MonthlyChart months={stats.months} />
                </div>
              </div>
            )}

            {/* Spend list */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">消費明細</p>
              <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
                {stats.myItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                      <p className="text-xs text-gray-400">{fmtDate(item.happenedAt)}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 flex-shrink-0">
                      ${item.myAmount.toLocaleString()}
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
