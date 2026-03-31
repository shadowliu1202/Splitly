import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ inviteCode: string }> }

// POST /api/invite/[inviteCode] – join a group via invite code
export async function POST(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { inviteCode } = await params
  const supabase = adminClient()

  // Look up the group by invite code
  const { data: group, error: gErr } = await supabase
    .from('groups')
    .select('id, name, invite_code')
    .eq('invite_code', inviteCode)
    .maybeSingle()

  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 })
  if (!group) return NextResponse.json({ error: '邀請連結無效' }, { status: 404 })

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ group, alreadyMember: true })
  }

  // Join the group
  const { error: joinErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId })

  if (joinErr) return NextResponse.json({ error: joinErr.message }, { status: 500 })

  return NextResponse.json({ group, alreadyMember: false }, { status: 201 })
}
