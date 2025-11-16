import { NextResponse } from "next/server"
import { rateLimiters } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

type Body = { name?: string; recipientEmail?: string; topic?: string; signature?: string }

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.headers.get("x-client-ip") || "unknown"

    // Parse cookies to read or create a persistent anon_id for anonymous users.
    const cookieHeader = req.headers.get("cookie") || ""
    const parseCookie = (name: string) => {
      if (!cookieHeader) return null
      const parts = cookieHeader.split(/;\s*/)
      for (const part of parts) {
        const [k, ...v] = part.split("=")
        if (k === name) return decodeURIComponent(v.join("="))
      }
      return null
    }

    const existingAnonId = parseCookie("anon_id")
    const anonId = existingAnonId || (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now()))
    const createdAnon = !existingAnonId
    const anonIdentifier = `${ip}:${anonId}`

    // Helper to always attach anon cookie when we created one for an anonymous user.
    const makeResponse = (body: any, status = 200) => {
      const res = NextResponse.json(body, { status })
      if (createdAnon) {
        res.cookies.set("anon_id", anonId, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        })
      }
      return res
    }

    // Basic rate-limit check (wrap around aiGeneration limiter)
    const check = rateLimiters.aiGeneration.check(ip)
    if (!check.allowed) {
      return makeResponse({ error: "Too many requests" }, 429)
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
      const anonCheck = rateLimiters.anonymousDaily.check(anonIdentifier)
      if (!anonCheck.allowed) {
        return makeResponse({ error: "Daily limit reached. Create an account to generate more samples." }, 429)
      }
    }

  const body = (await req.json()) as Body
  const name = (body.name || "").trim()
  const recipientEmail = (body.recipientEmail || "").trim()
  const topic = (body.topic || "").trim()
  const signature = (body.signature || "").trim()

    // Simple validation: require name and recipient email
    if (!name || !recipientEmail) {
      return makeResponse({ error: "Please provide a recipient name and email." }, 400)
    }

    // basic server-side email check
    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
      return makeResponse({ error: "Invalid email address." }, 400)
    }

    if (topic.length > 20) {
      return makeResponse({ error: "Topic must be 20 characters or less." }, 400)
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

      // Remove common placeholder signature blocks that some models emit
      // e.g. lines like "[Your Name]", "Your Phone Number", etc. We strip
      // trailing placeholder blocks so we can append the real signature cleanly.
      const stripPlaceholderBlock = (text: string) => {
        const lines = text.split(/\r?\n/)
        const placeholderRe = /\[?\s*(Your\s+Name|Your\s+Position|Your\s+Company|Your\s+Phone(?:\s+Number)?|Your\s+Email(?:\s+Address)?)\s*\]?/i
        // remove trailing lines that are obviously placeholders or empty after them
        while (lines.length > 0) {
          const last = lines[lines.length - 1].trim()
          if (!last) {
            lines.pop()
            continue
          }
          if (placeholderRe.test(last)) {
            lines.pop()
            continue
          }
          // also handle cases where a block of bracketed placeholders appears (e.g. [Your Name])
          if (/^\[.*\]$/.test(last) && last.length < 64) {
            lines.pop()
            continue
          }
          break
        }
        return lines.join("\n")
      }

      bodyText = stripPlaceholderBlock(bodyText)

      // If a signature was provided, ensure it's appended after a common closing (e.g. "Best," or "Best regards,")
      if (signature) {
        const sig = signature.trim()
        // Don't duplicate if signature already appears at end
        const normalized = bodyText.replace(/\s+$/g, "")
        if (!normalized.endsWith(sig)) {
          // Look for common closings and insert signature on the following line
          const closingRe = /(Best(?: regards?)?|Regards|Sincerely|Cheers)[\.,]?$/im
          const lines = bodyText.split(/\n/)
          // find a line that matches closingRe from the bottom
          let inserted = false
          for (let i = lines.length - 1; i >= 0; i--) {
            if (closingRe.test(lines[i].trim())) {
              // insert signature on next line after the closing
              lines.splice(i + 1, 0, sig)
              inserted = true
              break
            }
          }

          if (!inserted) {
            // fallback: append with a blank line before signature
            lines.push("", sig)
          }

          bodyText = lines.join("\n")
        }
      }

      return makeResponse({ subject, body: bodyText, generatedBy: "ai" })
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

  return makeResponse({ subject, body, generatedBy: "fallback" })
    }
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
