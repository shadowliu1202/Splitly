'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

interface LiffContextType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  liff: any | null
  isReady: boolean
  isLoggedIn: boolean
  profile: LiffProfile | null
  accessToken: string | null
  error: Error | null
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  isReady: false,
  isLoggedIn: false,
  profile: null,
  accessToken: null,
  error: null,
})

export function LiffProvider({ children }: { children: ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [liff, setLiff] = useState<any | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profile, setProfile] = useState<LiffProfile | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffModule = await import('@line/liff')
        const liffInstance = liffModule.default

        const initTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LIFF init timeout (15s)')), 15000)
        )
        await Promise.race([
          liffInstance.init({
            liffId: process.env.NEXT_PUBLIC_LIFF_ID!,
            withLoginOnExternalBrowser: true,
          }),
          initTimeout,
        ])

        sessionStorage.removeItem('liff_retry')
        setLiff(liffInstance)

        const loggedIn = liffInstance.isLoggedIn()

        // Inside LINE but no session yet — trigger login redirect (don't set isReady; page will reload)
        if (!loggedIn && liffInstance.isInClient()) {
          liffInstance.login()
          return
        }

        setIsLoggedIn(loggedIn)

        if (loggedIn) {
          const profileTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getProfile timeout')), 10000)
          )
          const [userProfile, token] = await Promise.race([
            Promise.all([liffInstance.getProfile(), liffInstance.getAccessToken()]),
            profileTimeout,
          ]) as [Awaited<ReturnType<typeof liffInstance.getProfile>>, string]
          setProfile({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            statusMessage: userProfile.statusMessage,
          })
          setAccessToken(token)
        }
      } catch (err) {
        console.error('[LIFF] init error:', err)
        // On first open in LINE, liff.init() redirects for auth and never resolves.
        // When we hit our timeout, auto-reload once so the returning page (with auth code) can init cleanly.
        const isTimeout = err instanceof Error && err.message.includes('timeout')
        const alreadyRetried = sessionStorage.getItem('liff_retry') === '1'
        if (isTimeout && !alreadyRetried) {
          sessionStorage.setItem('liff_retry', '1')
          window.location.reload()
          return
        }
        sessionStorage.removeItem('liff_retry')
        setError(err instanceof Error ? err : new Error('LIFF 初始化失敗'))
      } finally {
        setIsReady(true)
      }
    }

    initLiff()
  }, [])

  return (
    <LiffContext.Provider
      value={{ liff, isReady, isLoggedIn, profile, accessToken, error }}
    >
      {children}
    </LiffContext.Provider>
  )
}

export const useLiff = () => useContext(LiffContext)
