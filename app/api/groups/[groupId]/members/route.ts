import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ groupId: string }> }

// GET /api/groups/[groupId]/members – list members as User objects
export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const supabase = adminClient()

  const { data, error } = await supabase
    .from('group_members')
    .select('users(id, display_name, avatar_url, line_user_id, created_at)')
    .eq('group_id', groupId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const members = data.map((d) => d.users)

  return NextResponse.json({ members })
}

// POST /api/groups/[groupId]/members – join group directly
export async function POST(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const supabase = adminClient()

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ alreadyMember: true })
  }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true }, { status: 201 })
}
