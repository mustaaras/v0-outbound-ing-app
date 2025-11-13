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
  places: GooglePlace[]
  emailPatterns?: Array<{
    domain: string
    businessName: string
    patterns: string[]
  }>
}

export async function processLocationSearch(places: GooglePlace[]): Promise<LocationSearchResult> {
  // No user authentication required for basic Google Places data
  try {
    // Extract domains from places with websites
    const domains = GoogleMapsUtils.extractDomainsFromPlaces(places)
    const placesWithWebsites = places.filter(p => p.website).length
    const placesWithPhones = places.filter(p => p.formatted_phone_number).length

    // Generate email patterns for businesses with websites
    const emailPatterns = places
      .filter(p => p.website) // Only businesses with websites
      .map(place => {
        const domain = GoogleMapsUtils.extractDomain(place.website!)
        if (!domain) return null

        return {
          domain,
          businessName: place.name,
          patterns: GoogleMapsUtils.generateEmailPatterns(domain, place.name)
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    devLog(`[v0] Extracted ${domains.length} domains from ${placesWithWebsites} places with websites, generated ${emailPatterns.length} email pattern sets`)

    const result: LocationSearchResult = {
      domains,
      totalPlaces: places.length,
      placesWithWebsites,
      placesWithPhones,
      places, // Return full place data
      emailPatterns,
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