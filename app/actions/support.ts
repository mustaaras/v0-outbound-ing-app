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

type ConversationMessage = {
  id: string
  type: 'user' | 'admin'
  message: string
  created_at: string
  support_message_id: string
}

export async function getSupportConversations(): Promise<ConversationMessage[]> {
  const { devLog, errorLog } = await import("@/lib/logger")
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  devLog("[v0] Fetching conversations for user:", user.id)
  devLog("[v0] User email:", user.email)
  devLog("[v0] User object:", JSON.stringify(user, null, 2))

  const supabase = await createClient()

  // Fetch user messages
  const { data: userMessages, error: userError } = await supabase
    .from("support_messages")
    .select("id, message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (userError) {
    errorLog("[v0] Error fetching user messages:", userError)
    throw new Error(userError.message)
  }

  devLog("[v0] User messages found:", userMessages?.length || 0)
  devLog("[v0] User message IDs:", userMessages?.map(m => m.id))

  // Fetch admin replies for user's messages (using join to bypass potential RLS issues)
  const { data: adminReplies, error: adminError } = await supabase
    .from("admin_replies")
    .select(`
      id, 
      message, 
      created_at, 
      support_message_id,
      support_messages!inner(user_id)
    `)
    .eq("support_messages.user_id", user.id)
    .order("created_at", { ascending: true })

  if (adminError) {
    errorLog("[v0] Error fetching admin replies:", adminError)
    errorLog("[v0] Admin error details:", JSON.stringify(adminError, null, 2))
    throw new Error(adminError.message)
  }

  devLog("[v0] Admin replies found:", adminReplies?.length || 0)
  devLog("[v0] Admin replies data:", JSON.stringify(adminReplies, null, 2))

  // Combine and sort all messages chronologically
  const conversations: ConversationMessage[] = []

  // Add user messages
  userMessages?.forEach(msg => {
    conversations.push({
      id: msg.id,
      type: 'user' as const,
      message: msg.message,
      created_at: msg.created_at,
      support_message_id: msg.id
    })
  })

  // Add admin replies
  adminReplies?.forEach(reply => {
    conversations.push({
      id: reply.id,
      type: 'admin' as const,
      message: reply.message,
      created_at: reply.created_at,
      support_message_id: reply.support_message_id
    })
  })

  // Sort by created_at
  conversations.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  devLog("[v0] Final conversations:", conversations)

  return conversations
}
