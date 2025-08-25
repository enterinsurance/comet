import { degrees, PDFDocument, rgb } from "pdf-lib"

interface SignatureEmbedding {
  signatureImageUrl: string
  x: number
  y: number
  width: number
  height: number
  page: number
  signerName: string
  signedAt: Date
}

interface DocumentFinalizationOptions {
  originalPdfUrl: string
  signatures: SignatureEmbedding[]
  documentTitle: string
  metadata?: {
    author?: string
    creator?: string
    subject?: string
  }
}

/**
 * Fetches a PDF or image from a URL and returns the bytes
 */
async function fetchFileBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch file from ${url}: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

/**
 * Embeds signatures into a PDF document and returns the final PDF bytes
 */
export async function generateSignedPdf(options: DocumentFinalizationOptions): Promise<Uint8Array> {
  try {
    // Load the original PDF
    const originalPdfBytes = await fetchFileBytes(options.originalPdfUrl)
    const pdfDoc = await PDFDocument.load(originalPdfBytes)

    // Set document metadata
    if (options.metadata) {
      pdfDoc.setTitle(options.documentTitle)
      pdfDoc.setAuthor(options.metadata.author || "Comet Document Signing")
      pdfDoc.setCreator(options.metadata.creator || "Comet Document Signing Platform")
      pdfDoc.setSubject(options.metadata.subject || "Electronically Signed Document")
      pdfDoc.setCreationDate(new Date())
      pdfDoc.setModificationDate(new Date())
    }

    // Get all pages
    const pages = pdfDoc.getPages()

    // Embed each signature
    for (const signature of options.signatures) {
      const pageIndex = signature.page - 1 // Convert to 0-based index

      if (pageIndex < 0 || pageIndex >= pages.length) {
        console.warn(`Signature page ${signature.page} is out of range. Skipping.`)
        continue
      }

      const page = pages[pageIndex]
      const { width: pageWidth, height: pageHeight } = page.getSize()

      try {
        // Fetch and embed the signature image
        const signatureImageBytes = await fetchFileBytes(signature.signatureImageUrl)
        const signatureImage = await pdfDoc.embedPng(signatureImageBytes)

        // Calculate position (PDF coordinates start from bottom-left)
        const x = signature.x
        const y = pageHeight - signature.y - signature.height // Flip Y coordinate

        // Draw the signature image
        page.drawImage(signatureImage, {
          x,
          y,
          width: signature.width,
          height: signature.height,
          opacity: 1,
        })

        // Add signature validation text below the signature
        const fontSize = 8
        const validationText = `Signed by: ${signature.signerName}`
        const dateText = `Date: ${signature.signedAt.toLocaleDateString()} ${signature.signedAt.toLocaleTimeString()}`

        // Draw signer name
        page.drawText(validationText, {
          x,
          y: y - 12,
          size: fontSize,
          color: rgb(0.3, 0.3, 0.3),
        })

        // Draw signature date
        page.drawText(dateText, {
          x,
          y: y - 24,
          size: fontSize,
          color: rgb(0.3, 0.3, 0.3),
        })
      } catch (imageError) {
        console.error(`Failed to embed signature from ${signature.signatureImageUrl}:`, imageError)
        // Continue with other signatures even if one fails
      }
    }

    // Add a "Digitally Signed" watermark/stamp on the first page
    if (pages.length > 0 && options.signatures.length > 0) {
      const firstPage = pages[0]
      const { width: pageWidth, height: pageHeight } = firstPage.getSize()

      // Add a subtle "Digitally Signed" text in the bottom right
      firstPage.drawText("Digitally Signed Document", {
        x: pageWidth - 150,
        y: 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.7,
      })

      // Add completion timestamp
      const completionText = `Completed: ${new Date().toLocaleDateString()}`
      firstPage.drawText(completionText, {
        x: pageWidth - 150,
        y: 35,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.7,
      })
    }

    // Return the final PDF as bytes
    const finalPdfBytes = await pdfDoc.save()
    return finalPdfBytes
  } catch (error) {
    console.error("PDF generation error:", error)
    throw new Error(
      `Failed to generate signed PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Validates that all required signatures are present and valid
 */
export function validateSignaturesForFinalization(signatures: SignatureEmbedding[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (signatures.length === 0) {
    errors.push("No signatures provided for finalization")
  }

  signatures.forEach((signature, index) => {
    if (!signature.signatureImageUrl) {
      errors.push(`Signature ${index + 1}: Missing signature image URL`)
    }

    if (!signature.signerName || signature.signerName.trim().length === 0) {
      errors.push(`Signature ${index + 1}: Missing signer name`)
    }

    if (signature.page < 1) {
      errors.push(`Signature ${index + 1}: Invalid page number ${signature.page}`)
    }

    if (signature.width <= 0 || signature.height <= 0) {
      errors.push(
        `Signature ${index + 1}: Invalid dimensions ${signature.width}x${signature.height}`
      )
    }

    if (!signature.signedAt) {
      errors.push(`Signature ${index + 1}: Missing signature date`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generates a filename for the completed document
 */
export function generateCompletedDocumentFilename(
  documentTitle: string,
  documentId: string
): string {
  // Remove file extension and sanitize title
  const baseName = documentTitle
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove special chars
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .substring(0, 50) // Limit length

  const timestamp = new Date().toISOString().split("T")[0] // YYYY-MM-DD format
  return `${baseName}_signed_${timestamp}_${documentId.substring(0, 8)}.pdf`
}
