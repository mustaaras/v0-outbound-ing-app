"use client"
import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function OAuthHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get('code')

  useEffect(() => {
    if (code) {
      // Redirect to the callback route with the code
      router.replace(`/auth/callback?code=${code}`)
    } else {
      router.replace('/auth/login')
    }
  }, [code, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}