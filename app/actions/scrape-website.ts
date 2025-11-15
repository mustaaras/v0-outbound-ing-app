"use server"

import { GoogleMapsUtils } from "@/lib/google-maps"
import { devLog, errorLog } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export async function scrapeWebsiteAction(website: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Require authenticated user but do NOT increment location search count here.
    if (!user) {
      return { success: false, error: 'Not authenticated', emails: [] }
    }

    if (!website) {
      return { success: false, error: 'No website provided', emails: [] }
    }

    devLog(`[v0] Scraping website on-demand: ${website}`)
    const result = await GoogleMapsUtils.scrapeWebsiteForContacts(website)

    return {
      success: result.success,
      emails: result.emails,
      error: result.success ? undefined : result.error,
      website,
    }
  } catch (error) {
    errorLog('[v0] scrapeWebsiteAction failed:', error)
    return { success: false, error: 'Unexpected error', emails: [] }
  }
}
