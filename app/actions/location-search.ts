"use server"

import { getCurrentUser, canPerformLocationSearch, incrementLocationSearchCount } from "@/lib/auth-utils"
import { GoogleMapsUtils, GooglePlace } from "@/lib/google-maps"
import { devLog, errorLog } from "@/lib/logger"

export interface LocationSearchResult {
  domains: string[]
  totalPlaces: number
  placesWithWebsites: number
  placesWithPhones: number
  places: GooglePlace[]
  scrapedEmails?: Array<{
    businessName: string
    website: string
    emails: string[]
    success: boolean
  }>
}

export async function processLocationSearch(places: GooglePlace[], options?: { scrapeWebsites?: boolean }): Promise<LocationSearchResult> {
  // Check user authentication and increment search count
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Check if user can perform search
  const { canSearch } = await canPerformLocationSearch(user.id, user.tier)
  if (!canSearch) {
    throw new Error("Monthly location search limit reached. Upgrade to continue searching.")
  }

  // Increment search count
  await incrementLocationSearchCount(user.id)

  try {
    // Extract domains from places with websites
    const domains = GoogleMapsUtils.extractDomainsFromPlaces(places)
    const placesWithWebsites = places.filter(p => p.website).length
    const placesWithPhones = places.filter(p => p.formatted_phone_number).length

    const scrapedEmails: Array<{
      businessName: string
      website: string
      emails: string[]
      success: boolean
    }> = []

    // If caller requested to skip website scraping (we will do per-place scrapes incrementally on the client), skip this step.
    if (options?.scrapeWebsites !== false) {
      // Scrape websites for real email addresses (limit to first 10 to avoid rate limits)
      // CONFIGURABLE LIMITS:
      // - MAX_SCRAPE_PLACES: Maximum number of websites to scrape per search (default: 10)
      // - MAX_EMAILS_PER_SITE: Maximum emails to extract per website (default: 10) - configured in google-maps.ts
      // - GOOGLE_PLACES_LIMIT: Maximum places returned from Google Places API (default: 10) - configured in location-search-form.tsx
      
      // Deduplicate websites to avoid scraping the same site multiple times
      const uniqueWebsites = new Set<string>()
      const placesToScrape = places
        .filter(p => p.website && p.website.trim() !== '')
        .filter(p => {
          const domain = GoogleMapsUtils.extractDomain(p.website!)
          if (domain && !uniqueWebsites.has(domain)) {
            uniqueWebsites.add(domain)
            return true
          }
          return false
        })
          .slice(0, 12) // Limit to 12 unique websites for performance

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
    } else {
      devLog(`[v0] Skipping website scraping because options.scrapeWebsites === false`)
    }

    const result: LocationSearchResult = {
      domains,
      totalPlaces: places.length,
      placesWithWebsites,
      placesWithPhones,
      places, // Return full place data
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

  const { canSearch, searches, limit } = await canPerformLocationSearch(user.id, user.tier)

  return {
    canSearch,
    tier: user.tier,
    remainingSearches: limit - searches,
  }
}