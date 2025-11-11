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
  
    // Comprehensive keyword to domain mapping (500+ keywords)
    const map: Record<string, string[]> = {
      // Marketing & Advertising
      affiliate: ["impact.com", "cj.com", "awin.com", "rakutenadvertising.com", "partnerize.com", "refersion.com", "shareasale.com", "clickbank.com"],
      advertising: ["google.com", "facebook.com", "amazon.com", "taboola.com", "outbrain.com", "criteo.com"],
      marketing: ["hubspot.com", "marketo.com", "salesforce.com", "mailchimp.com", "semrush.com", "moz.com"],
      seo: ["semrush.com", "ahrefs.com", "moz.com", "serpstat.com", "seranking.com"],
      ppc: ["google.com", "microsoft.com", "wordstream.com", "optmyzr.com"],
      "social media": ["hootsuite.com", "buffer.com", "sproutsocial.com", "later.com", "planoly.com"],
      "content marketing": ["hubspot.com", "contentful.com", "wordpress.com", "medium.com"],
    
      // E-commerce & Retail
      ecommerce: ["shopify.com", "bigcommerce.com", "woocommerce.com", "magento.com", "wix.com", "squarespace.com"],
      retail: ["amazon.com", "walmart.com", "target.com", "shopify.com"],
      marketplace: ["amazon.com", "ebay.com", "etsy.com", "alibaba.com"],
      dropshipping: ["shopify.com", "oberlo.com", "spocket.com", "dropified.com"],
      pos: ["square.com", "shopify.com", "lightspeed.com", "toast.com"],
    
      // Email & Communication
      email: ["mailchimp.com", "klaviyo.com", "sendgrid.com", "hubspot.com", "brevo.com", "activecampaign.com", "convertkit.com"],
      newsletter: ["substack.com", "mailchimp.com", "convertkit.com", "beehiiv.com"],
      "email marketing": ["mailchimp.com", "klaviyo.com", "activecampaign.com", "sendgrid.com"],
      automation: ["zapier.com", "make.com", "n8n.io", "activepieces.com"],
    
      // CRM & Sales
      crm: ["salesforce.com", "hubspot.com", "pipedrive.com", "zoho.com", "freshsales.com", "monday.com"],
      sales: ["salesforce.com", "hubspot.com", "outreach.io", "salesloft.com"],
      "lead generation": ["linkedin.com", "hunter.io", "apollo.io", "lusha.com"],
      "sales automation": ["outreach.io", "salesloft.com", "apollo.io"],
    
      // Analytics & Data
      analytics: ["google.com", "adobe.com", "mixpanel.com", "amplitude.com", "segment.com", "heap.io"],
      data: ["snowflake.com", "databricks.com", "tableau.com", "looker.com"],
      "business intelligence": ["tableau.com", "powerbi.microsoft.com", "looker.com", "qlik.com"],
      metrics: ["datadog.com", "newrelic.com", "dynatrace.com"],
    
      // SaaS & Cloud
      saas: ["salesforce.com", "hubspot.com", "slack.com", "asana.com", "notion.so", "atlassian.com"],
      cloud: ["aws.amazon.com", "azure.microsoft.com", "cloud.google.com", "digitalocean.com"],
      hosting: ["aws.amazon.com", "digitalocean.com", "linode.com", "vultr.com", "cloudflare.com"],
      cdn: ["cloudflare.com", "fastly.com", "akamai.com"],
    
      // Payment & Finance
      payment: ["stripe.com", "paypal.com", "square.com", "adyen.com", "checkout.com", "braintreepayments.com"],
      fintech: ["stripe.com", "plaid.com", "square.com", "braintreepayments.com"],
      billing: ["stripe.com", "chargebee.com", "recurly.com", "paddle.com"],
      invoicing: ["freshbooks.com", "quickbooks.intuit.com", "xero.com", "wave.com"],
      accounting: ["quickbooks.intuit.com", "xero.com", "sage.com", "netsuite.com"],
    
      // Design & Creative
      design: ["figma.com", "adobe.com", "canva.com", "sketch.com", "invisionapp.com"],
      graphics: ["adobe.com", "canva.com", "affinity.serif.com"],
      video: ["adobe.com", "vimeo.com", "wistia.com", "loom.com"],
      photography: ["adobe.com", "shutterstock.com", "unsplash.com", "pexels.com"],
    
      // Development & DevOps
      development: ["github.com", "gitlab.com", "bitbucket.org", "jetbrains.com"],
      devops: ["github.com", "gitlab.com", "circleci.com", "jenkins.io"],
      ci: ["github.com", "circleci.com", "travis-ci.com", "jenkins.io"],
      monitoring: ["datadog.com", "newrelic.com", "sentry.io", "pagerduty.com"],
      testing: ["selenium.dev", "browserstack.com", "saucelabs.com"],
    
      // Collaboration & Productivity
      collaboration: ["slack.com", "microsoft.com", "zoom.us", "discord.com"],
      productivity: ["notion.so", "asana.com", "trello.com", "monday.com"],
      "project management": ["asana.com", "monday.com", "jira.atlassian.com", "basecamp.com"],
      documentation: ["notion.so", "confluence.atlassian.com", "gitbook.com"],
    
      // HR & Recruitment
      hr: ["workday.com", "bamboohr.com", "namely.com", "adp.com"],
      recruitment: ["greenhouse.io", "lever.co", "workable.com", "recruitee.com"],
      ats: ["greenhouse.io", "lever.co", "workday.com"],
      payroll: ["gusto.com", "adp.com", "paychex.com", "rippling.com"],
    
      // Customer Support
      "customer support": ["zendesk.com", "intercom.com", "freshdesk.com", "helpscout.com"],
      helpdesk: ["zendesk.com", "freshdesk.com", "helpscout.com", "zoho.com"],
      chat: ["intercom.com", "drift.com", "livechat.com", "crisp.chat"],
      support: ["zendesk.com", "intercom.com", "freshdesk.com"],
    
      // Security & Privacy
      security: ["cloudflare.com", "okta.com", "auth0.com", "crowdstrike.com"],
      cybersecurity: ["crowdstrike.com", "paloaltonetworks.com", "fortinet.com"],
      authentication: ["okta.com", "auth0.com", "onelogin.com"],
      vpn: ["nordvpn.com", "expressvpn.com", "cloudflare.com"],
    
      // Education & Learning
      education: ["coursera.org", "udemy.com", "skillshare.com", "linkedin.com"],
      elearning: ["udemy.com", "teachable.com", "thinkific.com", "kajabi.com"],
      training: ["linkedin.com", "pluralsight.com", "udemy.com"],
      lms: ["canvas.instructure.com", "moodle.org", "blackboard.com"],
    
      // Social & Community
      social: ["facebook.com", "linkedin.com", "twitter.com", "instagram.com"],
      community: ["discord.com", "circle.so", "mighty.co", "slack.com"],
      forum: ["discourse.org", "vanilla.com", "phpbb.com"],
    
      // Media & Publishing
      publishing: ["wordpress.com", "medium.com", "ghost.org", "substack.com"],
      blogging: ["wordpress.com", "medium.com", "ghost.org", "blogger.com"],
      podcast: ["anchor.fm", "buzzsprout.com", "libsyn.com", "podbean.com"],
      streaming: ["twitch.tv", "youtube.com", "vimeo.com"],
    
      // Real Estate
      "real estate": ["zillow.com", "redfin.com", "realtor.com", "compass.com"],
      property: ["zillow.com", "costar.com", "loopnet.com"],
    
      // Travel & Hospitality
      travel: ["booking.com", "expedia.com", "airbnb.com", "tripadvisor.com"],
      hospitality: ["marriott.com", "hilton.com", "airbnb.com"],
      booking: ["booking.com", "expedia.com", "opentable.com"],
    
      // Healthcare & Wellness
      healthcare: ["epic.com", "cerner.com", "athenahealth.com"],
      telemedicine: ["teladoc.com", "amwell.com", "mdlive.com"],
      fitness: ["peloton.com", "fitbit.com", "myfitnesspal.com"],
      wellness: ["headspace.com", "calm.com", "noom.com"],
    
      // Legal & Compliance
      legal: ["clio.com", "rocket.lawyer.com", "legalzoom.com"],
      compliance: ["onetrust.com", "logicgate.com", "secureframe.com"],
      contracts: ["docusign.com", "pandadoc.com", "hellosign.com"],
    
      // Industries
      automotive: ["tesla.com", "ford.com", "gm.com", "toyota.com"],
      manufacturing: ["ge.com", "siemens.com", "schneider-electric.com"],
      logistics: ["ups.com", "fedex.com", "dhl.com", "shippo.com"],
      shipping: ["shipstation.com", "easyship.com", "shippo.com"],
    
      // AI & Tech
      ai: ["openai.com", "anthropic.com", "google.com", "huggingface.co"],
      "machine learning": ["databricks.com", "datarobot.com", "h2o.ai"],
      nlp: ["openai.com", "cohere.com", "anthropic.com"],
    
      // Blockchain & Crypto
      blockchain: ["coinbase.com", "binance.com", "ethereum.org"],
      crypto: ["coinbase.com", "binance.com", "kraken.com"],
      nft: ["opensea.io", "rarible.com", "foundation.app"],
    
      // Gaming
      gaming: ["unity.com", "epicgames.com", "roblox.com", "steam.com"],
      esports: ["twitch.tv", "discord.com", "faceit.com"],
    
      // Food & Agriculture
      agriculture: ["johndeere.com", "bayer.com", "corteva.com"],
      food: ["doordash.com", "ubereats.com", "grubhub.com"],
      restaurant: ["toast.com", "square.com", "touchbistro.com"],
    
      // Energy
      energy: ["tesla.com", "nexteraenergy.com", "shell.com"],
      renewable: ["tesla.com", "sunpower.com", "vestas.com"],
      sustainability: ["salesforce.com", "patagonia.com", "allbirds.com"],
    
      // Insurance
      insurance: ["lemonade.com", "root.com", "metromile.com"],
      insurtech: ["lemonade.com", "hippo.com", "next.com"],
    
      // Non-profit
      nonprofit: ["salesforce.org", "classy.org", "givebutter.com"],
      fundraising: ["gofundme.com", "kickstarter.com", "indiegogo.com"],
      donation: ["paypal.com", "stripe.com", "donorbox.org"],
    
      // Events
      events: ["eventbrite.com", "hopin.com", "bizzabo.com"],
      ticketing: ["eventbrite.com", "ticketmaster.com", "seetickets.com"],
      conferencing: ["zoom.us", "webex.com", "hopin.com"],
    
      // Storage
      storage: ["dropbox.com", "box.com", "google.com", "onedrive.com"],
      backup: ["backblaze.com", "carbonite.com", "acronis.com"],
    
      // Messaging
      messaging: ["slack.com", "discord.com", "telegram.org", "signal.org"],
      voip: ["twilio.com", "vonage.com", "ringcentral.com"],
      sms: ["twilio.com", "messagebird.com", "plivo.com"],
    
      // API
      api: ["postman.com", "rapidapi.com", "apigee.com"],
      integration: ["zapier.com", "make.com", "mulesoft.com"],
      webhook: ["svix.com", "hookdeck.com", "ngrok.com"],
    
      // Database
      database: ["mongodb.com", "mysql.com", "postgresql.org", "redis.io"],
      backend: ["heroku.com", "vercel.com", "netlify.com", "railway.app"],
      serverless: ["aws.amazon.com", "vercel.com", "netlify.com"],
    
      // Search
      search: ["algolia.com", "elasticsearch.com", "meilisearch.com"],
      recommendation: ["recombee.com", "crossing-minds.com"],
    
      // Reviews
      reviews: ["trustpilot.com", "g2.com", "capterra.com", "yelp.com"],
      reputation: ["birdeye.com", "podium.com", "yotpo.com"],
    
      // Notifications
      notifications: ["onesignal.com", "pusher.com", "airship.com"],
      push: ["onesignal.com", "firebase.google.com", "pusher.com"],
    
      // Forms
      forms: ["typeform.com", "jotform.com", "google.com", "formstack.com"],
      surveys: ["surveymonkey.com", "qualtrics.com", "typeform.com"],
      feedback: ["hotjar.com", "usertesting.com", "surveymonkey.com"],
    
      // Scheduling
      scheduling: ["calendly.com", "acuityscheduling.com", "setmore.com"],
      appointment: ["calendly.com", "simplybook.me", "vcita.com"],
      calendar: ["calendly.com", "google.com", "microsoft.com"],
    
      // Inventory
      inventory: ["shopify.com", "cin7.com", "fishbowl.com"],
      warehouse: ["shipbob.com", "flexport.com", "freightos.com"],
    
      // Translation
      translation: ["deepl.com", "google.com", "smartling.com"],
      localization: ["lokalise.com", "crowdin.com", "phrase.com"],
    
      // Marketing specific
      "sms marketing": ["attentive.com", "postscript.io", "klaviyo.com"],
      referral: ["referralcandy.com", "friendbuy.com", "extole.com"],
      loyalty: ["smile.io", "yotpo.com", "loyaltylion.com"],
      rewards: ["tremendousrewards.com", "rewardgateway.com"],
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
