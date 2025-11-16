import { updateSession } from "@/lib/supabase/middleware"
import { rateLimiters, getClientIP } from "@/lib/rate-limit"
import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname

    // Try to detect an authenticated user (so we can rate-limit by user id instead of IP)
    let hasUser = false
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // noop for middleware check
            },
          },
        })

        const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
        hasUser = !!user
      }
    } catch (err) {
      // ignore and treat as anonymous
      hasUser = false
    }

    // Apply different rate limits based on the route
    if (pathname.startsWith("/api/")) {
      // API routes get moderate rate limiting (by IP)
      const rateLimitResult = rateLimiters.api.check(getClientIP(request))
      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            error: "Too many API requests. Please slow down.",
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            }
          }
        )
      }
    }

    // Auth routes get stricter rate limiting
    if (pathname.includes("/auth/") || pathname.includes("/api/auth/")) {
      // Allow the OAuth provider callback through without strict rate limiting
      // to avoid blocking legitimate sign-in flows (they often hit this URL).
      if (pathname.includes("/auth/callback")) {
        return await updateSession(request)
      }
      // Use user id if available (prevents IP collisions for logged-in users), else fall back to IP
      const identifier = hasUser ? (await (async () => {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          if (supabaseUrl && supabaseAnonKey) {
            const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
              cookies: {
                getAll() {
                  return request.cookies.getAll()
                },
                setAll() {},
              },
            })
            const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
            return user?.id || getClientIP(request)
          }
        } catch {
          return getClientIP(request)
        }
      })()) : getClientIP(request)

  const rateLimitResult = rateLimiters.auth.check(identifier || getClientIP(request))
      if (!rateLimitResult.allowed) {
        const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        const accept = request.headers.get("accept") || ""

        // If this is a browser navigation (accepts HTML), return a simple human-friendly HTML page
        // instead of raw JSON. For non-HTML clients, keep JSON to preserve API behavior.
        if (accept.includes("text/html")) {
          const html = `<!doctype html><html><head><meta charset="utf-8"><title>Too many sign-in attempts</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:48px;">` +
            `<h1>Too many sign-in attempts</h1><p>Please wait ${retryAfter} seconds before trying again.</p><p><a href="/">Return to the homepage</a></p></body></html>`

          return new Response(html, {
            status: 429,
            headers: {
              "Content-Type": "text/html",
              "Retry-After": String(retryAfter),
            }
          })
        }

        return new Response(
          JSON.stringify({
            error: "Too many authentication attempts. Please wait before trying again.",
            retryAfter
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
            }
          }
        )
      }
    }

    return await updateSession(request)
  } catch (error) {
    console.error("[v0] Middleware error:", error)
    // Continue without middleware if there's an error
    return new Response(null, { status: 500 })
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
