'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/providers/UserProvider'
import { useLiff } from '@/components/providers/LiffProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isReady, isLoggedIn } = useLiff()
  const { user, isLoading, error } = useUser()
  const router = useRouter()

  // If LIFF is ready, not logged in, and no cached user → send to login page
  useEffect(() => {
    if (isReady && !isLoggedIn && !isLoading && !user) {
      router.replace('/')
    }
  }, [isReady, isLoggedIn, isLoading, user, router])

  // Already have a user (from sessionStorage / Google / LINE / superPreviewer)
  if (user) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  // Still loading / waiting for LIFF
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  // Auth error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-4xl">⚠️</p>
          <p className="text-lg font-semibold">登入發生錯誤</p>
          <p className="text-sm text-gray-400">{error.message ?? '無法驗證身份，請重新登入'}</p>
          <button
            onClick={() => router.replace('/')}
            className="mt-2 px-4 py-2 rounded-xl bg-line-green text-white text-sm font-medium active:opacity-80"
          >
            回到登入頁
          </button>
        </div>
      </div>
    )
  }

  // Waiting for redirect effect to fire
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size={32} />
    </div>
  )
}
