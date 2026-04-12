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
const SUPER_PREVIEWER_LINE_ID = 'superPreviewer'

function getSessionUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch { return null }
}

function setCachedUser(user: User) {
  try { sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user)) } catch {}
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { isReady, isLoggedIn, profile, accessToken } = useLiff()

  // Initialise synchronously from sessionStorage to avoid flash
  const [user, setUser] = useState<User | null>(() => getSessionUser())
  const [isLoading, setIsLoading] = useState(() => {
    const cached = getSessionUser()
    return !cached  // any cached user (incl. superPreviewer) starts as not-loading
  })
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    // superPreviewer: bypass all auth, use cached object as-is
    const cached = getSessionUser()
    if (cached?.line_user_id === SUPER_PREVIEWER_LINE_ID) {
      setUser(cached)
      setIsLoading(false)
      return
    }

    // Google / non-LINE user: already in sessionStorage, LIFF won't log them in
    // Once LIFF is ready and confirms not logged in, stop loading
    if (cached?.id && isReady && !isLoggedIn) {
      setUser(cached)
      setIsLoading(false)
      return
    }

    // LIFF not ready yet
    if (!isReady) return

    // LIFF ready but not logged in and no cache → redirect handled by layout
    if (!isLoggedIn || !profile) {
      setIsLoading(false)
      return
    }

    // LIFF logged in — use cache for instant display, then sync with server
    const cachedLine = cached?.line_user_id === profile.userId ? cached : null
    if (cachedLine) {
      setUser(cachedLine)
      setIsLoading(false)
    }

    const syncUser = async () => {
      if (!cachedLine) setIsLoading(true)
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
        if (!cachedLine) {
          setError(err instanceof Error ? err : new Error('登入失敗'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    syncUser()
  }, [isReady, isLoggedIn, profile, accessToken, tick])

  return (
    <UserContext.Provider value={{ user, isLoading, error, refresh: () => setTick((t) => t + 1) }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
