export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  tier: "light" | "pro"
}

export const PRODUCTS: Product[] = [
  {
    id: "light-monthly",
    name: "Light",
    description: "Great starter plan for small teams and side projects",
    priceInCents: 1500, // $15/month
    tier: "light",
    features: [
      "100 emails per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Email support",
      "Full archive access",
      "Verified Contacts – 50 searches/month",
      "Email Finder – unlimited searches",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro",
    description: "Perfect for growing businesses and active sales teams",
    priceInCents: 3900, // $39/month
    tier: "pro",
    features: [
      "750 emails per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "A/B Test Generator (3 variants per email)",
      "Priority email support",
      "Full archive access",
      "Verified Contacts – 150 searches/month",
      "Email Finder – unlimited searches",
    ],
  },
]
