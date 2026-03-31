import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

function getUserId(req: NextRequest) {
  return req.headers.get('x-user-id')
}

// GET /api/groups – list groups the user belongs to
export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = adminClient()

  // 1. Get group IDs for this user
  const { data: memberships, error: mErr } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  const groupIds = memberships.map((m) => m.group_id)

  if (groupIds.length === 0) return NextResponse.json({ groups: [] })

  // 2. Fetch groups with member count
  const { data: groups, error: gErr } = await supabase
    .from('groups')
    .select('*, group_members(count)')
    .in('id', groupIds)
    .order('created_at', { ascending: false })

  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 })

  // Flatten the count
  const result = groups.map((g) => ({
    ...g,
    member_count: (g.group_members as unknown as { count: number }[])[0]?.count ?? 0,
    group_members: undefined,
  }))

  return NextResponse.json({ groups: result })
}

// POST /api/groups – create a new group
export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const supabase = adminClient()
  const inviteCode = nanoid(8)

  const { data: group, error: gErr } = await supabase
    .from('groups')
    .insert({ name: name.trim(), invite_code: inviteCode, created_by: userId })
    .select()
    .single()

  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 })

  // Add creator as first member
  await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId })

  return NextResponse.json({ group }, { status: 201 })
}
