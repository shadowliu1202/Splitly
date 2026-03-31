'use client'

import { useUser } from '@/components/providers/UserProvider'
import { useLiff } from '@/components/providers/LiffProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isReady, isLoggedIn } = useLiff()
  const { isLoading, error } = useUser()

  // LIFF initialising
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <LoadingSpinner size={36} />
          <p className="text-sm text-gray-400">載入中...</p>
        </div>
      </div>
    )
  }

  // Not logged in to LINE
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-4xl">🔐</p>
          <p className="text-lg font-semibold">請在 LINE 中開啟此應用程式</p>
          <p className="text-sm text-gray-400">Splitly 需要透過 LINE 登入才能使用</p>
        </div>
      </div>
    )
  }

  // Syncing user to DB
  if (isLoading) {
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
          <p className="text-sm text-gray-400">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-line-green underline"
          >
            重新整理
          </button>
        </div>
      </div>
    )
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>
}
