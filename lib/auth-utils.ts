import { errorLog } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@/lib/types"
import { sendUsageWarningEmail } from "@/lib/email/send"
import { getCurrentMonth } from "@/lib/utils/date"
import { getEmailLimit, normalizeTier, getSavedContactsLimit, getLocationSearchLimit } from "@/lib/utils/tier"

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
  )
  return Promise.race([promise, timeoutPromise])
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user: authUser },
      error: authError,
    } = await withTimeout(supabase.auth.getUser(), 5000)

    if (authError) {
      errorLog("[v0] Error getting auth user:", authError)
      return null
    }

    if (!authUser) return null

    const { data: user, error } = await withTimeout(
      supabase.from("users").select("*").eq("id", authUser.id).single(),
      5000,
    )

    if (error) {
      errorLog("[v0] Error fetching user:", error)
      return null
    }

    return user
  } catch (error) {
    errorLog("[v0] getCurrentUser error:", error)
    return null
  }
}

export async function getUserUsage(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const currentMonth = getCurrentMonth()

    const { data, error } = await withTimeout(
      supabase.from("usage").select("count").eq("user_id", userId).eq("month", currentMonth).maybeSingle(),
      5000,
    )

    if (error) {
      errorLog("[v0] Error fetching usage:", error)
      return 0
    }

    if (!data) return 0
    return data.count
  } catch (error) {
    errorLog("[v0] getUserUsage error:", error)
    return 0
  }
}

export async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  const currentMonth = getCurrentMonth()

  const { data: existing } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle()

  const newCount = existing ? existing.count + 1 : 1

  if (existing) {
    await supabase
      .from("usage")
      .update({ count: newCount })
      .eq("user_id", userId)
      .eq("month", currentMonth)
  } else {
    // Create new usage record
    await supabase.from("usage").insert({ user_id: userId, month: currentMonth, count: newCount })
  }

  // Check if we should send usage warning email
  const { data: user } = await supabase
    .from("users")
    .select("email, first_name, tier")
    .eq("id", userId)
    .single()

  if (user) {
    const effectiveTier = normalizeTier(user.tier)
    const limit = getEmailLimit(effectiveTier)
    const percentage = Math.round((newCount / limit) * 100)

    // Only send warnings for paid tiers (light and pro), not free
    if (effectiveTier === "light") {
      // Send warning at 80%
      if (newCount === Math.floor(limit * 0.8)) {
        await sendUsageWarningEmail(
          user.email,
          user.first_name,
          newCount,
          limit,
          percentage,
          effectiveTier
        ).catch(error => errorLog("[Email] Failed to send 80% usage warning:", error))
      }
      
      // Send warning at 100%
      if (newCount === limit) {
        await sendUsageWarningEmail(
          user.email,
          user.first_name,
          newCount,
          limit,
          100,
          effectiveTier
        ).catch(error => errorLog("[Email] Failed to send 100% usage warning:", error))
      }
    }
  }
}

export async function canGenerateTemplate(
  userId: string,
  tier: string,
): Promise<{ canGenerate: boolean; usage: number; limit: number }> {
  const effectiveTier = normalizeTier(tier)
  const usage = await getUserUsage(userId)
  const limit = getEmailLimit(effectiveTier)

  return {
    canGenerate: usage < limit,
    usage,
    limit,
  }
}

export async function canSaveContact(
  userId: string,
  tier: string,
): Promise<{ canSave: boolean; currentCount: number; limit: number }> {
  try {
    const supabase = await createClient()

    // Count total saved contacts (active + archived)
    const { count, error } = await withTimeout(
      supabase
        .from("saved_buyers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      5000,
    )

    if (error) {
      errorLog("[v0] Error counting saved contacts:", error)
      return { canSave: false, currentCount: 0, limit: 0 }
    }

    const effectiveTier = normalizeTier(tier)
    const limit = getSavedContactsLimit(effectiveTier)
    const currentCount = count || 0

    return {
      canSave: currentCount < limit,
      currentCount,
      limit,
    }
  } catch (error) {
    errorLog("[v0] canSaveContact error:", error)
    return { canSave: false, currentCount: 0, limit: 0 }
  }
}

export async function getUserLocationSearches(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const currentMonth = getCurrentMonth()

    const { data, error } = await withTimeout(
      supabase.from("location_searches").select("search_count").eq("user_id", userId).eq("month", currentMonth).maybeSingle(),
      5000,
    )

    if (error) {
      errorLog("[v0] Error fetching location searches:", error)
      return 0
    }

    if (!data) return 0
    return data.search_count
  } catch (error) {
    errorLog("[v0] getUserLocationSearches error:", error)
    return 0
  }
}

export async function incrementLocationSearchCount(userId: string): Promise<void> {
  const supabase = await createClient()
  const currentMonth = getCurrentMonth()

  const { data: existing } = await supabase
    .from("location_searches")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle()

  const newCount = existing ? existing.search_count + 1 : 1

  if (existing) {
    await supabase
      .from("location_searches")
      .update({ search_count: newCount })
      .eq("user_id", userId)
      .eq("month", currentMonth)
  } else {
    // Create new location search record
    await supabase.from("location_searches").insert({ user_id: userId, month: currentMonth, search_count: newCount })
  }
}

export async function canPerformLocationSearch(
  userId: string,
  tier: string,
): Promise<{ canSearch: boolean; searches: number; limit: number }> {
  const effectiveTier = normalizeTier(tier)
  const searches = await getUserLocationSearches(userId)
  const limit = getLocationSearchLimit(effectiveTier)

  return {
    canSearch: searches < limit,
    searches,
    limit,
  }
}
