// Application constants

export const APP_NAME = "Comet"
export const APP_DESCRIPTION = "Secure document signing with PDF upload and electronic signatures"

// File upload constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = ["application/pdf"]

// Invitation expiration (in days)
export const INVITATION_EXPIRY_DAYS = 7

// API Routes
export const API_ROUTES = {
  AUTH: "/api/auth",
  DOCUMENTS: "/api/documents",
  SIGNATURES: "/api/signatures",
  INVITATIONS: "/api/invitations",
} as const

// Document statuses
export const DOCUMENT_STATUSES = {
  DRAFT: "draft",
  PENDING: "pending",
  SIGNED: "signed",
  COMPLETED: "completed",
} as const
