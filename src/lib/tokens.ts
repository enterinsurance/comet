import crypto from "crypto"

/**
 * Generate a secure token for signing requests
 * Uses crypto.randomUUID() for maximum security
 */
export function generateSigningToken(): string {
  return crypto.randomUUID()
}

/**
 * Generate a shorter, URL-safe token for invitations
 * 32 characters, URL-safe
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(24).toString("base64url")
}

/**
 * Validate token format
 */
export function isValidToken(token: string): boolean {
  // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  // Base64url format (32 chars)
  const base64urlRegex = /^[A-Za-z0-9_-]{32}$/

  return uuidRegex.test(token) || base64urlRegex.test(token)
}

/**
 * Calculate expiration date for signing tokens
 * Default: 7 days from now
 */
export function calculateTokenExpiration(daysFromNow: number = 7): Date {
  const expiration = new Date()
  expiration.setDate(expiration.getDate() + daysFromNow)
  return expiration
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false
  return new Date() > expiresAt
}
