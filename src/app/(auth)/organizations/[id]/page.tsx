'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, FolderOpen, Grid3X3, Settings, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberList } from '@/components/members/MemberList'
import { OrganizationSettings } from '@/components/settings/OrganizationSettings'

export default function OrganizationPage() {
  const params = useParams()
  const orgId = params.id as string

  // Mock data - replace with tRPC
  const organization = {
    id: orgId,
    name: 'Acme Corporation',
    memberCount: 25,
  }

  const projects = [
    {
      id: '1',
      name: 'Website Redesign',
      description: 'Q1 2025 website refresh project',
      matrixCount: 3,
      status: 'ACTIVE',
    },
    {
      id: '2',
      name: 'Mobile App Launch',
      description: 'New iOS and Android app',
      matrixCount: 5,
      status: 'ACTIVE',
    },
  ]

  const matrices = [
    {
      id: '1',
      name: 'Sprint Planning Matrix',
      projectName: 'Website Redesign',
      projectId: '1',
      taskCount: 12,
      memberCount: 5,
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Security Incident Response',
      projectName: 'Mobile App Launch',
      projectId: '2',
      taskCount: 8,
      memberCount: 6,
      updatedAt: new Date(),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {organization.memberCount} members
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="matrices">All Matrices</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Projects</h2>
            <Link href={`/organizations/${orgId}/projects/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first project to start building RACI matrices
                </p>
                <Link href={`/organizations/${orgId}/projects/new`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/organizations/${orgId}/projects/${project.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Grid3X3 className="mr-2 h-4 w-4" />
                        <span>{project.matrixCount} matrices</span>
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {project.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="matrices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">All Matrices</h2>
          </div>

          <div className="space-y-3">
            {matrices.map((matrix) => (
              <Link
                key={matrix.id}
                href={`/organizations/${orgId}/projects/${matrix.projectId}/matrices/${matrix.id}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{matrix.name}</CardTitle>
                        <CardDescription className="text-sm">{matrix.projectName}</CardDescription>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Updated {matrix.updatedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{matrix.taskCount} tasks</span>
                      <span>{matrix.memberCount} members</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <MemberList organizationId={orgId} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <OrganizationSettings organizationId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
