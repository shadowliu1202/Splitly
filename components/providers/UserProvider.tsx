'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { useLiff } from './LiffProvider'
import type { User } from '@/types'

interface UserContextType {
  user: User | null
  isLoading: boolean
  error: Error | null
  refresh: () => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  refresh: () => {},
})

const USER_CACHE_KEY = 'splitly_user'

function getCachedUser(lineUserId: string): User | null {
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (cached?.line_user_id === lineUserId) return cached as User
  } catch {}
  return null
}

function setCachedUser(user: User) {
  try {
    sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
  } catch {}
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { isReady, isLoggedIn, profile, accessToken } = useLiff()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isReady) return
    if (!isLoggedIn || !profile) {
      setIsLoading(false)
      return
    }

    // Use cached user immediately to avoid loading flash
    const cached = getCachedUser(profile.userId)
    if (cached) {
      setUser(cached)
      setIsLoading(false)
    }

    const syncUser = async () => {
      if (!cached) setIsLoading(true)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        const res = await fetch('/api/auth/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            accessToken,
            profile: {
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
            },
          }),
        })
        clearTimeout(timeoutId)

        if (!res.ok) throw new Error('登入失敗')

        const data = await res.json()
        setCachedUser(data.user)
        setUser(data.user)
      } catch (err) {
        if (!cached) {
          console.error('[UserProvider] sync error:', err)
          setError(err instanceof Error ? err : new Error('登入失敗'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    syncUser()
  }, [isReady, isLoggedIn, profile, accessToken, tick])

  return (
    <UserContext.Provider
      value={{ user, isLoading, error, refresh: () => setTick((t) => t + 1) }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
