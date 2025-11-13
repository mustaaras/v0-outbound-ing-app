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
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  const supabase = await createClient()

  // Fetch user messages
  const { data: userMessages, error: userError } = await supabase
    .from("support_messages")
    .select("id, message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (userError) throw new Error(userError.message)

  // Fetch admin replies for user's messages
  const { data: adminReplies, error: adminError } = await supabase
    .from("admin_replies")
    .select("id, message, created_at, support_message_id")
    .in("support_message_id", userMessages?.map(m => m.id) || [])
    .order("created_at", { ascending: true })

  if (adminError) throw new Error(adminError.message)

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

  return conversations
}
