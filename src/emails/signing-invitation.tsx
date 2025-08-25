import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface SigningInvitationEmailProps {
  recipientName?: string
  senderName: string
  documentTitle: string
  signingUrl: string
  expiresAt: string
  message?: string
}

export const SigningInvitationEmail = ({
  recipientName,
  senderName = "Someone",
  documentTitle = "Untitled Document",
  signingUrl = "https://comet-docs.com/sign/example",
  expiresAt = "7 days",
  message,
}: SigningInvitationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {senderName} has requested your signature on "{documentTitle}"
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Text style={logo}>📄 Comet</Text>
          </Section>

          <Heading style={heading}>Signature Request</Heading>

          <Text style={paragraph}>Hello{recipientName ? ` ${recipientName}` : ""},</Text>

          <Text style={paragraph}>
            <strong>{senderName}</strong> has requested your signature on the following document:
          </Text>

          <Section style={documentSection}>
            <Text style={documentTitle as any}>📄 {documentTitle}</Text>
          </Section>

          {message && (
            <Section style={messageSection}>
              <Text style={messageLabel}>Message from {senderName}:</Text>
              <Text style={messageText}>"{message}"</Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={signingUrl}>
              Sign Document
            </Button>
          </Section>

          <Text style={paragraph}>Or copy and paste this URL into your browser:</Text>
          <Text style={link}>
            <a href={signingUrl} style={linkStyle as any}>
              {signingUrl}
            </a>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This signature request will expire in <strong>{expiresAt}</strong>.
            <br />
            If you have any questions, please contact {senderName} directly.
          </Text>

          <Text style={footer}>
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
  color: "#1f2937",
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
  backgroundColor: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
}

const documentTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "0",
  textAlign: "center" as const,
}

const messageSection = {
  backgroundColor: "#eff6ff",
  border: "1px solid #dbeafe",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
}

const messageLabel = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e40af",
  margin: "0 0 8px",
}

const messageText = {
  fontSize: "14px",
  color: "#1e40af",
  fontStyle: "italic",
  margin: "0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#2563eb",
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

const link = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 24px",
  wordBreak: "break-all" as any,
}

const linkStyle = {
  color: "#2563eb",
  textDecoration: "underline",
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

export default SigningInvitationEmail
