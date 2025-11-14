import { updateSession } from "@/lib/supabase/middleware"
import { rateLimiters, getClientIP } from "@/lib/rate-limit"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname

    // Apply different rate limits based on the route
    if (pathname.startsWith("/api/")) {
      // API routes get moderate rate limiting
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
      const rateLimitResult = rateLimiters.auth.check(getClientIP(request))
      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            error: "Too many authentication attempts. Please wait before trying again.",
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
