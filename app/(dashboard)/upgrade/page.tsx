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
    <div className="mx-auto max-w-7xl space-y-6 mt-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground">Scale your outreach with premium features and higher limits</p>
      </div>

      {isPaid && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Current Plan: {isPro ? "Pro" : "Light"}</CardTitle>
            <CardDescription>
              Enjoying {isPro ? "unlimited" : "300"} emails per month and all premium strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            {hasStripeCustomer ? (
              <>
                <ManageSubscription />
                <p className="text-sm text-muted-foreground">Want to upgrade? Choose a plan below</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Your subscription is being set up...</p>
            )}
          </CardContent>
        </Card>
      )}

      <UpgradeClient 
        userTier={(user as any).tier} 
        isPaid={isPaid} 
        selectedProductId={selectedProductId} 
      />
    </div>
  )
}
