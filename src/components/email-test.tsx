"use client"

import { Send } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EmailTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailType, setEmailType] = useState<"invitation" | "completion">("invitation")
  const [emailAddress, setEmailAddress] = useState("")
  const [recipientName, setRecipientName] = useState("")

  const sendTestEmail = async () => {
    if (!emailAddress) {
      toast.error("Please enter an email address")
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch("/api/emails/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: emailType,
          to: emailAddress,
          recipientName: recipientName || undefined,
          senderName: "Development Test",
          documentTitle: "Test Document for Email System",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send test email")
      }

      const result = await response.json()
      toast.success(`Test ${emailType} email sent successfully! Message ID: ${result.messageId}`)
    } catch (error) {
      console.error("Test email error:", error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to send test email"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5" />
          <span>Email System Test</span>
        </CardTitle>
        <CardDescription>
          Test the Resend email integration with React Email templates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email-type">Email Type</Label>
          <Select value={emailType} onValueChange={(value: "invitation" | "completion") => setEmailType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invitation">Signing Invitation</SelectItem>
              <SelectItem value="completion">Signing Completion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="test@example.com"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Recipient Name (optional)</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

        <Button 
          onClick={sendTestEmail} 
          disabled={isLoading || !emailAddress}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isLoading ? "Sending..." : `Send Test ${emailType === "invitation" ? "Invitation" : "Completion"}`}
        </Button>

        <div className="text-xs text-muted-foreground">
          <strong>Note:</strong> Make sure RESEND_API_KEY is set in your environment variables
        </div>
      </CardContent>
    </Card>
  )
}