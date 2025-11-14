import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const redirectTo = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL
    : process.env.NEXT_PUBLIC_SUPABASE_DEV_REDIRECT_URL

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      // Ensure the browser client looks for OAuth tokens in the URL and completes the PKCE flow
      detectSessionInUrl: true,
    }
  })
}
