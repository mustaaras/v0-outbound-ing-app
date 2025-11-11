import { type NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"
import { PRODUCTS } from "@/lib/products"
import { devLog, errorLog } from "@/lib/logger"
import { sendSubscriptionConfirmationEmail, sendSubscriptionCancelledEmail } from "@/lib/email/send"


// Create the admin supabase client lazily inside the handler to avoid
// running this at module-evaluation time during Next's build/data collection.
function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  let stripe: Stripe

  try {
    stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    errorLog("[v0] Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  devLog("[v0] Webhook event received:", event.type)

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        devLog("[v0] Checkout session completed:", {
          mode: session.mode,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata,
        })

        if (session.mode === "subscription") {
          const customerId = session.customer as string
          const subscriptionId = session.subscription as string
          const productId = session.metadata?.productId

          const customer = await stripe.customers.retrieve(customerId)
          const userId = (customer as unknown as { metadata?: Record<string, string> })?.metadata?.userId

          if (!userId) {
            errorLog("[v0] No userId found in customer metadata")
            return NextResponse.json({ error: "No userId found" }, { status: 400 })
          }
          devLog("[v0] Processing subscription for user:", { userId, productId })

          const product = PRODUCTS.find((p) => p.id === productId)
          const tier = product?.tier || "pro"

          devLog("[v0] Updating user to tier:", tier)

          const supabaseAdmin = getSupabaseAdmin()

          const { data, error } = await supabaseAdmin
            .from("users")
            .update({
              tier,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            })
            .eq("id", userId)
            .select()

          if (error) {
            errorLog("[v0] Error updating user in webhook:", error)
          } else {
            devLog("[v0] Successfully updated user in webhook:", data)
            
            // Send subscription confirmation email
            if (data && data[0]) {
              const user = data[0]
              const emailLimit = tier === "pro" ? "Unlimited" : tier === "light" ? "300 emails/month" : "30 emails/month"
              const planPrice = product?.priceLabel || ""
              const billingCycle = product?.billingCycle || "monthly"
              
              try {
                await sendSubscriptionConfirmationEmail(
                  user.email,
                  user.first_name || "there",
                  product?.name || tier.charAt(0).toUpperCase() + tier.slice(1),
                  planPrice,
                  billingCycle,
                  emailLimit
                )
              } catch (emailError) {
                errorLog("[v0] Failed to send subscription confirmation email:", emailError)
                // Don't fail the webhook if email fails
              }
            }
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        devLog("[v0] Subscription updated:", {
          customerId,
          status: subscription.status,
          subscriptionId: subscription.id,
        })

        if (subscription.status !== "active") {
          const supabaseAdmin = getSupabaseAdmin()
          await supabaseAdmin
            .from("users")
            .update({
              tier: "free",
              stripe_subscription_id: subscription.id,
            })
            .eq("stripe_customer_id", customerId)

          devLog("[v0] User downgraded to free tier")
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

  devLog("[v0] Subscription deleted:", { customerId })

        const supabaseAdmin = getSupabaseAdmin()
        await supabaseAdmin
          .from("users")
          .update({
            tier: "free",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId)

  devLog("[v0] User downgraded to free tier after cancellation")
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    errorLog("[v0] Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
