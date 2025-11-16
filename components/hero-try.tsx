"use client"

import React, { useState } from "react"

export default function HeroTry() {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const res = await fetch("/api/generate-hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), company: company.trim() })
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
        Paste a name & company — we’ll craft a personalized outreach you can copy.
      </p>

      <form onSubmit={handleGenerate} className="w-full max-w-2xl">
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <input
            aria-label="Recipient name"
            placeholder="Recipient name (e.g. Alex Johnson)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border bg-background px-4 py-3 text-sm shadow-sm focus:outline-none"
          />
          <input
            aria-label="Company"
            placeholder="Company (e.g. Acme Co)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-md border bg-background px-4 py-3 text-sm shadow-sm focus:outline-none"
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
          <button
            type="button"
            onClick={() => { setName(""); setCompany(""); setResult(null); setError(null) }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            Reset
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
