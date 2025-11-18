'use client'

import { useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Users, Eye, Settings, Activity, Loader2, MoreVertical, Pencil, Copy, Archive, Trash2, Radio, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { RaciMatrixGrid } from '@/components/raci/raci-matrix-grid'
import { ValidationSummary } from '@/components/raci/validation-summary'
import { MatrixHealthDashboard } from '@/components/raci/matrix-health-dashboard'
import { PresenceIndicator } from '@/components/realtime/presence-indicator'
import { ActivityFeed } from '@/components/realtime/activity-feed'
import { CommentThread } from '@/components/comments/comment-thread'
import { ExportDialog } from '@/components/raci/export-dialog'
import { useRealtime } from '@/hooks/use-realtime'
import { Badge } from '@/components/ui/badge'
import type {
  RaciTask,
  RaciMember,
  ValidationSuggestion,
  TaskStatus,
  TaskPriority,
  RACIRole,
  MemberRole,
} from '@/types/raci'
import type { RaciRole } from '@prisma/client'
import { api } from '@/trpc/react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export default function MatrixEditorPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const orgId = params.id as string
  const projectId = params.projectId as string
  const matrixId = params.matrixId as string

  const [showValidation, setShowValidation] = useState(true)
  const [showHealthDashboard, setShowHealthDashboard] = useState(true)
  const [showActivityFeed, setShowActivityFeed] = useState(true)
  const [showComments, setShowComments] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Real-time collaboration
  const { isConnected, presence, presenceCount } = useRealtime({
    matrixId,
    onMatrixUpdate: () => {
      // Invalidate queries when other users make changes
      void queryClient.invalidateQueries({ queryKey: [['matrix', 'getById']] })
      void refetchHealth()
    },
  })

  // Matrix CRUD dialog states
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newMatrixName, setNewMatrixName] = useState('')

  // Fetch matrix data
  const {
    data: matrix,
    isLoading: matrixLoading,
    error: matrixError,
  } = api.matrix.getById.useQuery({
    id: matrixId,
    organizationId: orgId,
  })

  // Fetch available members for assignments
  const {
    data: availableMembers,
    isLoading: membersLoading,
  } = api.matrix.getMembers.useQuery({
    id: matrixId,
    organizationId: orgId,
  })

  // Enhanced validation hook
  const {
    data: healthData,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = api.matrix.validateEnhanced.useQuery(
    {
      id: matrixId,
      organizationId: orgId,
    },
    {
      enabled: showHealthDashboard && !!matrix,
      refetchOnWindowFocus: false,
    }
  )

  // Mutation: Create task
  const createTaskMutation = api.task.create.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [['matrix', 'getById']] })
      void refetchHealth()
    },
  })

  // Mutation: Update task
  const updateTaskMutation = api.task.update.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [['matrix', 'getById']] })
      void refetchHealth()
    },
  })

  // Mutation: Delete task
  const deleteTaskMutation = api.task.delete.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [['matrix', 'getById']] })
      void refetchHealth()
    },
  })

  // Mutation: Reorder tasks
  const reorderTasksMutation = api.task.reorder.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [['matrix', 'getById']] })
    },
  })

  // Mutation: Update matrix (rename)
  const updateMatrixMutation = api.matrix.update.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [['matrix', 'getById']] })
      setShowRenameDialog(false)
      setNewMatrixName('')
    },
  })

  // Mutation: Archive matrix
  const archiveMatrixMutation = api.matrix.archive.useMutation({
    onSuccess: () => {
      router.push(`/organizations/${orgId}/projects/${projectId}`)
    },
  })

  // Mutation: Delete matrix
  const deleteMatrixMutation = api.matrix.delete.useMutation({
    onSuccess: () => {
      router.push(`/organizations/${orgId}/projects/${projectId}`)
    },
  })

  // Mutation: Duplicate matrix
  const duplicateMatrixMutation = api.matrix.duplicate.useMutation({
    onSuccess: (newMatrix) => {
      router.push(`/organizations/${orgId}/projects/${projectId}/matrices/${newMatrix.id}`)
    },
  })

  // Mutation: Create assignment with optimistic update
  const createAssignmentMutation = api.assignment.create.useMutation({
    onMutate: async (newAssignment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [['matrix', 'getById']] })

      // Snapshot previous value
      const previousMatrix = queryClient.getQueryData([['matrix', 'getById'], { input: { id: matrixId, organizationId: orgId }, type: 'query' }])

      // Optimistically update
      if (previousMatrix && typeof previousMatrix === 'object' && 'tasks' in previousMatrix) {
        queryClient.setQueryData([['matrix', 'getById'], { input: { id: matrixId, organizationId: orgId }, type: 'query' }], {
          ...previousMatrix,
          tasks: (previousMatrix as any).tasks.map((task: any) =>
            task.id === newAssignment.taskId
              ? {
                  ...task,
                  assignments: [
                    ...task.assignments,
                    {
                      id: 'temp-' + Date.now(),
                      taskId: newAssignment.taskId,
                      memberId: newAssignment.memberId,
                      raciRole: newAssignment.raciRole,
                    },
                  ],
                }
              : task
          ),
        })
      }

      return { previousMatrix }
    },
    onError: (_err, _newAssignment, context) => {
      // Rollback on error
      if (context?.previousMatrix) {
        queryClient.setQueryData([['matrix', 'getById'], { input: { id: matrixId, organizationId: orgId }, type: 'query' }], context.previousMatrix)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [['matrix', 'getById']] })
      void refetchHealth()
    },
  })

  // Mutation: Delete assignment with optimistic update
  const deleteAssignmentMutation = api.assignment.delete.useMutation({
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [['matrix', 'getById']] })

      const previousMatrix = queryClient.getQueryData([['matrix', 'getById'], { input: { id: matrixId, organizationId: orgId }, type: 'query' }])

      if (previousMatrix && typeof previousMatrix === 'object' && 'tasks' in previousMatrix) {
        queryClient.setQueryData([['matrix', 'getById'], { input: { id: matrixId, organizationId: orgId }, type: 'query' }], {
          ...previousMatrix,
          tasks: (previousMatrix as any).tasks.map((task: any) => ({
            ...task,
            assignments: task.assignments.filter((a: any) => a.id !== variables.id),
          })),
        })
      }

      return { previousMatrix }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMatrix) {
        queryClient.setQueryData([['matrix', 'getById'], { input: { id: matrixId, organizationId: orgId }, type: 'query' }], context.previousMatrix)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [['matrix', 'getById']] })
      void refetchHealth()
    },
  })

  // Transform tasks to RaciTask format
  const tasks = useMemo<RaciTask[]>(() => {
    if (!matrix?.tasks) return []
    return matrix.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description ?? undefined,
      orderIndex: task.orderIndex,
      status: task.status as TaskStatus,
      priority: task.priority as TaskPriority,
      assignments: task.assignments.map((a) => ({
        id: a.id,
        taskId: a.taskId,
        memberId: a.memberId,
        raciRole: a.raciRole as RACIRole,
      })),
    }))
  }, [matrix?.tasks])

  // Transform members to RaciMember format
  const members = useMemo<RaciMember[]>(() => {
    if (!availableMembers) return []
    return availableMembers.map((m) => ({
      id: m.id,
      name: m.name ?? 'Unknown',
      email: m.email,
      role: m.role as MemberRole,
      department: m.department
        ? {
            id: m.department.id,
            name: m.department.name,
            code: m.department.code ?? '',
          }
        : undefined,
    }))
  }, [availableMembers])

  const handleAssignmentChange = async (
    taskId: string,
    memberId: string,
    role: RaciRole | null,
    assignmentId?: string
  ) => {
    try {
      setErrorMessage(null)
      if (role === null && assignmentId) {
        // Delete assignment
        await deleteAssignmentMutation.mutateAsync({
          id: assignmentId,
          organizationId: orgId,
        })
      } else if (role !== null && !assignmentId) {
        // Create new assignment
        await createAssignmentMutation.mutateAsync({
          organizationId: orgId,
          taskId,
          memberId,
          raciRole: role,
        })
      }
      // Note: We don't support updating roles directly - user must delete and recreate
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update assignment')
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<RaciTask>) => {
    await updateTaskMutation.mutateAsync({
      id: taskId,
      organizationId: orgId,
      name: updates.name,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
    })
  }

  const handleAddTask = async () => {
    const orderIndex = tasks.length
    await createTaskMutation.mutateAsync({
      matrixId,
      organizationId: orgId,
      name: 'New Task',
      orderIndex,
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
    })
  }

  const handleTaskReorder = async (reorderedTasks: RaciTask[]) => {
    try {
      await reorderTasksMutation.mutateAsync({
        matrixId,
        organizationId: orgId,
        taskOrders: reorderedTasks.map((task, index) => ({
          id: task.id,
          orderIndex: index,
        })),
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to reorder tasks')
      setTimeout(() => setErrorMessage(null), 5000)
      throw error // Re-throw to trigger rollback in component
    }
  }

  const handleApplySuggestion = (suggestion: ValidationSuggestion) => {
    console.log('Applying suggestion:', suggestion)
    // TODO: Implement suggestion application logic
  }

  const handleDismissSuggestion = (suggestion: ValidationSuggestion) => {
    console.log('Dismissing suggestion:', suggestion)
    // TODO: Implement suggestion dismissal logic
  }

  // Matrix CRUD handlers
  const handleRenameMatrix = async () => {
    if (!newMatrixName.trim()) return
    try {
      await updateMatrixMutation.mutateAsync({
        id: matrixId,
        organizationId: orgId,
        name: newMatrixName.trim(),
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to rename matrix')
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  const handleDuplicateMatrix = async () => {
    try {
      await duplicateMatrixMutation.mutateAsync({
        id: matrixId,
        organizationId: orgId,
        newName: newMatrixName.trim() || undefined,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to duplicate matrix')
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  const handleArchiveMatrix = async () => {
    try {
      await archiveMatrixMutation.mutateAsync({
        id: matrixId,
        organizationId: orgId,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to archive matrix')
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  const handleDeleteMatrix = async () => {
    try {
      await deleteMatrixMutation.mutateAsync({
        id: matrixId,
        organizationId: orgId,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete matrix')
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  // Loading state
  if (matrixLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Loading matrix...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (matrixError || !matrix) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Matrix Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {matrixError?.message ?? 'Could not load the matrix'}
          </p>
          <Button onClick={() => router.push(`/organizations/${orgId}/projects/${projectId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
      </div>
    )
  }

  const isLoading =
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    deleteTaskMutation.isPending ||
    createAssignmentMutation.isPending ||
    deleteAssignmentMutation.isPending

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
          <span className="flex-1">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/organizations/${orgId}/projects/${projectId}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{matrix.name}</h1>
                  {isConnected && (
                    <Badge variant="outline" className="gap-1.5">
                      <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                      <span className="text-xs">Live</span>
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tasks.length} tasks • {members.length} members
                  {isLoading && ' • Saving...'}
                </p>
                {presenceCount > 0 && (
                  <div className="mt-2">
                    <PresenceIndicator users={presence} maxDisplay={5} size="sm" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Comments
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActivityFeed(!showActivityFeed)}
              >
                <Activity className="mr-2 h-4 w-4" />
                Activity
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHealthDashboard(!showHealthDashboard)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Health
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValidation(!showValidation)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Quick Validation
              </Button>
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Members
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <ExportDialog matrixId={matrixId} matrixName={matrix.name} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setNewMatrixName(matrix.name)
                      setShowRenameDialog(true)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename Matrix
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setNewMatrixName('')
                      setShowDuplicateDialog(true)
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Matrix
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleArchiveMatrix}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Matrix
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Matrix
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Matrix */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">RACI Matrix</h2>
                <Button size="sm" onClick={handleAddTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
              <div className="overflow-auto">
                <RaciMatrixGrid
                  tasks={tasks}
                  members={members}
                  onAssignmentChange={handleAssignmentChange}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskReorder={handleTaskReorder}
                  showValidation={showValidation}
                  onAddTask={handleAddTask}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Comments (Phase 4 - Comments & Mentions) */}
            {showComments && (
              <CommentThread
                organizationId={orgId}
                matrixId={matrixId}
              />
            )}

            {/* Activity Feed (Phase 3 - Real-time Collaboration) */}
            {showActivityFeed && <ActivityFeed matrixId={matrixId} limit={50} />}

            {/* Matrix Health Dashboard (Phase 1.2) */}
            {showHealthDashboard && (
              <MatrixHealthDashboard
                data={healthData ?? null}
                loading={healthLoading}
                onRefresh={() => void refetchHealth()}
                onApplySuggestion={handleApplySuggestion}
                onDismissSuggestion={handleDismissSuggestion}
              />
            )}

            {/* Quick Validation Summary (Basic) */}
            {showValidation && !showHealthDashboard && !showActivityFeed && <ValidationSummary tasks={tasks} />}

            {/* Quick Guide */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold mb-3">Quick Guide</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-green-100 text-green-900 flex items-center justify-center text-xs font-bold">
                    A
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Accountable</div>
                    <div className="text-xs">Ultimately answerable (exactly 1)</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-bold">
                    R
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Responsible</div>
                    <div className="text-xs">Does the work (at least 1)</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-yellow-100 text-yellow-900 flex items-center justify-center text-xs font-bold">
                    C
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Consulted</div>
                    <div className="text-xs">Provides input</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-purple-100 text-purple-900 flex items-center justify-center text-xs font-bold">
                    I
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Informed</div>
                    <div className="text-xs">Kept up to date</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Matrix</DialogTitle>
            <DialogDescription>Enter a new name for this RACI matrix.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="matrix-name">Matrix Name</Label>
              <Input
                id="matrix-name"
                value={newMatrixName}
                onChange={(e) => setNewMatrixName(e.target.value)}
                placeholder="Enter matrix name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameMatrix()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameMatrix}
              disabled={!newMatrixName.trim() || updateMatrixMutation.isPending}
            >
              {updateMatrixMutation.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Matrix</DialogTitle>
            <DialogDescription>
              Create a copy of this matrix with all tasks and assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Matrix Name (optional)</Label>
              <Input
                id="duplicate-name"
                value={newMatrixName}
                onChange={(e) => setNewMatrixName(e.target.value)}
                placeholder={`${matrix?.name} (Copy)`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDuplicateMatrix()
                }}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate a name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateMatrix}
              disabled={duplicateMatrixMutation.isPending}
            >
              {duplicateMatrixMutation.isPending ? 'Duplicating...' : 'Duplicate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Matrix</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this matrix? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-medium">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside">
                <li>{tasks.length} tasks</li>
                <li>All RACI assignments</li>
                <li>All comments and history</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMatrix}
              disabled={deleteMatrixMutation.isPending}
            >
              {deleteMatrixMutation.isPending ? 'Deleting...' : 'Delete Matrix'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
