'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

/**
 * After Google OAuth, the server redirects here with ?u=<base64 user JSON>.
 * We store it in sessionStorage and redirect to the app.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const encoded = params.get('u')
    const error = params.get('error')

    if (error || !encoded) {
      router.replace('/?error=' + (error ?? 'unknown'))
      return
    }

    try {
      const user = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')))
      if (!user?.id) throw new Error('invalid user')
      sessionStorage.setItem('splitly_user', JSON.stringify(user))
      router.replace('/groups')
    } catch {
      router.replace('/?error=invalid_callback')
    }
  }, [params, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <LoadingSpinner size={36} />
        <p className="text-sm text-gray-400">登入中...</p>
      </div>
    </div>
  )
}
