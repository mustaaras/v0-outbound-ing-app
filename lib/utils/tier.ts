import type { UserTier } from "@/lib/types"
import { TIER_LIMITS, SAVED_CONTACTS_LIMITS, LOCATION_SEARCH_LIMITS } from "@/lib/types"

/**
 * Normalize tier value (handle legacy 'ultra' tier)
 */
export function normalizeTier(tier: string): UserTier {
  return tier === "ultra" ? "pro" : (tier as UserTier)
}

/**
 * Get email generation limit for a tier
 */
export function getEmailLimit(tier: string): number {
  const effectiveTier = normalizeTier(tier)
  return TIER_LIMITS[effectiveTier] ?? TIER_LIMITS.free
}

/**
 * Get saved contacts limit for a tier
 */
export function getSavedContactsLimit(tier: string): number {
  const effectiveTier = normalizeTier(tier)
  return SAVED_CONTACTS_LIMITS[effectiveTier] ?? SAVED_CONTACTS_LIMITS.free
}

/**
 * Get location search limit for a tier
 */
export function getLocationSearchLimit(tier: string): number {
  const effectiveTier = normalizeTier(tier)
  return LOCATION_SEARCH_LIMITS[effectiveTier] ?? LOCATION_SEARCH_LIMITS.free
}

