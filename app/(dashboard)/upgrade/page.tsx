import { getCurrentUser } from "@/lib/auth-utils"
import { PRODUCTS } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Crown, Sparkles, Zap } from "lucide-react"
import { UpgradeForm } from "@/components/upgrade-form"
import { ManageSubscription } from "@/components/manage-subscription"

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
  const isUltra = user.tier === "ultra"
  const isPaid = isLight || isPro || isUltra
  const hasStripeCustomer = !!user.stripe_customer_id

  const params = await searchParams
  const selectedProductId = params.product

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
            <CardTitle>Current Plan: {isUltra ? "Ultra" : isPro ? "Pro" : "Light"}</CardTitle>
            <CardDescription>
              Enjoying {isUltra ? "1,500" : isPro ? "750" : "100"} templates per month and all premium strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            {hasStripeCustomer ? (
              <>
                <ManageSubscription />
                {!isUltra && <p className="text-sm text-muted-foreground">Want to upgrade? Choose a plan below</p>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Your subscription is being set up...</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Free Plan</CardTitle>
            <CardDescription>Perfect for trying out</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">$0</div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">5 templates per month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Free strategies only</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Full archive access</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Public Email Finder – 30 searches/month</span>
              </li>
            </ul>
            <Button disabled className="w-full bg-transparent" variant="outline">
              {!isPaid ? "Current Plan" : "Downgrade Not Available"}
            </Button>
          </CardContent>
        </Card>

        <Card className={isLight ? "border-green-500 bg-green-500/5" : "border-green-500 relative"}>
          {isLight && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
                <Check className="h-3 w-3" />
                Current Plan
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              {PRODUCTS[0].name}
            </CardTitle>
            <CardDescription>{PRODUCTS[0].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">$9.99</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
            <ul className="space-y-2">
              {PRODUCTS[0].features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            {isLight ? (
              <Button disabled className="w-full bg-transparent" variant="outline">
                Current Plan
              </Button>
            ) : (
              <UpgradeForm
                productId={PRODUCTS[0].id}
                buttonLabel={isPaid ? "Downgrade to Light" : "Get Light"}
                autoOpen={selectedProductId === PRODUCTS[0].id}
              />
            )}
          </CardContent>
        </Card>

        <Card className={isPro ? "border-primary bg-primary/5" : "relative border-primary"}>
          {!isPro && !isUltra && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </div>
            </div>
          )}
          {isPro && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                <Check className="h-3 w-3" />
                Current Plan
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {PRODUCTS[1].name}
            </CardTitle>
            <CardDescription>{PRODUCTS[1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">$29</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
            <ul className="space-y-2">
              {PRODUCTS[1].features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button disabled className="w-full bg-transparent" variant="outline">
                Current Plan
              </Button>
            ) : (
              <UpgradeForm
                productId={PRODUCTS[1].id}
                buttonLabel={isLight ? "Upgrade to Pro" : "Get Pro"}
                autoOpen={selectedProductId === PRODUCTS[1].id}
              />
            )}
          </CardContent>
        </Card>

        <Card className={isUltra ? "border-purple-500 bg-purple-500/5" : "relative border-2 border-purple-500"}>
          {!isUltra && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 rounded-full bg-purple-500 px-3 py-1 text-xs font-medium text-white">
                <Crown className="h-3 w-3" />
                Maximum Power
              </div>
            </div>
          )}
          {isUltra && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 rounded-full bg-purple-500 px-3 py-1 text-xs font-medium text-white">
                <Check className="h-3 w-3" />
                Current Plan
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-500" />
              {PRODUCTS[2].name}
            </CardTitle>
            <CardDescription>{PRODUCTS[2].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">$49</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
            <ul className="space-y-2">
              {PRODUCTS[2].features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-purple-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            {isUltra ? (
              <Button disabled className="w-full bg-transparent" variant="outline">
                Current Plan
              </Button>
            ) : (
              <UpgradeForm
                productId={PRODUCTS[2].id}
                buttonLabel={isLight || isPro ? "Upgrade to Ultra" : "Get Ultra"}
                autoOpen={selectedProductId === PRODUCTS[2].id}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
