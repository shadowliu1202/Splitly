import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

type Params = { params: Promise<{ groupId: string }> }

// POST /api/groups/[groupId]/virtual-members – add a virtual member to a group
export async function POST(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const { name } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const supabase = adminClient()

  // Verify requester is a group member
  const { data: membership } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Create a virtual user (line_user_id is a unique placeholder)
  const { data: user, error: uErr } = await supabase
    .from('users')
    .insert({
      line_user_id: `virtual_${nanoid(16)}`,
      display_name: name.trim(),
      is_virtual: true,
    })
    .select()
    .single()

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 })

  // Add to group
  const { error: mErr } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: user.id })

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  return NextResponse.json({ user }, { status: 201 })
}
