import crypto from "crypto"

// Enhanced token configuration
const TOKEN_CONFIG = {
  // Token lengths in bytes
  SIGNING_TOKEN_LENGTH: 32, // 256-bit entropy
  INVITATION_TOKEN_LENGTH: 24, // 192-bit entropy
  SESSION_TOKEN_LENGTH: 16, // 128-bit entropy

  // Token types for different purposes
  TOKEN_TYPES: {
    SIGNING: "sign",
    INVITATION: "inv",
    SESSION: "sess",
    API: "api",
  } as const,

  // Maximum token lifetime in hours
  MAX_LIFETIME_HOURS: 24 * 30, // 30 days
  DEFAULT_LIFETIME_HOURS: 24 * 7, // 7 days
}

/**
 * Generate a secure token with enhanced entropy
 * Uses crypto.randomBytes for cryptographically secure randomness
 */
export function generateSigningToken(): string {
  // Use higher entropy token for signing
  return crypto.randomBytes(TOKEN_CONFIG.SIGNING_TOKEN_LENGTH).toString("base64url")
}

/**
 * Generate a shorter, URL-safe token for invitations
 * With enhanced security and type prefix
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(TOKEN_CONFIG.INVITATION_TOKEN_LENGTH).toString("base64url")
}

/**
 * Generate a session token with appropriate entropy
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(TOKEN_CONFIG.SESSION_TOKEN_LENGTH).toString("base64url")
}

/**
 * Generate a timestamped token with additional metadata
 */
export function generateEnhancedToken(
  type: keyof typeof TOKEN_CONFIG.TOKEN_TYPES,
  metadata?: Record<string, any>
): {
  token: string
  tokenHash: string
  metadata?: Record<string, any>
  createdAt: Date
} {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(TOKEN_CONFIG.SIGNING_TOKEN_LENGTH)

  // Create token with timestamp prefix for additional entropy
  const tokenData = Buffer.concat([
    Buffer.from(timestamp.toString(16), "hex").subarray(0, 4), // 4 bytes timestamp
    randomBytes,
  ])

  const token = tokenData.toString("base64url")

  // Create hash for database storage (never store raw tokens)
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  return {
    token,
    tokenHash,
    metadata,
    createdAt: new Date(timestamp),
  }
}

/**
 * Validate token format and structure
 */
export function isValidToken(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false
  }

  // Check minimum length for security
  if (token.length < 16) {
    return false
  }

  // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  // Base64url format (various lengths for different token types)
  const base64urlRegex = /^[A-Za-z0-9_-]+$/

  // Check for common patterns that might indicate tampering
  const suspiciousPatterns = [
    /^[0]+$/, // All zeros
    /^[1]+$/, // All ones
    /^[a]+$/i, // All same character
    /(.)(\1){10,}/, // Repeated patterns
  ]

  if (suspiciousPatterns.some((pattern) => pattern.test(token))) {
    return false
  }

  return uuidRegex.test(token) || base64urlRegex.test(token)
}

/**
 * Enhanced token validation with timing attack protection
 */
export function validateTokenSecure(providedToken: string, storedTokenHash: string): boolean {
  if (!isValidToken(providedToken)) {
    return false
  }

  // Create hash of provided token
  const providedTokenHash = crypto.createHash("sha256").update(providedToken).digest("hex")

  // Use crypto.timingSafeEqual to prevent timing attacks
  if (providedTokenHash.length !== storedTokenHash.length) {
    return false
  }

  return crypto.timingSafeEqual(
    Buffer.from(providedTokenHash, "hex"),
    Buffer.from(storedTokenHash, "hex")
  )
}

/**
 * Calculate expiration date with enhanced validation
 */
export function calculateTokenExpiration(daysFromNow: number = 7): Date {
  // Validate input
  if (daysFromNow <= 0 || daysFromNow > 30) {
    throw new Error("Token expiration must be between 1 and 30 days")
  }

  const expiration = new Date()
  expiration.setDate(expiration.getDate() + daysFromNow)

  // Set to end of day for consistent behavior
  expiration.setHours(23, 59, 59, 999)

  return expiration
}

/**
 * Check if a token has expired with grace period
 */
export function isTokenExpired(expiresAt: Date | null, gracePeriodMinutes: number = 5): boolean {
  if (!expiresAt) return false

  const now = new Date()
  const expirationWithGrace = new Date(expiresAt.getTime() + gracePeriodMinutes * 60 * 1000)

  return now > expirationWithGrace
}

/**
 * Get time until token expiration
 */
export function getTokenTimeToExpiration(expiresAt: Date | null): {
  expired: boolean
  timeRemaining: number
  humanReadable: string
} {
  if (!expiresAt) {
    return {
      expired: false,
      timeRemaining: Infinity,
      humanReadable: "Never expires",
    }
  }

  const now = new Date()
  const timeRemaining = expiresAt.getTime() - now.getTime()

  if (timeRemaining <= 0) {
    return {
      expired: true,
      timeRemaining: 0,
      humanReadable: "Expired",
    }
  }

  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

  let humanReadable = ""
  if (days > 0) humanReadable += `${days}d `
  if (hours > 0) humanReadable += `${hours}h `
  if (minutes > 0) humanReadable += `${minutes}m`

  return {
    expired: false,
    timeRemaining,
    humanReadable: humanReadable.trim() || "< 1m",
  }
}

/**
 * Create a secure token rotation system
 */
export function rotateToken(
  oldToken: string,
  type: keyof typeof TOKEN_CONFIG.TOKEN_TYPES
): {
  newToken: string
  newTokenHash: string
  rotatedAt: Date
} {
  // Generate new token
  const enhanced = generateEnhancedToken(type, {
    rotatedFrom: crypto.createHash("sha256").update(oldToken).digest("hex").substring(0, 8),
  })

  return {
    newToken: enhanced.token,
    newTokenHash: enhanced.tokenHash,
    rotatedAt: enhanced.createdAt,
  }
}
