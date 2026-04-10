import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ groupId: string }> }

// GET /api/groups/[groupId] – group details with members
export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const supabase = adminClient()

  const { data: group, error } = await supabase
    .from('groups')
    .select('*, group_members(joined_at, user_id, users(id, display_name, avatar_url))')
    .eq('id', groupId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({ group })
}

// PATCH /api/groups/[groupId] – rename group (any member)
export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const { name, defaultCurrency, lineGroupId } = await req.json()

  if (!name?.trim() && !defaultCurrency && lineGroupId === undefined) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  }

  const supabase = adminClient()

  // Verify requester is a member
  const { data: membership } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates: Record<string, string | null> = {}
  if (name?.trim()) updates.name = name.trim()
  if (defaultCurrency) updates.default_currency = defaultCurrency
  if (lineGroupId !== undefined) updates.line_group_id = lineGroupId ?? null

  const { data: group, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ group })
}

// DELETE /api/groups/[groupId] – delete group (creator only)
export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const supabase = adminClient()

  const { data: group } = await supabase
    .from('groups')
    .select('created_by')
    .eq('id', groupId)
    .single()

  if (group?.created_by !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
