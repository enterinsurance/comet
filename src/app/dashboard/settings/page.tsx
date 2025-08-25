import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Account settings will be available in future phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Account Settings</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Configure your account preferences, notification settings, and security options.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Available in Phase 7 - Enhanced Security & UX
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}