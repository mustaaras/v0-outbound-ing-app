import { getCurrentUser } from "@/lib/auth-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown } from "lucide-react"
import { ManageSubscription } from "@/components/manage-subscription"
import { UpgradeClient } from "./upgrade-client"

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const isLight = user.tier === "light"
  const isPro = user.tier === "pro"
  const isPaid = isLight || isPro
  const hasStripeCustomer = !!user.stripe_customer_id

  const params = await searchParams
  const selectedProductId = params.product

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground">Scale your outreach with premium features and higher limits</p>
      </div>

      <UpgradeClient 
        userTier={(user as any).tier} 
        isPaid={isPaid} 
        selectedProductId={selectedProductId} 
      />
    </div>
  )
}
