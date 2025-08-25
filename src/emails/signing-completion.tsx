import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface SigningCompletionEmailProps {
  recipientName: string
  documentTitle: string
  signerName: string
  completedAt: string
  downloadUrl?: string
  totalSignatures: number
  completedSignatures: number
}

export const SigningCompletionEmail = ({
  recipientName = "User",
  documentTitle = "Untitled Document",
  signerName = "Someone",
  completedAt = "recently",
  downloadUrl,
  totalSignatures = 1,
  completedSignatures = 1,
}: SigningCompletionEmailProps) => {
  const isFullyComplete = completedSignatures === totalSignatures

  return (
    <Html>
      <Head />
      <Preview>
        {isFullyComplete
          ? `"${documentTitle}" has been fully signed`
          : `${signerName} has signed "${documentTitle}"`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Text style={logo}>📄 Comet</Text>
          </Section>

          <Heading style={heading}>
            {isFullyComplete ? "Document Fully Signed! ✅" : "Signature Received ✅"}
          </Heading>

          <Text style={paragraph}>Hello {recipientName},</Text>

          <Text style={paragraph}>
            {isFullyComplete
              ? `Great news! "${documentTitle}" has been fully signed by all parties.`
              : `${signerName} has signed "${documentTitle}" on ${completedAt}.`}
          </Text>

          <Section style={documentSection}>
            <Text style={documentTitle as any}>📄 {documentTitle}</Text>
            <Text style={statusText}>
              Status: {completedSignatures} of {totalSignatures} signatures completed
            </Text>
          </Section>

          <Section style={progressSection}>
            <Text style={progressLabel}>Signing Progress:</Text>
            <div style={progressBar}>
              <div
                style={
                  {
                    ...progressFill,
                    width: `${(completedSignatures / totalSignatures) * 100}%`,
                  } as any
                }
              />
            </div>
            <Text style={progressText}>
              {Math.round((completedSignatures / totalSignatures) * 100)}% Complete
            </Text>
          </Section>

          {downloadUrl && isFullyComplete && (
            <Section style={buttonContainer}>
              <Button style={button} href={downloadUrl}>
                Download Signed Document
              </Button>
            </Section>
          )}

          {!isFullyComplete && (
            <Text style={paragraph}>
              The document is still waiting for {totalSignatures - completedSignatures} more
              signature{totalSignatures - completedSignatures !== 1 ? "s" : ""}. You'll receive
              another notification when all signatures are complete.
            </Text>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            {isFullyComplete
              ? "All signatures have been collected and the document is now complete."
              : "You'll be notified when all signatures are collected."}
            <br />
            <br />
            Powered by Comet Document Signing
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
}

const logoContainer = {
  textAlign: "center" as const,
  margin: "0 0 40px",
}

const logo = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0",
}

const heading = {
  fontSize: "28px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#059669",
  textAlign: "center" as const,
  margin: "0 0 30px",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  margin: "0 0 16px",
}

const documentSection = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const documentTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0 0 8px",
}

const statusText = {
  fontSize: "14px",
  color: "#059669",
  fontWeight: "500",
  margin: "0",
}

const progressSection = {
  margin: "24px 0",
}

const progressLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#374151",
  margin: "0 0 8px",
}

const progressBar = {
  width: "100%",
  height: "8px",
  backgroundColor: "#e5e7eb",
  borderRadius: "4px",
  overflow: "hidden",
  margin: "0 0 8px",
}

const progressFill = {
  height: "100%",
  backgroundColor: "#059669",
  transition: "width 0.3s ease" as any,
}

const progressText = {
  fontSize: "12px",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#059669",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  border: "none",
  cursor: "pointer",
}

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
}

const footer = {
  fontSize: "12px",
  color: "#6b7280",
  textAlign: "center" as const,
  margin: "0 0 8px",
}

export default SigningCompletionEmail
