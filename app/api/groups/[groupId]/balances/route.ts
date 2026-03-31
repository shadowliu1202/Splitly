import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { computeBalances, calculateSettlements } from '@/lib/utils/settlement'
import type { User } from '@/types'

type Params = { params: Promise<{ groupId: string }> }

// GET /api/groups/[groupId]/balances
// Returns per-member balances and the minimal set of transfers to settle all debts.
export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params
  const supabase = adminClient()

  // Fetch members
  const { data: memberRows, error: mErr } = await supabase
    .from('group_members')
    .select('user_id, users(id, display_name, avatar_url, line_user_id, created_at)')
    .eq('group_id', groupId)

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  // Build userId → User map.
  // The Supabase JS client types nested selects as arrays for non-unique FKs,
  // but at runtime group_members.user_id always resolves to a single user.
  const memberMap: Record<string, User> = {}
  for (const row of memberRows ?? []) {
    const rawUsers = row.users
    // Handle both array (Supabase type inference) and object (runtime value)
    const userRecord = Array.isArray(rawUsers) ? rawUsers[0] : rawUsers
    if (userRecord && 'id' in userRecord) {
      memberMap[userRecord.id] = userRecord as User
    }
  }

  // Fetch expenses with splits
  const { data: expenses, error: eErr } = await supabase
    .from('expenses')
    .select('paid_by, expense_splits(user_id, amount)')
    .eq('group_id', groupId)

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 })

  // Fetch recorded settlements
  const { data: settlements, error: sErr } = await supabase
    .from('settlements')
    .select('from_user_id, to_user_id, amount')
    .eq('group_id', groupId)

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })

  const balances = computeBalances(
    (expenses ?? []) as Parameters<typeof computeBalances>[0],
    (settlements ?? []) as Parameters<typeof computeBalances>[1],
    memberMap
  )

  const transfers = calculateSettlements(balances)

  return NextResponse.json({ balances, transfers })
}
