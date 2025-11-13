"use server"

import { getCurrentUser, canPerformSnovSearch, incrementSnovSearchCount } from "@/lib/auth-utils"
import { GoogleMapsUtils, GooglePlace } from "@/lib/google-maps"
import { getSnovClient } from "@/lib/snov"
import { devLog, errorLog } from "@/lib/logger"

export interface LocationSearchResult {
  domains: string[]
  totalPlaces: number
  placesWithWebsites: number
  placesWithPhones: number
  places: GooglePlace[] // Return full place data
}

export async function processLocationSearch(places: GooglePlace[]): Promise<LocationSearchResult> {
  // No user authentication required for basic Google Places data
  try {
    // Extract domains from places with websites
    const domains = GoogleMapsUtils.extractDomainsFromPlaces(places)
    const placesWithWebsites = places.filter(p => p.website).length
    const placesWithPhones = places.filter(p => p.formatted_phone_number).length

    devLog(`[v0] Extracted ${domains.length} domains from ${placesWithWebsites} places with websites, ${placesWithPhones} with phones`)

    const result: LocationSearchResult = {
      domains,
      totalPlaces: places.length,
      placesWithWebsites,
      placesWithPhones,
      places, // Return full place data
    }

    return result
  } catch (error) {
    errorLog("[v0] Error processing location search:", error)
    throw new Error("Failed to process location search results")
  }
}

export async function validateLocationSearchAccess(): Promise<{
  canSearch: boolean
  tier: string
  remainingSearches?: number
}> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const { canSearch, searches, limit } = await canPerformSnovSearch(user.id, user.tier)

  return {
    canSearch,
    tier: user.tier,
    remainingSearches: limit - searches,
  }
}