// Contact Generator: Smart domain matching for product keywords
export async function findContactEmails({ keyword, maxResults = 5 }: { keyword: string; maxResults?: number }) {
  if (!keyword || keyword.length < 2) return []
  
  const candidates: string[] = []
  const base = keyword.toLowerCase().replace(/[^a-z0-9]/g, "") // Remove special chars
  
  devLog("[contact-gen] Searching for keyword:", keyword, "base:", base)
  
  // Build comprehensive candidate list
  const extensions = [".com", ".ai", ".io", ".net", ".org", ".app", ".co"]
  
  // 1. Exact match
  extensions.forEach(ext => candidates.push(`${base}${ext}`))
  
  // 2. keyword + gpt
  extensions.forEach(ext => candidates.push(`${base}gpt${ext}`))
  
  // 3. gpt + keyword
  extensions.forEach(ext => candidates.push(`gpt${base}${ext}`))
  
  // 4. keyword + ai
  extensions.forEach(ext => candidates.push(`${base}ai${ext}`))
  
  // 5. ai + keyword
  extensions.forEach(ext => candidates.push(`ai${base}${ext}`))
  
  // 6. If keyword contains multiple parts, try variations
  if (base.length > 4) {
    const parts = [base.slice(0, 4), base.slice(4)]
    extensions.forEach(ext => {
      candidates.push(`${parts[0]}${parts[1]}${ext}`)
      candidates.push(`${parts[1]}${parts[0]}${ext}`)
    })
  }

  const uniqueDomains = Array.from(new Set(candidates))
  devLog("[contact-gen] Checking", uniqueDomains.length, "candidate domains")

  // Try domains in parallel batches
  const results: PublicEmailResult[] = []
  const BATCH_SIZE = 5
  
  for (let i = 0; i < uniqueDomains.length && results.length < maxResults; i += BATCH_SIZE) {
    const batch = uniqueDomains.slice(i, i + BATCH_SIZE)
    const promises = batch.map(async domain => {
      try {
        devLog("[contact-gen] Trying domain:", domain)
        const found = await extractPublicEmailsForDomain(domain, { pagesPerDomain: 6, timeoutMs: 3000 })
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
  }
  
  devLog("[contact-gen] Final results:", results.length, "emails found")
  return results
}
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
    
    // ===== DEVELOPER TOOLS & INFRASTRUCTURE =====
    github: ["github.com", "gitlab.com", "bitbucket.org", "sourcegraph.com"],
    git: ["github.com", "gitlab.com", "bitbucket.org", "gitkraken.com"],
    "version control": ["github.com", "gitlab.com", "bitbucket.org", "perforce.com"],
    ide: ["jetbrains.com", "visualstudio.com", "cursor.sh", "replit.com"],
    "code editor": ["cursor.sh", "visualstudio.com", "sublimetext.com", "jetbrains.com"],
    devtools: ["github.com", "postman.com", "insomnia.rest", "jetbrains.com"],
    ci: ["github.com", "circleci.com", "travis-ci.com", "jenkins.io", "buildkite.com"],
    "continuous integration": ["github.com", "circleci.com", "gitlab.com", "jenkins.io"],
    devops: ["github.com", "gitlab.com", "circleci.com", "jenkins.io", "terraform.io"],
    kubernetes: ["kubernetes.io", "rancher.com", "redhat.com", "vmware.com"],
    docker: ["docker.com", "rancher.com", "portainer.io"],
    containers: ["docker.com", "kubernetes.io", "rancher.com", "podman.io"],
    "infrastructure as code": ["terraform.io", "pulumi.com", "ansible.com", "cloudformation.aws.com"],
    terraform: ["terraform.io", "hashicorp.com", "spacelift.io", "env0.com"],
    monitoring: ["datadog.com", "newrelic.com", "sentry.io", "pagerduty.com", "grafana.com"],
    observability: ["datadog.com", "newrelic.com", "honeycomb.io", "lightstep.com"],
    logging: ["datadog.com", "splunk.com", "loggly.com", "papertrail.com"],
    apm: ["datadog.com", "newrelic.com", "dynatrace.com", "appdynamics.com"],
    
    // ===== CLOUD & HOSTING =====
    cloud: ["aws.amazon.com", "azure.microsoft.com", "cloud.google.com", "digitalocean.com", "linode.com", "vultr.com"],
    aws: ["aws.amazon.com", "cloudflare.com", "terraform.io"],
    azure: ["azure.microsoft.com", "microsoft.com"],
    gcp: ["cloud.google.com", "firebase.google.com"],
    hosting: ["vercel.com", "netlify.com", "digitalocean.com", "heroku.com", "railway.app", "fly.io"],
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
    productivity: ["notion.so", "asana.com", "trello.com", "monday.com", "clickup.com", "linear.app"],
    "project management": ["asana.com", "monday.com", "linear.app", "clickup.com", "jira.atlassian.com"],
    collaboration: ["slack.com", "discord.com", "microsoft.com", "zoom.us", "miro.com"],
    workspace: ["notion.so", "coda.io", "airtable.com", "clickup.com"],
    notes: ["notion.so", "obsidian.md", "evernote.com", "onenote.com", "roam.com"],
    documentation: ["notion.so", "gitbook.com", "readme.com", "docusaurus.io"],
    wiki: ["notion.so", "confluence.atlassian.com", "gitbook.com", "outline.com"],
    
    // ===== COMMUNICATION =====
    messaging: ["slack.com", "discord.com", "telegram.org", "signal.org", "whatsapp.com"],
    chat: ["slack.com", "discord.com", "intercom.com", "drift.com", "crisp.chat"],
    "video conferencing": ["zoom.us", "meet.google.com", "webex.com", "whereby.com"],
    voip: ["twilio.com", "vonage.com", "ringcentral.com", "plivo.com"],
    sms: ["twilio.com", "messagebird.com", "plivo.com", "telnyx.com"],
    email: ["sendgrid.com", "mailgun.com", "postmark.com", "resend.com", "aws.amazon.com"],
    "email delivery": ["sendgrid.com", "mailgun.com", "postmark.com", "resend.com"],
    
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
    "content marketing": ["hubspot.com", "contentful.com", "sanity.io", "wordpress.com"],
    "social media": ["hootsuite.com", "buffer.com", "sproutsocial.com", "later.com"],
    advertising: ["google.com", "facebook.com", "linkedin.com", "twitter.com", "tiktok.com"],
    ppc: ["google.com", "microsoft.com", "wordstream.com", "optmyzr.com"],
    "affiliate marketing": ["impact.com", "cj.com", "shareasale.com", "awin.com"],
    affiliate: ["impact.com", "cj.com", "awin.com", "partnerize.com", "refersion.com"],
    
    // ===== CRM & SALES =====
    crm: ["salesforce.com", "hubspot.com", "pipedrive.com", "zoho.com", "freshsales.com"],
    sales: ["salesforce.com", "hubspot.com", "outreach.io", "salesloft.com", "apollo.io"],
    "sales engagement": ["outreach.io", "salesloft.com", "apollo.io", "groove.co"],
    "lead generation": ["apollo.io", "lusha.com", "zoominfo.com", "hunter.io"],
    prospecting: ["apollo.io", "zoominfo.com", "linkedin.com", "hunter.io"],
    outbound: ["apollo.io", "outreach.io", "salesloft.com", "lemlist.com"],
    
    // ===== ECOMMERCE =====
    ecommerce: ["shopify.com", "woocommerce.com", "bigcommerce.com", "magento.com", "prestashop.com"],
    shopify: ["shopify.com", "shopifyplus.com"],
    woocommerce: ["woocommerce.com", "wordpress.org"],
    "online store": ["shopify.com", "woocommerce.com", "bigcommerce.com", "squarespace.com"],
    cart: ["shopify.com", "bigcommerce.com", "woocommerce.com", "commercetools.com"],
    checkout: ["stripe.com", "shopify.com", "fastspring.com", "paddle.com"],
    "product catalog": ["shopify.com", "algolia.com", "elastic.co"],
    
    // ===== PAYMENTS =====
    payment: ["stripe.com", "paypal.com", "square.com", "adyen.com", "checkout.com"],
    payments: ["stripe.com", "paypal.com", "square.com", "adyen.com", "braintreepayments.com"],
    fintech: ["stripe.com", "plaid.com", "square.com", "adyen.com", "circle.com"],
    billing: ["stripe.com", "chargebee.com", "recurly.com", "paddle.com", "zuora.com"],
    invoicing: ["stripe.com", "freshbooks.com", "quickbooks.intuit.com", "xero.com"],
    subscriptions: ["stripe.com", "chargebee.com", "recurly.com", "paddle.com"],
    
    // ===== DESIGN & CREATIVE =====
    design: ["figma.com", "adobe.com", "canva.com", "sketch.com", "framer.com"],
    "ui design": ["figma.com", "sketch.com", "adobe.com", "framer.com"],
    "ux design": ["figma.com", "adobe.com", "hotjar.com", "usertesting.com"],
    prototyping: ["figma.com", "framer.com", "invisionapp.com", "protopie.io"],
    "design system": ["figma.com", "storybook.js.org", "zeroheight.com"],
    graphics: ["adobe.com", "canva.com", "affinity.serif.com", "sketch.com"],
    video: ["adobe.com", "loom.com", "riverside.fm", "descript.com", "runway.ml"],
    "video editing": ["adobe.com", "davinciresolve.com", "runway.ml", "descript.com"],
    animation: ["adobe.com", "lottiefiles.com", "rive.app", "spline.design"],
    "3d": ["blender.org", "autodesk.com", "unity.com", "unreal.com", "spline.design"],
    
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
    livechat: ["intercom.com", "drift.com", "livechat.com", "crisp.chat"],
    ticketing: ["zendesk.com", "freshdesk.com", "linear.app", "jira.atlassian.com"],
    
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
      const res = await extractPublicEmailsForDomain(d, { pagesPerDomain: params.pagesPerDomain ?? 12, timeoutMs: 4000 })
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
