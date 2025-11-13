"use client"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const options = ["Great experience", "Good, but could improve", "Neutral", "Needs improvement", "Poor experience"]

export function FeedbackBox({ userTier }: { userTier: string }) {
  const [selected, setSelected] = useState<string>("")
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!selected) throw new Error("Please select a rating")
      const { submitFeedback } = await import("@/app/actions/feedback")
      // Note: submitFeedback will associate with current user on server side
      await submitFeedback({ rating: selected, comment })
      setDone(true)
    } catch (err: any) {
      setError(err?.message || "Failed to submit feedback")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return <div className="rounded-lg border bg-green-50 p-4">Thanks — your feedback was submitted.</div>
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="font-semibold">Leave Feedback</h4>
      <p className="text-sm text-muted-foreground mb-3">Help us improve Outbound.ing</p>
      {error && <div className="bg-red-100 text-red-800 p-2 rounded mb-3">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2">
              <input type="radio" name="rating" value={opt} checked={selected === opt} onChange={() => setSelected(opt)} />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Additional comments (optional)" rows={3} />
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Submitting...' : 'Submit Feedback'}</Button>
      </form>
    </div>
  )
}
