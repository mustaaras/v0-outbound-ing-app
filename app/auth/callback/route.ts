import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { devLog, errorLog } from "@/lib/logger"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  devLog("[v0] OAuth callback hit:", {
    url: requestUrl.toString(),
    hasCode: !!code,
    origin
  })

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    devLog("[v0] OAuth exchange result:", {
      hasError: !!error,
      hasUser: !!data?.user,
      error: error?.message
    })

    if (error) {
      errorLog("[v0] OAuth callback error:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=OAuthCallbackError`)
    }

    if (data.user) {
      devLog("[v0] OAuth user authenticated:", data.user.email)

      // Note: User record in 'users' table is created automatically by database trigger
      // No need to manually create it here
      devLog("[v0] User authentication successful, proceeding to dashboard")
    }
  } else {
    devLog("[v0] No code parameter in callback URL")
  }

  devLog("[v0] Redirecting to dashboard")
  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(`${origin}/dashboard`)
}
