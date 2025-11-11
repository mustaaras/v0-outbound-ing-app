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
    description: "Great starter plan for small teams and side projects",
    priceInCents: 1500, // $15/month
    priceLabel: "$15/month",
    billingCycle: "monthly",
    tier: "light",
    features: [
      "300 emails per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Notes field (200 characters)",
      "Email support",
      "Full archive access",
      "Email Finder – unlimited searches",
    ],
  },
  {
    id: "light-annual",
    name: "Light",
    description: "Great starter plan for small teams and side projects",
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
      "Notes field (200 characters)",
      "Email support",
      "Full archive access",
      "Email Finder – unlimited searches",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro",
    description: "Perfect for growing businesses and active sales teams",
    priceInCents: 3900, // $39/month
    priceLabel: "$39/month",
    billingCycle: "monthly",
    tier: "pro",
    features: [
      "Unlimited emails",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Multi-language support",
      "Notes field (300 characters)",
      "A/B Test Generator (3 variants per email)",
      "Priority email support",
      "Full archive access",
      "Verified Contacts – 100 searches/month (Premium Beta)",
      "Email Finder – unlimited searches",
    ],
  },
  {
    id: "pro-annual",
    name: "Pro",
    description: "Perfect for growing businesses and active sales teams",
    priceInCents: 37440, // $374.40/year ($31.20/month)
    priceLabel: "$31.20/month",
    billingCycle: "annual",
    annualSavings: 20,
    tier: "pro",
    features: [
      "Unlimited emails",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Multi-language support",
      "Notes field (300 characters)",
      "A/B Test Generator (3 variants per email)",
      "Priority email support",
      "Full archive access",
      "Verified Contacts – 100 searches/month (Premium Beta)",
      "Email Finder – unlimited searches",
    ],
  },
]
