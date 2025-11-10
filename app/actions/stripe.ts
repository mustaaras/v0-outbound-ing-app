"use server"

import { getStripe } from "@/lib/stripe"
import { PRODUCTS } from "@/lib/products"
import { getCurrentUser } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import { errorLog } from "@/lib/logger"

export async function startCheckoutSession(productId: string) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Create or get Stripe customer
  let customerId = user.stripe_customer_id
  const stripe = getStripe()

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id,
      },
    })
    customerId = customer.id

    // Update user with customer ID
    const supabase = await createClient()
    await supabase.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    ui_mode: "embedded",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: {
      productId: product.id,
    },
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/upgrade/success?session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`,
  })

  return session.client_secret!
}

export async function createPortalSession() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  if (!user.stripe_customer_id) {
    throw new Error("You don't have an active subscription yet. Please upgrade to a paid plan first.")
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/upgrade`,
  })

  return session.url
}

export async function cancelSubscription() {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  if (!user.stripe_customer_id) {
    return { success: false, error: "No active subscription found" }
  }

  try {
    // Get all active subscriptions for the customer
    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "active",
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return { success: false, error: "No active subscription found" }
    }

    // Cancel the subscription at period end (so user keeps access until billing cycle ends)
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    })

    return { success: true }
  } catch (error) {
      errorLog("Failed to cancel subscription:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to cancel subscription" }
  }
}
