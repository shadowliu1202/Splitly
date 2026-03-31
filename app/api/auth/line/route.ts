import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { accessToken, profile } = await req.json()

    if (!profile?.userId || !profile?.displayName) {
      return NextResponse.json({ error: 'Invalid profile' }, { status: 400 })
    }

    // ── Optional: verify LINE access token ──────────────────────────────────
    // Uncomment in production to validate the token is genuinely from LINE.
    //
    // const verifyRes = await fetch(
    //   `https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`
    // )
    // const verifyData = await verifyRes.json()
    // if (!verifyRes.ok || String(verifyData.client_id) !== process.env.LINE_CHANNEL_ID) {
    //   return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
    // }
    // ────────────────────────────────────────────────────────────────────────

    const supabase = adminClient()

    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          line_user_id: profile.userId,
          display_name: profile.displayName,
          avatar_url: profile.pictureUrl ?? null,
        },
        { onConflict: 'line_user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('[auth/line]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[auth/line]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
