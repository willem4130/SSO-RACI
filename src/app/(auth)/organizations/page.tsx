'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FolderOpen, Users, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function OrganizationsPage() {
  const [_showCreateOrg, setShowCreateOrg] = useState(false)

  // Mock data - replace with tRPC
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspaces and team access
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateOrg(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </div>

      {/* Organizations List */}
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
  )
}
