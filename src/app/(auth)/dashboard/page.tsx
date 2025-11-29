'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  FolderOpen,
  Users,
  Grid3X3,
  Clock,
  ArrowRight,
  FileText,
  Upload,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const [_showCreateOrg, setShowCreateOrg] = useState(false)

  // Mock data - this will be replaced with tRPC queries
  const organizations = [
    {
      id: '1',
      name: 'Acme Corporation',
      projectCount: 5,
      matrixCount: 12,
      memberCount: 25,
    },
  ]

  // Mock recent items
  const recentItems = [
    {
      id: '1',
      name: 'Q4 Product Launch',
      type: 'matrix',
      organization: 'Acme Corporation',
      updatedAt: '2 hours ago',
      href: '/organizations/1/projects/1/matrices/1',
    },
    {
      id: '2',
      name: 'Marketing Campaign',
      type: 'project',
      organization: 'Acme Corporation',
      updatedAt: '5 hours ago',
      href: '/organizations/1/projects/2',
    },
    {
      id: '3',
      name: 'Website Redesign',
      type: 'matrix',
      organization: 'Acme Corporation',
      updatedAt: '1 day ago',
      href: '/organizations/1/projects/1/matrices/2',
    },
  ]

  // Mock activity
  const recentActivity = [
    {
      id: '1',
      user: 'John Doe',
      action: 'updated',
      target: 'Q4 Product Launch',
      time: '2 hours ago',
    },
    {
      id: '2',
      user: 'Jane Smith',
      action: 'commented on',
      target: 'Marketing Campaign',
      time: '3 hours ago',
    },
    {
      id: '3',
      user: 'Bob Wilson',
      action: 'created',
      target: 'New Sprint Plan',
      time: '5 hours ago',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back. Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button size="sm" onClick={() => setShowCreateOrg(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 justify-start" asChild>
          <Link href="/templates">
            <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">Templates</div>
              <div className="text-xs text-muted-foreground">Start from a template</div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 justify-start" onClick={() => setShowCreateOrg(true)}>
          <Plus className="mr-3 h-5 w-5 text-muted-foreground" />
          <div className="text-left">
            <div className="font-medium">New Matrix</div>
            <div className="text-xs text-muted-foreground">Create from scratch</div>
          </div>
        </Button>
        <Button variant="outline" className="h-auto py-4 justify-start" asChild>
          <Link href="/organizations">
            <FolderOpen className="mr-3 h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">Organizations</div>
              <div className="text-xs text-muted-foreground">Manage workspaces</div>
            </div>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 justify-start" asChild>
          <Link href="/analytics">
            <Activity className="mr-3 h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">Analytics</div>
              <div className="text-xs text-muted-foreground">View insights</div>
            </div>
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Items */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Recent Items</CardTitle>
              <CardDescription>Jump back into your work</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/organizations">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {item.type === 'matrix' ? (
                      <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.organization}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.updatedAt}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Activity</CardTitle>
            <CardDescription>Recent team activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div>
                    <span className="font-medium">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>{' '}
                    <span className="font-medium">{activity.target}</span>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Organizations</h2>
          <Button variant="outline" size="sm" onClick={() => setShowCreateOrg(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>

        {organizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
              <p className="text-muted-foreground mb-4 text-center text-sm max-w-md">
                Create your first organization to start managing projects and RACI matrices
              </p>
              <Button size="sm" onClick={() => setShowCreateOrg(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Link key={org.id} href={`/organizations/${org.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>{org.projectCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Grid3X3 className="h-3.5 w-3.5" />
                        <span>{org.matrixCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{org.memberCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
