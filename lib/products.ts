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
    priceInCents: 1500, // $15/month
    tier: "light",
    features: [
      "100 templates per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Email support",
      "Full archive access",
      "Search Buyers – up to 50 saved buyer emails/month (email-only billing)",
    ],
  },
  {
    id: "pro-monthly",
    name: "Pro",
    description: "Perfect for growing businesses and active sales teams",
    priceInCents: 3900, // $39/month
    tier: "pro",
    features: [
      "750 templates per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Priority email support",
      "Full archive access",
      "Search Buyers – up to 150 saved buyer emails/month (email-only billing)",
    ],
  },
  {
    id: "ultra-monthly",
    name: "Ultra",
    description: "Maximum capacity for high-volume outreach campaigns",
    priceInCents: 6900, // $69/month
    tier: "ultra",
    features: [
      "1,500 templates per month",
      "All 101 premium strategies",
      "All 9 industry categories",
      "Full customization options",
      "Premium priority support",
      "Full archive access",
      "Early access to new features",
      "Search Buyers – up to 300 saved buyer emails/month (email-only billing)",
    ],
  },
]
