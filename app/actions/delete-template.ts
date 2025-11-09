"use server"

import { createClient } from "@/lib/supabase/server"

export async function deleteTemplate(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("templates").delete().eq("id", id)

  if (error) {
    throw new Error("Failed to delete template")
  }
}

// Default export
export default deleteTemplate
