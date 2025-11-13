import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings-form"
import { createClient } from "@/lib/supabase/server"
import { FeedbackChart } from "@/components/feedback-chart"
import { SupportStats } from "@/components/support-stats"
import { FeedbackBox } from "@/components/feedback-box"
import { SupportBox } from "@/components/support-box"
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

  // Fetch feedback rows and aggregate server-side
  const { data: feedbackRows } = await supabase.from("feedback").select("rating")
  const countsMap: Record<string, number> = {}
  if (Array.isArray(feedbackRows)) {
    feedbackRows.forEach((r: any) => {
      const key = r.rating || "Unknown"
      countsMap[key] = (countsMap[key] || 0) + 1
    })
  }

  // total support messages
  const { count: totalSupportCount } = await supabase
    .from("support_messages")
    .select("id", { count: "exact" })

  // last 30 days count
  const thirtyAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  const { count: last30Count } = await supabase
    .from("support_messages")
    .select("id", { count: "exact" })
    .gte("created_at", thirtyAgo)

  const last30 = last30Count ?? 0

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SettingsForm user={user} hasPassword={hasPassword} renewalDate={renewalDate} />
        </div>

        <div className="space-y-4">
          <div id="feedback">
            <FeedbackChart counts={countsMap} />
          </div>
          <div id="support">
            <SupportStats total={(totalSupportCount ?? 0) as number} last30Days={last30} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div id="feedback-box">
          <FeedbackBox userTier={user.tier} />
        </div>
        <div id="support-box">
          {user.tier === "light" || user.tier === "pro" ? (
            <SupportBox userTier={user.tier} />
          ) : (
            <div className="rounded-lg border bg-muted p-4 text-sm">Support is available for Light & Pro users. <a className="underline" href="/upgrade">Upgrade</a> to contact support directly.</div>
          )}
        </div>
      </div>
    </div>
  )
}
