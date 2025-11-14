"use server"

import { createClient } from "@/lib/supabase/server"

export async function getTemplatesAction(options?: {
  limit?: number
  offset?: number
  search?: string
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated", templates: [], total: 0 }
    }

    let query = supabase
      .from("templates")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (options?.search) {
      query = query.or(`subject.ilike.%${options.search}%,recipient.ilike.%${options.search}%,result_text.ilike.%${options.search}%,category.ilike.%${options.search}%`)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data: templates, error, count } = await query

    if (error) {
      console.error("Error fetching templates:", error)
      return { success: false, error: "Failed to fetch templates", templates: [], total: 0 }
    }

    return { success: true, templates: templates || [], total: count || 0 }
  } catch (error) {
    console.error("Error in getTemplatesAction:", error)
    return { success: false, error: "An unexpected error occurred", templates: [], total: 0 }
  }
}