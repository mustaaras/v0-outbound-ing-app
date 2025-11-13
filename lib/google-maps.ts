import "server-only"

import { devLog, errorLog } from "@/lib/logger"

export interface GooglePlace {
  place_id: string
  name: string
  formatted_address?: string
  formatted_phone_number?: string // ← Phone number for cold calling!
  website?: string
  types?: string[]
  rating?: number
  user_ratings_total?: number
  price_level?: number
  business_status?: string
  vicinity?: string
  location?: {
    lat: number
    lng: number
  }
  // Additional useful fields for lead gen
  opening_hours?: any
  reviews?: any[]
  photos?: any[]
}

export interface LocationSearchParams {
  query?: string
  location?: string // "lat,lng"
  radius?: number // in meters
  type?: string // "restaurant", "store", etc.
  keyword?: string
}

export interface LocationSearchResult {
  places: GooglePlace[]
  status: string
}

// Server-side utility functions for processing Google Places data
export class GoogleMapsUtils {
  /**
   * Extract domain from Google Places website URL
   */
  static extractDomain(website?: string): string | null {
    if (!website) return null

    try {
      const url = new URL(website)
      let domain = url.hostname.toLowerCase()

      // Remove www. prefix
      domain = domain.replace(/^www\./, '')

      // Remove common TLDs and get base domain
      const parts = domain.split('.')
      if (parts.length >= 2) {
        // For .com, .org, etc. - take last 2 parts
        // For .co.uk, .com.au, etc. - take last 3 parts if it's a country TLD
        const tld = parts[parts.length - 1]
        const secondLevel = parts[parts.length - 2]

        // Country code TLDs that use 3 parts
        const countryTlds = ['uk', 'au', 'ca', 'nz', 'za', 'in', 'br', 'mx', 'ar', 'cl', 'co', 'pe', 've', 'uy', 'py', 'bo', 'ec', 'gy', 'sr', 'gf', 'fk', 'gs', 'hm', 'io', 'pn', 'sh', 'ac', 'gg', 'im', 'je', 'cx', 'cc', 'nf', 'yt', 'tf', 're', 'pm', 'wf', 'mq', 'gp', 'gf', 'pf', 'nc', 'mc', 'va', 'sm', 'ad', 'li', 'gi', 'pt', 'es', 'fr', 'it', 'de', 'nl', 'be', 'lu', 'at', 'ch', 'dk', 'no', 'se', 'fi', 'is', 'sj', 'gl', 'fo', 'ax', 'ee', 'lv', 'lt', 'mt', 'cy', 'si', 'sk', 'cz', 'pl', 'hu', 'ro', 'bg', 'gr', 'tr', 'ru', 'by', 'ua', 'md', 'ba', 'me', 'rs', 'mk', 'al', 'hr', 'xk', 'me', 'rs', 'mk', 'al', 'hr', 'xk']

        if (countryTlds.includes(tld) && parts.length >= 3) {
          domain = parts.slice(-3).join('.')
        } else {
          domain = parts.slice(-2).join('.')
        }
      }

      devLog(`[v0] Extracted domain: ${domain} from ${website}`)
      return domain
    } catch (error) {
      errorLog(`[v0] Failed to extract domain from ${website}:`, error)
      return null
    }
  }

  /**
   * Filter places that have websites (potential business leads)
   */
  static filterPlacesWithWebsites(places: GooglePlace[]): GooglePlace[] {
    return places.filter(place => place.website && place.website.trim() !== '')
  }

  /**
   * Convert Google Places results to domain list for Snov.io processing
   */
  static extractDomainsFromPlaces(places: GooglePlace[]): string[] {
    const domains = places
      .map(place => this.extractDomain(place.website))
      .filter((domain): domain is string => domain !== null)

    // Remove duplicates
    return [...new Set(domains)]
  }

  /**
   * Validate Google Maps API key format
   */
  static validateApiKey(apiKey?: string): boolean {
    if (!apiKey) return false

    // Google Maps API keys are typically 39 characters long and contain only alphanumeric characters and underscores
    const apiKeyRegex = /^[A-Za-z0-9_]{39}$/
    return apiKeyRegex.test(apiKey)
  }
}

// Placeholder for future client-side Google Maps integration
// This will be implemented in a client component
export function getGoogleMapsClient() {
  throw new Error("Google Maps client is only available on the client side. Use a client component instead.")
}