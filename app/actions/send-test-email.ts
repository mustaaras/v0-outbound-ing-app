"use server"

import { createClient } from "@/lib/supabase/server"
import { sendWelcomeEmail } from "@/lib/email/send"
import { errorLog } from "@/lib/logger"

export async function sendTestEmail() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const email = user.email!
    const firstName = (user.user_metadata?.first_name as string) || email.split("@")[0]

    const result = await sendWelcomeEmail(email, firstName)
    return result
  } catch (error) {
    errorLog("[Email] sendTestEmail error:", error)
    return { success: false, error: "Failed to send test email" }
  }
}
