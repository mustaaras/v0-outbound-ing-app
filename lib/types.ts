export type UserTier = "free" | "light" | "pro" | "ultra"

export interface User {
  id: string
  email: string
  tier: UserTier
  stripe_customer_id?: string
  stripe_subscription_id?: string
  created_at: string
  updated_at: string
}

export interface Strategy {
  id: string
  name: string
  description: string
  tier: UserTier
  category: string
  input_fields: string[]
  prompt: string
  created_at: string
}

export interface Template {
  id: string
  user_id: string
  subject: string
  category?: string
  strategy_ids: string[]
  recipient?: string
  recipient_email?: string
  input_data: Record<string, string>
  result_text: string
  created_at: string
}

export interface Usage {
  id: string
  user_id: string
  month: string
  count: number
  created_at: string
}

export const TIER_LIMITS = {
  free: 5,
  light: 100,
  pro: 750,
  ultra: 1500,
} as const

export const SNOV_SEARCH_LIMITS = {
  free: 0,
  light: 0,
  pro: 150,
  ultra: 300,
} as const

export interface SnovSearch {
  id: string
  user_id: string
  month: string
  search_count: number
  created_at: string
  updated_at: string
}
