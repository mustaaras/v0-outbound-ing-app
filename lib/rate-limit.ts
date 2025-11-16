import { NextRequest, NextResponse } from "next/server"

// Simple in-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export class RateLimiter {
  private windowMs: number
  private maxRequestsValue: number
  private message: string
  private skipSuccessfulRequests: boolean
  private skipFailedRequests: boolean

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs
    this.maxRequestsValue = options.maxRequests
    this.message = options.message || "Too many requests, please try again later."
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false
    this.skipFailedRequests = options.skipFailedRequests || false
  }

  get maxRequests(): number {
    return this.maxRequestsValue
  }

  private getKey(identifier: string): string {
    return `rate_limit_${identifier}`
  }

  private getRemainingTime(resetTime: number): number {
    return Math.ceil((resetTime - Date.now()) / 1000)
  }

  check(identifier: string): { allowed: boolean; remainingRequests: number; resetTime: number } {
    const key = this.getKey(identifier)
    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return {
        allowed: true,
        remainingRequests: this.maxRequests - 1,
        resetTime: now + this.windowMs
      }
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: record.resetTime
      }
    }

    // Increment counter
    record.count++
    rateLimitStore.set(key, record)

    return {
      allowed: true,
      remainingRequests: this.maxRequests - record.count,
      resetTime: record.resetTime
    }
  }

  middleware(options: { identifier?: (req: NextRequest) => string } = {}) {
    return (req: NextRequest) => {
      const identifier = options.identifier
        ? options.identifier(req)
        : getClientIP(req)

      const result = this.check(identifier)

      if (!result.allowed) {
        const remainingTime = this.getRemainingTime(result.resetTime)

        return new NextResponse(
          JSON.stringify({
            error: this.message,
            retryAfter: remainingTime
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": remainingTime.toString(),
              "X-RateLimit-Limit": this.maxRequests.toString(),
              "X-RateLimit-Remaining": result.remainingRequests.toString(),
              "X-RateLimit-Reset": result.resetTime.toString()
            }
          }
        )
      }

      // Add rate limit headers to successful requests
      const response = NextResponse.next()
      response.headers.set("X-RateLimit-Limit", this.maxRequests.toString())
      response.headers.set("X-RateLimit-Remaining", result.remainingRequests.toString())
      response.headers.set("X-RateLimit-Reset", result.resetTime.toString())

      return response
    }
  }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // Strict rate limiting for AI generation (expensive operations)
  aiGeneration: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    message: "Too many AI generation requests. Please wait before generating more emails."
  }),

  // Moderate rate limiting for general API calls
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: "Too many API requests. Please slow down."
  }),

  // Lenient rate limiting for search operations
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
    message: "Too many search requests. Please wait before searching again."
  }),

  // More lenient rate limiting for authentication (mobile-friendly)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 auth attempts per 15 minutes (more lenient for mobile)
    message: "Too many authentication attempts. Please wait before trying again."
  })

  // Anonymous daily generator limit (logout visitors)
  ,anonymousDaily: new RateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 2, // 2 generations per day for anonymous users
    message: "Daily limit reached. Create an account to generate more samples."
  })
}

// Helper function to get client IP (works with Vercel)
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const clientIP = request.headers.get("x-client-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (clientIP) {
    return clientIP
  }

  return "unknown"
}

// Helper function for user-based rate limiting (requires authentication)
export function getUserIdentifier(userId?: string): string {
  return userId || "anonymous"
}

// Dev helper: reset rate limit counters (unsafe for production)
export function resetRateLimit(identifier?: string) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('resetRateLimit is only available in development')
  }

  if (identifier) {
    const key = `rate_limit_${identifier}`
    rateLimitStore.delete(key)
    return { cleared: 1 }
  }

  const size = rateLimitStore.size
  rateLimitStore.clear()
  return { cleared: size }
}