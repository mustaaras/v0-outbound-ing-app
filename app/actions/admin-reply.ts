"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { sendAdminReplyEmail } from "@/lib/email/send"
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

    // Send email notification to user
    try {
      await sendAdminReplyEmail((supportMessage as any).users.email, message.trim())
      devLog("[Admin Reply] Email sent successfully to:", (supportMessage as any).users.email)
    } catch (emailError) {
      errorLog("[Admin Reply] Failed to send email notification:", emailError)
      // Don't fail the whole operation if email fails
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