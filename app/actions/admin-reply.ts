"use server"

import { createServiceClient } from "@/lib/supabase/server"
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

    const serviceSupabase = createServiceClient()

    // Get the original support message to find the user
    const { data: supportMessage, error: fetchError } = await serviceSupabase
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
    const { data: reply, error: insertError } = await serviceSupabase
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

    const supabase = await createServiceClient()

    // Get all admin replies for this user's support messages
    const { data: adminReplies, error } = await supabase
      .from("admin_replies")
      .select(`
        id,
        created_at,
        support_message_id,
        support_messages!inner(user_id)
      `)
      .eq("support_messages.user_id", user.id)

    if (error) {
      errorLog("[Unread Messages] Failed to fetch admin replies:", error)
      return { count: 0 }
    }

    // For now, we'll consider all admin replies as "unread" since we don't have a read status
    // In a future enhancement, we could add a read_at timestamp
    const count = adminReplies?.length || 0

    return { count }

  } catch (error) {
    errorLog("[Unread Messages] Error:", error)
    return { count: 0 }
  }
}