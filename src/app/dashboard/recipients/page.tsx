import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function RecipientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recipients</h1>
        <p className="text-muted-foreground">
          Manage signing recipients and invitations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Recipient management will be available in Phase 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Recipients Management</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Manage document recipients, send signing invitations, and track signing progress.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Available in Phase 4 - Email Integration
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}