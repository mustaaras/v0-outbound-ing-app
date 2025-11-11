import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PRODUCTS } from "@/lib/products"
import { getUserSearchCount } from "@/app/actions/search-buyers"
import { SNOV_SEARCH_LIMITS } from "@/lib/types"
import { Search } from "lucide-react"
import { SearchBuyersForm } from "@/components/search-buyers-form"
import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function PricingPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }

  const isEligibleForSearch = user.tier === "light" || user.tier === "pro" || user.tier === "ultra"
  let searchesUsed: number | null = null
  let searchLimit: number | null = null
  if (isEligibleForSearch) {
    searchesUsed = await getUserSearchCount((user as any).id)
    searchLimit = SNOV_SEARCH_LIMITS[user!.tier as keyof typeof SNOV_SEARCH_LIMITS] || 0
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out Outbound.ing",
      tier: "free" as const,
      productId: null,
      features: [
        "5 templates per month",
        "Access to free strategies",
        "9 industry categories",
        "Basic customization",
        "Email support",
      ],
      cta: user.tier === "free" ? "Current Plan" : "Downgrade",
      disabled: user.tier === "free",
    },
    ...PRODUCTS.map((product) => ({
      name: product.name,
      price: `$${(product.priceInCents / 100).toFixed(2)}`,
      description: product.description,
      tier: product.tier,
      productId: product.id,
      features: product.features,
      cta: user.tier === product.tier ? "Current Plan" : "Upgrade Now",
      disabled: user.tier === product.tier,
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pricing Plans</h1>
        <p className="mt-2 text-muted-foreground">Choose the perfect plan for your outreach needs</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.tier === "pro" ? "border-primary shadow-lg" : ""}>
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
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => {
                  const lower = feature.toLowerCase()
                  const isSearch = lower.startsWith("search buyers") || lower.includes("buyer searches") || lower.includes("saved buyer emails")
                  return (
                    <li key={index} className="flex items-start gap-2">
                      {isSearch ? (
                        <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      )}
                      <span className="text-sm flex items-center gap-2">
                        {feature}
                        {isSearch && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Email-only</span>
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

      <Card>
        <CardHeader>
          <CardTitle>Plan Comparison</CardTitle>
          <CardDescription>Compare features across all plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">Feature</th>
                  <th className="py-3 text-center font-medium">Free</th>
                  <th className="py-3 text-center font-medium">Light</th>
                  <th className="py-3 text-center font-medium">Pro</th>
                  <th className="py-3 text-center font-medium">Ultra</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 text-sm">Templates per month</td>
                  <td className="py-3 text-center text-sm">5</td>
                  <td className="py-3 text-center text-sm">100</td>
                  <td className="py-3 text-center text-sm">750</td>
                  <td className="py-3 text-center text-sm">1,500</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm">Premium strategies</td>
                  <td className="py-3 text-center text-sm">Limited</td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm">Strategy selection</td>
                  <td className="py-3 text-center text-sm">1 at a time</td>
                  <td className="py-3 text-center text-sm">Unlimited</td>
                  <td className="py-3 text-center text-sm">Unlimited</td>
                  <td className="py-3 text-center text-sm">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm">Industry categories</td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm">Full customization</td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm">Email support</td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">Priority</td>
                  <td className="py-3 text-center text-sm">Premium</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm">Archive access</td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-sm">Early access to features</td>
                  <td className="py-3 text-center text-sm">-</td>
                  <td className="py-3 text-center text-sm">-</td>
                  <td className="py-3 text-center text-sm">-</td>
                  <td className="py-3 text-center text-sm">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Removed redundant standalone Search Buyers section now that feature is highlighted in plan cards */}
    </div>
  )
}
