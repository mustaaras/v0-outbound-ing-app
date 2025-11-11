"use client"

import { useState } from "react"
import { PRODUCTS } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles, Zap } from "lucide-react"
import { UpgradeForm } from "@/components/upgrade-form"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UpgradeClientProps {
  userTier: string
  isPaid: boolean
  selectedProductId?: string
}

export function UpgradeClient({ userTier, isPaid, selectedProductId }: UpgradeClientProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  
  const productsToShow = PRODUCTS.filter(p => p.billingCycle === billingCycle)
  const isLight = userTier === "light"
  const isPro = userTier === "pro"

  return (
    <>
      <div className="flex justify-center mb-8">
        <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "annual")} className="w-auto">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">
              Annual
              <span className="ml-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-medium text-white">
                Save 20%
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                <span className="text-sm">30 emails per month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pick 1 strategy at a time</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Basic customization</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Full archive access</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email Finder – 60 searches/month</span>
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
              {productsToShow[0]?.name}
            </CardTitle>
            <CardDescription>{productsToShow[0]?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{productsToShow[0]?.priceLabel}</span>
                {billingCycle === "annual" && <span className="text-sm text-muted-foreground"> (billed annually)</span>}
              </div>
              {billingCycle === "annual" && productsToShow[0]?.annualSavings && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Save {productsToShow[0].annualSavings}% with annual billing
                </p>
              )}
            </div>
            <ul className="space-y-2">
              {productsToShow[0]?.features.map((feature, index) => (
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
                productId={productsToShow[0]?.id || ""}
                buttonLabel={isPaid ? "Downgrade to Light" : "Get Light"}
                autoOpen={selectedProductId === productsToShow[0]?.id}
              />
            )}
          </CardContent>
        </Card>

        <Card className={isPro ? "border-primary bg-primary/5" : "relative border-primary"}>
          {!isPro && (
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
              <Sparkles className="h-5 w-5 text-primary" />
              {productsToShow[1]?.name}
            </CardTitle>
            <CardDescription>{productsToShow[1]?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{productsToShow[1]?.priceLabel}</span>
                {billingCycle === "annual" && <span className="text-sm text-muted-foreground"> (billed annually)</span>}
              </div>
              {billingCycle === "annual" && productsToShow[1]?.annualSavings && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Save {productsToShow[1].annualSavings}% with annual billing
                </p>
              )}
            </div>
            <ul className="space-y-2">
              {productsToShow[1]?.features.map((feature, index) => (
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
                productId={productsToShow[1]?.id || ""}
                buttonLabel={isLight ? "Upgrade to Pro" : "Get Pro"}
                autoOpen={selectedProductId === productsToShow[1]?.id}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
