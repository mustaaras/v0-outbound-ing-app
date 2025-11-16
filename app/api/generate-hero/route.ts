import { NextResponse } from "next/server"
import { rateLimiters } from "@/lib/rate-limit"
import { generateText } from "ai"

type Body = { name?: string; company?: string }

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.headers.get("x-client-ip") || "unknown"

    // Basic rate-limit check (wrap around aiGeneration limiter)
    const check = rateLimiters.aiGeneration.check(ip)
    if (!check.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = (await req.json()) as Body
    const name = (body.name || "").trim()
    const company = (body.company || "").trim()

    // Simple validation
    if (!name && !company) {
      return NextResponse.json({ error: "Please provide a name or company to generate a sample." }, { status: 400 })
    }

    // Build a short prompt for quick generation
    const prompt = `Write a single cold outreach email (subject + short body) to ${name || "a potential contact"}${company ? ` at ${company}` : ""}. Keep it concise (3-5 sentences), friendly, and end with a short CTA asking for a quick call or reply. Return JSON with keys subject and body.`

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
      // Fallback deterministic template
      const subject = company ? `Quick intro — ${company}` : `Quick intro`
      const body = `${name ? `Hi ${name},\n\n` : "Hi there,\n\n"}I hope you’re doing well. I wanted to introduce myself — I help teams at ${company || "growing companies"} increase reply rates on cold outreach by combining proven templates with lightweight personalization. Would you be open to a 10-minute call next week to explore whether this could help your team?\n\nBest regards,`

      return NextResponse.json({ subject, body, generatedBy: "fallback" })
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
