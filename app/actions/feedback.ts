"use server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-utils"

export async function submitFeedback({ rating, comment }: { rating: string; comment?: string }) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const supabase = await createClient()
  const { error } = await supabase.from("feedback").insert({ user_id: user.id, rating, comment })
  if (error) throw new Error(error.message)
  return { success: true }
}
