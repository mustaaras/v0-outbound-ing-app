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

      const { data: existingUser } = await supabase.from("users").select("id").eq("id", data.user.id).maybeSingle()

      if (!existingUser) {
        devLog("[v0] Creating user entry for OAuth user:", data.user.id)
        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          tier: "free",
        })

        if (insertError) {
          errorLog("[v0] Error creating user entry:", insertError)
        } else {
          devLog("[v0] User entry created successfully")
        }
      } else {
        devLog("[v0] User entry already exists")
      }
    }
  } else {
    devLog("[v0] No code parameter in callback URL")
  }

  devLog("[v0] Redirecting to dashboard")
  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(`${origin}/dashboard`)
}
