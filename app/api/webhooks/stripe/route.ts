import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"
import { PRODUCTS } from "@/lib/products"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("[v0] Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log("[v0] Webhook event received:", event.type)

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        console.log("[v0] Checkout session completed:", {
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
          const userId = (customer as any).metadata?.userId

          if (!userId) {
            console.error("[v0] No userId found in customer metadata")
            return NextResponse.json({ error: "No userId found" }, { status: 400 })
          }

          console.log("[v0] Processing subscription for user:", { userId, productId })

          const product = PRODUCTS.find((p) => p.id === productId)
          const tier = product?.tier || "pro"

          console.log("[v0] Updating user to tier:", tier)

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
            console.error("[v0] Error updating user in webhook:", error)
          } else {
            console.log("[v0] Successfully updated user in webhook:", data)
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log("[v0] Subscription updated:", {
          customerId,
          status: subscription.status,
          subscriptionId: subscription.id,
        })

        if (subscription.status !== "active") {
          await supabaseAdmin
            .from("users")
            .update({
              tier: "free",
              stripe_subscription_id: subscription.id,
            })
            .eq("stripe_customer_id", customerId)

          console.log("[v0] User downgraded to free tier")
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log("[v0] Subscription deleted:", { customerId })

        await supabaseAdmin
          .from("users")
          .update({
            tier: "free",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId)

        console.log("[v0] User downgraded to free tier after cancellation")
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
