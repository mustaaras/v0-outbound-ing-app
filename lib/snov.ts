import "server-only"

import { errorLog, devLog } from "@/lib/logger"

interface SnovBuyer {
  email: string
  first_name: string
  last_name: string
  company: string
  title: string
  linkedin_url?: string
  phone?: string
  industry?: string
  company_size?: string
}

interface SnovSearchParams {
  domain?: string
  company?: string
  title?: string
  first_name?: string
  last_name?: string
  industry?: string
  company_size?: string
  country?: string
  limit?: number
  offset?: number
}

interface SnovSearchResponse {
  success: boolean
  data: {
    total: number
    results: SnovBuyer[]
  }
  error?: string
}

class SnovClient {
  private apiKey: string
  private apiUrl = "https://api.snov.io/v2"

  constructor() {
    const key = process.env.SNOV_API_KEY
    if (!key) {
      throw new Error("SNOV_API_KEY environment variable is not set")
    }
    this.apiKey = key
  }

  /**
   * Search for buyers/prospects using Snov.io API
   */
  async searchBuyers(params: SnovSearchParams): Promise<SnovSearchResponse> {
    try {
      const searchParams = new URLSearchParams()
      
      // Add parameters
      if (params.domain) searchParams.append("domain", params.domain)
      if (params.company) searchParams.append("company", params.company)
      if (params.title) searchParams.append("title", params.title)
      if (params.first_name) searchParams.append("first_name", params.first_name)
      if (params.last_name) searchParams.append("last_name", params.last_name)
      if (params.industry) searchParams.append("industry", params.industry)
      if (params.company_size) searchParams.append("company_size", params.company_size)
      if (params.country) searchParams.append("country", params.country)
      
      searchParams.append("limit", String(params.limit || 20))
      searchParams.append("offset", String(params.offset || 0))

      const response = await fetch(`${this.apiUrl}/prospects/search`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: searchParams.toString(),
      })

      if (!response.ok) {
        const errorData = await response.text()
        errorLog(`Snov.io API error: ${response.status}`, errorData)
        throw new Error(`Snov.io API error: ${response.status}`)
      }

      const data = await response.json()

      devLog("[v0] Snov.io search response:", {
        total: data.total,
        count: data.prospects?.length || 0,
      })

      // Transform Snov.io response to our format
      const buyers: SnovBuyer[] = (data.prospects || []).map((prospect: any) => ({
        email: prospect.email || "",
        first_name: prospect.first_name || "",
        last_name: prospect.last_name || "",
        company: prospect.company_name || "",
        title: prospect.title || "",
        linkedin_url: prospect.linkedin_url,
        phone: prospect.phone,
        industry: prospect.industry,
        company_size: prospect.company_size,
      }))

      return {
        success: true,
        data: {
          total: data.total || 0,
          results: buyers,
        },
      }
    } catch (error) {
      errorLog("[v0] Snov.io search error:", error)
      return {
        success: false,
        data: {
          total: 0,
          results: [],
        },
        error: error instanceof Error ? error.message : "Failed to search prospects",
      }
    }
  }

  /**
   * Get buyer count for remaining searches
   */
  async getRemainingSearches(userId: string): Promise<number> {
    // This will be implemented with database queries in the action
    return 0
  }
}

let snovClient: SnovClient | null = null

export function getSnovClient(): SnovClient {
  if (!snovClient) {
    snovClient = new SnovClient()
  }
  return snovClient
}

export type { SnovBuyer, SnovSearchParams, SnovSearchResponse }
