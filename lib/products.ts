export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  tier: "light" | "pro" | "ultra"
}

export const PRODUCTS: Product[] = [
  {
    id: "light-monthly",
    name: "Light",
    description: "Great starter plan for small teams and side projects",
    priceInCents: 999, // $9.99/month
    tier: "light",
    features: [
      "100 templates per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Email support",
      "Full archive access",
      "No buyer searches (upgrade for Search Buyers)",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro",
    description: "Perfect for growing businesses and active sales teams",
    priceInCents: 2900, // $29/month
    tier: "pro",
    features: [
      "750 templates per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Priority email support",
      "Full archive access",
      "Search Buyers – 150 buyer searches/month",
    ],
  },
  {
    id: "ultra-monthly",
    name: "Ultra",
    description: "Maximum capacity for high-volume outreach campaigns",
    priceInCents: 4900, // $49/month
    tier: "ultra",
    features: [
      "1,500 templates per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Premium priority support",
      "Full archive access",
      "Early access to new features",
      "Search Buyers – 300 buyer searches/month",
    ],
  },
]
