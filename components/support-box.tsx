"use client"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function SupportBox({ userTier }: { userTier: string }) {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { submitSupportMessage } = await import("@/app/actions/support")
      // submitSupportMessage will check current user on server side
      await submitSupportMessage({ message })
      setDone(true)
    } catch (err: any) {
      setError(err?.message || "Failed to send support message")
    } finally {
      setLoading(false)
    }
  }

  if (done) return <div className="rounded-lg border bg-green-50 p-4">Your support request was sent. We'll reply soon.</div>

  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="font-semibold">Contact Support</h4>
      <p className="text-sm text-muted-foreground mb-3">Available to Light & Pro users</p>
      {error && <div className="bg-red-100 text-red-800 p-2 rounded mb-3">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue or question" rows={4} />
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Sending...' : 'Send to Support'}</Button>
      </form>
    </div>
  )
}
