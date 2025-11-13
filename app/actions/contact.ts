"use server"
import { createClient } from "@/lib/supabase/server"

export async function submitContactMessage({ name, email, message }: { name: string; email: string; message: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from("contact_messages").insert({ name, email, message })
  if (error) throw new Error(error.message)
  return { success: true }
}
