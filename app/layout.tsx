import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LiffProvider } from '@/components/providers/LiffProvider'
import { UserProvider } from '@/components/providers/UserProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Splitly – 分帳好簡單',
  description: '透過 LINE 輕鬆記帳、分帳、結算',
  applicationName: 'Splitly',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <LiffProvider>
          <UserProvider>{children}</UserProvider>
        </LiffProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
