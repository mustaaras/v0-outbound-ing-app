"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { errorLog, devLog } from "@/lib/logger"

export async function sendAdminReply(supportMessageId: string, message: string) {
  try {
    // Verify admin access
    const admin = await getCurrentUser()
    if (!admin || admin.email !== "mustafaaras91@gmail.com") {
      throw new Error("Unauthorized: Admin access required")
    }

    if (!message.trim()) {
      throw new Error("Message cannot be empty")
    }

    const supabase = await createClient()

    // Get the original support message to find the user
    const { data: supportMessage, error: fetchError } = await supabase
      .from("support_messages")
      .select(`
        id,
        user_id,
        users!inner(email)
      `)
      .eq("id", supportMessageId)
      .single()

    if (fetchError || !supportMessage) {
      errorLog("[Admin Reply] Failed to fetch support message:", fetchError)
      throw new Error("Support message not found")
    }

    // Insert the admin reply
    const { data: reply, error: insertError } = await supabase
      .from("admin_replies")
      .insert({
        support_message_id: supportMessageId,
        admin_email: admin.email,
        message: message.trim(),
      })
      .select()
      .single()

    if (insertError) {
      errorLog("[Admin Reply] Failed to insert reply:", insertError)
      throw new Error("Failed to save admin reply")
    }

    devLog("[Admin Reply] Admin reply sent successfully:", reply.id)
    return { success: true, reply }

  } catch (error) {
    errorLog("[Admin Reply] Error sending admin reply:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

export async function getUnreadAdminMessagesCount() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { count: 0 }
    }

    const supabase = await createClient()

    // Get all unread admin replies for this user's support messages
    const { data: adminReplies, error } = await supabase
      .from("admin_replies")
      .select(`
        id,
        created_at,
        support_message_id,
        support_messages!inner(user_id)
      `)
      .eq("support_messages.user_id", user.id)
      .is("read_at", null) // Only count unread messages

    if (error) {
      errorLog("[Unread Messages] Failed to fetch admin replies:", error)
      return { count: 0 }
    }

    const count = adminReplies?.length || 0

    return { count }

  } catch (error) {
    errorLog("[Unread Messages] Error:", error)
    return { count: 0 }
  }
}

export async function markAdminMessagesAsRead() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const supabase = await createClient()

    // First get all support message IDs for this user
    const { data: supportMessages, error: fetchError } = await supabase
      .from("support_messages")
      .select("id")
      .eq("user_id", user.id)

    if (fetchError) {
      errorLog("[Mark Read] Failed to fetch support messages:", fetchError)
      throw new Error("Failed to fetch support messages")
    }

    if (!supportMessages || supportMessages.length === 0) {
      // No support messages, nothing to mark as read
      return { success: true }
    }

    const supportMessageIds = supportMessages.map(msg => msg.id)

    // Mark all unread admin replies for this user as read
    const { error } = await supabase
      .from("admin_replies")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .in("support_message_id", supportMessageIds)

    if (error) {
      errorLog("[Mark Read] Failed to mark messages as read:", error)
      throw new Error("Failed to mark messages as read")
    }

    devLog("[Mark Read] Successfully marked admin messages as read for user:", user.id)
    return { success: true }

  } catch (error) {
    errorLog("[Mark Read] Error marking messages as read:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}