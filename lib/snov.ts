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
  mode?: "domain" | "keyword" // search mode
  domain?: string // required for domain prospect search when mode=domain
  keyword?: string // company name / keyword when mode=keyword
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
  // Simple curated expansion from generic keywords to well-known company names
  private keywordHints: Record<string, string[]> = {
    affiliate: [
      "Impact",
      "CJ",
      "Awin",
      "ShareASale",
      "Rakuten Advertising",
      "Partnerize",
      "ClickBank",
      "Refersion",
      "Tapfiliate",
      "Saasquatch",
    ],
    ecommerce: ["Shopify", "BigCommerce", "WooCommerce", "Magento", "Wix"],
    email: ["Mailchimp", "Klaviyo", "SendGrid", "Brevo", "HubSpot"],
    crm: ["Salesforce", "HubSpot", "Pipedrive", "Zoho", "Freshsales"],
  }

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
   * Start company-domain-by-name task given a keyword/company name
   */
  private async startCompanyDomainByName(keyword: string): Promise<string[] | null> {
    try {
      await this.ensureAccessToken()
      const authHeader = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
      const url = `${this.apiUrl}/company-domain-by-name/start`
      const base = keyword.trim()
      // Expand generic keywords to a broader set of candidate company names
      const lower = base.toLowerCase()
      const hints = this.keywordHints[lower] || []
      // Also try some simple variants (Title Case, lowercase)
      const titleCase = base.replace(/\b\w/g, (c) => c.toUpperCase())
      const names = Array.from(new Set([base, titleCase, ...hints])).filter(Boolean)
      const payload = { names }
      devLog('[v0] Starting company-domain-by-name search', names)
      let resp = await fetch(url, {
        method: 'POST',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if ((resp.status === 401 || resp.status === 403) && this.clientId && this.clientSecret) {
        await this.fetchAccessToken()
        const retryHeader = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
        resp = await fetch(url, {
          method: 'POST',
          headers: { Authorization: retryHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      const text = await resp.text()
      devLog('[v0] company-domain-by-name start response', resp.status, text)
      if (!resp.ok) return null
      let json: any
      try { json = JSON.parse(text) } catch { return null }
      const taskHash = json?.data?.task_hash || json?.task_hash || json?.meta?.task_hash
      if (!taskHash) {
        errorLog('[v0] company-domain-by-name missing task_hash', json)
        return null
      }
      // poll result endpoint
      const resultUrl = `${this.apiUrl}/company-domain-by-name/result?task_hash=${encodeURIComponent(taskHash)}`
      const delays = [800, 1500, 2500, 4000]
      for (let i = 0; i < delays.length; i++) {
        await new Promise(r => setTimeout(r, delays[i]))
        let rResp = await fetch(resultUrl, { headers: { Authorization: authHeader } })
        if ((rResp.status === 401 || rResp.status === 403) && this.clientId && this.clientSecret) {
          await this.fetchAccessToken()
          const retryAuth = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
            rResp = await fetch(resultUrl, { headers: { Authorization: retryAuth } })
        }
        const rText = await rResp.text()
        devLog(`[v0] company-domain-by-name poll ${i+1}`, rResp.status, rText.substring(0,300))
        if (!rResp.ok) continue
        let rJson: any
        try { rJson = JSON.parse(rText) } catch { continue }
        if (rJson.status === 'completed') {
          const domains: string[] = (rJson.data || []).map((d: any) => d?.result?.domain).filter((d: any) => typeof d === 'string' && d.includes('.'))
          return domains.length ? domains : null
        }
      }
      return null
    } catch (e) {
      errorLog('[v0] company-domain-by-name exception', e)
      return null
    }
  }

  /**
   * Start a domain prospect search task (task-based flow per Snov docs)
   */
  private async startDomainProspects(domain: string, positions: string[], page: number): Promise<{ task_hash: string } | null> {
    try {
      await this.ensureAccessToken()
      const authHeader = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
      
      // Try both JSON and form-encoded formats
      const jsonPayload = {
        domain: domain,
        page: page,
        positions: positions,
      }
      
      const formPayload = new URLSearchParams()
      formPayload.append("domain", domain)
      formPayload.append("page", String(page))
      positions.forEach((p) => formPayload.append("positions[]", p))
      
      const url = `${this.apiUrl}/domain-search/prospects/start`
      
      devLog("[v0] Starting domain search:", { domain, positions, page, url })
      
      // Try JSON format first (more common in modern APIs)
      let resp = await fetch(url, {
        method: "POST",
        headers: { 
          Authorization: authHeader, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(jsonPayload),
      })
      
      // If that fails with 400/415, try form-encoded
      if (resp.status === 400 || resp.status === 415) {
        devLog("[v0] JSON format failed, trying form-encoded")
        resp = await fetch(url, {
          method: "POST",
          headers: { 
            Authorization: authHeader, 
            "Content-Type": "application/x-www-form-urlencoded" 
          },
          body: formPayload.toString(),
        })
      }
      
      if ((resp.status === 401 || resp.status === 403) && this.clientId && this.clientSecret) {
        devLog("[v0] startDomainProspects auth error; refreshing token")
        await this.fetchAccessToken()
        const retryAuth = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
        
        // Retry with JSON first
        resp = await fetch(url, {
          method: "POST",
          headers: { 
            Authorization: retryAuth, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify(jsonPayload),
        })
        
        // If still fails, try form
        if (resp.status === 400 || resp.status === 415) {
          resp = await fetch(url, {
            method: "POST",
            headers: { 
              Authorization: retryAuth, 
              "Content-Type": "application/x-www-form-urlencoded" 
            },
            body: formPayload.toString(),
          })
        }
      }
      
      const text = await resp.text()
      devLog(`[v0] startDomainProspects response ${resp.status}:`, text)
      
      if (!resp.ok) {
        errorLog(`[v0] startDomainProspects error ${resp.status}:`, text)
        // Parse error message for better user feedback
        try {
          const errorData = JSON.parse(text)
          if (errorData.errors) {
            const errorMsg = errorData.errors.map((e: any) => Object.values(e).join(': ')).join(', ')
            errorLog(`[v0] Snov API validation error:`, errorMsg)
          }
        } catch {}
        return null
      }
      
      try {
        const json = JSON.parse(text)
        // task_hash can be at root level or nested in meta
        const taskHash = json?.task_hash || json?.meta?.task_hash
        if (taskHash) {
          devLog("[v0] Got task_hash:", taskHash)
          return { task_hash: taskHash }
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
    
    devLog("[v0] Fetching results for task:", taskHash)
    
    let resp = await fetch(url, { headers: { Authorization: authHeader } })
    if ((resp.status === 401 || resp.status === 403) && this.clientId && this.clientSecret) {
      devLog("[v0] getDomainProspectsResult auth error; refreshing token")
      await this.fetchAccessToken()
      const retryAuth = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
      resp = await fetch(url, { headers: { Authorization: retryAuth } })
    }
    
    const text = await resp.text()
    devLog(`[v0] getDomainProspectsResult response ${resp.status}:`, text.substring(0, 500))
    
    if (!resp.ok) {
      errorLog(`[v0] getDomainProspectsResult error ${resp.status}:`, text)
      return null
    }
    try {
      const json = JSON.parse(text)
      devLog("[v0] Result data keys:", Object.keys(json))
      return json
    } catch (e) {
      errorLog("[v0] getDomainProspectsResult parse error:", e)
      return null
    }
  }

  /**
   * Start email search for a specific prospect using the provided start URL.
   */
  private async startProspectEmailSearch(startUrl: string): Promise<string | null> {
    await this.ensureAccessToken()
    const authHeader = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
    let resp = await fetch(startUrl, { method: 'POST', headers: { Authorization: authHeader } })
    if ((resp.status === 401 || resp.status === 403) && this.clientId && this.clientSecret) {
      await this.fetchAccessToken()
      const retryAuth = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
      resp = await fetch(startUrl, { method: 'POST', headers: { Authorization: retryAuth } })
    }
    const text = await resp.text()
    devLog('[v0] startProspectEmailSearch', resp.status, text.substring(0, 300))
    if (!resp.ok) return null
    try {
      const json = JSON.parse(text)
      const taskHash = json?.meta?.task_hash || json?.task_hash
      return taskHash || null
    } catch {
      return null
    }
  }

  /**
   * Fetch result for prospect email search task; return first acceptable email.
   */
  private async getProspectEmailResult(taskHash: string): Promise<string | null> {
    await this.ensureAccessToken()
    const authHeader = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
    const url = `${this.apiUrl}/domain-search/prospects/search-emails/result/${encodeURIComponent(taskHash)}`
    let resp = await fetch(url, { headers: { Authorization: authHeader } })
    if ((resp.status === 401 || resp.status === 403) && this.clientId && this.clientSecret) {
      await this.fetchAccessToken()
      const retryAuth = this.accessToken ? `Bearer ${this.accessToken}` : `Bearer ${this.apiKey}`
      resp = await fetch(url, { headers: { Authorization: retryAuth } })
    }
    const text = await resp.text()
    devLog('[v0] getProspectEmailResult', resp.status, text.substring(0, 300))
    if (!resp.ok) return null
    try {
      const json = JSON.parse(text)
      const emails: any[] = json?.data?.emails || []
      // Prefer valid, then unknown
      const valid = emails.find((e: any) => e?.smtp_status === 'valid')?.email
      if (valid) return valid
      const unknown = emails.find((e: any) => e?.smtp_status === 'unknown')?.email
      return unknown || null
    } catch {
      return null
    }
  }

  /**
   * Public search method: start task, poll for results, map, slice.
   */
  async searchBuyers(params: SnovSearchParams): Promise<SnovSearchResponse> {
    try {
      const mode = params.mode || (params.keyword ? 'keyword' : 'domain')
      let workingDomain = params.domain
      let resolvedDomains: string[] | null = null
      if (mode === 'keyword') {
        if (!params.keyword) {
          return { success: false, data: { total: 0, results: [] }, error: 'Keyword is required' }
        }
        // convert keyword to domain(s)
        const domains = await this.startCompanyDomainByName(params.keyword)
        if (!domains || domains.length === 0) {
          return { success: true, data: { total: 0, results: [] } }
        }
        resolvedDomains = domains
        workingDomain = domains[0]
        devLog('[v0] keyword resolved to domain', workingDomain, 'from', domains)
      }
      if (!workingDomain) {
        return { success: false, data: { total: 0, results: [] }, error: 'Domain is required' }
      }
      
      // Clean domain - remove protocol and paths if present
      let cleanDomain = workingDomain.trim().toLowerCase()
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '') // remove http:// or https://
      cleanDomain = cleanDomain.replace(/^www\./, '') // remove www.
      cleanDomain = cleanDomain.split('/')[0] // remove any paths
      
      devLog("[v0] Cleaned domain:", cleanDomain, "from:", params.domain)
      
      const page = params.page || 1
      let positions: string[] = []
      if (params.title) {
        const tokens = params.title.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 2)
        tokens.forEach((t) => positions.push(t))
      }
      // If no explicit title, inject domain/keyword-based defaults
      if (positions.length === 0) {
        const kw = (params.keyword || '').toLowerCase()
        if (mode === 'keyword' && (/affiliate|partner|partnership/.test(kw))) {
          positions = [
            'Affiliate Manager',
            'Affiliate Marketing',
            'Partnerships Manager',
            'Partner Manager',
            'Head of Partnerships',
          ]
        } else {
          positions = ["manager", "director", "lead", "head"]
        }
      }
      
      const limit = params.limit && params.limit > 0 ? params.limit : Number.MAX_SAFE_INTEGER
      const collected: SnovBuyer[] = []
      const tried: string[] = []

  const domainsToTry = resolvedDomains ? resolvedDomains.slice(0, 3) : [cleanDomain]
      for (const dom of domainsToTry) {
        const d = dom.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
        tried.push(d)
        const start = await this.startDomainProspects(d, positions, page)
        if (!start?.task_hash) {
          continue
        }
        devLog("[v0] Polling for results (domain):", d, 'task', start.task_hash)
        const delays = [1000, 2000, 3000, 4000, 5000]
        let result: any | null = null
        for (let i = 0; i < delays.length; i++) {
          await new Promise((r) => setTimeout(r, delays[i]))
          result = await this.getDomainProspectsResult(start.task_hash)
          if (!result) continue
          const ps = result.prospects || result.data?.prospects || result.data || []
          if (Array.isArray(ps) && ps.length > 0) break
        }
        if (!result) continue
        const prospects = result.prospects || result.data?.prospects || result.data || []
        if (!Array.isArray(prospects) || prospects.length === 0) continue
        // Attempt to enrich each prospect with a verified email if not already present
        for (const p of prospects) {
          if (collected.length >= limit) break
          let email: string = p.email || p.emails?.[0] || ''
          // If no direct email but we have a search_emails_start link try enrichment
          if (!email && p.search_emails_start) {
            const taskHash = await this.startProspectEmailSearch(p.search_emails_start)
            if (taskHash) {
              const emailDelays = [800, 1600, 2500]
              for (let i = 0; i < emailDelays.length && !email; i++) {
                await new Promise(r => setTimeout(r, emailDelays[i]))
                email = (await this.getProspectEmailResult(taskHash)) || ''
              }
            }
          }
          if (!email) continue
          const normEmail = email.toLowerCase()
          if (collected.some(c => c.email.toLowerCase() === normEmail)) continue
          const buyer: SnovBuyer = {
            email,
            first_name: p.first_name || p.firstname || '',
            last_name: p.last_name || p.lastname || '',
            company: p.company_name || p.company || d || '',
            title: p.position || p.title || '',
            linkedin_url: p.linkedin || p.linkedin_url || p.social_linkedin,
            phone: p.phone || p.phones?.[0],
            industry: p.industry || p.company_industry,
            company_size: p.company_size || p.company_size_range,
          }
          collected.push(buyer)
          devLog('[v0] collected prospect', { email: buyer.email, company: buyer.company })
        }
        if (collected.length >= limit) break
      }

      devLog('[v0] search summary', { triedDomains: tried, returned: collected.length, positions })
      return { success: true, data: { total: collected.length, results: collected.slice(0, limit) } }
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
