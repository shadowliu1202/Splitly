import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ groupId: string; settlementId: string }> }

// GET /api/groups/[groupId]/settlements/[settlementId]
export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, settlementId } = await params
  const supabase = adminClient()

  const { data: member } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: settlement, error } = await supabase
    .from('settlements')
    .select(`
      *,
      from_user:users!from_user_id(id, display_name, avatar_url),
      to_user:users!to_user_id(id, display_name, avatar_url)
    `)
    .eq('id', settlementId)
    .eq('group_id', groupId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!settlement) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ settlement })
}

// PATCH /api/groups/[groupId]/settlements/[settlementId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, settlementId } = await params
  const body = await req.json()
  const supabase = adminClient()

  const { data: member } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: Record<string, unknown> = {}
  if (body.fromUserId !== undefined) updates.from_user_id = body.fromUserId
  if (body.toUserId !== undefined) updates.to_user_id = body.toUserId
  if (body.amount !== undefined) updates.amount = body.amount
  if (body.settledAt !== undefined) updates.settled_at = body.settledAt
  if (body.remark !== undefined) updates.remark = body.remark ?? null
  if (body.photoUrl !== undefined) updates.photo_url = body.photoUrl ?? null

  const { data: settlement, error } = await supabase
    .from('settlements')
    .update(updates)
    .eq('id', settlementId)
    .eq('group_id', groupId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ settlement })
}

// DELETE /api/groups/[groupId]/settlements/[settlementId]
export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, settlementId } = await params
  const supabase = adminClient()

  const { data: member } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', settlementId)
    .eq('group_id', groupId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
