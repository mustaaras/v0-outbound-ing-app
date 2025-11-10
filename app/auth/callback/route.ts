import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { devLog, errorLog } from "@/lib/logger"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      errorLog("[v0] OAuth callback error:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=OAuthCallbackError`)
    }

    if (data.user) {
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
        }
      }
    }
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(`${origin}/dashboard`)
}
