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
  private clientId?: string
  private clientSecret?: string
  private tokenUrl: string
  private accessToken: string | null = null
  private tokenExpiresAt: number | null = null

  constructor() {
    const key = process.env.SNOV_API_KEY
    this.apiKey = key || ""

    this.clientId = process.env.SNOV_CLIENT_ID
    this.clientSecret = process.env.SNOV_CLIENT_SECRET
    this.tokenUrl = process.env.SNOV_TOKEN_URL || `${this.apiUrl}/oauth/token`

    // It's okay if SNOV_API_KEY is empty when client credentials are provided;
    // we'll attempt client credentials flow if clientId/clientSecret exist.
    if (!this.apiKey && !(this.clientId && this.clientSecret)) {
      throw new Error("SNOV_API_KEY or SNOV_CLIENT_ID & SNOV_CLIENT_SECRET must be set")
    }
  }

  private async fetchAccessToken(): Promise<void> {
    if (!(this.clientId && this.clientSecret)) return
    try {
      // Try multiple token endpoints and Basic auth fallback. Some Snov accounts
      // use different token endpoints or require HTTP Basic auth for client creds.
      const candidateUrls = [
        this.tokenUrl,
        `${this.apiUrl}/oauth/token`,
        `https://api.snov.io/oauth/token`,
        `https://api.snov.io/v1/oauth/token`,
        `${this.apiUrl.replace('/v2', '/v1')}/oauth/token`,
      ].filter(Boolean) as string[]

      for (const url of candidateUrls) {
        try {
          const form = new URLSearchParams()
          form.append('grant_type', 'client_credentials')
          // Try with client_id/client_secret in body first
          form.append('client_id', this.clientId!)
          form.append('client_secret', this.clientSecret!)

          devLog('[v0] Attempting Snov token request (body) to', url)

          let resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form.toString(),
          })

          // If not found or bad request, try Basic auth variant
          if (resp.status === 404 || resp.status === 400) {
            // Try Basic auth (some endpoints expect client credentials via Basic)
            const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
            const basicForm = new URLSearchParams()
            basicForm.append('grant_type', 'client_credentials')

            devLog('[v0] Trying Basic auth token request to', url)
            resp = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basic}`,
              },
              body: basicForm.toString(),
            })
          }

          const text = await resp.text()
          let data: any = null
          try {
            data = text ? JSON.parse(text) : null
          } catch (e) {
            // keep raw text
            data = text
          }

          if (!resp.ok) {
            devLog('[v0] Token request to', url, 'returned', resp.status, data)
            // Try next candidate URL
            continue
          }

          // Expect an access_token in the response
          if (data?.access_token) {
            this.accessToken = data.access_token
            const expiresIn = Number(data.expires_in) || 3600
            this.tokenExpiresAt = Date.now() + expiresIn * 1000 - 5000 // refresh 5s early
            devLog('[v0] Obtained Snov access token from', url, 'expires in', expiresIn)
            return
          } else {
            errorLog('[v0] Snov token response missing access_token from', url, data)
            // try next
            continue
          }
        } catch (innerErr) {
          errorLog('[v0] Error requesting token from', url, innerErr)
          // try next endpoint
          continue
        }
      }

      // If we reach here, no token endpoint succeeded
      errorLog('[v0] Unable to obtain Snov access token from any candidate endpoint')
    } catch (err) {
      errorLog('[v0] Error fetching Snov access token:', err)
    }
  }

  private async ensureAccessToken(): Promise<void> {
    if (!(this.clientId && this.clientSecret)) return
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) return
    await this.fetchAccessToken()
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

      // Ensure we have an access token if client credentials are configured
      await this.ensureAccessToken()

      const authHeader = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`

      let response = await fetch(`${this.apiUrl}/prospects/search`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: searchParams.toString(),
      })

      // If forbidden and we have client credentials, attempt to refresh token once and retry
      if ((response.status === 401 || response.status === 403) && this.clientId && this.clientSecret) {
        devLog("[v0] Received 401/403 from Snov, attempting token refresh and retry")
        await this.fetchAccessToken()
        const retryAuth = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
        response = await fetch(`${this.apiUrl}/prospects/search`, {
          method: "POST",
          headers: {
            Authorization: retryAuth,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: searchParams.toString(),
        })
      }

      if (!response.ok) {
        let errorData: string | Record<string, unknown> = await response.text()
        try {
          errorData = JSON.parse(String(errorData))
        } catch {
          // keep raw text
        }

        errorLog(`Snov.io API error: ${response.status}`, errorData)
        return {
          success: false,
          data: {
            total: 0,
            results: [],
          },
          error: `Snov.io API error: ${response.status} - ${
            typeof errorData === "string" ? errorData : JSON.stringify(errorData)
          }`,
        }
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
