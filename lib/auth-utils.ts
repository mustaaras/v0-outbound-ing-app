import { errorLog } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@/lib/types"

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
  )
  return Promise.race([promise, timeoutPromise])
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase: any = await createClient()

    const {
      data: { user: authUser },
    } = await withTimeout<any>(supabase.auth.getUser(), 5000)

    if (!authUser) return null

    const { data: user, error } = await withTimeout<any>(
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
    const supabase: any = await createClient()
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

    const { data, error } = await withTimeout<any>(
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
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: existing } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("usage")
      .update({ count: existing.count + 1 })
      .eq("user_id", userId)
      .eq("month", currentMonth)
  } else {
    // Create new usage record
    await supabase.from("usage").insert({ user_id: userId, month: currentMonth, count: 1 })
  }
}

export async function canGenerateTemplate(
  userId: string,
  tier: string,
): Promise<{ canGenerate: boolean; usage: number; limit: number }> {
  // Fallback: treat any legacy 'ultra' tier value as 'pro'
  const effectiveTier = tier === "ultra" ? "pro" : tier
  const usage = await getUserUsage(userId)
  const limit = effectiveTier === "pro" ? 750 : effectiveTier === "light" ? 100 : 25

  return {
    canGenerate: usage < limit,
    usage,
    limit,
  }
}
