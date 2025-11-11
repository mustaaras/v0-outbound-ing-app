"use server"

import { createClient } from "@/lib/supabase/server"
import { errorLog, devLog } from "@/lib/logger"

export async function deleteBuyer(buyerId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("saved_buyers")
      .delete()
      .eq("id", buyerId)
      .eq("user_id", userId)

    if (error) {
      errorLog("[v0] deleteBuyer error:", error)
      return { success: false, error: "Failed to delete contact" }
    }

    devLog("[v0] Buyer deleted:", buyerId)
    return { success: true }
  } catch (err) {
    errorLog("[v0] deleteBuyer exception:", err)
    return { success: false, error: "Failed to delete contact" }
  }
}

export async function archiveBuyer(buyerId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("saved_buyers")
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq("id", buyerId)
      .eq("user_id", userId)

    if (error) {
      errorLog("[v0] archiveBuyer error:", error)
      return { success: false, error: "Failed to archive contact" }
    }

    devLog("[v0] Buyer archived:", buyerId)
    return { success: true }
  } catch (err) {
    errorLog("[v0] archiveBuyer exception:", err)
    return { success: false, error: "Failed to archive contact" }
  }
}
