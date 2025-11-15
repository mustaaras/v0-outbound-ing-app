"use server"

import { createClient } from "@/lib/supabase/server"
import { getSnovClient, type SnovBuyer } from "@/lib/snov"
import { errorLog, devLog } from "@/lib/logger"
// import { SNOV_SEARCH_LIMITS } from "@/lib/types"

interface SearchBuyersInput {
  userId: string
  userTier: string
  mode?: "domain" | "keyword"
  domain?: string
  keyword?: string
  title?: string
  requestedCount?: number
}

interface SearchBuyersResult {
  success: boolean
  data: {
    total: number
    results: SnovBuyer[]
    searchesUsed: number
    searchLimit: number
    searchesRemaining: number
  }
  error?: string
}

/**
 * Get current month's search count for a user
 */
export async function getUserSearchCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

    const { data, error } = await supabase
      .from("snov_searches")
      .select("search_count")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .maybeSingle()

    if (error) {
      errorLog("[v0] Error fetching search count:", error)
      return 0
    }

    return data?.search_count || 0
  } catch (error) {
    errorLog("[v0] Error in getUserSearchCount:", error)
    return 0
  }
}

/**
 * Increment search count for the current month
 */
async function incrementSearchCount(userId: string): Promise<void> {
  const supabase = await createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: existing } = await supabase
    .from("snov_searches")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("snov_searches")
      .update({ search_count: existing.search_count + 1 })
      .eq("user_id", userId)
      .eq("month", currentMonth)
  } else {
    await supabase.from("snov_searches").insert({
      user_id: userId,
      month: currentMonth,
      search_count: 1,
    })
  }
}

async function incrementSearchCountBy(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return
  const supabase = await createClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: existing } = await supabase
    .from("snov_searches")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("snov_searches")
      .update({ search_count: existing.search_count + amount })
      .eq("user_id", userId)
      .eq("month", currentMonth)
  } else {
    await supabase.from("snov_searches").insert({
      user_id: userId,
      month: currentMonth,
      search_count: amount,
    })
  }
}

/**
 * Check if user can perform a search
 */
export async function canPerformSearch(
  userId: string,
  userTier: string,
): Promise<{ canSearch: boolean; searchesUsed: number; searchLimit: number; searchesRemaining: number }> {
  // const searchLimit = SNOV_SEARCH_LIMITS[userTier as keyof typeof SNOV_SEARCH_LIMITS] || 0
  const searchLimit = 0 // This feature is deprecated
  const searchesUsed = await getUserSearchCount(userId)
  const searchesRemaining = Math.max(0, searchLimit - searchesUsed)

  return {
    canSearch: searchesRemaining > 0,
    searchesUsed,
    searchLimit,
    searchesRemaining,
  }
}

/**
 * Search for buyers using Snov.io API
 */
export async function searchBuyers(input: SearchBuyersInput): Promise<SearchBuyersResult> {
  devLog("[v0] searchBuyers called:", { userId: input.userId, tier: input.userTier })

  const SNOV_ENABLED = process.env.SNOV_ENABLED === "true"
  if (!SNOV_ENABLED) {
    devLog('[v0] searchBuyers aborted: SNOV integration disabled via environment')
    return {
      success: false,
      data: {
        total: 0,
        results: [],
        searchesUsed: 0,
        searchLimit: 0,
        searchesRemaining: 0,
      },
      error: 'Contact search (Snov) is disabled in this deployment.',
    }
  }

  // Disallow Free tier; Light and above are eligible
  if (input.userTier === "free") {
    return {
      success: false,
      data: {
        total: 0,
        results: [],
        searchesUsed: 0,
        searchLimit: 0,
        searchesRemaining: 0,
      },
      error: "Search Buyers is unavailable on the Free plan. Upgrade to Light, Pro, or Ultra to continue.",
    }
  }

  // Check search limits
  const { canSearch, searchesUsed, searchLimit, searchesRemaining } = await canPerformSearch(
    input.userId,
    input.userTier,
  )

  if (!canSearch) {
    return {
      success: false,
      data: {
        total: 0,
        results: [],
        searchesUsed,
        searchLimit,
        searchesRemaining: 0,
      },
      error: `You've reached your monthly search limit of ${searchLimit}. Please upgrade or wait until next month.`,
    }
  }

  try {
    const supabase = await createClient()

    // Get Snov client and search
    const snovClient = getSnovClient()
    // Determine how many results to request from Snov (cap by searchesRemaining)
    const requested = input.requestedCount && input.requestedCount > 0 ? input.requestedCount : 1
    const toRequest = Math.min(requested, searchesRemaining, 50) // cap absolute request to 50

    const searchResponse = await snovClient.searchBuyers({
      mode: input.mode,
      domain: input.domain,
      keyword: input.keyword,
      title: input.title,
      limit: toRequest,
      page: 1,
    })

    if (!searchResponse.success) {
      return {
        success: false,
        data: {
          total: 0,
          results: [],
          searchesUsed,
          searchLimit,
          searchesRemaining,
        },
        error: searchResponse.error || "Failed to search prospects",
      }
    }

    // Filter to email-only results, as requested
    const emailResults = (searchResponse.data.results || []).filter((r) => r.email && r.email.trim() !== "")

    // Charge only for successful results returned with an email (cap by remaining)
    const resultsCount = emailResults.length
    const chargeAmount = Math.min(resultsCount, searchesRemaining)

    if (chargeAmount > 0) {
      await incrementSearchCountBy(input.userId, chargeAmount)
    }

    // Log search into contact_search_history for dashboard aggregation and audit
    try {
      const queryText = input.domain || input.keyword || input.title || (input.mode ?? "")
      await supabase.from("contact_search_history").insert({
        user_id: input.userId,
        search_query: queryText,
        search_type: input.mode || "domain",
        results_count: chargeAmount,
      })
    } catch (err) {
      // Non-fatal: log and continue. Dashboard aggregation will simply miss these entries if insert fails.
      devLog("[v0] Failed to log contact_search_history:", err)
    }

    const newSearchesUsed = searchesUsed + chargeAmount
    const newSearchesRemaining = Math.max(0, searchLimit - newSearchesUsed)

    devLog("[v0] Search completed successfully:", {
      total: searchResponse.data.total,
      results: searchResponse.data.results.length,
      newSearchesUsed,
      newSearchesRemaining,
    })

    return {
      success: true,
      data: {
        total: searchResponse.data.total,
        results: emailResults,
        searchesUsed: newSearchesUsed,
        searchLimit,
        searchesRemaining: newSearchesRemaining,
      },
    }
  } catch (error) {
    errorLog("[v0] Search error:", error)
    return {
      success: false,
      data: {
        total: 0,
        results: [],
        searchesUsed,
        searchLimit,
        searchesRemaining,
      },
      error: error instanceof Error ? error.message : "Failed to search prospects",
    }
  }
}
