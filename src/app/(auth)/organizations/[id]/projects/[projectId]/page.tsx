'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Grid3X3, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/trpc/react'
import { toast } from 'sonner'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const projectId = params.projectId as string

  const [showCreateMatrix, setShowCreateMatrix] = useState(false)
  const [matrixName, setMatrixName] = useState('')
  const [matrixDescription, setMatrixDescription] = useState('')

  // Mock data
  const project = {
    id: projectId,
    name: 'Website Redesign',
    description: 'Q1 2025 website refresh project',
    status: 'ACTIVE',
  }

  const matrices = [
    {
      id: '1',
      name: 'Sprint Planning Matrix',
      description: 'Sprint 1 task assignments',
      taskCount: 12,
      memberCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const createMatrixMutation = api.matrix.create.useMutation({
    onSuccess: (data) => {
      toast.success('Matrix created successfully')
      setShowCreateMatrix(false)
      setMatrixName('')
      setMatrixDescription('')
      router.push(`/organizations/${orgId}/projects/${projectId}/matrices/${data.id}`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create matrix')
    },
  })

  const handleCreateMatrix = () => {
    if (!matrixName.trim()) {
      toast.error('Matrix name is required')
      return
    }

    createMatrixMutation.mutate({
      organizationId: orgId,
      projectId,
      name: matrixName.trim(),
      description: matrixDescription.trim() || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="secondary" className="text-xs">
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Project
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">RACI Matrices</h2>
          <div className="flex gap-2">
            <Link href="/templates">
              <Button variant="outline">Use Template</Button>
            </Link>
            <Button onClick={() => setShowCreateMatrix(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Matrix
            </Button>
          </div>
        </div>

        {matrices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Grid3X3 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No matrices yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first RACI matrix or start from a template
              </p>
              <div className="flex gap-2">
                <Link href="/templates">
                  <Button variant="outline">Browse Templates</Button>
                </Link>
                <Button onClick={() => setShowCreateMatrix(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Matrix
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matrices.map((matrix) => (
              <Link
                key={matrix.id}
                href={`/organizations/${orgId}/projects/${projectId}/matrices/${matrix.id}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle>{matrix.name}</CardTitle>
                    <CardDescription>{matrix.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{matrix.taskCount} tasks</span>
                        <span>{matrix.memberCount} members</span>
                      </div>
                      <div>Updated {matrix.updatedAt.toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Matrix Dialog */}
      <Dialog open={showCreateMatrix} onOpenChange={setShowCreateMatrix}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New RACI Matrix</DialogTitle>
            <DialogDescription>
              Define roles and responsibilities for your project tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Matrix Name</Label>
              <Input
                id="name"
                placeholder="e.g., Sprint 1 Planning"
                value={matrixName}
                onChange={(e) => setMatrixName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this matrix..."
                value={matrixDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setMatrixDescription(e.target.value)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateMatrix(false)}
              disabled={createMatrixMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMatrix}
              disabled={!matrixName.trim() || createMatrixMutation.isPending}
            >
              {createMatrixMutation.isPending ? 'Creating...' : 'Create Matrix'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
