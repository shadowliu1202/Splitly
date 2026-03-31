'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLiff } from '@/components/providers/LiffProvider'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

/**
 * Root entry point for the LIFF app.
 *
 * IMPORTANT: This must be a client-side redirect, NOT a server-side redirect().
 * When LINE OAuth completes, it redirects back to this URL with ?liff.state=...
 * A server-side redirect would strip that param before LIFF SDK processes it,
 * causing an infinite login loop.
 */
export default function RootPage() {
  const router = useRouter()
  const { isReady } = useLiff()

  useEffect(() => {
    if (isReady) {
      router.replace('/groups')
    }
  }, [isReady, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <LoadingSpinner size={36} />
        <p className="text-sm text-gray-400">載入中...</p>
      </div>
    </div>
  )
}
