// Common types for the document signing application

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  title: string
  filename: string
  url: string
  status: "draft" | "pending" | "signed" | "completed"
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface SignatureField {
  id: string
  documentId: string
  x: number
  y: number
  width: number
  height: number
  page: number
  signerEmail: string
  signed: boolean
  signatureData?: string
}

export interface Invitation {
  id: string
  documentId: string
  email: string
  token: string
  status: "pending" | "signed" | "expired"
  expiresAt: Date
  createdAt: Date
}
