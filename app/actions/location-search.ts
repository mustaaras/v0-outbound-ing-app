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
  scrapedEmails?: Array<{
    businessName: string
    website: string
    emails: string[]
    success: boolean
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

    // Scrape websites for real email addresses (limit to first 5 to avoid rate limits)
    const scrapedEmails = []
    const placesToScrape = places.filter(p => p.website).slice(0, 5) // Limit for performance

    devLog(`[v0] Starting website scraping for ${placesToScrape.length} businesses...`)

    for (const place of placesToScrape) {
      try {
        const result = await GoogleMapsUtils.scrapeWebsiteForContacts(place.website!)
        scrapedEmails.push({
          businessName: place.name,
          website: place.website!,
          emails: result.emails,
          success: result.success
        })

        // Small delay to be respectful to websites
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        devLog(`[v0] Failed to scrape ${place.website}:`, error)
        scrapedEmails.push({
          businessName: place.name,
          website: place.website!,
          emails: [],
          success: false
        })
      }
    }

    devLog(`[v0] Scraped ${scrapedEmails.filter(s => s.success).length} websites successfully, found ${scrapedEmails.reduce((sum, s) => sum + s.emails.length, 0)} emails`)

    const result: LocationSearchResult = {
      domains,
      totalPlaces: places.length,
      placesWithWebsites,
      placesWithPhones,
      places, // Return full place data
      emailPatterns,
      scrapedEmails,
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