"use client"

import React from "react"
import { Check, Zap, Crown, Rocket, Coins } from "lucide-react"
import { PRODUCTS } from "@/lib/products"
import { PUBLIC_EMAIL_SEARCH_LIMITS, SNOV_SEARCH_LIMITS, TIER_LIMITS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PricingComparisonProps {
  currentTier: string
}

// Feature rows definition
interface FeatureRow {
  key: string
  label: string
  render: (tier: string) => React.ReactNode
}

const featureRows: FeatureRow[] = [
  {
    key: "templates",
  label: "Emails / month",
    render: (tier) => String(TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || (tier === "free" ? 5 : "")),
  },
  {
    key: "strategies",
    label: "Premium strategies",
    render: (tier) => (tier === "free" ? "Limited" : <Check className="mx-auto h-4 w-4 text-primary" />),
  },
  {
    key: "strategySelection",
    label: "Strategy selection",
    render: (tier) => (tier === "free" ? "1 at a time" : "Unlimited"),
  },
  {
    key: "industryCategories",
    label: "Industry categories",
    render: () => <Check className="mx-auto h-4 w-4 text-primary" />,
  },
  {
    key: "customization",
    label: "Customization options",
    render: () => <Check className="mx-auto h-4 w-4 text-primary" />,
  },
  {
    key: "archive",
    label: "Archive access",
    render: () => <Check className="mx-auto h-4 w-4 text-primary" />,
  },
  {
    key: "searchContacts",
    label: "Search Contacts saved emails / month",
    render: (tier) => {
      if (tier === "free") return "Not included"
      return String(SNOV_SEARCH_LIMITS[tier as keyof typeof SNOV_SEARCH_LIMITS])
    },
  },
  {
    key: "publicEmailFinder",
    label: "Public Email Finder searches / month",
    render: (tier) => (tier === "free" ? String(PUBLIC_EMAIL_SEARCH_LIMITS.free) : "Unlimited"),
  },
  {
    key: "support",
    label: "Support level",
    render: (tier) => (tier === "ultra" ? "Premium" : tier === "pro" ? "Priority" : "Standard"),
  },
  {
    key: "earlyAccess",
    label: "Early access to new features",
    render: (tier) => (tier === "ultra" ? <Check className="mx-auto h-4 w-4 text-primary" /> : "-"),
  },
]

export function PricingComparison({ currentTier }: PricingComparisonProps) {
  const tiers = [
    { name: "Free", tier: "free", price: 0 },
    ...PRODUCTS.map((p) => ({ name: p.name, tier: p.tier, price: p.priceInCents / 100 })),
  ]

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[240px_repeat(4,1fr)]">
        <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r bg-muted/40">
          <h3 className="text-sm font-semibold">Compare Plans</h3>
          <p className="mt-1 text-xs text-muted-foreground">Everything scales with your outreach volume.</p>
        </div>
        {tiers.map((t) => (
          <div
            key={t.tier}
            className={cn(
              "p-4 md:p-6 border-b md:border-b-0 md:border-r flex flex-col gap-2 text-center",
              currentTier === t.tier ? "bg-primary/5" : "bg-background",
            )}
          >
            <div className="text-sm font-semibold flex items-center justify-center gap-1">
              {t.tier === "ultra" ? (
                <Rocket className="h-4 w-4 text-purple-500" />
              ) : t.tier === "pro" ? (
                <Crown className="h-4 w-4 text-primary" />
              ) : t.tier === "light" ? (
                <Zap className="h-4 w-4 text-green-600" />
              ) : (
                <Coins className="h-4 w-4 text-muted-foreground" />
              )}
              {t.name}
            </div>
            <div className="text-lg font-bold">${t.price}</div>
            <div className="text-xs text-muted-foreground">per month</div>
            {currentTier === t.tier && (
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Current Plan
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="divide-y">
        {featureRows.map((row) => (
          <div key={row.key} className="grid grid-cols-1 md:grid-cols-[240px_repeat(4,1fr)]">
            <div className="p-3 md:p-4 text-sm font-medium bg-muted/30 flex items-center">{row.label}</div>
            {tiers.map((t) => (
              <div
                key={t.tier + row.key}
                className={cn(
                  "p-3 md:p-4 text-xs md:text-sm flex items-center justify-center",
                  currentTier === t.tier ? "bg-primary/5" : "",
                )}
              >
                {row.render(t.tier)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
