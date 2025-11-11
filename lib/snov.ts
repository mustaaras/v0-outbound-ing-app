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
  domain?: string // required for domain prospect search
  title?: string // free-text job title to be tokenized into positions[]
  limit?: number // desired number of prospects to return (client slices)
  page?: number // optional page for pagination (default 1)
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
    // Snov.io uses v1/oauth/access_token for token generation (per their docs)
    this.tokenUrl = process.env.SNOV_TOKEN_URL || "https://api.snov.io/v1/oauth/access_token"

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
   * Start a domain prospect search task (task-based flow per Snov docs)
   */
  private async startDomainProspects(domain: string, positions: string[], page: number): Promise<{ task_hash: string } | null> {
    try {
      await this.ensureAccessToken()
      const authHeader = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
      const body = new URLSearchParams()
      body.append("domain", domain)
      body.append("page", String(page))
      positions.forEach((p) => body.append("positions[]", p))
      const url = `${this.apiUrl}/domain-search/prospects/start`
      
      devLog("[v0] Starting domain search:", { domain, positions, page, url })
      
      let resp = await fetch(url, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      })
      
      if ((resp.status === 401 || resp.status === 403) && this.clientId && this.clientSecret) {
        devLog("[v0] startDomainProspects auth error; refreshing token")
        await this.fetchAccessToken()
        const retryAuth = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
        resp = await fetch(url, {
          method: "POST",
          headers: { Authorization: retryAuth, "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        })
      }
      
      const text = await resp.text()
      devLog(`[v0] startDomainProspects response ${resp.status}:`, text)
      
      if (!resp.ok) {
        errorLog(`[v0] startDomainProspects error ${resp.status}:`, text)
        return null
      }
      
      try {
        const json = JSON.parse(text)
        if (json?.task_hash) {
          devLog("[v0] Got task_hash:", json.task_hash)
          return { task_hash: json.task_hash }
        }
        errorLog("[v0] startDomainProspects missing task_hash:", json)
        return null
      } catch (e) {
        errorLog("[v0] startDomainProspects parse error:", e, "Text:", text)
        return null
      }
    } catch (error) {
      errorLog("[v0] startDomainProspects exception:", error)
      return null
    }
  }

  /**
   * Retrieve results for a previously started domain prospect search task.
   */
  private async getDomainProspectsResult(taskHash: string): Promise<any | null> {
    await this.ensureAccessToken()
    const authHeader = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
    const url = `${this.apiUrl}/domain-search/prospects/result/${encodeURIComponent(taskHash)}`
    let resp = await fetch(url, { headers: { Authorization: authHeader } })
    if ((resp.status === 401 || resp.status === 403) && this.clientId && this.clientSecret) {
      devLog("[v0] getDomainProspectsResult auth error; refreshing token")
      await this.fetchAccessToken()
      const retryAuth = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
      resp = await fetch(url, { headers: { Authorization: retryAuth } })
    }
    if (!resp.ok) {
      const text = await resp.text()
      errorLog(`[v0] getDomainProspectsResult error ${resp.status}`, text)
      return null
    }
    try {
      return await resp.json()
    } catch (e) {
      errorLog("[v0] getDomainProspectsResult parse error", e)
      return null
    }
  }

  /**
   * Public search method: start task, poll for results, map, slice.
   */
  async searchBuyers(params: SnovSearchParams): Promise<SnovSearchResponse> {
    try {
      if (!params.domain) {
        return { success: false, data: { total: 0, results: [] }, error: "Domain is required" }
      }
      
      // Clean domain - remove protocol and paths if present
      let cleanDomain = params.domain.trim().toLowerCase()
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '') // remove http:// or https://
      cleanDomain = cleanDomain.replace(/^www\./, '') // remove www.
      cleanDomain = cleanDomain.split('/')[0] // remove any paths
      
      devLog("[v0] Cleaned domain:", cleanDomain, "from:", params.domain)
      
      const page = params.page || 1
      const positions: string[] = []
      if (params.title) {
        const tokens = params.title.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 2)
        tokens.forEach((t) => positions.push(t))
      }
      if (positions.length === 0) {
        positions.push("manager", "director", "lead", "head")
      }
      
      const start = await this.startDomainProspects(cleanDomain, positions, page)
      if (!start?.task_hash) {
        return { success: false, data: { total: 0, results: [] }, error: "Failed to start search. Please check the domain is valid and accessible." }
      }
      
      const delays = [400, 700, 1100, 1600, 2200]
      let result: any | null = null
      for (let i = 0; i < delays.length; i++) {
        result = await this.getDomainProspectsResult(start.task_hash)
        if (result && (result.prospects || result.results || result.data?.prospects)) break
        await new Promise((r) => setTimeout(r, delays[i]))
      }
      if (!result) {
        return { success: false, data: { total: 0, results: [] }, error: "Timed out waiting for results" }
      }
      const prospects = result.prospects || result.results || result.data?.prospects || []
      const total = result.total || result.count || prospects.length || 0
      const mapped: SnovBuyer[] = prospects.map((p: any) => ({
        email: p.email || p.emails?.[0] || "",
        first_name: p.first_name || p.firstname || "",
        last_name: p.last_name || p.lastname || "",
        company: p.company_name || p.company || cleanDomain || "",
        title: p.position || p.title || "",
        linkedin_url: p.linkedin || p.linkedin_url || p.social_linkedin,
        phone: p.phone || p.phones?.[0],
        industry: p.industry || p.company_industry,
        company_size: p.company_size || p.company_size_range,
      }))
      const limit = params.limit && params.limit > 0 ? params.limit : mapped.length
      const sliced = mapped.slice(0, limit)
      devLog("[v0] domain search", { domain: cleanDomain, total, returned: sliced.length, positions })
      return { success: true, data: { total, results: sliced } }
    } catch (error) {
      errorLog("[v0] domain search error", error)
      return { success: false, data: { total: 0, results: [] }, error: error instanceof Error ? error.message : "Failed to search prospects" }
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
