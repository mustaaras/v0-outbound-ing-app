import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { devLog } from "@/lib/logger"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  devLog("[v0] Middleware check:", {
    path: request.nextUrl.pathname,
    hasUser: !!user,
  })

  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth/callback"]
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)

  const protectedRoutes = ["/dashboard", "/generator", "/archive", "/upgrade", "/pricing", "/settings"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (!user && isProtectedRoute) {
  devLog("[v0] Redirecting to login - no user found")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (
    user &&
    (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/signup"))
  ) {
  devLog("[v0] Redirecting to dashboard - user already logged in")
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
