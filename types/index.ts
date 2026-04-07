export type SplitType = 'equal' | 'custom' | 'percentage'

// ── DB Models ─────────────────────────────────────────────────────────────────

export interface User {
  id: string
  line_user_id: string
  display_name: string
  avatar_url: string | null
  is_virtual: boolean
  created_at: string | null
}

export interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string | null
  created_at: string
  // joined via query
  group_members?: GroupMember[]
  member_count?: number
}

export interface GroupMember {
  group_id: string
  user_id: string
  joined_at: string
  users?: User
}

export interface Expense {
  id: string
  group_id: string
  paid_by: string
  amount: number
  description: string
  split_type: SplitType
  happened_at: string   // DATE as YYYY-MM-DD
  photo_url: string | null
  remark: string | null
  created_at: string
  // joined via query
  payer?: User
  expense_splits?: ExpenseSplit[]
}

export interface ExpenseSplit {
  expense_id: string
  user_id: string
  amount: number
  users?: User
}

export interface Settlement {
  id: string
  group_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  settled_at: string
  remark: string | null
  photo_url: string | null
  created_at: string
  from_user?: User
  to_user?: User
}

// ── Computed types ────────────────────────────────────────────────────────────

export interface UserBalance {
  userId: string
  user: User
  amount: number // positive = owed money, negative = owes money
}

/** A suggested transfer to settle all debts with minimum transactions */
export interface Transfer {
  fromUserId: string
  toUserId: string
  fromUser: User
  toUser: User
  amount: number
}

// ── API payloads ──────────────────────────────────────────────────────────────

export interface CreateExpensePayload {
  description: string
  amount: number
  paidBy: string
  splitType: SplitType
  happenedAt: string  // YYYY-MM-DD
  photoUrl?: string | null
  remark?: string | null
  splits: { userId: string; amount: number }[]
}

export interface UpdateExpensePayload {
  description?: string
  amount?: number
  paidBy?: string
  splitType?: SplitType
  happenedAt?: string
  photoUrl?: string | null
  remark?: string | null
  splits?: { userId: string; amount: number }[]
}

export interface CreateGroupPayload {
  name: string
}
