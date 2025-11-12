"use server"

import { publicEmailFinder } from "@/lib/public-email"
import { errorLog, devLog } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"
import { PUBLIC_EMAIL_SEARCH_LIMITS } from "@/lib/types"

export interface PublicEmailFinderInput {
  userId: string
  userTier: string
  keyword?: string
  domains?: string // comma or newline separated domains
  pagesPerDomain?: number
  perDomainCap?: number
  totalCap?: number
}

export interface PublicEmailFinderResult {
  success: boolean
  data: {
    total: number
    results: Array<{ domain: string; email: string; type: "generic" | "personal"; sourceUrl: string }>
    searchesRemaining: number
  }
  error?: string
}

export async function getPublicEmailSearchCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const currentMonth = new Date().toISOString().slice(0, 7)

    const { data, error } = await supabase
      .from("public_email_searches")
      .select("search_count")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .maybeSingle()

    if (error) {
      errorLog("[public-email] Error fetching search count:", error)
      return 0
    }

    return data?.search_count || 0
  } catch (e) {
    errorLog("[public-email] Exception fetching search count:", e)
    return 0
  }
}

export async function findPublicEmails(input: PublicEmailFinderInput): Promise<PublicEmailFinderResult> {
  try {
    const rawDomains = (input.domains || "")
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)

    if (!input.keyword && rawDomains.length === 0) {
      return { success: false, data: { total: 0, results: [], searchesRemaining: 0 }, error: "Provide a keyword or at least one domain" }
    }

    // Check usage limits
    const searchLimit = PUBLIC_EMAIL_SEARCH_LIMITS[input.userTier as keyof typeof PUBLIC_EMAIL_SEARCH_LIMITS] || 30
    const searchesUsed = await getPublicEmailSearchCount(input.userId)
    const searchesRemaining = Math.max(0, searchLimit - searchesUsed)

    if (searchesUsed >= searchLimit) {
      return {
        success: false,
        data: { total: 0, results: [], searchesRemaining: 0 },
        error: `You've reached your monthly limit of ${searchLimit} public email searches. Upgrade for unlimited searches.`,
      }
    }

    const { results } = await publicEmailFinder({
      keyword: input.keyword,
      domains: rawDomains,
      pagesPerDomain: input.pagesPerDomain ?? 12,
      perDomainCap: input.perDomainCap ?? 5,
      totalCap: input.totalCap ?? 50,
    })

    devLog("[public-email] found", results.length, "emails")

    // Increment search count
    const supabase = await createClient()
    const currentMonth = new Date().toISOString().slice(0, 7)

    const { error: upsertError } = await supabase
      .from("public_email_searches")
      .upsert(
        {
          user_id: input.userId,
          month: currentMonth,
          search_count: searchesUsed + 1,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,month",
        }
      )

    if (upsertError) {
      errorLog("[public-email] Error updating search count:", upsertError)
    }

    const newRemaining = Math.max(0, searchLimit - (searchesUsed + 1))

    return { success: true, data: { total: results.length, results, searchesRemaining: newRemaining } }
  } catch (e) {
    errorLog("[public-email] error", e)
    return { success: false, data: { total: 0, results: [], searchesRemaining: 0 }, error: "Failed to find public emails" }
  }
}
