"use server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-utils"

export async function submitSupportMessage({ message }: { message: string }) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const supabase = await createClient()
  const { error } = await supabase.from("support_messages").insert({ user_id: user.id, message })
  if (error) throw new Error(error.message)
  return { success: true }
}
