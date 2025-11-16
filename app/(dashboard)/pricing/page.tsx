import type { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { PricingComparison } from "@/components/pricing-comparison"
import { PricingClient } from "@/app/(dashboard)/pricing/pricing-client"

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

export const metadata: Metadata = {
  title: "Pricing — Outbound.ing",
  description: "Simple, transparent pricing plans for AI-powered outreach — Free, Light, and Pro.",
  openGraph: {
    title: "Pricing — Outbound.ing",
    description: "Simple, transparent pricing plans for AI-powered outreach — Free, Light, and Pro.",
    images: ["/og-image.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Outbound.ing",
    description: "Simple, transparent pricing plans for AI-powered outreach — Free, Light, and Pro.",
    images: ["/og-image.png"]
  }
}

