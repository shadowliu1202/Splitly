'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ReactNode } from 'react'

interface HeaderProps {
  title: string
  showBack?: boolean
  rightAction?: ReactNode
}

export default function Header({ title, showBack, rightAction }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center h-14 px-2">
      {showBack ? (
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full active:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
      ) : (
        <div className="w-10" />
      )}

      <h1 className="flex-1 text-center text-base font-semibold text-gray-900 truncate px-2">
        {title}
      </h1>

      {rightAction ? (
        <div className="w-10 flex justify-end">{rightAction}</div>
      ) : (
        <div className="w-10" />
      )}
    </header>
  )
}
