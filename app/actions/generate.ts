"use server"

import { createClient } from "@/lib/supabase/server"
import { canGenerateTemplate, incrementUsage } from "@/lib/auth-utils"
import { generateText } from "ai"
import { errorLog } from "@/lib/logger"

interface GenerateTemplateInput {
  subject: string
  category: string
  recipientName?: string
  recipientEmail?: string
  sellerSignature?: string
  strategyIds: string[]
  userId: string
  inputData: Record<string, string>
  tone: string
  emailLength: string
  goal: string
  personalization: string
}

export async function generateTemplate(input: GenerateTemplateInput) {
  const supabase = await createClient()

  // Get user tier
  const { data: user } = await supabase.from("users").select("tier").eq("id", input.userId).single()

  if (!user) {
    throw new Error("User not found")
  }

  // Check if user can generate
  const { canGenerate } = await canGenerateTemplate(input.userId, user.tier)
  if (!canGenerate) {
    throw new Error("Monthly usage limit reached. Upgrade to Pro for unlimited templates.")
  }

  // Get selected strategies
  const { data: strategies } = await supabase.from("strategies").select("*").in("id", input.strategyIds)

  if (!strategies || strategies.length === 0) {
    throw new Error("No strategies found")
  }

  // Check if user has access to pro strategies
  const hasProStrategy = strategies.some((s) => s.tier === "pro")
  if (hasProStrategy && user.tier !== "pro") {
    throw new Error("Upgrade to Pro to use premium strategies")
  }

  const recipientText = input.recipientName ? `to ${input.recipientName}` : ""
  const strategyDescriptions = strategies.map((s) => `- ${s.name}: ${s.prompt}`).join("\n")

  const lengthGuide =
    input.emailLength === "Short" ? "~100 words" : input.emailLength === "Medium" ? "~150 words" : "~200 words"

  const personalizationGuide =
    input.personalization === "Low"
      ? "Keep personalization minimal, focus on the core message"
      : input.personalization === "Medium"
        ? "Use moderate personalization with recipient details where available"
        : "Heavily personalize using all available recipient information and context"

  const prompt = `You are an expert cold email copywriter specializing in ${input.category} outreach. Generate a persuasive cold email about "${input.subject}" ${recipientText}.

**Tone:** ${input.tone}
**Length:** ${lengthGuide}
**Goal:** ${input.goal}
**Personalization:** ${personalizationGuide}

Combine and blend the following strategies into one cohesive, compelling email:

${strategyDescriptions}

Requirements:
- Adopt a ${input.tone.toLowerCase()} tone throughout
- Keep the email to approximately ${lengthGuide}
- Primary goal is to: ${input.goal.toLowerCase()}
- ${personalizationGuide}
- Make it conversational and engaging
- Focus on value and benefits for the recipient
- Include a clear call-to-action that aligns with the goal
- Avoid being overly pushy or desperate
- Build credibility and trust
${input.recipientName ? `- Address the recipient as ${input.recipientName}` : "- Use a professional greeting"}
- Do NOT include any signature, sign-off with a name, or contact information at the end
- End with just "Best regards," or similar closing phrase
- Do NOT add placeholders like [Your Name], [Your Company], etc.

Generate ONLY the email body text, no subject line. The sender's signature will be added separately.`

  try {
    // Generate with AI
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.8,
    })

    const finalText = input.sellerSignature ? `${text.trim()}\n\n${input.sellerSignature}` : text.trim()

    const { error: insertError } = await supabase.from("templates").insert({
      user_id: input.userId,
      subject: input.subject,
      category: input.category,
      strategy_ids: input.strategyIds,
      recipient: input.recipientName || null,
      recipient_email: input.recipientEmail || null,
      input_data: input.inputData,
      result_text: finalText,
    })

    if (insertError) {
      errorLog("Failed to save template:", insertError)
    }

    // Increment usage
    await incrementUsage(input.userId)

    return { result: finalText }
  } catch (error) {
    errorLog("AI generation error:", error)
    throw new Error("Failed to generate template. Please try again.")
  }
}
