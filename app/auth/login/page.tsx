"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { devLog, errorLog } from "@/lib/logger"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email address")
      return
    }

    const supabase = createClient()
    setResetLoading(true)
    setError(null)
    setResetEmailSent(false)

    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setResetEmailSent(true)
      setError(null)
    } catch (error: unknown) {
      errorLog("[v0] Password reset error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to send password reset email"
      
      // Handle rate limit errors with more helpful message
      if (errorMessage.toLowerCase().includes("rate limit") || errorMessage.toLowerCase().includes("too many requests")) {
        setError("Too many password reset requests. Please wait 60 seconds before trying again.")
      } else if (errorMessage.toLowerCase().includes("email rate limit")) {
        setError("Email rate limit exceeded. Please wait a few minutes before requesting another password reset.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setResetLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setNeedsVerification(false)

  devLog("[v0] Attempting login for:", email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

  devLog("[v0] Login response:", { data, error })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email address before logging in. Check your inbox for a verification link.")
          setNeedsVerification(true)
        } else if (error.message.includes("Invalid login credentials")) {
          setError(
            "Invalid email or password. If you signed up with Google, please use 'Continue with Google' instead.",
          )
        } else if (error.message.toLowerCase().includes("too many") || error.message.toLowerCase().includes("rate limit")) {
          // Handle rate limiting with more specific message
          const retryAfter = error.message.match(/retryAfter["\s:]+(\d+)/)?.[1]
          const waitTime = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 15
          setError(`Too many login attempts. Please wait ${waitTime} minutes before trying again.`)
        } else {
          throw error
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
  devLog("[v0] Login successful, redirecting to dashboard")
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: unknown) {
  errorLog("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address first")
      return
    }

    const supabase = createClient()
    setResendingEmail(true)
    setError(null)
    setEmailSent(false)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      })

      if (error) throw error

      setEmailSent(true)
      setError(null)
    } catch (error: unknown) {
  errorLog("[v0] Resend verification error:", error)
      setError(error instanceof Error ? error.message : "Failed to resend verification email")
    } finally {
      setResendingEmail(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setError(null)

    try {
      const devRedirect = process.env.NEXT_PUBLIC_SUPABASE_DEV_REDIRECT_URL
      const prodRedirect = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL
      const redirectUrl = (typeof window !== "undefined" && window.location.hostname.includes("localhost"))
        ? devRedirect
        : prodRedirect

      console.log("🔍 OAuth Debug - Using redirect URL:", redirectUrl)
      devLog("[v0] Starting Google OAuth login with redirect:", redirectUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        devLog("[v0] Google OAuth error:", error)
        throw error
      }

      devLog("[v0] Google OAuth initiated successfully")
    } catch (error: unknown) {
      errorLog("[v0] Google login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Outbound.ing</h1>
            <p className="text-sm text-muted-foreground">AI-powered cold email generator</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleGoogleLogin}>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                  {emailSent && (
                    <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                      Verification email sent! Check your inbox.
                    </div>
                  )}
                  {resetEmailSent && (
                    <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                      Password reset email sent! Check your inbox for the reset link.
                    </div>
                  )}
                  {showForgotPassword ? (
                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={handleForgotPassword}
                        className="w-full"
                        disabled={resetLoading}
                      >
                        {resetLoading ? "Sending reset link..." : "Send password reset email"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Back to login
                      </Button>
                    </div>
                  ) : (
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Log in"}
                    </Button>
                  )}
                  {needsVerification && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={handleResendVerification}
                      disabled={resendingEmail}
                    >
                      {resendingEmail ? "Sending..." : "Resend Verification Email"}
                    </Button>
                  )}
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup" className="font-medium underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
                <div className="mt-2 text-center text-xs text-muted-foreground">
                  <Link href="/" className="underline underline-offset-4">← Back to Home</Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
