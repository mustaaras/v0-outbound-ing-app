"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { errorLog, devLog } from "@/lib/logger"
import { sendAccountDeletionEmail } from "@/lib/email/send"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

interface DeleteAccountResult {
  success: boolean
  error?: string
}

/**
 * Delete user account completely
 * - Cancels active Stripe subscription
 * - Deletes all user data (templates, usage, searches, saved buyers)
 * - Deletes auth user (triggers cascade delete via foreign key)
 */
export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  try {
    const supabase = await createClient()

    // Verify the requesting user matches the account to delete
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser || authUser.id !== userId) {
      return {
        success: false,
        error: "Unauthorized: Cannot delete another user's account",
      }
    }

    devLog("[v0] Starting account deletion for user:", userId)

    // Get user's Stripe subscription info
    const { data: user } = await supabase
      .from("users")
      .select("stripe_customer_id, stripe_subscription_id, email")
      .eq("id", userId)
      .single()

    if (!user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    // Cancel Stripe subscription if exists
    if (user.stripe_subscription_id) {
      try {
        const stripe = getStripe()
        await stripe.subscriptions.cancel(user.stripe_subscription_id)
        devLog("[v0] Cancelled Stripe subscription:", user.stripe_subscription_id)
      } catch (stripeError) {
        errorLog("[v0] Error cancelling Stripe subscription:", stripeError)
        // Continue with deletion even if Stripe cancellation fails
      }
    }

    // Delete user record from users table
    // This will cascade delete all related data due to foreign key constraints:
    // - templates
    // - usage
    // - snov_searches
    // - public_email_searches
    // - saved_buyers
    const { error: deleteError } = await supabase.from("users").delete().eq("id", userId)

    if (deleteError) {
      errorLog("[v0] Error deleting user data:", deleteError)
      return {
        success: false,
        error: "Failed to delete user data",
      }
    }

    devLog("[v0] Deleted user data from database")

    // Delete auth user (this is the final step). Use the service role client
    // to optionally revoke refresh tokens (best-effort) and then delete the
    // auth user. Provide a friendly error if the service role key is missing.
    try {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        errorLog("[v0] SUPABASE_SERVICE_ROLE_KEY is not configured; cannot perform admin user deletion")
        return {
          success: false,
          error: "Account deletion is not available in this environment. Missing SUPABASE_SERVICE_ROLE_KEY.",
        }
      }

      // Use a service-role client to perform admin operations
      const serviceSupabase = createServiceClient()

      // Best-effort: revoke any outstanding refresh tokens for the user so
      // client sessions can't be silently refreshed. If the admin API method
      // isn't available in the installed supabase client version, this will
      // simply be a no-op.
      try {
        // Use `any` to call a possibly-available admin helper without causing
        // TypeScript errors if the installed client version doesn't include it.
        const adminAny = (serviceSupabase.auth.admin as any)
        if (adminAny && typeof adminAny.invalidateUserRefreshTokens === "function") {
          await adminAny.invalidateUserRefreshTokens(userId)
          devLog("[v0] Revoked user refresh tokens for:", userId)
        }
      } catch (e) {
        // Log and continue — token revocation is best-effort and should not
        // block account deletion if unsupported or failing.
        errorLog("[v0] Failed to revoke refresh tokens:", e)
      }

      const { error: authDeleteError } = await serviceSupabase.auth.admin.deleteUser(userId)

      if (authDeleteError) {
        errorLog("[v0] Error deleting auth user:", authDeleteError)
        return {
          success: false,
          error: "Failed to delete authentication account",
        }
      }
    } catch (e) {
      errorLog("[v0] Error deleting auth user (service client):", e)
      return {
        success: false,
        error: e instanceof Error ? e.message : "Failed to delete authentication account",
      }
    }

    devLog("[v0] Successfully deleted account for:", user.email)

    // Send a deletion confirmation email (best-effort). We do this after
    // deleting DB records but before signing the browser session out so the
    // email can reference the user's name/email. Failures are logged but do
    // not block the deletion flow.
    try {
      await sendAccountDeletionEmail(user.email, (user as any).first_name)
    } catch (e) {
      errorLog("[v0] Failed to send deletion confirmation email:", e)
    }

    // Sign out the user (clears cookies on the response)
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // Non-fatal — log and continue
      errorLog("[v0] Failed to sign out server client after deletion:", e)
    }

    // Redirect the browser to a post-deletion confirmation page. This will
    // also serve as the final user-visible acknowledgement that deletion
    // completed and sessions were cleared.
    redirect("/account-deleted")
  } catch (error) {
    errorLog("[v0] Account deletion error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account",
    }
  }
}

