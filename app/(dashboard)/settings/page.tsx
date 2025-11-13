import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings-form"
import { createClient } from "@/lib/supabase/server"
import getStripe from "@/lib/stripe"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()
  const { data: authUser } = await supabase.auth.getUser()

  // User has password if they signed up with email provider
  const hasPassword = authUser.user?.app_metadata?.provider === "email"

  // Fetch subscription renewal date if user has a Stripe customer ID
  let renewalDate: string | null = null
  if (user.stripe_customer_id) {
    try {
      const stripe = getStripe()
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: "active",
        limit: 1,
      })
      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0]
        renewalDate = new Date((sub as any).current_period_end * 1000).toLocaleDateString()
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      <SettingsForm user={user} hasPassword={hasPassword} renewalDate={renewalDate} />
    </div>
  )
}
