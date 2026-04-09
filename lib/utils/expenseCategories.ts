import {
  Utensils,
  Car,
  BedDouble,
  ShoppingBag,
  Film,
  Camera,
  Home,
  Tag,
  type LucideIcon,
} from 'lucide-react'

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'shopping'
  | 'entertainment'
  | 'attraction'
  | 'daily'
  | 'other'

export interface CategoryMeta {
  id: ExpenseCategory
  label: string
  icon: LucideIcon
  bg: string        // Tailwind bg class
  text: string      // Tailwind text class (for icon inside coloured bg)
}

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { id: 'food',          label: '餐飲', icon: Utensils,    bg: 'bg-orange-400', text: 'text-white' },
  { id: 'transport',     label: '交通', icon: Car,         bg: 'bg-blue-400',   text: 'text-white' },
  { id: 'accommodation', label: '住宿', icon: BedDouble,   bg: 'bg-purple-400', text: 'text-white' },
  { id: 'shopping',      label: '購物', icon: ShoppingBag, bg: 'bg-pink-400',   text: 'text-white' },
  { id: 'entertainment', label: '娛樂', icon: Film,        bg: 'bg-indigo-400', text: 'text-white' },
  { id: 'attraction',    label: '景點', icon: Camera,      bg: 'bg-teal-400',   text: 'text-white' },
  { id: 'daily',         label: '日用', icon: Home,        bg: 'bg-green-400',  text: 'text-white' },
  { id: 'other',         label: '其他', icon: Tag,         bg: 'bg-amber-400',  text: 'text-white' },
]

export const CATEGORY_MAP = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.id, c])
) as Record<ExpenseCategory, CategoryMeta>

export function getCategoryMeta(category?: string | null): CategoryMeta {
  return CATEGORY_MAP[(category as ExpenseCategory) ?? 'other'] ?? CATEGORY_MAP.other
}
