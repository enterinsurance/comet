import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { headers } from "next/headers"

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
})

// Create rate limiters for different endpoints
export const rateLimiters = {
  // General API endpoints - 100 requests per 10 minutes
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "10 m"),
    analytics: true,
    prefix: "@upstash/ratelimit:api",
  }),

  // Authentication endpoints - 5 requests per 5 minutes
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "5 m"),
    analytics: true,
    prefix: "@upstash/ratelimit:auth",
  }),

  // File upload - 20 requests per hour
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit:upload",
  }),

  // Email sending - 10 requests per hour
  email: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit:email",
  }),

  // Document signing - 50 requests per hour
  signing: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit:signing",
  }),
}

export type RateLimitType = keyof typeof rateLimiters

export async function checkRateLimit(type: RateLimitType, identifier?: string) {
  try {
    let id = identifier
    if (!id) {
      const headersList = await headers()
      id = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "anonymous"
    }

    const { success, limit, reset, remaining } = await rateLimiters[type].limit(id)

    return {
      success,
      limit,
      reset,
      remaining,
      identifier: id,
    }
  } catch (error) {
    console.error("Rate limiting error:", error)
    return {
      success: true,
      limit: 0,
      reset: 0,
      remaining: 0,
      identifier: identifier || "unknown",
    }
  }
}

export function createRateLimitHeaders(result: Awaited<ReturnType<typeof checkRateLimit>>) {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  }
}

export function createRateLimitResponse() {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  )
}
