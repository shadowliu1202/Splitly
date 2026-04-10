import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

// GET /api/auth/google/callback — exchange code, upsert user, redirect to client
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?error=no_code`)
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(tokenData.error ?? 'Token exchange failed')

    // Get Google user profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const googleUser = await userRes.json()
    if (!userRes.ok || !googleUser.id) throw new Error('Failed to get Google profile')

    // Upsert user in DB
    const supabase = adminClient()
    const { data: user, error } = await (supabase
      .from('users')
      .upsert(
        {
          google_user_id: googleUser.id,
          display_name: googleUser.name ?? googleUser.email,
          avatar_url: googleUser.picture ?? null,
        } as never,
        { onConflict: 'google_user_id' }
      )
      .select()
      .single() as unknown as Promise<{ data: Record<string, unknown> | null; error: unknown }>)

    if (error) throw error

    // Pass user to client page via base64 URL param
    const encoded = Buffer.from(JSON.stringify(user)).toString('base64url')
    return NextResponse.redirect(`${appUrl}/auth/callback?u=${encoded}`)
  } catch (err) {
    console.error('[auth/google/callback]', err)
    return NextResponse.redirect(`${appUrl}/?error=google_auth_failed`)
  }
}
