"use client"
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const feedbackOptions = [
  "Great experience",
  "Good, but could improve",
  "Neutral",
  "Needs improvement",
  "Poor experience"
];

export default function FeedbackPage() {
  const [selected, setSelected] = useState<string>("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!selected) throw new Error("Please select a rating.");
      const { submitFeedback } = await import("@/app/actions/feedback")
      await submitFeedback({ rating: selected, comment });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Feedback</h1>
      {submitted ? (
        <div className="bg-blue-100 text-blue-800 p-4 rounded-lg mb-6">Thank you for your feedback!</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block mb-1 font-medium">How was your experience?</label>
            <div className="flex flex-col gap-2">
              {feedbackOptions.map(option => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="feedback"
                    value={option}
                    checked={selected === option}
                    onChange={() => setSelected(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">Additional Comments</label>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your thoughts..." rows={4} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Submitting..." : "Submit Feedback"}</Button>
        </form>
      )}
    </div>
  );
}
