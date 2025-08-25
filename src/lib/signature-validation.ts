/**
 * Signature validation utilities
 */

interface SignatureValidationResult {
  isValid: boolean
  error?: string
  metadata?: {
    width: number
    height: number
    size: number
  }
}

/**
 * Validates a signature data URL
 */
export function validateSignatureData(signatureData: string): SignatureValidationResult {
  // Check if it's a valid data URL
  if (!signatureData.startsWith("data:image/png;base64,")) {
    return {
      isValid: false,
      error: "Invalid signature format. Must be a PNG data URL.",
    }
  }

  // Extract base64 data
  const base64Data = signatureData.split(",")[1]
  if (!base64Data) {
    return {
      isValid: false,
      error: "No signature data found.",
    }
  }

  // Check minimum size (empty signatures are typically very small)
  if (base64Data.length < 100) {
    return {
      isValid: false,
      error: "Signature appears to be empty or too small.",
    }
  }

  // Check maximum size (prevent abuse)
  const sizeInBytes = (base64Data.length * 3) / 4
  const maxSizeInMB = 2 // 2MB limit
  if (sizeInBytes > maxSizeInMB * 1024 * 1024) {
    return {
      isValid: false,
      error: `Signature file too large. Maximum size is ${maxSizeInMB}MB.`,
    }
  }

  return {
    isValid: true,
    metadata: {
      width: 0, // Will be determined by canvas
      height: 0, // Will be determined by canvas
      size: sizeInBytes,
    },
  }
}

/**
 * Validates signer information
 */
export function validateSignerInfo(
  signerName: string,
  signerEmail?: string
): SignatureValidationResult {
  if (!signerName || signerName.trim().length === 0) {
    return {
      isValid: false,
      error: "Signer name is required.",
    }
  }

  if (signerName.trim().length < 2) {
    return {
      isValid: false,
      error: "Signer name must be at least 2 characters long.",
    }
  }

  if (signerName.trim().length > 100) {
    return {
      isValid: false,
      error: "Signer name must be less than 100 characters.",
    }
  }

  // Basic email validation if provided
  if (signerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)) {
    return {
      isValid: false,
      error: "Invalid email format.",
    }
  }

  return { isValid: true }
}

/**
 * Generates a unique signature filename
 */
export function generateSignatureFilename(invitationId: string, timestamp?: number): string {
  const ts = timestamp || Date.now()
  return `signatures/${invitationId}-${ts}.png`
}

/**
 * Creates audit trail data for signature
 */
export function createSignatureAudit(request: Request): {
  ipAddress: string
  userAgent: string
  timestamp: Date
} {
  const headers = request.headers

  return {
    ipAddress:
      headers.get("x-forwarded-for") ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip") || // Cloudflare
      "unknown",
    userAgent: headers.get("user-agent") || "unknown",
    timestamp: new Date(),
  }
}
