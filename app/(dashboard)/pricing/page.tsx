import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { PricingClient } from "./pricing-client"
import { PricingComparison } from "@/components/pricing-comparison"

export default async function PricingPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pricing Plans</h1>
        <p className="mt-2 text-muted-foreground">Choose the perfect plan for your outreach needs</p>
      </div>

      <PricingClient userTier={(user as any).tier} userId={(user as any).id} />

      <PricingComparison currentTier={(user as any).tier} />
    </div>
  )
}

