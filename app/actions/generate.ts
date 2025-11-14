"use server"

import { createClient } from "@/lib/supabase/server"
import { canGenerateTemplate, incrementUsage } from "@/lib/auth-utils"
import { generateText } from "ai"
import { errorLog } from "@/lib/logger"
import { rateLimiters } from "@/lib/rate-limit"

interface GenerateTemplateInput {
  subject: string
  category: string
  recipientName?: string
  recipientEmail?: string
  recipientTitle?: string
  recipientCompany?: string
  sellerSignature?: string
  strategyIds: string[]
  userId: string
  inputData: Record<string, string>
  tone: string
  emailLength: string
  goal: string
  language: string
  generateVariants?: boolean
  generateMultiChannel?: boolean
  additionalNotes?: string
}

export async function generateTemplate(input: GenerateTemplateInput) {
  // Rate limiting check - AI generation is expensive
  const rateLimitResult = rateLimiters.aiGeneration.check(input.userId)
  if (!rateLimitResult.allowed) {
    throw new Error(`Rate limit exceeded. You can generate ${rateLimiters.aiGeneration.maxRequests} emails per minute. Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`)
  }

  const supabase = await createClient()

  // Get user tier
  const { data: user } = await supabase.from("users").select("tier").eq("id", input.userId).single()

  if (!user) {
    throw new Error("User not found")
  }

  // Check if user can generate
  const { canGenerate } = await canGenerateTemplate(input.userId, user.tier)
  if (!canGenerate) {
    throw new Error("Monthly usage limit reached. Upgrade to Pro for unlimited emails.")
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
  input.emailLength === "Short" ? "2-3 sentences" : input.emailLength === "Medium" ? "4-6 sentences" : "a full paragraph (7-10 sentences)"

  const languageInstruction = input.language !== "English" ? `\n**IMPORTANT: Write the entire email in ${input.language}. All content must be in ${input.language}.**\n` : ""

  const prompt = `You are an expert cold email copywriter specializing in ${input.category} outreach. Generate a persuasive cold email about "${input.subject}" ${recipientText}.
${languageInstruction}
**Tone:** ${input.tone}
**Length:** ${lengthGuide}
**Goal:** ${input.goal}

Combine and blend the following strategies into one cohesive, compelling email:

${strategyDescriptions}
${input.additionalNotes ? `\n**Additional Instructions from User:**\n${input.additionalNotes}\n` : ""}
Requirements:
- Adopt a ${input.tone.toLowerCase()} tone throughout
- Keep the email to approximately ${lengthGuide}
- Primary goal is to: ${input.goal.toLowerCase()}
- Make it conversational and engaging
- Focus on value and benefits for the recipient
- Include a clear call-to-action that aligns with the goal
- Avoid being overly pushy or desperate
- Build credibility and trust
${input.recipientName ? `- Address the recipient as ${input.recipientName}` : "- Use a professional greeting"}
- Do NOT include any signature, sign-off with a name, or contact information at the end
- End with just "Best regards," or similar closing phrase
- Do NOT add placeholders like [Your Name], [Your Company], etc.
${input.language !== "English" ? `- Write EVERYTHING in ${input.language}, including greetings, body, and closing` : ""}

Generate ONLY the email body text, no subject line. The sender's signature will be added separately.`

  try {
    // Check for premium features
    const isPro = user.tier === "pro" || user.tier === "ultra"
    const isUltra = user.tier === "ultra"
    
    if (input.generateVariants && !isPro) {
      throw new Error("A/B Test Variants require Pro tier or higher")
    }
    
    if (input.generateMultiChannel && !isUltra) {
      throw new Error("Multi-Channel Variants require Ultra tier")
    }

    // Generate A/B Test Variants (Pro+)
    if (input.generateVariants && isPro) {
      const variantPrompts = [
        { label: "Variant A: Original", modifier: "" },
        { label: "Variant B: Direct CTA", modifier: "Make the call-to-action more direct and specific. Use action-oriented language." },
        { label: "Variant C: Soft Approach", modifier: "Use a softer, more consultative tone. Focus on asking questions rather than making statements." },
      ]

      const variants = await Promise.all(
        variantPrompts.map(async ({ label, modifier }) => {
          const variantPrompt = modifier ? `${prompt}\n\nADDITIONAL INSTRUCTION: ${modifier}` : prompt
          const { text } = await generateText({
            model: "openai/gpt-4o-mini",
            prompt: variantPrompt,
            temperature: 0.8,
          })
          const finalText = input.sellerSignature ? `${text.trim()}\n\n${input.sellerSignature}` : text.trim()
          return { label, content: finalText }
        })
      )

      // Save first variant to database
      const { error: insertError } = await supabase.from("templates").insert({
        user_id: input.userId,
        subject: input.subject,
        category: input.category,
        strategy_ids: input.strategyIds,
        recipient: input.recipientName || null,
        recipient_email: input.recipientEmail || null,
        input_data: input.inputData,
        result_text: variants[0].content,
      })

      if (insertError) {
        errorLog("Failed to save template:", insertError)
      }

      await incrementUsage(input.userId)
      return { result: variants[0].content, variants }
    }

    // Generate Multi-Channel Variants (Ultra)
    if (input.generateMultiChannel && isUltra) {
      const channels = [
        {
          name: "email",
          label: "Email",
          prompt: prompt,
        },
        {
          name: "linkedin",
          label: "LinkedIn Message",
          prompt: `${prompt}\n\nADDITIONAL CONSTRAINTS: Keep to 500 characters max. LinkedIn InMail style - professional but conversational. No signature needed.`,
        },
        {
          name: "linkedin_request",
          label: "LinkedIn Connection Request",
          prompt: `Generate a LinkedIn connection request message about "${input.subject}" ${recipientText}. STRICT LIMIT: 300 characters max. Be concise, mention mutual benefit, no fluff.`,
        },
        {
          name: "twitter",
          label: "Twitter/X DM",
          prompt: `Generate a Twitter/X direct message about "${input.subject}" ${recipientText}. STRICT LIMIT: 280 characters. Casual, friendly tone. Use emojis sparingly if appropriate.`,
        },
        {
          name: "sms",
          label: "SMS",
          prompt: `Generate an SMS text message about "${input.subject}" ${recipientText}. STRICT LIMIT: 160 characters. Ultra-concise, clear CTA, friendly tone.`,
        },
        {
          name: "voicemail",
          label: "Cold Call Voicemail Script",
          prompt: `Generate a 30-second voicemail script about "${input.subject}" ${recipientText}. Conversational, spoken language. Include: greeting, reason for call, value prop, callback request. Write it as a script to be read aloud.`,
        },
      ]

      const multiChannelResults: Record<string, string> = {}
      
      for (const channel of channels) {
        const { text } = await generateText({
          model: "openai/gpt-4o-mini",
          prompt: channel.prompt,
          temperature: 0.8,
        })
        
        const finalText = channel.name === "email" && input.sellerSignature 
          ? `${text.trim()}\n\n${input.sellerSignature}` 
          : text.trim()
        
        multiChannelResults[channel.name] = finalText
      }

      // Save email version to database
      const { error: insertError } = await supabase.from("templates").insert({
        user_id: input.userId,
        subject: input.subject,
        category: input.category,
        strategy_ids: input.strategyIds,
        recipient: input.recipientName || null,
        recipient_email: input.recipientEmail || null,
        input_data: input.inputData,
        result_text: multiChannelResults.email,
      })

      if (insertError) {
        errorLog("Failed to save template:", insertError)
      }

      await incrementUsage(input.userId)
      return { result: multiChannelResults.email, multiChannelResults }
    }

    // Standard single email generation
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

    throw new Error("Failed to generate email. Please try again.")
  }
}
