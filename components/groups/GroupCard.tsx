import Link from 'next/link'
import { Users, ChevronRight } from 'lucide-react'
import { Group } from '@/types'
import Card from '@/components/ui/Card'

interface Props {
  group: Group
}

export default function GroupCard({ group }: Props) {
  const memberCount =
    group.member_count ??
    group.group_members?.length ??
    0

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="flex items-center gap-4 p-4 active:bg-gray-50 transition-colors">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">💰</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{group.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Users size={12} />
            {memberCount} 位成員
          </p>
        </div>

        <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
      </Card>
    </Link>
  )
}
