import { NextResponse } from "next/server"
import { rateLimiters } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

type Body = { name?: string; recipientEmail?: string; topic?: string; signature?: string }

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.headers.get("x-client-ip") || "unknown"

    // Basic rate-limit check (wrap around aiGeneration limiter)
    const check = rateLimiters.aiGeneration.check(ip)
    if (!check.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // Check authentication: if user is not logged in, enforce daily anonymous limit
    let userPresent = false
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userPresent = !!user
    } catch (err) {
      // ignore errors and treat as anonymous
      userPresent = false
    }

    if (!userPresent) {
      const anonCheck = rateLimiters.anonymousDaily.check(ip)
      if (!anonCheck.allowed) {
        return NextResponse.json({ error: "Daily limit reached. Create an account to generate more samples." }, { status: 429 })
      }
    }

  const body = (await req.json()) as Body
  const name = (body.name || "").trim()
  const recipientEmail = (body.recipientEmail || "").trim()
  const topic = (body.topic || "").trim()
  const signature = (body.signature || "").trim()

    // Simple validation: require name and recipient email
    if (!name || !recipientEmail) {
      return NextResponse.json({ error: "Please provide a recipient name and email." }, { status: 400 })
    }

    // basic server-side email check
    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 })
    }

    if (topic.length > 20) {
      return NextResponse.json({ error: "Topic must be 20 characters or less." }, { status: 400 })
    }

  // Build a short prompt for quick generation
  const prompt = `Write a single cold outreach email (subject + short body) to ${name} about ${topic || "a short opportunity"}. Keep it concise (3-5 sentences), friendly, and end with a short CTA asking for a quick call or reply. If a sender signature is provided, end the email with that signature exactly as provided. Include a short subject line on the first line prefixed with 'Subject:'. Return plain text.`

    try {
      const { text } = await generateText({ model: "openai/gpt-4o-mini", prompt, temperature: 0.6 })
      // The ai package returns a text blob; attempt to split into subject/body by first line
      const trimmed = text.trim()
      let subject = "Quick intro"
      let bodyText = trimmed

      // If the AI returns a clear subject in the first line (Subject: ...), handle it
      const firstLine = trimmed.split("\n")[0]
      if (/^Subject[:\-]/i.test(firstLine)) {
        subject = firstLine.replace(/^Subject[:\-]\s*/i, "").trim()
        bodyText = trimmed.split("\n").slice(1).join("\n").trim()
      } else if (firstLine.length < 120 && trimmed.includes("\n\n")) {
        // treat first short line as subject
        subject = firstLine
        bodyText = trimmed.split("\n\n").slice(1).join("\n\n").trim()
      }

      return NextResponse.json({ subject, body: bodyText, generatedBy: "ai" })
    } catch (e) {
  // Fallback deterministic template (topic-aware)
  const subject = topic ? `Quick intro — ${topic}` : `Quick intro`
  const bodyLines = []
  bodyLines.push(name ? `Hi ${name},\n\n` : "Hi there,\n\n")
  bodyLines.push(`I hope you’re doing well. I wanted to introduce myself — I work with teams to improve outreach related to ${topic || "sales and hiring"} by combining proven templates with lightweight personalization. Would you be open to a 10-minute call next week to explore whether this could help your team?\n\n`)
  if (signature) {
    bodyLines.push(signature)
  } else {
    bodyLines.push("Best regards,")
  }

  const body = bodyLines.join("")

  return NextResponse.json({ subject, body, generatedBy: "fallback" })
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
