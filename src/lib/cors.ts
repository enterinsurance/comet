import { type NextRequest, NextResponse } from "next/server"

// CORS configuration
const CORS_CONFIG = {
  // Allow specific origins in production
  allowedOrigins: [
    process.env.DOMAIN,
    process.env.ORIGIN
  ],

  // Allowed HTTP methods
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],

  // Allowed headers
  allowedHeaders: [
    "Accept",
    "Accept-Version",
    "Authorization",
    "Content-Length",
    "Content-MD5",
    "Content-Type",
    "Date",
    "X-Api-Version",
    "X-CSRF-Token",
    "X-Requested-With",
  ],

  // Headers exposed to the client
  exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],

  // Maximum age for preflight cache
  maxAge: 86400, // 24 hours

  // Allow credentials
  credentials: true,
}

export function createCorsHeaders(origin?: string | null) {
  const headers: Record<string, string> = {}

  // Check if origin is allowed
  if (
    origin &&
    (CORS_CONFIG.allowedOrigins.includes(origin) || CORS_CONFIG.allowedOrigins.includes("*"))
  ) {
    headers["Access-Control-Allow-Origin"] = origin
  }

  headers["Access-Control-Allow-Methods"] = CORS_CONFIG.allowedMethods.join(", ")
  headers["Access-Control-Allow-Headers"] = CORS_CONFIG.allowedHeaders.join(", ")
  headers["Access-Control-Expose-Headers"] = CORS_CONFIG.exposedHeaders.join(", ")
  headers["Access-Control-Max-Age"] = CORS_CONFIG.maxAge.toString()

  if (CORS_CONFIG.credentials) {
    headers["Access-Control-Allow-Credentials"] = "true"
  }

  return headers
}

export function handleCorsPreflightRequest(request: NextRequest) {
  const origin = request.headers.get("origin")
  const corsHeaders = createCorsHeaders(origin)

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin")
  const corsHeaders = createCorsHeaders(origin)

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// Security headers to add alongside CORS
export function createSecurityHeaders() {
  return {
    // Prevent XSS attacks
    "X-XSS-Protection": "1; mode=block",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Content Security Policy (basic)
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Allow Next.js scripts
      "style-src 'self' 'unsafe-inline'", // Allow CSS
      "img-src 'self' data: blob: https:", // Allow images
      "font-src 'self'",
      "connect-src 'self' blob: https:",
      "frame-src 'none'",
    ].join("; "),
  }
}
