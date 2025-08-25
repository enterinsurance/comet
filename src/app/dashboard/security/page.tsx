"use client"

import {
  AlertTriangle,
  Calendar,
  Download,
  Eye,
  Filter,
  Key,
  Lock,
  Monitor,
  RefreshCw,
  Shield,
  Smartphone,
  Trash2,
  Zap,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "@/lib/auth-client"

interface SecurityEvent {
  id: string
  eventType: string
  severity: string
  message: string
  success: boolean
  timestamp: string
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, any> | null
}

interface Session {
  id: string
  token: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}

interface SecurityStats {
  totalEvents: number
  criticalEvents: number
  failedLogins: number
  activeSessions: number
  lastLogin: string | null
}

export default function SecurityPage() {
  const { data: session } = useSession()
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    failedLogins: 0,
    activeSessions: 0,
    lastLogin: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [eventTimeRange, setEventTimeRange] = useState("last7d")
  const [eventFilter, setEventFilter] = useState("all")
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    if (!session?.user) return

    const fetchSecurityData = async () => {
      try {
        // Fetch security events
        const eventsResponse = await fetch(`/api/user/security/events?range=${eventTimeRange}&filter=${eventFilter}`)
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setSecurityEvents(eventsData.events)
          setStats(eventsData.stats)
        }

        // Fetch active sessions
        const sessionsResponse = await fetch("/api/user/security/sessions")
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          setSessions(sessionsData.sessions)
        }
      } catch (error) {
        console.error("Failed to fetch security data:", error)
        toast.error("Failed to load security information")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSecurityData()
  }, [session, eventTimeRange, eventFilter])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long")
      return
    }

    setIsUpdatingPassword(true)
    try {
      const response = await fetch("/api/user/security/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (response.ok) {
        toast.success("Password changed successfully")
        setShowChangePasswordDialog(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to change password")
      }
    } catch (error) {
      console.error("Failed to change password:", error)
      toast.error(error instanceof Error ? error.message : "Failed to change password")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch("/api/user/security/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
        toast.success("Session revoked successfully")
      } else {
        throw new Error("Failed to revoke session")
      }
    } catch (error) {
      console.error("Failed to revoke session:", error)
      toast.error("Failed to revoke session")
    }
  }

  const handleRevokeAllSessions = async () => {
    try {
      const response = await fetch("/api/user/security/sessions/revoke-all", {
        method: "POST",
      })

      if (response.ok) {
        toast.success("All sessions revoked successfully. You will be redirected to login.")
        window.location.href = "/auth/login"
      } else {
        throw new Error("Failed to revoke all sessions")
      }
    } catch (error) {
      console.error("Failed to revoke all sessions:", error)
      toast.error("Failed to revoke all sessions")
    }
  }

  const downloadSecurityReport = async () => {
    try {
      const response = await fetch("/api/user/security/report")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `security-report-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Security report downloaded")
      }
    } catch (error) {
      console.error("Failed to download security report:", error)
      toast.error("Failed to download security report")
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "high":
        return <Shield className="h-4 w-4 text-orange-600" />
      case "medium":
        return <Eye className="h-4 w-4 text-yellow-600" />
      default:
        return <Zap className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variant = 
      severity === "CRITICAL" ? "destructive" :
      severity === "HIGH" ? "destructive" :
      severity === "MEDIUM" ? "secondary" :
      "outline"

    return (
      <Badge variant={variant} className="text-xs">
        {severity.toLowerCase()}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
          <p className="text-muted-foreground">Loading security information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor your account security and manage access
          </p>
        </div>
        <Button onClick={downloadSecurityReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Security events logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedLogins}</div>
            <p className="text-xs text-muted-foreground">Recent failed attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently signed in</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="password" className="space-y-4">
        <TabsList>
          <TabsTrigger value="password">Password & Authentication</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="audit">Security Audit Log</TabsTrigger>
        </TabsList>

        {/* Password & Authentication Tab */}
        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Password Security</span>
              </CardTitle>
              <CardDescription>
                Manage your password and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Last changed: {stats.lastLogin ? new Date(stats.lastLogin).toLocaleDateString() : "Never"}
                  </p>
                </div>
                <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleChangePassword}>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={8}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={8}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowChangePasswordDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isUpdatingPassword}>
                          {isUpdatingPassword ? "Updating..." : "Change Password"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" disabled>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Active Sessions ({sessions.length})</span>
                </div>
                {sessions.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRevokeAllSessions}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke All
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Manage devices and browsers that are currently signed in to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((sessionItem) => (
                    <div key={sessionItem.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {sessionItem.userAgent?.split(" ")[0] || "Unknown Device"}
                          </span>
                          {sessionItem.isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        {!sessionItem.isCurrent && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRevokeSession(sessionItem.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>IP Address: {sessionItem.ipAddress || "Unknown"}</p>
                        <p>Created: {new Date(sessionItem.createdAt).toLocaleString()}</p>
                        <p>Expires: {new Date(sessionItem.expiresAt).toLocaleString()}</p>
                        {sessionItem.userAgent && (
                          <p className="truncate">User Agent: {sessionItem.userAgent}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Monitor className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No active sessions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Audit Log</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={eventTimeRange} onValueChange={setEventTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last24h">Last 24h</SelectItem>
                      <SelectItem value="last7d">Last 7 days</SelectItem>
                      <SelectItem value="last30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="failed">Failures</SelectItem>
                      <SelectItem value="login">Login Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
              <CardDescription>
                View security-related events and activities on your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityEvents.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getSeverityIcon(event.severity)}
                              <span className="text-sm font-medium">
                                {event.eventType.replace(/_/g, " ").toLowerCase()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getSeverityBadge(event.severity)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {event.message}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.ipAddress || "Unknown"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No security events found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}