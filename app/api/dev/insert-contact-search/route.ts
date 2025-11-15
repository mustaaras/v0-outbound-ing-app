"use server"

import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import { devLog } from "@/lib/logger"

// Dev-only route: insert a sample contact_search_history row for the current user
// This is intended for local testing only and should NOT be used in production.
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("contact_search_history").insert({
      user_id: user.id,
      search_query: "dev-insert",
      search_type: "dev",
      results_count: 1,
    })

    if (error) {
      devLog("[dev] Failed to insert contact_search_history:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    devLog("[dev] insert-contact-search error:", err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
