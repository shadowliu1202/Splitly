'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLiff } from '@/components/providers/LiffProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

/**
 * Root entry point.
 *
 * Priority:
 * 1. sessionStorage has a cached user → go straight to /groups
 * 2. LIFF is ready + logged in → go to /groups (handles LINE OAuth redirect)
 * 3. Otherwise → show login UI (LINE / Google)
 *
 * NOTE: Must be a client-side redirect. LINE OAuth redirects back here with
 * ?liff.state=… which liff.init() must process before we navigate away.
 */
export default function RootPage() {
  const router = useRouter()
  const { isReady, isLoggedIn, liff } = useLiff()
  const [showLogin, setShowLogin] = useState(false)

  // Step 1: check sessionStorage immediately (sync)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('splitly_user')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.id) {
          router.replace('/groups')
          return
        }
      }
    } catch {}
    // No cache — will show login once LIFF has had a chance to init
  }, [router])

  // Step 2: once LIFF is ready, redirect if logged in or reveal login UI
  useEffect(() => {
    if (!isReady) return
    if (isLoggedIn) {
      router.replace('/groups')
    } else {
      setShowLogin(true)
    }
  }, [isReady, isLoggedIn, router])

  if (!showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <LoadingSpinner size={36} />
          <p className="text-sm text-gray-400">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm space-y-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <p className="text-6xl">💸</p>
          <h1 className="text-3xl font-bold text-gray-900">Splitly</h1>
          <p className="text-sm text-gray-400">輕鬆分帳，清楚記帳</p>
        </div>

        {/* Login buttons */}
        <div className="space-y-3">
          <button
            onClick={() => liff?.login()}
            className="w-full flex items-center justify-center gap-3 bg-[#06C755] text-white py-3.5 rounded-2xl font-semibold text-base active:opacity-80 transition-opacity"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.04 2 11c0 3.33 1.87 6.25 4.72 8.02L6 22l3.27-1.7C10.14 20.73 11.05 21 12 21c5.52 0 10-4.04 10-9s-4.48-9-10-9zm1 12.5H7v-1.5h6v1.5zm2-3H7V10h8v1.5z"/>
            </svg>
            使用 LINE 登入
          </button>

          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-2xl font-semibold text-base active:opacity-80 transition-opacity shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            使用 Google 登入
          </a>
        </div>
      </div>
    </div>
  )
}
