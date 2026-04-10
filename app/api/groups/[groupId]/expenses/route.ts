import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { CreateExpensePayload } from '@/types'
import { pushLineMessage, buildExpenseNotifyText } from '@/lib/utils/lineNotify'

type Params = { params: Promise<{ groupId: string }> }

// GET /api/groups/[groupId]/expenses
export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const supabase = adminClient()

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select(`
      *,
      payer:users!paid_by(id, display_name, avatar_url),
      expense_splits(amount, user_id, users(id, display_name, avatar_url))
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ expenses })
}

// POST /api/groups/[groupId]/expenses
export async function POST(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const body: CreateExpensePayload & { notify?: boolean; payerName?: string } = await req.json()
  const { description, amount, paidBy, splitType, category, currency, exchangeRate, happenedAt, photoUrl, remark, splits, notify, payerName } = body

  if (!description || !amount || !paidBy || !splits?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = adminClient()

  // Insert expense
  const { data: expense, error: eErr } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      paid_by: paidBy,
      amount,
      description,
      split_type: splitType,
      category: category ?? 'other',
      currency: currency ?? 'TWD',
      exchange_rate: exchangeRate ?? 1,
      happened_at: happenedAt ?? new Date().toISOString().slice(0, 10),
      photo_url: photoUrl ?? null,
      remark: remark ?? null,
    })
    .select()
    .single()

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 })

  // Insert splits
  const { error: sErr } = await supabase.from('expense_splits').insert(
    splits.map((s) => ({
      expense_id: expense.id,
      user_id: s.userId,
      amount: s.amount,
    }))
  )

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  // Send LINE notification if requested
  if (notify) {
    const { data: group } = await supabase
      .from('groups')
      .select('name, line_group_id')
      .eq('id', groupId)
      .single() as unknown as { data: { name: string; line_group_id: string | null } | null }

    if (group?.line_group_id) {
      const text = buildExpenseNotifyText({
        groupName: group.name,
        description,
        amount: Number(amount),
        currency: currency ?? 'TWD',
        payerName: payerName ?? '未知',
        splitCount: splits.length,
      })
      await pushLineMessage(group.line_group_id, [{ type: 'text', text }])
    }
  }

  return NextResponse.json({ expense }, { status: 201 })
}
