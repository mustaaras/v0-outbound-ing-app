import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }
  } else {
    // No code provided, redirect to login
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  // Successfully exchanged code for session, redirect to dashboard
  return NextResponse.redirect(`${origin}/dashboard`)
}
