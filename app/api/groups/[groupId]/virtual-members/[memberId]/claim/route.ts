import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

type Params = { params: Promise<{ groupId: string; memberId: string }> }

// POST /api/groups/[groupId]/virtual-members/[memberId]/claim
// Transfers all records from the virtual member to the real LINE user,
// then removes the virtual member.
export async function POST(req: NextRequest, { params }: Params) {
  const realUserId = req.headers.get('x-user-id')
  if (!realUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, memberId: virtualId } = await params
  const supabase = adminClient()

  // Verify the target is actually a virtual member in this group
  const { data: virtualUser } = await supabase
    .from('users')
    .select('id, is_virtual')
    .eq('id', virtualId)
    .eq('is_virtual', true)
    .maybeSingle()

  if (!virtualUser) {
    return NextResponse.json({ error: 'Virtual member not found' }, { status: 404 })
  }

  const { data: inGroup } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', virtualId)
    .maybeSingle()

  if (!inGroup) {
    return NextResponse.json({ error: 'Virtual member not in this group' }, { status: 404 })
  }

  // 1. Transfer expense splits: virtual → real
  await supabase
    .from('expense_splits')
    .update({ user_id: realUserId })
    .eq('user_id', virtualId)

  // 2. Transfer expenses paid_by: virtual → real (for this group only)
  await supabase
    .from('expenses')
    .update({ paid_by: realUserId })
    .eq('paid_by', virtualId)
    .eq('group_id', groupId)

  // 3. Transfer settlements: virtual → real
  await supabase
    .from('settlements')
    .update({ from_user_id: realUserId })
    .eq('from_user_id', virtualId)
    .eq('group_id', groupId)

  await supabase
    .from('settlements')
    .update({ to_user_id: realUserId })
    .eq('to_user_id', virtualId)
    .eq('group_id', groupId)

  // 4. Remove virtual member from group
  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', virtualId)

  // 5. Ensure real user is in the group
  await supabase
    .from('group_members')
    .upsert({ group_id: groupId, user_id: realUserId })

  // 6. Delete the virtual user record
  await supabase
    .from('users')
    .delete()
    .eq('id', virtualId)
    .eq('is_virtual', true)

  return NextResponse.json({ success: true })
}
