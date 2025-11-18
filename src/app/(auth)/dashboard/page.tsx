'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FolderOpen, Users, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const [showCreateOrg, setShowCreateOrg] = useState(false)

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

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organizations, projects, and RACI matrices
          </p>
        </div>
        <Button onClick={() => setShowCreateOrg(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No organizations yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first organization to start managing projects and RACI matrices
            </p>
            <Button onClick={() => setShowCreateOrg(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link key={org.id} href={`/organizations/${org.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                  <CardDescription>Organization workspace</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{org.projectCount} Projects</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Grid3x3 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{org.matrixCount} Matrices</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{org.memberCount} Members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/templates">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Browse Templates</CardTitle>
                <CardDescription>Start from pre-built RACI templates</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/organizations/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Create Organization</CardTitle>
                <CardDescription>Set up a new workspace</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/about">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Learn More</CardTitle>
                <CardDescription>Discover RACI best practices</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
