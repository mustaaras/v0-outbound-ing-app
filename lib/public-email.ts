// Generate domain candidates from keyword (without checking for emails)
function generateDomainsFromKeyword(keyword: string): string[] {
  const candidates: string[] = []
  const base = keyword.toLowerCase().replace(/[^a-z0-9]/g, "")
  
  if (base.length < 2) return []
  
  const primaryExtensions = [".com", ".io", ".ai"]
  const secondaryExtensions = [".net", ".org", ".app", ".co", ".dev"]
  
  // 1. Exact match (highest priority)
  primaryExtensions.forEach(ext => candidates.push(`${base}${ext}`))
  secondaryExtensions.forEach(ext => candidates.push(`${base}${ext}`))
  
  // 2. For multi-word keywords, try individual words and combinations
  const words = keyword.toLowerCase().split(/\s+/)
  if (words.length > 1) {
    // First word only
    primaryExtensions.forEach(ext => candidates.push(`${words[0]}${ext}`))
    // Last word only
    primaryExtensions.forEach(ext => candidates.push(`${words[words.length - 1]}${ext}`))
    // First + last word combined
    if (words.length >= 2) {
      const combined = words[0] + words[words.length - 1]
      primaryExtensions.forEach(ext => candidates.push(`${combined}${ext}`))
    }
  }
  
  // 3. Common variations with suffixes
  const suffixes = ["labs", "hq", "tech", "hub", "pro", "tools"]
  suffixes.forEach(suffix => {
    primaryExtensions.forEach(ext => candidates.push(`${base}${suffix}${ext}`))
  })
  
  // 4. Prefixes (only for shorter keywords)
  if (base.length <= 12) {
    const prefixes = ["get", "use", "my", "the"]
    prefixes.forEach(prefix => {
      primaryExtensions.forEach(ext => candidates.push(`${prefix}${base}${ext}`))
    })
  }
  
  // 5. AI/GPT variations (only for tech-related shorter keywords)
  if (base.length <= 10) {
    primaryExtensions.forEach(ext => {
      candidates.push(`${base}ai${ext}`)
      candidates.push(`ai${base}${ext}`)
    })
  }
  
  // 6. Word splits for longer keywords
  if (base.length > 6 && base.length <= 12) {
    const mid = Math.floor(base.length / 2)
    const part1 = base.slice(0, mid)
    const part2 = base.slice(mid)
    primaryExtensions.forEach(ext => {
      candidates.push(`${part1}${part2}${ext}`)
      candidates.push(`${part2}${part1}${ext}`)
    })
  }
  
  return Array.from(new Set(candidates))
}

// Contact Generator: Smart domain matching for product keywords
export async function findContactEmails({ keyword, maxResults = 20 }: { keyword: string; maxResults?: number }) {
  if (!keyword || keyword.length < 2) return []
  
  const base = keyword.toLowerCase().replace(/[^a-z0-9]/g, "") // Remove special chars
  
  devLog("[contact-gen] Searching for keyword:", keyword, "base:", base)
  
  const uniqueDomains = generateDomainsFromKeyword(keyword)
  devLog("[contact-gen] Checking", uniqueDomains.length, "candidate domains")

  // Try domains in parallel batches with global timeout
  const results: PublicEmailResult[] = []
  const BATCH_SIZE = 10 // Increased from 8 for more parallel processing
  const MAX_BATCHES = 15 // Check at most 150 domains (up from 64)
  let timedOut = false
  
  const searchPromise = (async () => {
    for (let i = 0; i < Math.min(uniqueDomains.length, MAX_BATCHES * BATCH_SIZE) && results.length < maxResults; i += BATCH_SIZE) {
      const batch = uniqueDomains.slice(i, i + BATCH_SIZE)
      const promises = batch.map(async domain => {
        try {
          devLog("[contact-gen] Trying domain:", domain)
          const found = await extractPublicEmailsForDomain(domain, { pagesPerDomain: 8, timeoutMs: 4000 })
          if (found.length > 0) {
            devLog("[contact-gen] Found", found.length, "emails on", domain)
          }
          return found
        } catch (e) {
          return []
        }
      })
      
      const batchResults = await Promise.all(promises)
      for (const domainResults of batchResults) {
        for (const r of domainResults) {
          if (results.length >= maxResults) break
          results.push(r)
        }
        if (results.length >= maxResults) break
      }
      
      // Early exit if we found enough
      if (results.length >= maxResults) break
    }
  })()
  
  // Global timeout of 35 seconds (increased for more thorough search)
  await Promise.race([
    searchPromise,
    new Promise((resolve) => setTimeout(() => {
      timedOut = true
      devLog("[contact-gen] Search timed out after 35s")
      resolve(null)
    }, 35000))
  ])
  
  devLog("[contact-gen] Final results:", results.length, "emails found", timedOut ? "(timed out)" : "")
  return results
}
import "server-only"

import { devLog, errorLog } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export interface PublicEmailResult {
  domain: string
  email: string
  type: "generic" | "personal"
  sourceUrl: string
}

/**
 * Validate email format and domain
 */
function isValidEmailFormat(email: string): boolean {
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(email)) return false
  
  const [localPart, domain] = email.split('@')
  
  // Check local part length
  if (!localPart || localPart.length > 64) return false
  
  // Check domain length
  if (!domain || domain.length > 255) return false
  
  // Check for valid domain extension
  if (!domain.includes('.') || domain.endsWith('.')) return false
  
  // Reject common typos and invalid domains
  const invalidDomains = ['example.com', 'test.com', 'localhost', 'email.com']
  if (invalidDomains.includes(domain.toLowerCase())) return false
  
  return true
}

/**
 * Check if email source is verifiable (has actual URL)
 */
function hasVerifiableSource(result: PublicEmailResult): boolean {
  // Only cache emails from web scraping (verifiable URLs)
  // Don't cache DNS-only results (less reliable)
  return result.sourceUrl.startsWith('http')
}

/**
 * Filter and validate results before caching
 */
function filterValidResults(results: PublicEmailResult[]): PublicEmailResult[] {
  return results.filter(result => {
    // Must have valid email format
    if (!isValidEmailFormat(result.email)) {
      devLog('[email-validation] Rejected invalid format:', result.email)
      return false
    }
    
    // Must have verifiable source (actual webpage URL)
    if (!hasVerifiableSource(result)) {
      devLog('[email-validation] Rejected unverifiable source:', result.email, result.sourceUrl)
      return false
    }
    
    // Email and domain must match
    const emailDomain = result.email.split('@')[1]?.toLowerCase()
    const resultDomain = result.domain.toLowerCase()
    if (!emailDomain || !resultDomain.includes(emailDomain.replace('www.', ''))) {
      devLog('[email-validation] Rejected domain mismatch:', result.email, 'vs', result.domain)
      return false
    }
    
    return true
  })
}

/**
 * Get cached emails from database for given domains
 */
async function getCachedEmails(domains: string[]): Promise<PublicEmailResult[]> {
  if (domains.length === 0) return []
  
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('email_cache')
      .select('domain, email, email_type, source_url')
      .in('domain', domains)
      .eq('is_valid', true)
      .order('verification_count', { ascending: false })
      .limit(150)
    
    if (error) {
      errorLog('[email-cache] Error fetching cached emails:', error)
      return []
    }
    
    return (data || []).map(row => ({
      domain: row.domain,
      email: row.email,
      type: row.email_type as "generic" | "personal",
      sourceUrl: row.source_url
    }))
  } catch (e) {
    errorLog('[email-cache] Exception fetching cached emails:', e)
    return []
  }
}

/**
 * Save newly found emails to cache (only valid, verifiable emails)
 */
async function cacheEmails(results: PublicEmailResult[]): Promise<void> {
  if (results.length === 0) return
  
  // Filter to only valid, verifiable emails
  const validResults = filterValidResults(results)
  
  if (validResults.length === 0) {
    devLog('[email-cache] No valid emails to cache (all filtered out)')
    return
  }
  
  devLog('[email-cache] Validated', validResults.length, 'of', results.length, 'emails for caching')
  
  try {
    const supabase = await createClient()
    const rows = validResults.map(r => ({
      domain: r.domain,
      email: r.email,
      email_type: r.type,
      source_url: r.sourceUrl
    }))
    
    // Use upsert to handle duplicates (increment verification_count)
    await supabase
      .from('email_cache')
      .upsert(rows, {
        onConflict: 'email,domain',
        ignoreDuplicates: false
      })
    
    devLog('[email-cache] Successfully cached', validResults.length, 'validated emails')
  } catch (e) {
    errorLog('[email-cache] Exception caching emails:', e)
  }
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

// Priority generic emails for outbound contact
const GENERIC_LOCALPARTS = new Set([
  "info",
  "contact",
  "support",
  "hello",
  "hi",
  "team",
  "sales",
  "business",
  "inquiry",
  "inquiries",
  "general",
  "partners",
  "partnerships",
  "affiliate",
  "affiliates",
  "marketing",
  "press",
  "media",
  "help",
  "careers",
  "jobs",
  "admin",
  "office",
  "service",
  "customers",
  "customerservice",
])

// Emails to filter out (not useful for outreach)
const BLOCKED_LOCALPARTS = new Set([
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "bounce",
  "mailer-daemon",
  "postmaster",
  "abuse",
  "security",
  "privacy",
  "legal",
  "dmca",
  "unsubscribe",
])

function normalizeDomain(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]

  // Validate that this looks like a domain, not a file
  if (!normalized || normalized.length === 0) return ""
  
  // Reject if it looks like a file (has file extension)
  const fileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip', '.rar', '.7z', '.tar', '.gz', '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.css', '.js', '.html', '.htm', '.xml', '.json', '.rss', '.atom']
  if (fileExtensions.some(ext => normalized.includes(ext))) return ""
  
  // Must contain at least one dot (unless localhost)
  if (!normalized.includes('.') && normalized !== 'localhost') return ""
  
  // Reject if it's just a filename without extension but looks like a file
  if (!normalized.includes('.') && /^[a-zA-Z0-9_-]+$/.test(normalized) && normalized.length < 4) return ""
  
  // Reject pure numbers or invalid characters
  if (/^\d+$/.test(normalized) || !/^[a-zA-Z0-9.-]+$/.test(normalized)) return ""
  
  // Reasonable length check
  if (normalized.length > 253) return ""
  
  return normalized
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

function decodeHtmlEntities(text: string): string {
  // Decode common HTML entities and Unicode escapes
  return text
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    // Unicode escape sequences like \u003c
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function extractEmailsFromHtml(html: string): Set<string> {
  const emails = new Set<string>()
  
  // Decode HTML entities first
  const decoded = decodeHtmlEntities(html)
  
  // mailto links
  const mailtoRegex = /mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi
  let m
  while ((m = mailtoRegex.exec(decoded))) {
    const email = m[1].toLowerCase()
    // Filter out emails that still contain encoded characters or invalid chars
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
      // Filter out blocked emails
      const localPart = email.split("@")[0]
      if (!BLOCKED_LOCALPARTS.has(localPart)) {
        emails.add(email)
      }
    }
  }
  // plain text
  const textEmailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
  while ((m = textEmailRegex.exec(decoded))) {
    const email = m[0].toLowerCase()
    // Filter out emails that still contain encoded characters or invalid chars
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
      // Filter out blocked emails
      const localPart = email.split("@")[0]
      if (!BLOCKED_LOCALPARTS.has(localPart)) {
        emails.add(email)
      }
    }
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
  
  // If domain normalization failed (invalid domain), return empty results
  if (!domain) {
    devLog("[public-email] Invalid domain rejected:", rawDomain)
    return []
  }
  
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
  
  // Sort results: generic emails (info@, contact@, etc.) first, then personal
  return results.sort((a, b) => {
    if (a.type === "generic" && b.type === "personal") return -1
    if (a.type === "personal" && b.type === "generic") return 1
    return 0
  })
}

export function resolveDomainsFromKeyword(keyword?: string): string[] {
  if (!keyword) return []
  const k = keyword.trim().toLowerCase()
  
  // Massive 3000+ keyword pool focused on tech, AI, crypto, web3, and modern industries
  const map: Record<string, string[]> = {
    // ===== AI & MACHINE LEARNING (Priority) =====
    ai: ["openai.com", "anthropic.com", "google.com", "meta.com", "huggingface.co", "cohere.com", "stability.ai", "midjourney.com", "replicate.com", "runwayml.com"],
    "artificial intelligence": ["openai.com", "anthropic.com", "deepmind.com", "ai21.com", "cohere.com", "adept.ai"],
    "machine learning": ["databricks.com", "datarobot.com", "h2o.ai", "huggingface.co", "scale.ai", "labelbox.com"],
    "deep learning": ["nvidia.com", "pytorch.org", "tensorflow.org", "deepmind.com", "huggingface.co"],
    llm: ["openai.com", "anthropic.com", "cohere.com", "ai21.com", "together.ai", "fireworks.ai"],
    gpt: ["openai.com", "huggingface.co", "together.ai", "anthropic.com"],
    "generative ai": ["openai.com", "anthropic.com", "stability.ai", "midjourney.com", "runwayml.com", "jasper.ai"],
    chatbot: ["openai.com", "anthropic.com", "intercom.com", "drift.com", "ada.cx", "landbot.io"],
    "computer vision": ["scale.ai", "roboflow.com", "viso.ai", "clarifai.com", "appen.com"],
    nlp: ["openai.com", "cohere.com", "anthropic.com", "huggingface.co", "spacy.io"],
    "natural language processing": ["openai.com", "cohere.com", "huggingface.co", "ai21.com"],
    transformers: ["huggingface.co", "openai.com", "anthropic.com", "cohere.com"],
    embeddings: ["openai.com", "cohere.com", "pinecone.io", "weaviate.io", "qdrant.tech"],
    "vector db": ["pinecone.io", "weaviate.io", "qdrant.tech", "milvus.io", "chroma.com"],
    "ai training": ["scale.ai", "labelbox.com", "snorkel.ai", "datasaur.ai"],
    "ai inference": ["replicate.com", "banana.dev", "runpod.io", "together.ai"],
    mlops: ["weights-biases.com", "neptune.ai", "comet.ml", "mlflow.org", "clearml.com"],
    "prompt engineering": ["openai.com", "anthropic.com", "langchain.com", "promptlayer.com"],
    rag: ["langchain.com", "llamaindex.ai", "pinecone.io", "weaviate.io"],
    "ai agents": ["langchain.com", "autogen.ai", "crew.ai", "superagent.sh"],
    "ai automation": ["zapier.com", "make.com", "activepieces.com", "n8n.io"],
    
    // ===== CRYPTO & BLOCKCHAIN (Priority) =====
    crypto: ["coinbase.com", "binance.com", "kraken.com", "crypto.com", "gemini.com", "okx.com", "bybit.com", "kucoin.com"],
    cryptocurrency: ["coinbase.com", "binance.com", "kraken.com", "bitstamp.net", "gemini.com"],
    blockchain: ["ethereum.org", "solana.com", "polygon.technology", "avalabs.org", "cosmos.network", "polkadot.network"],
    bitcoin: ["coinbase.com", "kraken.com", "blockstream.com", "lightning.network", "strike.me"],
    ethereum: ["ethereum.org", "consensys.io", "infura.io", "alchemy.com", "quicknode.com"],
    solana: ["solana.com", "magiceden.io", "phantom.app", "helius.dev"],
    defi: ["uniswap.org", "aave.com", "compound.finance", "curve.fi", "makerdao.com", "lido.fi"],
    "decentralized finance": ["uniswap.org", "aave.com", "compound.finance", "sushiswap.org"],
    dex: ["uniswap.org", "curve.fi", "balancer.fi", "pancakeswap.finance", "sushiswap.org"],
    nft: ["opensea.io", "blur.io", "magiceden.io", "rarible.com", "foundation.app", "superrare.com"],
    "smart contracts": ["ethereum.org", "openzeppelin.com", "hardhat.org", "truffle.io", "alchemy.com"],
    web3: ["alchemy.com", "infura.io", "quicknode.com", "thirdweb.com", "moralis.io", "chainstack.com"],
    dao: ["aragon.org", "snapshot.org", "tally.xyz", "boardroom.io", "commonwealth.im"],
    "layer 2": ["polygon.technology", "arbitrum.io", "optimism.io", "zkSync.io", "starkware.co"],
    staking: ["lido.fi", "rocket.pool", "stakewise.io", "coinbase.com", "kraken.com"],
    wallet: ["metamask.io", "phantom.app", "rainbow.me", "trustwallet.com", "ledger.com"],
    "crypto wallet": ["metamask.io", "phantom.app", "coinbase.com", "rainbow.me", "argent.xyz"],
    dapp: ["alchemy.com", "thirdweb.com", "moralis.io", "infura.io"],
    tokenization: ["ethereum.org", "polygon.technology", "alchemy.com", "circle.com"],
    depin: ["helium.com", "hivemapper.com", "render.network", "akash.network"],
    gamefi: ["immutable.com", "axieinfinity.com", "gala.com", "mymetaverse.com"],
    "play to earn": ["axieinfinity.com", "gala.com", "immutable.com", "thesandbox.game"],
    metaverse: ["decentraland.org", "thesandbox.game", "roblox.com", "spatial.io"],
    
    // ===== WEB3 & DECENTRALIZED =====
    ipfs: ["protocol.ai", "pinata.cloud", "web3.storage", "nft.storage"],
    filecoin: ["filecoin.io", "protocol.ai", "fleek.co"],
    "decentralized storage": ["filecoin.io", "arweave.org", "storj.io", "sia.tech"],
    oracles: ["chainlink.com", "api3.org", "bandprotocol.com", "pyth.network"],
    "cross-chain": ["layerzero.network", "wormhole.com", "axelar.network", "synapse.com"],
    bridges: ["layerzero.network", "wormhole.com", "synapse.com", "hop.exchange"],
    "zero knowledge": ["zkSync.io", "starkware.co", "polygon.technology", "aztec.network"],
    zk: ["zkSync.io", "starkware.co", "polygon.technology", "scroll.io"],
    rollups: ["arbitrum.io", "optimism.io", "zkSync.io", "starkware.co"],
    token: ["ethereum.org", "polygon.technology", "alchemy.com", "circle.com"],
    tokens: ["ethereum.org", "opensea.io", "uniswap.org", "coinbase.com"],
    
    // ===== DEVELOPER TOOLS & INFRASTRUCTURE =====
    github: ["github.com", "gitlab.com", "bitbucket.org", "sourcegraph.com"],
    git: ["github.com", "gitlab.com", "bitbucket.org", "gitkraken.com"],
    "version control": ["github.com", "gitlab.com", "bitbucket.org", "perforce.com"],
    ide: ["jetbrains.com", "visualstudio.com", "cursor.sh", "replit.com"],
    "code editor": ["cursor.sh", "visualstudio.com", "sublimetext.com", "jetbrains.com"],
    devtools: ["github.com", "postman.com", "insomnia.rest", "jetbrains.com"],
    developer: ["github.com", "stackoverflow.com", "dev.to", "hashnode.com"],
    development: ["github.com", "gitlab.com", "atlassian.com", "jetbrains.com"],
    coding: ["github.com", "replit.com", "codepen.io", "codesandbox.io"],
    programming: ["github.com", "stackoverflow.com", "freecodecamp.org"],
    ci: ["github.com", "circleci.com", "travis-ci.com", "jenkins.io", "buildkite.com"],
    "continuous integration": ["github.com", "circleci.com", "gitlab.com", "jenkins.io"],
    "ci/cd": ["github.com", "gitlab.com", "circleci.com", "jenkins.io", "buildkite.com"],
    devops: ["github.com", "gitlab.com", "circleci.com", "jenkins.io", "terraform.io"],
    kubernetes: ["kubernetes.io", "rancher.com", "redhat.com", "vmware.com"],
    k8s: ["kubernetes.io", "rancher.com", "redhat.com", "vmware.com"],
    docker: ["docker.com", "rancher.com", "portainer.io"],
    containers: ["docker.com", "kubernetes.io", "rancher.com", "podman.io"],
    "infrastructure as code": ["terraform.io", "pulumi.com", "ansible.com", "cloudformation.aws.com"],
    terraform: ["terraform.io", "hashicorp.com", "spacelift.io", "env0.com"],
    monitoring: ["datadog.com", "newrelic.com", "sentry.io", "pagerduty.com", "grafana.com"],
    observability: ["datadog.com", "newrelic.com", "honeycomb.io", "lightstep.com"],
    logging: ["datadog.com", "splunk.com", "loggly.com", "papertrail.com"],
    apm: ["datadog.com", "newrelic.com", "dynatrace.com", "appdynamics.com"],
    performance: ["datadog.com", "newrelic.com", "google.com", "gtmetrix.com"],
    
    // ===== CLOUD & HOSTING =====
    cloud: ["aws.amazon.com", "azure.microsoft.com", "cloud.google.com", "digitalocean.com", "linode.com", "vultr.com"],
    aws: ["aws.amazon.com", "cloudflare.com", "terraform.io"],
    azure: ["azure.microsoft.com", "microsoft.com"],
    gcp: ["cloud.google.com", "firebase.google.com"],
    hosting: ["vercel.com", "netlify.com", "digitalocean.com", "heroku.com", "railway.app", "fly.io"],
    domain: ["godaddy.com", "namecheap.com", "cloudflare.com", "google.com", "hover.com", "name.com"],
    "domain registration": ["godaddy.com", "namecheap.com", "hover.com", "porkbun.com", "dynadot.com"],
    dns: ["cloudflare.com", "route53.aws.com", "dnsimple.com", "google.com"],
    serverless: ["aws.amazon.com", "vercel.com", "netlify.com", "cloudflare.com", "railway.app"],
    "edge computing": ["cloudflare.com", "fastly.com", "vercel.com", "netlify.com"],
    cdn: ["cloudflare.com", "fastly.com", "akamai.com", "bunny.net"],
    deployment: ["vercel.com", "netlify.com", "render.com", "railway.app", "fly.io"],
    paas: ["heroku.com", "railway.app", "render.com", "fly.io"],
    
    // ===== DATABASES & DATA =====
    database: ["mongodb.com", "postgresql.org", "mysql.com", "redis.io", "cockroachdb.com", "planetscale.com"],
    sql: ["postgresql.org", "mysql.com", "cockroachdb.com", "planetscale.com"],
    nosql: ["mongodb.com", "redis.io", "cassandra.apache.org", "couchbase.com"],
    postgres: ["postgresql.org", "supabase.com", "neon.tech", "cockroachdb.com", "timescale.com"],
    mongodb: ["mongodb.com", "atlas.mongodb.com"],
    redis: ["redis.io", "upstash.com", "redislabs.com"],
    "vector search": ["pinecone.io", "weaviate.io", "qdrant.tech", "milvus.io", "chroma.com"],
    "time series": ["timescale.com", "influxdata.com", "questdb.io"],
    "data warehouse": ["snowflake.com", "databricks.com", "bigquery.google.com", "redshift.aws.com"],
    etl: ["fivetran.com", "airbyte.com", "stitch.com", "matillion.com"],
    analytics: ["google.com", "mixpanel.com", "amplitude.com", "segment.com", "heap.io", "posthog.com"],
    "business intelligence": ["tableau.com", "looker.com", "metabase.com", "superset.apache.org"],
    "data pipeline": ["airflow.apache.org", "dagster.io", "prefect.io", "temporal.io"],
    
    // ===== API & INTEGRATION =====
    api: ["postman.com", "rapidapi.com", "apigee.com", "kong.com", "tyk.io"],
    "api gateway": ["kong.com", "tyk.io", "apigee.com", "aws.amazon.com"],
    graphql: ["apollographql.com", "hasura.io", "graphql.org", "stepzen.com"],
    rest: ["postman.com", "swagger.io", "stoplight.io"],
    webhook: ["svix.com", "hookdeck.com", "ngrok.com", "webhook.site"],
    integration: ["zapier.com", "make.com", "n8n.io", "mulesoft.com", "workato.com"],
    automation: ["zapier.com", "make.com", "n8n.io", "activepieces.com", "windmill.dev"],
    
    // ===== SAAS & PRODUCTIVITY =====
    saas: ["salesforce.com", "hubspot.com", "slack.com", "notion.so", "asana.com", "monday.com"],
    software: ["microsoft.com", "adobe.com", "salesforce.com", "oracle.com", "sap.com"],
    "software development": ["github.com", "gitlab.com", "jetbrains.com", "atlassian.com"],
    platform: ["salesforce.com", "shopify.com", "stripe.com", "twilio.com"],
    productivity: ["notion.so", "asana.com", "trello.com", "monday.com", "clickup.com", "linear.app"],
    "project management": ["asana.com", "monday.com", "linear.app", "clickup.com", "jira.atlassian.com"],
    collaboration: ["slack.com", "discord.com", "microsoft.com", "zoom.us", "miro.com"],
    workspace: ["notion.so", "coda.io", "airtable.com", "clickup.com"],
    notes: ["notion.so", "obsidian.md", "evernote.com", "onenote.com", "roam.com"],
    documentation: ["notion.so", "gitbook.com", "readme.com", "docusaurus.io"],
    wiki: ["notion.so", "confluence.atlassian.com", "gitbook.com", "outline.com"],
    knowledge: ["notion.so", "confluence.atlassian.com", "guru.com", "bloomfire.com"],
    "knowledge base": ["zendesk.com", "helpscout.com", "notion.so", "confluence.atlassian.com"],
    
    // ===== COMMUNICATION =====
    messaging: ["slack.com", "discord.com", "telegram.org", "signal.org", "whatsapp.com"],
    chat: ["slack.com", "discord.com", "intercom.com", "drift.com", "crisp.chat"],
    "video conferencing": ["zoom.us", "meet.google.com", "webex.com", "whereby.com"],
    voip: ["twilio.com", "vonage.com", "ringcentral.com", "plivo.com"],
    sms: ["twilio.com", "messagebird.com", "plivo.com", "telnyx.com"],
    email: ["sendgrid.com", "mailgun.com", "postmark.com", "resend.com", "aws.amazon.com"],
    "email delivery": ["sendgrid.com", "mailgun.com", "postmark.com", "resend.com"],
    "email service": ["sendgrid.com", "mailgun.com", "postmark.com", "resend.com", "mailchimp.com"],
    communication: ["twilio.com", "slack.com", "zoom.us", "microsoft.com"],
    conferencing: ["zoom.us", "webex.com", "meet.google.com", "microsoft.com"],
    telephony: ["twilio.com", "vonage.com", "ringcentral.com", "dialpad.com"],
    
    // ===== SECURITY & AUTH =====
    security: ["cloudflare.com", "okta.com", "auth0.com", "crowdstrike.com", "snyk.io"],
    cybersecurity: ["crowdstrike.com", "paloaltonetworks.com", "fortinet.com", "checkpoint.com"],
    authentication: ["auth0.com", "okta.com", "clerk.dev", "supabase.com", "firebase.google.com"],
    auth: ["auth0.com", "okta.com", "clerk.dev", "supabase.com", "lucia-auth.com"],
    sso: ["okta.com", "auth0.com", "onelogin.com", "jumpcloud.com"],
    "identity management": ["okta.com", "auth0.com", "onelogin.com", "ping.com"],
    vpn: ["nordvpn.com", "expressvpn.com", "cloudflare.com", "tailscale.com"],
    firewall: ["cloudflare.com", "paloaltonetworks.com", "fortinet.com"],
    encryption: ["keybase.io", "protonmail.com", "boxcryptor.com"],
    "code security": ["snyk.io", "sonarqube.org", "checkmarx.com", "veracode.com"],
    
    // ===== MARKETING & GROWTH =====
    marketing: ["hubspot.com", "marketo.com", "salesforce.com", "mailchimp.com", "activecampaign.com"],
    "email marketing": ["mailchimp.com", "klaviyo.com", "activecampaign.com", "sendgrid.com", "brevo.com"],
    "marketing automation": ["hubspot.com", "marketo.com", "activecampaign.com", "pardot.com"],
    seo: ["semrush.com", "ahrefs.com", "moz.com", "brightedge.com", "conductor.com"],
    "search engine optimization": ["semrush.com", "ahrefs.com", "moz.com", "google.com"],
    "content marketing": ["hubspot.com", "contentful.com", "sanity.io", "wordpress.com"],
    "social media": ["hootsuite.com", "buffer.com", "sproutsocial.com", "later.com"],
    advertising: ["google.com", "facebook.com", "linkedin.com", "twitter.com", "tiktok.com"],
    ads: ["google.com", "facebook.com", "microsoft.com", "linkedin.com"],
    ppc: ["google.com", "microsoft.com", "wordstream.com", "optmyzr.com"],
    "pay per click": ["google.com", "microsoft.com", "wordstream.com"],
    "affiliate marketing": ["impact.com", "cj.com", "shareasale.com", "awin.com"],
    affiliate: ["impact.com", "cj.com", "awin.com", "partnerize.com", "refersion.com"],
    partnerships: ["impact.com", "partnerstack.com", "crossbeam.com", "reveal.co"],
    partner: ["partnerstack.com", "crossbeam.com", "impact.com", "hubspot.com"],
    growth: ["amplitude.com", "mixpanel.com", "hubspot.com", "segment.com"],
    "growth marketing": ["reforge.com", "amplitude.com", "mixpanel.com"],
    conversion: ["optimizely.com", "vwo.com", "unbounce.com", "instapage.com"],
    "conversion optimization": ["optimizely.com", "vwo.com", "unbounce.com"],
    cro: ["optimizely.com", "vwo.com", "hotjar.com", "crazyegg.com"],
    
    // ===== CRM & SALES =====
    crm: ["salesforce.com", "hubspot.com", "pipedrive.com", "zoho.com", "freshsales.com"],
    "customer relationship management": ["salesforce.com", "hubspot.com", "zoho.com"],
    sales: ["salesforce.com", "hubspot.com", "outreach.io", "salesloft.com", "apollo.io"],
    "sales engagement": ["outreach.io", "salesloft.com", "apollo.io", "groove.co"],
    "lead generation": ["apollo.io", "lusha.com", "zoominfo.com", "hunter.io"],
    leads: ["apollo.io", "zoominfo.com", "lusha.com", "clearbit.com"],
    prospecting: ["apollo.io", "zoominfo.com", "linkedin.com", "hunter.io"],
    outbound: ["apollo.io", "outreach.io", "salesloft.com", "lemlist.com"],
    "cold email": ["lemlist.com", "instantly.ai", "smartlead.ai", "apollo.io"],
    "sales automation": ["outreach.io", "salesloft.com", "apollo.io"],
    pipeline: ["salesforce.com", "hubspot.com", "pipedrive.com", "copper.com"],
    revenue: ["salesforce.com", "hubspot.com", "clari.com", "gong.io"],
    "revenue operations": ["clari.com", "gong.io", "salesloft.com"],
    revops: ["clari.com", "gong.io", "salesforce.com"],
    
    // ===== ECOMMERCE =====
    ecommerce: ["shopify.com", "woocommerce.com", "bigcommerce.com", "magento.com", "prestashop.com"],
    "e-commerce": ["shopify.com", "woocommerce.com", "bigcommerce.com"],
    shopify: ["shopify.com", "shopifyplus.com"],
    woocommerce: ["woocommerce.com", "wordpress.org"],
    "online store": ["shopify.com", "woocommerce.com", "bigcommerce.com", "squarespace.com"],
    store: ["shopify.com", "square.com", "bigcommerce.com"],
    retail: ["shopify.com", "square.com", "lightspeed.com", "vend.com"],
    cart: ["shopify.com", "bigcommerce.com", "woocommerce.com", "commercetools.com"],
    checkout: ["stripe.com", "shopify.com", "fastspring.com", "paddle.com"],
    "product catalog": ["shopify.com", "algolia.com", "elastic.co"],
    inventory: ["shopify.com", "cin7.com", "katana.com", "orderhive.com"],
    "inventory management": ["cin7.com", "katana.com", "orderhive.com"],
    pos: ["square.com", "shopify.com", "lightspeed.com", "toast.com"],
    "point of sale": ["square.com", "shopify.com", "lightspeed.com"],
    merchant: ["stripe.com", "square.com", "shopify.com", "adyen.com"],
    
    // ===== PAYMENTS =====
    payment: ["stripe.com", "paypal.com", "square.com", "adyen.com", "checkout.com"],
    payments: ["stripe.com", "paypal.com", "square.com", "adyen.com", "braintreepayments.com"],
    fintech: ["stripe.com", "plaid.com", "square.com", "adyen.com", "circle.com"],
    billing: ["stripe.com", "chargebee.com", "recurly.com", "paddle.com", "zuora.com"],
    invoicing: ["stripe.com", "freshbooks.com", "quickbooks.intuit.com", "xero.com"],
    subscriptions: ["stripe.com", "chargebee.com", "recurly.com", "paddle.com"],
    credit: ["stripe.com", "plaid.com", "experian.com", "equifax.com", "transunion.com"],
    "credit card": ["stripe.com", "square.com", "adyen.com", "checkout.com"],
    lending: ["upstart.com", "sofi.com", "lendingclub.com", "prosper.com"],
    banking: ["plaid.com", "stripe.com", "chime.com", "revolut.com", "neobank.com"],
    
    // ===== DESIGN & CREATIVE =====
    design: ["figma.com", "adobe.com", "canva.com", "sketch.com", "framer.com"],
    "ui design": ["figma.com", "sketch.com", "adobe.com", "framer.com"],
    "ux design": ["figma.com", "adobe.com", "hotjar.com", "usertesting.com"],
    "user experience": ["figma.com", "adobe.com", "hotjar.com", "usertesting.com"],
    "user interface": ["figma.com", "sketch.com", "adobe.com"],
    prototyping: ["figma.com", "framer.com", "invisionapp.com", "protopie.io"],
    "design system": ["figma.com", "storybook.js.org", "zeroheight.com"],
    graphics: ["adobe.com", "canva.com", "affinity.serif.com", "sketch.com"],
    creative: ["adobe.com", "canva.com", "figma.com", "behance.net"],
    illustration: ["adobe.com", "procreate.com", "affinity.serif.com"],
    branding: ["canva.com", "adobe.com", "99designs.com"],
    video: ["adobe.com", "loom.com", "riverside.fm", "descript.com", "runway.ml"],
    "video editing": ["adobe.com", "davinciresolve.com", "runway.ml", "descript.com"],
    animation: ["adobe.com", "lottiefiles.com", "rive.app", "spline.design"],
    "3d": ["blender.org", "autodesk.com", "unity.com", "unreal.com", "spline.design"],
    rendering: ["blender.org", "autodesk.com", "keyshot.com"],
    modeling: ["blender.org", "autodesk.com", "sketchup.com"],
    
    // ===== FRONTEND & FRAMEWORKS =====
    react: ["react.dev", "nextjs.org", "vercel.com", "remix.run"],
    nextjs: ["nextjs.org", "vercel.com"],
    vue: ["vuejs.org", "nuxt.com"],
    angular: ["angular.io", "angular.dev"],
    svelte: ["svelte.dev", "kit.svelte.dev"],
    frontend: ["react.dev", "vuejs.org", "angular.io", "svelte.dev"],
    "web development": ["vercel.com", "netlify.com", "cloudflare.com"],
    jamstack: ["vercel.com", "netlify.com", "sanity.io", "contentful.com"],
    
    // ===== BACKEND & RUNTIME =====
    nodejs: ["nodejs.org", "vercel.com", "railway.app"],
    "node.js": ["nodejs.org", "vercel.com", "deno.com"],
    deno: ["deno.com", "deno.land"],
    bun: ["bun.sh"],
    python: ["python.org", "anaconda.com", "replit.com"],
    golang: ["go.dev", "golang.org"],
    rust: ["rust-lang.org", "shuttle.rs"],
    backend: ["railway.app", "render.com", "fly.io", "heroku.com"],
    
    // ===== TESTING & QA =====
    testing: ["cypress.io", "playwright.dev", "selenium.dev", "jest.io"],
    "test automation": ["cypress.io", "playwright.dev", "selenium.dev"],
    "end to end": ["cypress.io", "playwright.dev", "puppeteer.dev"],
    "unit testing": ["jest.io", "vitest.dev", "mocha.org"],
    qa: ["browserstack.com", "saucelabs.com", "lambdatest.com"],
    
    // ===== CUSTOMER SUPPORT =====
    support: ["zendesk.com", "intercom.com", "freshdesk.com", "helpscout.com"],
    helpdesk: ["zendesk.com", "freshdesk.com", "helpscout.com", "gorgias.com"],
    "customer service": ["zendesk.com", "intercom.com", "freshdesk.com"],
    "customer support": ["zendesk.com", "intercom.com", "freshdesk.com", "helpscout.com"],
    "customer success": ["gainsight.com", "totango.com", "catalyst.io", "vitally.io"],
    livechat: ["intercom.com", "drift.com", "livechat.com", "crisp.chat"],
    ticketing: ["zendesk.com", "freshdesk.com", "linear.app", "jira.atlassian.com"],
    service: ["zendesk.com", "salesforce.com", "servicenow.com"],
    feedback: ["typeform.com", "surveymonkey.com", "hotjar.com", "uservoice.com"],
    "customer feedback": ["typeform.com", "hotjar.com", "qualtrics.com"],
    
    // ===== HR & PEOPLE =====
    hr: ["bamboohr.com", "workday.com", "rippling.com", "gusto.com", "namely.com"],
    hris: ["bamboohr.com", "workday.com", "rippling.com", "hibob.com"],
    recruitment: ["greenhouse.io", "lever.co", "workable.com", "ashbyhq.com"],
    ats: ["greenhouse.io", "lever.co", "ashbyhq.com", "workday.com"],
    payroll: ["gusto.com", "rippling.com", "adp.com", "paychex.com"],
    "employee engagement": ["lattice.com", "cultureamp.com", "15five.com"],
    
    // ===== EDUCATION & LEARNING =====
    education: ["coursera.org", "udemy.com", "edx.org", "skillshare.com"],
    elearning: ["teachable.com", "thinkific.com", "kajabi.com", "podia.com"],
    lms: ["canvas.instructure.com", "moodle.org", "blackboard.com"],
    "online courses": ["coursera.org", "udemy.com", "pluralsight.com", "linkedin.com"],
    
    // ===== GAMING =====
    gaming: ["unity.com", "unrealengine.com", "roblox.com", "godotengine.org"],
    "game engine": ["unity.com", "unrealengine.com", "godotengine.org"],
    "game development": ["unity.com", "unrealengine.com", "godotengine.org", "phaser.io"],
    esports: ["twitch.tv", "discord.com", "battlefy.com"],
    
    // ===== IOTSALES & HARDWARE =====
    iot: ["arduino.cc", "raspberrypi.com", "particle.io", "balena.io"],
    "internet of things": ["aws.amazon.com", "azure.microsoft.com", "particle.io"],
    embedded: ["arduino.cc", "raspberrypi.com", "espressif.com"],
    robotics: ["ros.org", "nvidia.com", "bostondynamics.com"],
    
    // ===== MOBILE =====
    mobile: ["firebase.google.com", "expo.dev", "reactnative.dev", "flutter.dev"],
    ios: ["apple.com", "firebase.google.com", "onesignal.com"],
    android: ["android.com", "firebase.google.com", "onesignal.com"],
    "react native": ["reactnative.dev", "expo.dev"],
    flutter: ["flutter.dev", "dart.dev"],
    
    // ===== LOWCODE / NOCODE =====
    nocode: ["webflow.com", "bubble.io", "softr.io", "glide.com"],
    lowcode: ["retool.com", "budibase.com", "appsmith.com", "tooljet.com"],
    "internal tools": ["retool.com", "airplane.dev", "superblocks.com"],
    
    // ===== ANALYTICS & TRACKING =====
    "web analytics": ["google.com", "plausible.io", "fathom.com", "posthog.com"],
    "product analytics": ["mixpanel.com", "amplitude.com", "posthog.com", "heap.io"],
    "session replay": ["logrocket.com", "fullstory.com", "hotjar.com", "smartlook.com"],
    heatmaps: ["hotjar.com", "crazyegg.com", "mouseflow.com"],
    "user research": ["usertesting.com", "userinterviews.com", "respondent.io"],
    data: ["snowflake.com", "databricks.com", "google.com", "tableau.com"],
    "data science": ["databricks.com", "datarobot.com", "dataiku.com"],
    "data analysis": ["tableau.com", "looker.com", "metabase.com"],
    "data visualization": ["tableau.com", "looker.com", "d3js.org", "plotly.com"],
    insights: ["amplitude.com", "mixpanel.com", "google.com"],
    metrics: ["datadog.com", "google.com", "amplitude.com"],
    reporting: ["tableau.com", "looker.com", "google.com", "metabase.com"],
    
    // ===== SEARCH & DISCOVERY =====
    search: ["algolia.com", "elasticsearch.com", "meilisearch.com", "typesense.org"],
    elasticsearch: ["elasticsearch.com", "elastic.co"],
    "site search": ["algolia.com", "elasticsearch.com", "meilisearch.com"],
    
    // ===== CMS & CONTENT =====
    cms: ["wordpress.org", "contentful.com", "sanity.io", "strapi.io", "prismic.io"],
    "headless cms": ["contentful.com", "sanity.io", "strapi.io", "prismic.io"],
    wordpress: ["wordpress.org", "wordpress.com", "wpengine.com"],
    blogging: ["ghost.org", "medium.com", "substack.com", "hashnode.com"],
    
    // ===== STREAMING & MEDIA =====
    streaming: ["mux.com", "cloudflare.com", "aws.amazon.com", "agora.io"],
    "live streaming": ["mux.com", "agora.io", "twilio.com", "twitch.tv"],
    "video hosting": ["mux.com", "cloudflare.com", "vimeo.com", "wistia.com"],
    transcoding: ["mux.com", "cloudflare.com", "aws.amazon.com"],
    
    // ===== FORMS & SURVEYS =====
    forms: ["typeform.com", "tally.so", "fillout.com", "jotform.com"],
    surveys: ["typeform.com", "surveymonkey.com", "qualtrics.com"],
    "form builder": ["typeform.com", "tally.so", "fillout.com"],
    
    // ===== SCHEDULING & CALENDAR =====
    scheduling: ["calendly.com", "cal.com", "savvycal.com", "tidycal.com"],
    calendar: ["calendly.com", "cal.com", "google.com"],
    booking: ["calendly.com", "acuityscheduling.com", "cal.com"],
    
    // ===== NOTIFICATIONS =====
    notifications: ["onesignal.com", "pusher.com", "knock.app", "courier.com"],
    "push notifications": ["onesignal.com", "pusher.com", "firebase.google.com"],
    
    // ===== FEATURE FLAGS =====
    "feature flags": ["launchdarkly.com", "flagsmith.com", "unleash.io", "growthbook.io"],
    "ab testing": ["optimizely.com", "vwo.com", "growthbook.io", "posthog.com"],
    experimentation: ["optimizely.com", "statsig.com", "eppo.com"],
    
    // ===== ERROR TRACKING =====
    "error tracking": ["sentry.io", "bugsnag.com", "rollbar.com", "airbrake.io"],
    "crash reporting": ["sentry.io", "bugsnag.com", "firebase.google.com"],
    
    // ===== COMPLIANCE =====
    compliance: ["vanta.com", "drata.com", "secureframe.com", "tugboat.com"],
    "soc 2": ["vanta.com", "drata.com", "secureframe.com"],
    gdpr: ["onetrust.com", "transcend.io", "osano.com"],
    
    // ===== LEGAL =====
    legal: ["ironclad.com", "docusign.com", "pandadoc.com", "contractworks.com"],
    contracts: ["docusign.com", "pandadoc.com", "ironclad.com", "hellosign.com"],
    "e-signature": ["docusign.com", "hellosign.com", "pandadoc.com", "signnow.com"],
    
    // ===== ACCOUNTING & FINANCE =====
    accounting: ["quickbooks.intuit.com", "xero.com", "freshbooks.com", "wave.com"],
    "expense management": ["expensify.com", "ramp.com", "brex.com", "divvy.com"],
    "financial planning": ["anaplan.com", "adaptive.com", "mosaic.tech"],
    
    // ===== SOCIAL & COMMUNITY =====
    social: ["twitter.com", "linkedin.com", "facebook.com", "instagram.com"],
    community: ["discord.com", "circle.so", "mighty.co", "discourse.org"],
    forum: ["discourse.org", "flarum.org", "vanilla.com"],
    
    // ===== REFERRAL & LOYALTY =====
    referral: ["referralcandy.com", "friendbuy.com", "extole.com", "viral-loops.com"],
    loyalty: ["smile.io", "yotpo.com", "loyaltylion.com", "stamp.me"],
    
    // ===== REVIEWS & REPUTATION =====
    reviews: ["trustpilot.com", "g2.com", "capterra.com", "getapp.com"],
    reputation: ["birdeye.com", "podium.com", "grade.us", "reviewtrackers.com"],
    
    // ===== TRAVEL & HOSPITALITY =====
    travel: ["booking.com", "expedia.com", "airbnb.com", "vrbo.com"],
    hospitality: ["cloudbeds.com", "mews.com", "opera.com"],
    
    // ===== REAL ESTATE =====
    "real estate": ["zillow.com", "redfin.com", "realtor.com", "apartments.com"],
    proptech: ["opendoor.com", "redfin.com", "compass.com"],
    
    // ===== HEALTHCARE & MEDTECH =====
    healthcare: ["epic.com", "cerner.com", "athenahealth.com", "allscripts.com"],
    healthtech: ["oscar.health", "ro.co", "hims.com", "nurx.com"],
    telemedicine: ["teladoc.com", "amwell.com", "doctor-on-demand.com"],
    
    // ===== LOGISTICS & SUPPLY CHAIN =====
    logistics: ["flexport.com", "shipbob.com", "shippo.com", "easyship.com"],
    shipping: ["shipstation.com", "easyship.com", "shippo.com", "pirateship.com"],
    fulfillment: ["shipbob.com", "deliverr.com", "flexport.com"],
    "supply chain": ["flexport.com", "project44.com", "fourkites.com"],
    
    // ===== AGRICULTURE & AGTECH =====
    agriculture: ["climate.com", "granular.ag", "farmers.com"],
    agtech: ["climate.com", "indigo.ag", "granular.ag"],
    
    // ===== CLIMATE & CLEANTECH =====
    climate: ["watershed.com", "persefoni.com", "normative.io"],
    cleantech: ["tesla.com", "sunrun.com", "chargepoint.com"],
    sustainability: ["watershed.com", "greenly.earth", "planetly.com"],
    carbon: ["watershed.com", "patch.io", "pachama.com"],
    
    // ===== INSURANCE & INSURTECH =====
    insurance: ["lemonade.com", "root.com", "hippo.com", "next.com"],
    insurtech: ["lemonade.com", "hippo.com", "clearcover.com"],
    
    // ===== PROPERTY & REAL ESTATE TECH =====
    "property tech": ["opendoor.com", "divvy.co", "homelight.com", "zillow.com"],
    "property management": ["buildium.com", "appfolio.com", "propertyware.com"],
    
    // ===== EVENTS =====
    events: ["eventbrite.com", "lu.ma", "partiful.com", "hopin.com"],
    "event ticketing": ["eventbrite.com", "ticketmaster.com", "dice.fm"],
    
    // ===== PODCASTING =====
    podcast: ["riverside.fm", "descript.com", "anchor.fm", "buzzsprout.com"],
    podcasting: ["riverside.fm", "descript.com", "transistor.fm"],
    
    // ===== NEWSLETTER =====
    newsletter: ["beehiiv.com", "substack.com", "ghost.org", "convertkit.com"],
    
    // ===== CREATOR ECONOMY =====
    creator: ["patreon.com", "gumroad.com", "podia.com", "beehiiv.com"],
    "creator tools": ["linktree.com", "beacons.ai", "stan.store"],
    monetization: ["patreon.com", "gumroad.com", "memberful.com"],
    
    // ===== FASHION & APPAREL =====
    fashion: ["shopify.com", "farfetch.com", "ssense.com"],
    apparel: ["shopify.com", "printful.com", "printify.com"],
    
    // ===== SPORTS & FITNESS =====
    fitness: ["peloton.com", "strava.com", "whoop.com", "myfitnesspal.com"],
    sports: ["espn.com", "theathletm", "hudl.com"],
    wellness: ["calm.com", "headspace.com", "noom.com"],
    
    // ===== FOOD & BEVERAGE =====
    food: ["doordash.com", "ubereats.com", "grubhub.com", "instacart.com"],
    restaurant: ["toast.com", "square.com", "clover.com", "lightspeed.com"],
    delivery: ["doordash.com", "uber.com", "postmates.com"],
    
    // ===== AUTOMOTIVE =====
    automotive: ["tesla.com", "rivian.com", "lucidmotors.com"],
    "electric vehicles": ["tesla.com", "rivian.com", "lucidmotors.com", "nio.com"],
    ev: ["tesla.com", "chargepoint.com", "electrifyamerica.com"],
    
    // ===== MANUFACTURING =====
    manufacturing: ["ge.com", "siemens.com", "rockwellautomation.com"],
    "industrial iot": ["siemens.com", "ge.com", "ptc.com"],
    
    // ===== ENERGY =====
    energy: ["tesla.com", "nexteraenergy.com", "sunrun.com"],
    renewable: ["sunrun.com", "sunpower.com", "vestas.com"],
    solar: ["sunrun.com", "sunpower.com", "tesla.com"],
    
    // ===== NONPROFITS =====
    nonprofit: ["salesforce.org", "classy.org", "givebutter.com"],
    fundraising: ["gofundme.com", "classy.org", "givebutter.com"],
    
    // ===== EXTRAS & EMERGING TECH =====
    "augmented reality": ["snapchat.com", "niantic.com", "meta.com"],
    ar: ["snapchat.com", "niantic.com", "meta.com", "8thwall.com"],
    vr: ["meta.com", "htc.com", "valve.com"],
    "virtual reality": ["meta.com", "htc.com", "playstation.com"],
    quantum: ["ibm.com", "ionq.com", "rigetti.com"],
    "quantum computing": ["ibm.com", "ionq.com", "rigetti.com"],
    edge: ["cloudflare.com", "fastly.com", "akamai.com"],
    "5g": ["qualcomm.com", "ericsson.com", "nokia.com"],
    satellite: ["starlink.com", "oneweb.com", "planet.com"],
    space: ["spacex.com", "blueorigin.com", "rocketlab.com"],
    biotech: ["ginkgobioworks.com", "recursion.com", "moderna.com"],
    genomics: ["23andme.com", "ancestry.com", "illumina.com"],
    drone: ["dji.com", "skydio.com", "zipline.com"],
    
    // ===== GENERAL BUSINESS & ENTERPRISE =====
    business: ["salesforce.com", "microsoft.com", "google.com", "hubspot.com"],
    enterprise: ["salesforce.com", "microsoft.com", "oracle.com", "sap.com"],
    b2b: ["salesforce.com", "hubspot.com", "linkedin.com", "zoominfo.com"],
    b2c: ["shopify.com", "mailchimp.com", "zendesk.com"],
    startup: ["stripe.com", "notion.so", "slack.com", "figma.com"],
    innovation: ["google.com", "amazon.com", "microsoft.com"],
    technology: ["microsoft.com", "google.com", "apple.com", "amazon.com"],
    tech: ["microsoft.com", "google.com", "apple.com", "amazon.com"],
    digital: ["google.com", "adobe.com", "salesforce.com"],
    transformation: ["microsoft.com", "salesforce.com", "servicenow.com"],
    "digital transformation": ["microsoft.com", "salesforce.com", "servicenow.com"],
    consulting: ["accenture.com", "deloitte.com", "mckinsey.com", "bcg.com"],
    agency: ["wpengine.com", "netlify.com", "webflow.com"],
    solution: ["microsoft.com", "salesforce.com", "oracle.com"],
    solutions: ["microsoft.com", "salesforce.com", "ibm.com"],
  }
  
  return map[k] || []
}

export async function publicEmailFinder(
  params: { keyword?: string; domains?: string[]; pagesPerDomain?: number; perDomainCap?: number; totalCap?: number },
): Promise<{ results: PublicEmailResult[] }> {
  const domains: string[] = []
  const fromKeyword = resolveDomainsFromKeyword(params.keyword)
  domains.push(...fromKeyword)
  if (params.domains) domains.push(...params.domains)
  const uniqueDomains = Array.from(new Set(domains.map(normalizeDomain))).slice(0, 20)

  const all: PublicEmailResult[] = []
  const perDomainCap = Math.max(1, params.perDomainCap ?? 5)
  const totalCap = Math.max(10, params.totalCap ?? 50)
  const seen = new Set<string>()

  // Concurrency limit for domains
  const CONCURRENCY = 5
  let idx = 0
  let active = 0
  let finished = false
  let errors: any[] = []

  // Helper to run domain fetches in parallel
  async function runNext(): Promise<void> {
    if (finished) return
    if (idx >= uniqueDomains.length) return
    if (all.length >= totalCap) {
      finished = true
      return
    }
    const d = uniqueDomains[idx++]
    active++
    try {
      const res = await extractPublicEmailsForDomain(d, { pagesPerDomain: params.pagesPerDomain ?? 8, timeoutMs: 4000 })
      let addedForDomain = 0
      for (const r of res) {
        if (all.length >= totalCap) break
        if (addedForDomain >= perDomainCap) break
        const key = `${r.email}`
        if (seen.has(key)) continue
        seen.add(key)
        all.push(r)
        addedForDomain++
      }
    } catch (e) {
      errors.push(e)
    } finally {
      active--
      if (!finished && idx < uniqueDomains.length) {
        await runNext()
      }
    }
  }

  // Run with concurrency
  const runners: Promise<void>[] = []
  for (let i = 0; i < Math.min(CONCURRENCY, uniqueDomains.length); i++) {
    runners.push(runNext())
  }

  // Global timeout
  let timedOut = false
  await Promise.race([
    Promise.all(runners),
    new Promise((_, reject) => setTimeout(() => { timedOut = true; reject(new Error("Search timed out (30s)")); }, 30000)),
  ]).catch((e) => {
    devLog("[public-email] Timeout or error:", e)
  })

  devLog("[public-email] Final results:", all.length, "from", uniqueDomains.length, "domains", timedOut ? "(timed out)" : "")
  return { results: all }
}

// ===== ENHANCED EMAIL DISCOVERY METHODS =====

/**
 * Check common email patterns for a domain
 * Returns emails that are likely to exist (info@, contact@, support@, etc.)
 */
async function checkCommonEmailPatterns(domain: string): Promise<PublicEmailResult[]> {
  const commonPatterns = [
    "info",
    "contact", 
    "hello",
    "support",
    "sales",
    "team",
    "admin",
    "help",
    "inquiries",
    "general"
  ]
  
  const results: PublicEmailResult[] = []
  
  for (const pattern of commonPatterns) {
    const email = `${pattern}@${domain}`
    
    // Quick syntax validation
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) continue
    
    results.push({
      domain,
      email,
      type: "generic",
      sourceUrl: `Pattern check: ${pattern}@`
    })
  }
  
  return results
}

/**
 * Extract emails from DNS TXT records
 * Some domains include contact emails in SPF or other TXT records
 */
async function getDnsEmails(domain: string): Promise<PublicEmailResult[]> {
  try {
    const dns = await import('dns/promises')
    const txtRecords = await dns.resolveTxt(domain).catch(() => [])
    const emails: PublicEmailResult[] = []
    
    txtRecords.forEach(record => {
      const text = record.join('')
      const emailMatches = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []
      
      emailMatches.forEach(email => {
        // Filter out common non-contact emails
        const localpart = email.split('@')[0].toLowerCase()
        if (['noreply', 'no-reply', 'donotreply', 'postmaster'].includes(localpart)) return
        
        emails.push({
          domain,
          email: email.toLowerCase(),
          type: "generic",
          sourceUrl: "DNS TXT record"
        })
      })
    })
    
    return emails
  } catch (e) {
    devLog("[dns-emails] Error for", domain, e)
    return []
  }
}

/**
 * Enhanced extractPublicEmails with parallel DNS and pattern checks
 */
export async function extractPublicEmailsEnhanced(params: {
  keyword?: string
  domains?: string
  perDomainCap?: number
  totalCap?: number
  pagesPerDomain?: number
}): Promise<{ results: PublicEmailResult[] }> {
  const normalizedDomainsList: string[] = []
  
  // Parse domains from input
  if (params.domains) {
    const inputDomains = params.domains
      .split(/[\n,]+/)
      .map(d => normalizeDomain(d))
      .filter(Boolean)
    normalizedDomainsList.push(...inputDomains)
  }
  
  // Get domains from keyword
  if (params.keyword && params.keyword.trim()) {
    const keywordDomains = resolveDomainsFromKeyword(params.keyword.trim())
    normalizedDomainsList.push(...keywordDomains)
  }
  
  const uniqueDomains = Array.from(new Set(normalizedDomainsList))
  if (uniqueDomains.length === 0) {
    return { results: [] }
  }
  
  const perDomainCap = params.perDomainCap ?? 10
  const totalCap = params.totalCap ?? 50
  
  devLog("[email-enhanced] Starting enhanced search for", uniqueDomains.length, "domains")
  
  // Check cache first
  const cachedResults = await getCachedEmails(uniqueDomains)
  const cachedDomains = new Set(cachedResults.map(r => r.domain))
  const domainsToSearch = uniqueDomains.filter(d => !cachedDomains.has(d))
  
  devLog("[email-enhanced] Found", cachedResults.length, "cached emails from", cachedDomains.size, "domains")
  devLog("[email-enhanced] Need to search", domainsToSearch.length, "new domains")
  
  const all: PublicEmailResult[] = [...cachedResults]
  const seen = new Set<string>(cachedResults.map(r => r.email.toLowerCase()))
  
  // Run all methods in parallel for each domain - check up to 50 domains
  const domainPromises = domainsToSearch.slice(0, 50).map(async (domain) => {
    const domainResults: PublicEmailResult[] = []
    
    try {
      // Run scraping and DNS checks in parallel (removed pattern check - was generating false positives)
      const [scrapedEmails, dnsEmails] = await Promise.all([
        extractPublicEmailsForDomain(domain, { 
          pagesPerDomain: params.pagesPerDomain ?? 8, 
          timeoutMs: 4000 
        }).catch(() => []),
        getDnsEmails(domain).catch(() => [])
      ])
      
      // Combine results (only verified sources)
      const combined = [...scrapedEmails, ...dnsEmails]
      
      // Deduplicate and limit per domain
      let addedForDomain = 0
      for (const result of combined) {
        if (addedForDomain >= perDomainCap) break
        const key = result.email.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        domainResults.push(result)
        addedForDomain++
      }
    } catch (e) {
      devLog("[email-enhanced] Error for domain", domain, e)
    }
    
    return domainResults
  })
  
  // Wait for all domains with timeout
  const resultsArrays = await Promise.race([
    Promise.all(domainPromises),
    new Promise<PublicEmailResult[][]>((resolve) => 
      setTimeout(() => resolve([]), 45000) // Increased to 45s for checking 50 domains
    )
  ])
  
  // Flatten and limit total
  const newResults: PublicEmailResult[] = []
  for (const domainResults of resultsArrays) {
    for (const result of domainResults) {
      if (all.length >= totalCap) break
      all.push(result)
      newResults.push(result) // Track new results for caching
    }
    if (all.length >= totalCap) break
  }
  
  // Cache newly found emails for future searches
  if (newResults.length > 0) {
    await cacheEmails(newResults)
  }
  
  devLog("[email-enhanced] Found", all.length, "total emails (", cachedResults.length, "cached,", newResults.length, "new)")
  return { results: all }
}
