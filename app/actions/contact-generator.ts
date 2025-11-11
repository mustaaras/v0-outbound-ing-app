"use server"

import { findContactEmails } from "@/lib/public-email"

export interface ContactGeneratorResult {
  success: boolean
  data: {
    results: Array<{ domain: string; email: string; type: "generic" | "personal"; sourceUrl: string }>
  }
  error?: string
}

export async function generateContacts(keyword: string): Promise<ContactGeneratorResult> {
  try {
    if (!keyword || keyword.length < 2) {
      return {
        success: false,
        data: { results: [] },
        error: "Keyword must be at least 2 characters",
      }
    }

    const results = await findContactEmails({ keyword, maxResults: 5 })

    return {
      success: true,
      data: { results },
    }
  } catch (e) {
    return {
      success: false,
      data: { results: [] },
      error: e instanceof Error ? e.message : "Failed to generate contacts",
    }
  }
}
