import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Supabase admin client（service role key）。
 * 只在 server-side API routes 使用，絕對不能暴露給瀏覽器。
 * Service Role Key 在 Supabase → Project Settings → API → service_role
 */
export function adminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Get it from Supabase → Project Settings → API → service_role'
    )
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
