import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ groupId: string }> }

// GET /api/groups/[groupId]/settlements – list all recorded settlements
export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const supabase = adminClient()

  const { data, error } = await supabase
    .from('settlements')
    .select(`
      *,
      from_user:users!from_user_id(id, display_name, avatar_url),
      to_user:users!to_user_id(id, display_name, avatar_url)
    `)
    .eq('group_id', groupId)
    .order('settled_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ settlements: data })
}

// POST /api/groups/[groupId]/settlements – record a payment between members
export async function POST(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const { fromUserId, toUserId, amount } = await req.json()

  if (!fromUserId || !toUserId || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Only the debtor (from) or creditor (to) can record the settlement
  if (userId !== fromUserId && userId !== toUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = adminClient()

  const { data: settlement, error } = await supabase
    .from('settlements')
    .insert({
      group_id: groupId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount,
      settled_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ settlement }, { status: 201 })
}
