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

export async function unarchiveBuyer(buyerId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("saved_buyers")
      .update({ archived: false, archived_at: null })
      .eq("id", buyerId)
      .eq("user_id", userId)

    if (error) {
      errorLog("[v0] unarchiveBuyer error:", error)
      return { success: false, error: "Failed to unarchive contact" }
    }

    devLog("[v0] Buyer unarchived:", buyerId)
    return { success: true }
  } catch (err) {
    errorLog("[v0] unarchiveBuyer exception:", err)
    return { success: false, error: "Failed to unarchive contact" }
  }
}

export async function bulkArchiveBuyers(ids: string[], userId: string): Promise<{ success: boolean; count: number; error?: string }> {
  if (!ids || ids.length === 0) return { success: true, count: 0 }
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("saved_buyers")
      .update({ archived: true, archived_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId)

    if (error) {
      errorLog("[v0] bulkArchiveBuyers error:", error)
      return { success: false, count: 0, error: "Failed to archive selected contacts" }
    }
    devLog("[v0] bulk archived count:", ids.length)
    return { success: true, count: ids.length }
  } catch (err) {
    errorLog("[v0] bulkArchiveBuyers exception:", err)
    return { success: false, count: 0, error: "Failed to archive selected contacts" }
  }
}

export async function bulkDeleteBuyers(ids: string[], userId: string): Promise<{ success: boolean; count: number; error?: string }> {
  if (!ids || ids.length === 0) return { success: true, count: 0 }
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("saved_buyers")
      .delete()
      .in("id", ids)
      .eq("user_id", userId)

    if (error) {
      errorLog("[v0] bulkDeleteBuyers error:", error)
      return { success: false, count: 0, error: "Failed to delete selected contacts" }
    }
    devLog("[v0] bulk deleted count:", ids.length)
    return { success: true, count: ids.length }
  } catch (err) {
    errorLog("[v0] bulkDeleteBuyers exception:", err)
    return { success: false, count: 0, error: "Failed to delete selected contacts" }
  }
}
