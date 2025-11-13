export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  priceLabel: string // e.g., "$15/month" or "$12/month"
  billingCycle: "monthly" | "annual"
  annualSavings?: number // percentage saved with annual billing
  features: string[]
  tier: "light" | "pro"
}

export const PRODUCTS: Product[] = [
  {
    id: "light-monthly",
    name: "Light",
    description: "Perfect for freelancers and small businesses",
    priceInCents: 1500, // $15/month
    priceLabel: "$15/month",
    billingCycle: "monthly",
    tier: "light",
    features: [
      "300 emails per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Location-based contact search (unlimited)",
      "Unlimited saved contacts",
      "Notes field (200 characters)",
      "Email support",
      "Full archive access",
    ],
  },
  {
    id: "light-annual",
    name: "Light",
    description: "Perfect for freelancers and small businesses",
    priceInCents: 14400, // $144/year ($12/month)
    priceLabel: "$12/month",
    billingCycle: "annual",
    annualSavings: 20,
    tier: "light",
    features: [
      "300 emails per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Location-based contact search (unlimited)",
      "Unlimited saved contacts",
      "Notes field (200 characters)",
      "Email support",
      "Full archive access",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro",
    description: "For growing businesses and active sales teams",
    priceInCents: 2900, // $29/month (reduced from $39)
    priceLabel: "$29/month",
    billingCycle: "monthly",
    tier: "pro",
    features: [
      "Unlimited emails",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Location-based contact search (unlimited)",
      "Unlimited saved contacts",
      "Multi-language support",
      "Notes field (300 characters)",
      "A/B Test Generator (3 variants per email)",
      "Priority email support",
      "Full archive access",
    ],
  },
  {
    id: "pro-annual",
    name: "Pro",
    description: "For growing businesses and active sales teams",
    priceInCents: 27840, // $278.40/year ($23.20/month, reduced from $31.20)
    priceLabel: "$23.20/month",
    billingCycle: "annual",
    annualSavings: 20,
    tier: "pro",
    features: [
      "Unlimited emails",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Location-based contact search (unlimited)",
      "Unlimited saved contacts",
      "Multi-language support",
      "Notes field (300 characters)",
      "A/B Test Generator (3 variants per email)",
      "Priority email support",
      "Full archive access",
    ],
  },
]
