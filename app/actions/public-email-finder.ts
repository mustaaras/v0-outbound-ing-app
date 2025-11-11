"use server"

import { publicEmailFinder } from "@/lib/public-email"
import { errorLog, devLog } from "@/lib/logger"

export interface PublicEmailFinderInput {
  userId: string
  keyword?: string
  domains?: string // comma or newline separated domains
  pagesPerDomain?: number
}

export interface PublicEmailFinderResult {
  success: boolean
  data: {
    total: number
    results: Array<{ domain: string; email: string; type: "generic" | "personal"; sourceUrl: string }>
  }
  error?: string
}

export async function findPublicEmails(input: PublicEmailFinderInput): Promise<PublicEmailFinderResult> {
  try {
    const rawDomains = (input.domains || "")
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)

    if (!input.keyword && rawDomains.length === 0) {
      return { success: false, data: { total: 0, results: [] }, error: "Provide a keyword or at least one domain" }
    }

    const { results } = await publicEmailFinder({
      keyword: input.keyword,
      domains: rawDomains,
      pagesPerDomain: input.pagesPerDomain ?? 8,
    })

    devLog("[public-email] found", results.length, "emails")

    return { success: true, data: { total: results.length, results } }
  } catch (e) {
    errorLog("[public-email] error", e)
    return { success: false, data: { total: 0, results: [] }, error: "Failed to find public emails" }
  }
}
