import { NextResponse } from "next/server"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://outbound.ing"

const STATIC_PATHS = [
  "/",
  "/pricing",
  "/generator",
  "/faq",
  "/guide",
  "/contact",
  "/auth/login",
  "/archive",
]

function formatDate(d?: string) {
  if (!d) return undefined
  return d.split("T")[0]
}

export async function GET() {
  const urls: Array<{ loc: string; lastmod?: string }> = STATIC_PATHS.map((p) => ({ loc: `${SITE_URL}${p}` }))

  // Attempt to include DB-driven content (strategies, templates) if Supabase service role key is available
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (SUPABASE_URL && SERVICE_ROLE_KEY) {
    try {
      const headers = {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      }

      // Strategies
      const strategiesRes = await fetch(`${SUPABASE_URL}/rest/v1/strategies?select=slug,updated_at&status=eq.published&limit=1000`, { headers })
      if (strategiesRes.ok) {
        const strategies = await strategiesRes.json()
        strategies.forEach((s: any) => {
          if (s.slug) urls.push({ loc: `${SITE_URL}/strategy/${s.slug}`, lastmod: formatDate(s.updated_at) })
        })
      }

      // Templates
      const templatesRes = await fetch(`${SUPABASE_URL}/rest/v1/templates?select=slug,updated_at&is_public=eq.true&limit=1000`, { headers })
      if (templatesRes.ok) {
        const templates = await templatesRes.json()
        templates.forEach((t: any) => {
          if (t.slug) urls.push({ loc: `${SITE_URL}/templates/${t.slug}`, lastmod: formatDate(t.updated_at) })
        })
      }
    } catch (e) {
      // swallow errors — sitemap will still contain static pages
      console.error("sitemap: error fetching supabase lists", e)
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}\n  </url>`)
    .join("\n")}\n</urlset>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
