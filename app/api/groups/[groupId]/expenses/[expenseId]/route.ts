import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { UpdateExpensePayload } from '@/types'

type Params = { params: Promise<{ groupId: string; expenseId: string }> }

// GET /api/groups/[groupId]/expenses/[expenseId]
export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, expenseId } = await params
  const supabase = adminClient()

  // verify membership
  const { data: member } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: expense, error } = await supabase
    .from('expenses')
    .select(`
      *,
      payer:users!paid_by(id, display_name, avatar_url),
      expense_splits(amount, user_id, users(id, display_name, avatar_url))
    `)
    .eq('id', expenseId)
    .eq('group_id', groupId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ expense })
}

// PATCH /api/groups/[groupId]/expenses/[expenseId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, expenseId } = await params
  const body: UpdateExpensePayload = await req.json()
  const supabase = adminClient()

  // verify membership
  const { data: member } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Build update object (only defined fields)
  const updates: Record<string, unknown> = {}
  if (body.description !== undefined) updates.description = body.description.trim()
  if (body.amount !== undefined) updates.amount = body.amount
  if (body.paidBy !== undefined) updates.paid_by = body.paidBy
  if (body.splitType !== undefined) updates.split_type = body.splitType
  if (body.happenedAt !== undefined) updates.happened_at = body.happenedAt
  if (body.category !== undefined) updates.category = body.category
  if (body.photoUrl !== undefined) updates.photo_url = body.photoUrl
  if (body.remark !== undefined) updates.remark = body.remark ?? null

  const { data: expense, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)
    .eq('group_id', groupId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If splits provided, replace them atomically
  if (body.splits && body.splits.length > 0) {
    await supabase.from('expense_splits').delete().eq('expense_id', expenseId)
    const { error: sErr } = await supabase.from('expense_splits').insert(
      body.splits.map((s) => ({
        expense_id: expenseId,
        user_id: s.userId,
        amount: s.amount,
      }))
    )
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })
  }

  return NextResponse.json({ expense })
}

// DELETE /api/groups/[groupId]/expenses/[expenseId]
export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, expenseId } = await params
  const supabase = adminClient()

  // verify membership
  const { data: member } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // splits cascade on delete via FK; delete expense
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('group_id', groupId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
