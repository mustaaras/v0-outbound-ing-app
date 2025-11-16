"use client"

import React, { useState } from "react"

export default function HeroTry() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [signature, setSignature] = useState("")
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      // Simple client-side validation
      const emailTrim = email.trim()
      const nameTrim = name.trim()
  const topicTrim = topic.trim()
  const signatureTrim = signature.trim()

      if (!nameTrim) {
        setError("Please provide a recipient name.")
        setLoading(false)
        return
      }

      if (!emailTrim) {
        setError("Please provide a recipient email.")
        setLoading(false)
        return
      }

      // basic email regex
      const emailRe = /\S+@\S+\.\S+/
      if (!emailRe.test(emailTrim)) {
        setError("Please provide a valid email address.")
        setLoading(false)
        return
      }

      if (topicTrim.length > 20) {
        setError("Topic must be 20 characters or less.")
        setLoading(false)
        return
      }

      const res = await fetch("/api/generate-hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameTrim, recipientEmail: emailTrim, topic: topicTrim, signature: signatureTrim })
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        setError(payload?.error || `Generation failed (${res.status})`)
        setLoading(false)
        return
      }

      const payload = await res.json()
      setResult({ subject: payload.subject, body: payload.body })
      // analytics placeholder: window.dataLayer?.push({ event: 'hero_generate_success' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setName("")
    setEmail("")
    setTopic("")
    setSignature("")
    setResult(null)
    setError(null)
  }

  async function handleCopy() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.body)
      // small UX hint - could add toast
    } catch {}
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
      <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-2 text-sm">
        <span className="text-primary">Try it</span>
        <span className="text-muted-foreground">— no signup required</span>
      </div>

      <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
        Get a ready-to-send email in 10 seconds
      </h1>

      <p className="text-balance max-w-2xl text-lg text-muted-foreground sm:text-xl">
        Paste a recipient name, their email, and a short topic (max 20 chars) — we’ll craft a personalized outreach you can copy or open in your mail client.
      </p>

      <form onSubmit={handleGenerate} className="w-full max-w-2xl">
        <div className="w-full">
          <div className="md:flex md:items-start md:gap-4">
            <div className="flex-1">
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            aria-label="Recipient name"
            placeholder="Recipient name (e.g. Alex Johnson)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-1 w-full rounded-md border bg-background px-4 py-3 text-sm shadow-sm focus:outline-none"
          />

          <input
            aria-label="Recipient email"
            placeholder="Recipient email (e.g. alex@acme.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="col-span-1 w-full rounded-md border bg-background px-4 py-3 text-sm shadow-sm focus:outline-none"
          />

          <input
            aria-label="Topic"
            placeholder="Topic (max 20 chars)"
            value={topic}
            maxLength={20}
            onChange={(e) => setTopic(e.target.value)}
            className="col-span-1 w-full rounded-md border bg-background px-4 py-3 text-sm shadow-sm focus:outline-none"
          />
              </div>
            </div>

            {/* Signature: placed after the main inputs in the DOM so it's last on mobile,
                but shown on the right on md+ via the flex layout above */}
            <div className="mt-3 md:mt-0 md:w-72">
              <input
                aria-label="Your signature"
                placeholder="Your signature (e.g. Jane from Outbound.ing)"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full rounded-md border bg-background px-4 py-3 text-sm shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </form>

      {error && <div className="mt-4 text-sm text-destructive">{error}</div>}

      {result && (
        <div className="mt-6 w-full max-w-2xl rounded-lg border bg-card p-4 text-left">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{result.subject}</h4>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground mt-2">{result.body}</pre>
            </div>
            <div className="ml-4 flex flex-col items-end gap-2">
              <button onClick={handleCopy} className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground">Copy</button>
              {email && (
                <a
                  href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`}
                  className="rounded-md border px-3 py-1 text-sm"
                >
                  Open in email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
