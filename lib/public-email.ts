import "server-only"

import { devLog, errorLog } from "@/lib/logger"

export interface PublicEmailResult {
  domain: string
  email: string
  type: "generic" | "personal"
  sourceUrl: string
}

interface ExtractOptions {
  pagesPerDomain?: number
  timeoutMs?: number
  roleKeywords?: string[]
}

const DEFAULT_PAGES = [
  "/",
  "/contact",
  "/about",
  "/team",
  "/careers",
  "/jobs",
  "/company",
  "/support",
  "/help",
  "/legal",
  "/privacy",
  "/terms",
  "/partners",
  "/partnerships",
  "/affiliate",
  "/affiliates",
]

const GENERIC_LOCALPARTS = new Set([
  "info",
  "contact",
  "support",
  "hello",
  "hi",
  "team",
  "sales",
  "partners",
  "partnerships",
  "affiliate",
  "affiliates",
  "marketing",
  "press",
  "help",
  "careers",
  "jobs",
])

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
}

function absoluteUrl(domain: string, path: string): string {
  const base = `https://${domain}`
  try {
    const u = new URL(path, base)
    return u.toString()
  } catch {
    return base
  }
}

async function fetchWithTimeout(url: string, opts: { timeoutMs?: number; headers?: Record<string, string> } = {}) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 7000)
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Outbound.ing PublicEmailFinder/1.0 (+https://outbound.ing)",
        ...opts.headers,
      },
      signal: controller.signal,
      cache: "no-store",
    })
    return res
  } finally {
    clearTimeout(t)
  }
}

async function getRobotsTxt(domain: string, timeoutMs: number): Promise<string | null> {
  try {
    const url = absoluteUrl(domain, "/robots.txt")
    const res = await fetchWithTimeout(url, { timeoutMs })
    if (!res.ok) return null
    const text = await res.text()
    return text || null
  } catch (e) {
    devLog("[public-email] robots fetch error", domain, e)
    return null
  }
}

function isAllowedByRobots(robots: string | null, path: string): boolean {
  if (!robots) return true
  // Minimal parser: if Disallow: / for User-agent: * then block
  const lines = robots.split(/\r?\n/)
  let applies = false
  for (const line of lines) {
    const l = line.trim()
    if (!l || l.startsWith("#")) continue
    if (/^User-agent:\s*\*/i.test(l)) {
      applies = true
      continue
    }
    if (/^User-agent:/i.test(l)) {
      applies = false
      continue
    }
    if (!applies) continue
    const m = l.match(/^Disallow:\s*(.*)$/i)
    if (m) {
      const dis = m[1].trim() || "/"
      if (dis === "/") return false
      if (path.startsWith(dis)) return false
    }
  }
  return true
}

function extractEmailsFromHtml(html: string): Set<string> {
  const emails = new Set<string>()
  // mailto links
  const mailtoRegex = /mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi
  let m
  while ((m = mailtoRegex.exec(html))) {
    emails.add(m[1].toLowerCase())
  }
  // plain text
  const textEmailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
  while ((m = textEmailRegex.exec(html))) {
    emails.add(m[0].toLowerCase())
  }
  return emails
}

function classifyEmail(email: string): "generic" | "personal" {
  const local = email.split("@")[0]
  if (GENERIC_LOCALPARTS.has(local)) return "generic"
  // Heuristic: 2+ words likely personal
  if (/[._-]/.test(local)) return "personal"
  return GENERIC_LOCALPARTS.has(local) ? "generic" : "personal"
}

export async function extractPublicEmailsForDomain(
  rawDomain: string,
  options: ExtractOptions = {},
): Promise<PublicEmailResult[]> {
  const domain = normalizeDomain(rawDomain)
  const pages = DEFAULT_PAGES.slice(0, Math.max(1, Math.min(options.pagesPerDomain ?? 8, DEFAULT_PAGES.length)))
  const timeoutMs = options.timeoutMs ?? 7000
  const robots = await getRobotsTxt(domain, timeoutMs)
  const results: PublicEmailResult[] = []
  const seen = new Set<string>()

  for (const path of pages) {
    try {
      if (!isAllowedByRobots(robots, path)) {
        devLog("[public-email] blocked by robots", domain, path)
        continue
      }
      const url = absoluteUrl(domain, path)
      const res = await fetchWithTimeout(url, { timeoutMs })
      if (!res.ok) {
        devLog("[public-email] fetch not ok", url, res.status)
        continue
      }
      const html = await res.text()
      const emails = extractEmailsFromHtml(html)
      for (const email of emails) {
        if (!email.endsWith("@" + domain)) continue
        if (seen.has(email)) continue
        seen.add(email)
        results.push({ domain, email, type: classifyEmail(email), sourceUrl: url })
      }
    } catch (e) {
      devLog("[public-email] page fetch error", domain, path, e)
    }
  }
  return results
}

export function resolveDomainsFromKeyword(keyword?: string): string[] {
  if (!keyword) return []
  const k = keyword.trim().toLowerCase()
  const map: Record<string, string[]> = {
    affiliate: ["impact.com", "cj.com", "awin.com", "rakutenadvertising.com", "partnerize.com", "refersion.com"],
    ecommerce: ["shopify.com", "bigcommerce.com", "woocommerce.com", "magento.com", "wix.com"],
    email: ["mailchimp.com", "klaviyo.com", "sendgrid.com", "hubspot.com"],
    crm: ["salesforce.com", "hubspot.com", "pipedrive.com", "zoho.com"],
  }
  return map[k] || []
}

export async function publicEmailFinder(
  params: { keyword?: string; domains?: string[]; pagesPerDomain?: number },
): Promise<{ results: PublicEmailResult[] }> {
  const domains: string[] = []
  const fromKeyword = resolveDomainsFromKeyword(params.keyword)
  domains.push(...fromKeyword)
  if (params.domains) domains.push(...params.domains)
  const uniqueDomains = Array.from(new Set(domains.map(normalizeDomain))).slice(0, 10)

  const all: PublicEmailResult[] = []
  for (const d of uniqueDomains) {
    const res = await extractPublicEmailsForDomain(d, { pagesPerDomain: params.pagesPerDomain ?? 8 })
    all.push(...res)
  }
  return { results: all }
}
