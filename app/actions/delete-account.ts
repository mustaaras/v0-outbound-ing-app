"use server"

import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { errorLog, devLog } from "@/lib/logger"
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

    // Delete auth user (this is the final step)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      errorLog("[v0] Error deleting auth user:", authDeleteError)
      return {
        success: false,
        error: "Failed to delete authentication account",
      }
    }

    devLog("[v0] Successfully deleted account for:", user.email)

    // Sign out the user
    await supabase.auth.signOut()

    return {
      success: true,
    }
  } catch (error) {
    errorLog("[v0] Account deletion error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account",
    }
  }
}

