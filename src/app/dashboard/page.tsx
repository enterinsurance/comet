"use client"

import { FileText, TrendingUp, Users, Clock } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSession } from "@/lib/auth-client"

interface DashboardStats {
  totalDocuments: number
  pendingSignatures: number
  completedDocuments: number
  thisMonthDocuments: number
}

interface RecentActivityItem {
  id: string
  title: string
  status: string
  updatedAt: string
  signersCount: number
  signaturesCount: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    pendingSignatures: 0,
    completedDocuments: 0,
    thisMonthDocuments: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) return

    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setRecentActivity(data.recentActivity)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [session])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case "SENT":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Sent</Badge>
      case "PARTIALLY_SIGNED":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Partial</Badge>
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Loading data...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your document signing dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDocuments === 0 ? "No documents yet" : "Documents created"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSignatures}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingSignatures === 0 ? "All up to date" : "Awaiting signatures"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedDocuments === 0 ? "No completed docs" : "Fully signed documents"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisMonthDocuments === 0 ? "No activity yet" : "Documents this month"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with document signing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-20 justify-start" variant="outline" asChild>
                <Link
                  href="/dashboard/documents/upload"
                  className="flex flex-col items-start space-y-2"
                >
                  <div className="font-medium">Upload Document</div>
                  <div className="text-sm text-muted-foreground">Start a new signing</div>
                </Link>
              </Button>
              <Button className="h-20 justify-start" variant="outline" asChild>
                <Link href="/dashboard/documents" className="flex flex-col items-start space-y-2">
                  <div className="font-medium">View Documents</div>
                  <div className="text-sm text-muted-foreground">Manage your documents</div>
                </Link>
              </Button>
              <Button className="h-20 justify-start" variant="outline" asChild>
                <Link href="/dashboard/recipients" className="flex flex-col items-start space-y-2">
                  <div className="font-medium">Recipients</div>
                  <div className="text-sm text-muted-foreground">Manage signing requests</div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest document activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your first document to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{activity.signersCount} signers</span>
                          <span>•</span>
                          <span>{activity.signaturesCount} signatures</span>
                          <span>•</span>
                          <span>{new Date(activity.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                ))}
                {recentActivity.length === 5 && (
                  <div className="pt-2 border-t">
                    <Link
                      href="/dashboard/documents"
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      View all documents →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
