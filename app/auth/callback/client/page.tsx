"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { devLog, errorLog } from "@/lib/logger"

export default function OAuthCallbackClientPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function finishOAuth() {
      const supabase = createClient()

      try {
        devLog("[v0] Client-side callback: checking session from URL")
        // supabase-js will attempt to complete the PKCE or implicit flow if the URL contains auth params.
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          devLog("[v0] Session error:", error)
          setError(error.message)
          setLoading(false)
          return
        }

        // If session exists, redirect
        if (data?.session) {
          devLog("[v0] Session detected, redirecting to dashboard")
          router.replace("/dashboard")
          return
        }

        // If no session and no error, something went wrong
        setError("Failed to detect or create a session from the OAuth response. Please login again.")
      } catch (err: unknown) {
        errorLog("[v0] OAuth client callback error:", err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    finishOAuth()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center p-6">
        {loading ? <p>Finishing sign-in...</p> : null}
        {error ? <div className="text-destructive">{error}</div> : null}
      </div>
    </div>
  )
}
