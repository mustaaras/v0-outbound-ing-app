"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { devLog, errorLog } from "@/lib/logger"

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function finishOAuth() {
      const supabase = createClient()

      try {
        devLog("[v0] Client-side OAuth callback: processing PKCE flow")
        
        // Check if there's an error in the URL params
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          const errorMessage = errorDescription || errorParam
          devLog("[v0] OAuth error from provider:", errorMessage)
          setError(errorMessage)
          setLoading(false)
          router.replace(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
          return
        }

        // With PKCE flow, supabase-js will automatically complete the flow
        // when getSession() is called if the URL contains the auth code
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          devLog("[v0] Session error:", sessionError)
          setError(sessionError.message)
          setLoading(false)
          router.replace(`/auth/login?error=${encodeURIComponent(sessionError.message)}`)
          return
        }

        // If session exists, redirect to dashboard
        if (data?.session) {
          devLog("[v0] OAuth successful, session created, redirecting to dashboard")
          router.replace("/dashboard")
          return
        }

        // If no session and no error, something went wrong
        devLog("[v0] No session found after OAuth callback")
        setError("Failed to complete sign in. Please try again.")
        setLoading(false)
        setTimeout(() => {
          router.replace("/auth/login")
        }, 3000)
      } catch (err: unknown) {
        errorLog("[v0] OAuth client callback error:", err)
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
        setLoading(false)
        setTimeout(() => {
          router.replace(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
        }, 3000)
      }
    }

    finishOAuth()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center p-6">
        {loading && (
          <div className="space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Completing sign in...</p>
          </div>
        )}
        {error && (
          <div className="space-y-4">
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              <p className="font-semibold">Sign in failed</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  )
}

