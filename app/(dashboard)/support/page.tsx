"use client"
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { submitSupportMessage } = await import("@/app/actions/support")
      await submitSupportMessage({ message });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send support message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Support & Contact</h1>
      {submitted ? (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">Your message has been sent! We'll reply as soon as possible.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block mb-1 font-medium">Message</label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} required placeholder="Describe your issue or question..." rows={5} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Send to Support"}</Button>
        </form>
      )}
    </div>
  );
}
