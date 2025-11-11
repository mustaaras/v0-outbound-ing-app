"use client"

import { Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PRODUCTS } from "@/lib/products"
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PricingClientProps {
  userTier: string
  userId: string
}

type PlanType = {
  name: string
  price: string
  billingText: string
  savings?: number
  description: string
  tier: "free" | "light" | "pro"
  productId: string | null
  features: string[]
  cta: string
  disabled: boolean
}

export function PricingClient({ userTier, userId }: PricingClientProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  
  const productsToShow = PRODUCTS.filter(p => p.billingCycle === billingCycle)

  const plans: PlanType[] = [
    {
      name: "Free",
      price: "$0",
      billingText: "/month",
      description: "Generous free tier for new users and testing",
      tier: "free" as const,
      productId: null,
      features: [
        "30 emails per month",
        "Pick 1 strategy at a time",
        "9 industry categories",
        "Basic customization",
        "Email support",
        "Email Finder – 60 searches/month",
        "Verified Contacts (Premium Beta) – Not included",
      ],
      cta: userTier === "free" ? "Current Plan" : "Downgrade",
      disabled: userTier === "free",
    },
    ...productsToShow.map((product) => ({
      name: product.name,
      price: product.priceLabel,
      billingText: billingCycle === "annual" ? " (billed annually)" : "",
      savings: billingCycle === "annual" ? product.annualSavings : undefined,
      description: product.description,
      tier: product.tier,
      productId: product.id,
      features: product.features.map(f =>
        f.startsWith("Verified Contacts")
          ? "Verified Contacts (Premium Beta) – Included"
          : f
      ),
      cta: userTier === product.tier ? "Current Plan" : "Upgrade Now",
      disabled: userTier === product.tier,
    })),
  ]

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

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name + plan.productId} className={plan.tier === "pro" ? "border-primary shadow-lg" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.tier === "pro" && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Popular
                  </span>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.billingText && <span className="text-sm text-muted-foreground">{plan.billingText}</span>}
                </div>
                {plan.savings && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Save {plan.savings}% with annual billing
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => {
                  const lower = feature.toLowerCase()
                  const isSearch = lower.startsWith("search contacts") || lower.includes("contact searches") || lower.includes("saved contact emails") || lower.includes("email finder")
                  const isVerified = lower.includes("verified contacts")
                  return (
                    <li key={index} className="flex items-start gap-2">
                      {isSearch ? (
                        <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : isVerified ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      )}
                      <span className="text-sm flex items-center gap-2">
                        {feature}
                        {isVerified && (
                          <span className="inline-flex items-center rounded-full bg-yellow-200 px-2 py-0.5 text-[10px] font-medium text-yellow-800">Premium Beta</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.name === "Free" ? (
                <Button variant="outline" className="w-full bg-transparent" disabled={plan.disabled}>
                  {plan.cta}
                </Button>
              ) : (
                <Button asChild className="w-full" disabled={plan.disabled}>
                  <Link href={`/upgrade?product=${plan.productId}`}>{plan.cta}</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  )
}
