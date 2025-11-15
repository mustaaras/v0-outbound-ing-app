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

  /**
   * Enhanced email validation - much more strict than basic regex
   */
  static isValidEmailFormat(email: string): boolean {
    if (!email || typeof email !== 'string') return false

    // Basic format check
    const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!basicRegex.test(email)) return false

    const [localPart, domainPart] = email.split('@')
    if (!localPart || !domainPart) return false

    // Local part validation
    // Should not be empty, not start/end with dots, no consecutive dots
    if (localPart.length === 0 || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
      return false
    }

    // Domain part validation
    if (domainPart.length === 0 || domainPart.startsWith('.') || domainPart.endsWith('.')) {
      return false
    }

    // Domain should have at least one dot and a valid TLD
    const domainParts = domainPart.split('.')
    if (domainParts.length < 2) return false

    // Check for file extensions (common false positives)
    const invalidExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.doc', '.docx', '.txt', '.html', '.css', '.js']
    const lowerDomain = domainPart.toLowerCase()
    if (invalidExtensions.some(ext => lowerDomain.endsWith(ext))) {
      return false
    }

    // Check for valid TLD (must be at least 2 characters, no numbers only)
    const tld = domainParts[domainParts.length - 1].toLowerCase()
    if (tld.length < 2 || /^\d+$/.test(tld)) {
      return false
    }

    // Common valid TLDs (not exhaustive but covers most cases)
    const validTlds = ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name', 'pro', 'coop', 'aero', 'museum', 'travel', 'jobs', 'mobi', 'cat', 'tel', 'asia', 'post', 'xxx', 'ac', 'ad', 'ae', 'af', 'ag', 'ai', 'al', 'am', 'an', 'ao', 'aq', 'ar', 'as', 'at', 'au', 'aw', 'ax', 'az', 'ba', 'bb', 'bd', 'be', 'bf', 'bg', 'bh', 'bi', 'bj', 'bm', 'bn', 'bo', 'br', 'bs', 'bt', 'bv', 'bw', 'by', 'bz', 'ca', 'cc', 'cd', 'cf', 'cg', 'ch', 'ci', 'ck', 'cl', 'cm', 'cn', 'co', 'cr', 'cu', 'cv', 'cx', 'cy', 'cz', 'de', 'dj', 'dk', 'dm', 'do', 'dz', 'ec', 'ee', 'eg', 'er', 'es', 'et', 'eu', 'fi', 'fj', 'fk', 'fm', 'fo', 'fr', 'ga', 'gb', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gl', 'gm', 'gn', 'gp', 'gq', 'gr', 'gs', 'gt', 'gu', 'gw', 'gy', 'hk', 'hm', 'hn', 'hr', 'ht', 'hu', 'id', 'ie', 'il', 'im', 'in', 'io', 'iq', 'ir', 'is', 'it', 'je', 'jm', 'jo', 'jp', 'ke', 'kg', 'kh', 'ki', 'km', 'kn', 'kp', 'kr', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lk', 'lr', 'ls', 'lt', 'lu', 'lv', 'ly', 'ma', 'mc', 'md', 'me', 'mg', 'mh', 'mk', 'ml', 'mm', 'mn', 'mo', 'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'mv', 'mw', 'mx', 'my', 'mz', 'na', 'nc', 'ne', 'nf', 'ng', 'ni', 'nl', 'no', 'np', 'nr', 'nu', 'nz', 'om', 'pa', 'pe', 'pf', 'pg', 'ph', 'pk', 'pl', 'pm', 'pn', 'pr', 'ps', 'pt', 'pw', 'py', 'qa', 're', 'ro', 'rs', 'ru', 'rw', 'sa', 'sb', 'sc', 'sd', 'se', 'sg', 'sh', 'si', 'sj', 'sk', 'sl', 'sm', 'sn', 'so', 'sr', 'st', 'su', 'sv', 'sy', 'sz', 'tc', 'td', 'tf', 'tg', 'th', 'tj', 'tk', 'tl', 'tm', 'tn', 'to', 'tp', 'tr', 'tt', 'tv', 'tw', 'tz', 'ua', 'ug', 'uk', 'um', 'us', 'uy', 'uz', 'va', 'vc', 've', 'vg', 'vi', 'vn', 'vu', 'wf', 'ws', 'ye', 'yt', 'yu', 'za', 'zm', 'zw']

    if (!validTlds.includes(tld)) {
      return false
    }

    return true
  }

  /**
   * Extract emails from website content, including JSON-LD structured data
   */
  static extractEmailsFromText(text: string): string[] {
    const matches: string[] = []

    // Helper: decode numeric/hex HTML entities (e.g. &#64; or &#x40;)
    const decodeHtmlEntities = (input: string) => {
      return input.replace(/&#x([0-9A-Fa-f]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
                  .replace(/&#([0-9]+);/g, (_m, dec) => String.fromCharCode(parseInt(dec, 10)))
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&apos;/g, "'")
    }

    // Normalize common obfuscations like 'name [at] domain dot com' -> 'name@domain.com'
    const normalizeObfuscation = (s: string) => {
      return s
        .replace(/\[at\]|\(at\)|\s+at\s+/gi, '@')
        .replace(/\[dot\]|\(dot\)|\s+dot\s+/gi, '.')
        .replace(/\s+\(at\)\s+/gi, '@')
        .replace(/\s+\(dot\)\s+/gi, '.')
        .replace(/\s+\[at\]\s+/gi, '@')
        .replace(/\s+\[dot\]\s+/gi, '.')
        .replace(/\s+@\s+/g, '@')
        .replace(/\s+\.\s+/g, '.')
    }

    // 1) Extract emails from mailto: links
    try {
      const mailtoRegex = /href=["']mailto:([^"'>\s?]+)["']/gi
      let m
      while ((m = mailtoRegex.exec(text)) !== null) {
        const decoded = decodeHtmlEntities(m[1])
        matches.push(decoded)
      }
    } catch (e) {
      // ignore
    }

    // 2) Extract emails from plain text (after decoding entities)
    try {
      const decodedText = decodeHtmlEntities(text)
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const plainTextMatches = decodedText.match(emailRegex) || []
      matches.push(...plainTextMatches)
    } catch (e) {
      // ignore
    }

    // 3) Handle obfuscated patterns like 'name [at] domain dot com' or 'name(at)domain.com'
    try {
      const obfRegex = /[\w.+%-]+\s*(?:\[at\]|\(at\)|@|\s+at\s+)\s*[\w.-]+\s*(?:\[dot\]|\(dot\)|\.|\s+dot\s+)\s*[a-zA-Z]{2,}/gi
      let o
      while ((o = obfRegex.exec(text)) !== null) {
        const candidate = normalizeObfuscation(o[0])
        // Extract normalized email if it matches email pattern
        const emailMatch = candidate.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
        if (emailMatch) matches.push(emailMatch[0])
      }
    } catch (e) {
      // ignore
    }

    // 4) Look for data attributes or JS variables that might contain emails
    try {
      const dataAttrRegex = /data[-_](?:email|contact)["']?\s*[:=]?\s*["']([^"']+)["']/gi
      let d
      while ((d = dataAttrRegex.exec(text)) !== null) {
        const decoded = decodeHtmlEntities(d[1])
        // normalize and check
        const norm = normalizeObfuscation(decoded)
        const em = norm.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
        if (em) matches.push(em[0])
      }
    } catch (e) {
      // ignore
    }

    // Extract emails from JSON-LD structured data
    try {
      // Find all JSON-LD script tags (handle multiline content)
      const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      let jsonLdMatch
      while ((jsonLdMatch = jsonLdRegex.exec(text)) !== null) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1])
          
          // Handle both single objects and arrays of objects
          const entities = Array.isArray(jsonData) ? jsonData : [jsonData]
          
          for (const entity of entities) {
            // Extract email from various JSON-LD properties
            if (entity.email) {
              if (Array.isArray(entity.email)) {
                matches.push(...entity.email)
              } else {
                matches.push(entity.email)
              }
            }
            
            // Also check nested contactPoint objects
            if (entity.contactPoint) {
              const contactPoints = Array.isArray(entity.contactPoint) ? entity.contactPoint : [entity.contactPoint]
              for (const contactPoint of contactPoints) {
                if (contactPoint.email) {
                  if (Array.isArray(contactPoint.email)) {
                    matches.push(...contactPoint.email.map((e: string) => decodeHtmlEntities(e)))
                  } else {
                    matches.push(decodeHtmlEntities(contactPoint.email))
                  }
                }
              }
            }
          }
        } catch (parseError) {
          // Skip invalid JSON-LD blocks
          continue
        }
      }
    } catch (error) {
      // Continue if JSON-LD parsing fails
    }

    // Remove duplicates and return
    // Final normalization: decode entities and filter
    const final = matches
      .map(m => m.trim())
      .map(m => decodeHtmlEntities(m))
      .map(m => normalizeObfuscation(m))
      .filter(m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m))

    // Remove duplicates and return
    return [...new Set(final)]
  }

  /**
   * Scrape website for contact information
   * Note: This is a basic implementation. In production, consider using a proper scraping service.
   */
  static async scrapeWebsiteForContacts(website: string, retries: number = 2): Promise<{
    emails: string[]
    success: boolean
    error?: string
  }> {
    // Lightweight in-memory cache (per-process). Keyed by domain. TTL = 24 hours.
    const CACHE_TTL = 1000 * 60 * 60 * 24
    if (!(global as any).__outbound_scrape_cache) (global as any).__outbound_scrape_cache = new Map<string, { ts: number; emails: string[] }>()
    const cache: Map<string, { ts: number; emails: string[] }> = (global as any).__outbound_scrape_cache

    let lastError: string = ''

    // Normalize website URL
    const normalize = (url: string) => {
      if (!url.startsWith('http')) return 'https://' + url
      return url
    }

    const domainKey = (() => {
      try {
        const u = new URL(normalize(website))
        return u.hostname.replace(/^www\./, '')
      } catch {
        return website
      }
    })()

    // Return cached if fresh
    const cached = cache.get(domainKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return { emails: cached.emails, success: cached.emails.length > 0 }
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (!website.startsWith('http')) {
          website = 'https://' + website
        }

        const response = await fetch(website, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; OutboundBot/1.0)',
          },
          signal: AbortSignal.timeout(5000),
        })

        if (!response.ok) {
          lastError = `HTTP ${response.status}`
          if (attempt < retries) continue
          return { emails: [], success: false, error: lastError }
        }

        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
          return { emails: [], success: false, error: 'Not an HTML page' }
        }

        const html = await response.text()
        if (html.length < 100 || html.includes('<html') === false) {
          return { emails: [], success: false, error: 'Invalid HTML content' }
        }

        // Extract emails from homepage first
        let allEmails: string[] = this.extractEmailsFromText(html)

        // If we already have enough emails, cache & return
  const MAX_EMAILS = 3
        if (allEmails.length >= MAX_EMAILS) {
          const unique = [...new Set(allEmails)].slice(0, MAX_EMAILS)
          cache.set(domainKey, { ts: Date.now(), emails: unique })
          return { emails: unique, success: true }
        }

        // Find candidate contact pages (more aggressive international patterns)
        // Extract candidate contact pages using both regex and lightweight DOM section parsing
        const contactCandidates = this.findContactPages(html, website)

        // Try to parse nav/header/footer anchors in order to prioritize likely contact pages
        try {
          const navMatches = [] as { href: string; text: string }[]

          const navSectionRegex = /<nav[\s\S]*?>[\s\S]*?<\/nav>/gi
          const headerSectionRegex = /<header[\s\S]*?>[\s\S]*?<\/header>/gi
          const footerSectionRegex = /<footer[\s\S]*?>[\s\S]*?<\/footer>/gi

          const extractAnchors = (sectionHtml: string) => {
            const aRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
            let m
            while ((m = aRegex.exec(sectionHtml)) !== null) {
              const href = m[1]
              const txt = m[2].replace(/<[^>]+>/g, '').trim()
              if (href) navMatches.push({ href, text: txt })
            }
          }

          let m
          while ((m = navSectionRegex.exec(html)) !== null) extractAnchors(m[0])
          while ((m = headerSectionRegex.exec(html)) !== null) extractAnchors(m[0])
          while ((m = footerSectionRegex.exec(html)) !== null) extractAnchors(m[0])

          // Add navMatches to contactCandidates with priority based on anchor text
          for (const a of navMatches) {
            try {
              const resolved = new URL(a.href, website).toString()
              // prepend so nav/footer anchors get higher priority
              contactCandidates.unshift(resolved)
            } catch {
              // ignore
            }
          }
        } catch (e) {
          // ignore DOM parsing failures
        }
        const filtered = contactCandidates
          .map(u => {
            try { return new URL(u, website).toString() } catch { return u }
          })
          .filter(u => !u.match(/\.(png|jpg|jpeg|gif|svg|webp|pdf|doc|docx)(\?.*)?$/i))

        // Prioritize candidates that contain contact-like keywords
        const priority = ['contact', 'iletisim', 'contact-us', 'contactus', 'kontakt', 'contato', 'kontakt', 'kontakt-os', 'kontakt-us', 'about', 'reach']
        const scored = filtered
          .map(u => ({ u, score: priority.reduce((s, k) => s + (u.toLowerCase().includes(k) ? 2 : 0), 0) }))
          .sort((a, b) => b.score - a.score)
          .map(s => s.u)

  // Limit how many pages we will attempt to fetch (reduced default for speed/politeness)
  const MAX_PAGES = 3
  const toFetch = [...new Set(scored)].slice(0, MAX_PAGES)

  // A simple concurrency pool (reduced)
  const CONCURRENCY = 2
        const results: string[] = []

        const tasks = toFetch.slice()
        const workers: Promise<void>[] = []

        const fetchOne = async (url: string) => {
          try {
            const r = await fetch(url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OutboundBot/1.0)' },
              signal: AbortSignal.timeout(8000),
            })
            const ct = r.headers.get('content-type') || ''
            if (!r.ok || (!ct.includes('text/html') && !ct.includes('application/xhtml'))) return
            const text = await r.text()
            if (text.length < 100 || text.includes('<html') === false) return
            const emails = this.extractEmailsFromText(text)
            for (const e of emails) results.push(e)
          } catch (err) {
            // ignore individual failures
          }
        }

        for (let i = 0; i < CONCURRENCY; i++) {
          const worker = (async () => {
            while (tasks.length > 0 && results.length < MAX_EMAILS) {
              const next = tasks.shift()
              if (!next) break
              await fetchOne(next)
            }
          })()
          workers.push(worker)
        }

        await Promise.all(workers)

        allEmails = allEmails.concat(results)

        const uniqueEmails = [...new Set(allEmails)]
          .filter(email => this.isValidEmailFormat(email))
          .filter(email => {
            const lowerEmail = email.toLowerCase()
            return !lowerEmail.includes('noreply') && !lowerEmail.includes('no-reply') && !lowerEmail.includes('donotreply') && !lowerEmail.includes('do-not-reply')
          })
          .slice(0, MAX_EMAILS)

        // Cache result
        cache.set(domainKey, { ts: Date.now(), emails: uniqueEmails })

        return { emails: uniqueEmails, success: uniqueEmails.length > 0 }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          continue
        }
        return { emails: [], success: false, error: lastError }
      }
    }

    return { emails: [], success: false, error: lastError }
  }

  /**
   * Find contact page URLs from website HTML
   */
  static findContactPages(html: string, baseUrl: string): string[] {
    const contactUrls: string[] = []

    try {
      const url = new URL(baseUrl)
      const baseDomain = url.origin

      // Common contact page patterns (expanded list)
      const patterns = [
        /href=["']([^"']*contact[^"']*)["']/gi,
        /href=["']([^"']*about[^"']*)["']/gi,
        /href=["']([^"']*reach[^"']*)["']/gi,
        /href=["']([^"']*connect[^"']*)["']/gi,
        /href=["']([^"']*support[^"']*)["']/gi,
        /href=["']([^"']*help[^"']*)["']/gi,
        /href=["']([^"']*inquiry[^"']*)["']/gi,
        /href=["']([^"']*inquiries[^"']*)["']/gi,
        /href=["']([^"']*get-in-touch[^"']*)["']/gi,
        /href=["']([^"']*touch[^"']*)["']/gi,
      ]

      for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
          let href = match[1]
          if (href.startsWith('/')) {
            href = baseDomain + href
          } else if (!href.startsWith('http')) {
            href = baseDomain + '/' + href
          }

          // More inclusive filtering for contact-related pages
          if (href.includes('contact') || href.includes('about') || href.includes('support') || 
              href.includes('help') || href.includes('inquir') || href.includes('touch') ||
              href.includes('reach') || href.includes('connect')) {
            contactUrls.push(href)
          }
        }
      }

      // Add common contact URLs (expanded list)
      const commonPaths = [
        '/contact',
        '/about',
        '/contact-us',
        '/about-us',
        '/support',
        '/help',
        '/contact-us/',
        '/about-us/',
        '/support/',
        '/help/',
        '/get-in-touch',
        '/reach-us',
        '/connect',
        '/inquiry',
        '/inquiries'
      ]

      for (const path of commonPaths) {
        contactUrls.push(`${baseDomain}${path}`)
      }

      return [...new Set(contactUrls)]
    } catch {
      return []
    }
  }
}

// Placeholder for future client-side Google Maps integration
// This will be implemented in a client component
export function getGoogleMapsClient() {
  throw new Error("Google Maps client is only available on the client side. Use a client component instead.")
}