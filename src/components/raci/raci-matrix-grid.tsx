'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table'
import { RaciRole } from '@prisma/client'
import { RaciCell } from './raci-cell'
import type { RaciTask, RaciMember, RaciCellData } from '@/types/raci'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface RaciMatrixGridProps {
  tasks: RaciTask[]
  members: RaciMember[]
  onAssignmentChange: (
    taskId: string,
    memberId: string,
    role: RaciRole | null,
    assignmentId?: string
  ) => Promise<void>
  onTaskUpdate?: (taskId: string, updates: Partial<RaciTask>) => void
  onTaskReorder?: (reorderedTasks: RaciTask[]) => Promise<void>
  onAddTask?: () => void
  onAddMember?: () => void
  isReadOnly?: boolean
  showValidation?: boolean
}

type TaskRow = {
  task: RaciTask
  [key: string]: RaciCellData | RaciTask
}

// Task cell component with editable name/description
function TaskCellContent({
  task,
  hasError,
  isReadOnly,
  onTaskUpdate,
}: {
  task: RaciTask
  hasError: boolean
  isReadOnly: boolean
  onTaskUpdate?: (taskId: string, updates: Partial<RaciTask>) => void
}) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editName, setEditName] = useState(task.name)
  const [editDesc, setEditDesc] = useState(task.description || '')

  const handleNameSave = () => {
    if (editName.trim() && editName !== task.name && onTaskUpdate) {
      onTaskUpdate(task.id, { name: editName.trim() })
    }
    setIsEditingName(false)
  }

  const handleDescSave = () => {
    if (editDesc !== task.description && onTaskUpdate) {
      onTaskUpdate(task.id, { description: editDesc.trim() || undefined })
    }
    setIsEditingDesc(false)
  }

  return (
    <div className={cn('px-4 py-3 flex items-center gap-2', hasError && 'bg-red-50')}>
      {hasError && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        {isEditingName ? (
          <input
            type="text"
            className="font-medium text-sm w-full border rounded px-2 py-1"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave()
              if (e.key === 'Escape') {
                setEditName(task.name)
                setIsEditingName(false)
              }
            }}
            autoFocus
          />
        ) : (
          <div
            className="font-medium text-sm truncate cursor-text hover:bg-gray-100 px-2 py-1 rounded"
            onClick={() => !isReadOnly && setIsEditingName(true)}
          >
            {task.name}
          </div>
        )}
        {isEditingDesc ? (
          <input
            type="text"
            className="text-xs text-gray-500 w-full border rounded px-2 py-1 mt-0.5"
            value={editDesc}
            placeholder="Add description..."
            onChange={(e) => setEditDesc(e.target.value)}
            onBlur={handleDescSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDescSave()
              if (e.key === 'Escape') {
                setEditDesc(task.description || '')
                setIsEditingDesc(false)
              }
            }}
            autoFocus
          />
        ) : (
          <div
            className="text-xs text-gray-500 truncate mt-0.5 cursor-text hover:bg-gray-100 px-2 py-1 rounded"
            onClick={() => !isReadOnly && setIsEditingDesc(true)}
          >
            {task.description || 'Add description...'}
          </div>
        )}
      </div>
    </div>
  )
}

// Sortable row component for drag-and-drop
function SortableRow({
  row,
  children,
  isReadOnly,
}: {
  row: { original: TaskRow }
  children: React.ReactNode
  isReadOnly: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.original.task.id,
    disabled: isReadOnly,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className="border-b last:border-b-0">
      {children}
      {!isReadOnly && (
        <td className="border-r">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </td>
      )}
    </tr>
  )
}

export function RaciMatrixGrid({
  tasks,
  members,
  onAssignmentChange,
  onTaskUpdate,
  onTaskReorder,
  onAddTask,
  onAddMember,
  isReadOnly = false,
  showValidation = true,
}: RaciMatrixGridProps) {
  const [loadingCell, setLoadingCell] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState(tasks)

  // Update local tasks when prop changes
  useMemo(() => {
    setLocalTasks(tasks)
  }, [tasks])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id || !onTaskReorder) return

    const oldIndex = localTasks.findIndex((t) => t.id === active.id)
    const newIndex = localTasks.findIndex((t) => t.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Optimistically update local state
    const reordered = arrayMove(localTasks, oldIndex, newIndex).map((task, index) => ({
      ...task,
      orderIndex: index,
    }))

    setLocalTasks(reordered)

    try {
      // Call parent handler to persist to database
      await onTaskReorder(reordered)
    } catch {
      // Rollback on error
      setLocalTasks(tasks)
    }
  }

  // Validate tasks
  const taskValidation = useMemo(() => {
    if (!showValidation) return {}

    const validation: Record<
      string,
      { hasAccountable: boolean; hasResponsible: boolean; accountableCount: number }
    > = {}

    localTasks.forEach((task) => {
      const accountableCount = task.assignments.filter((a) => a.raciRole === 'ACCOUNTABLE').length
      const hasResponsible = task.assignments.some((a) => a.raciRole === 'RESPONSIBLE')

      validation[task.id] = {
        hasAccountable: accountableCount === 1,
        hasResponsible,
        accountableCount,
      }
    })

    return validation
  }, [localTasks, showValidation])

  const handleRoleChange = async (
    taskId: string,
    memberId: string,
    role: RaciRole | null,
    assignmentId?: string
  ) => {
    const cellKey = `${taskId}-${memberId}`
    setLoadingCell(cellKey)
    try {
      await onAssignmentChange(taskId, memberId, role, assignmentId)
    } finally {
      setLoadingCell(null)
    }
  }

  // Transform tasks into table data
  const data = useMemo<TaskRow[]>(() => {
    return localTasks.map((task) => {
      const row: TaskRow = { task }

      members.forEach((member) => {
        const assignment = task.assignments.find((a) => a.memberId === member.id)

        row[member.id] = {
          taskId: task.id,
          memberId: member.id,
          role: assignment?.raciRole ?? null,
          assignmentId: assignment?.id,
        }
      })

      return row
    })
  }, [localTasks, members])

  const columnHelper = createColumnHelper<TaskRow>()

  const columns = useMemo<ColumnDef<TaskRow, any>[]>(() => {
    const cols: ColumnDef<TaskRow, any>[] = [
      columnHelper.accessor('task', {
        id: 'task',
        header: () => (
          <div className="flex items-center justify-between px-4 py-2">
            <span className="font-semibold">Tasks</span>
            {onAddTask && !isReadOnly && (
              <Button size="sm" variant="ghost" onClick={onAddTask} className="h-7 px-2">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
        cell: (info) => {
          const task = info.getValue() as RaciTask
          const validation = taskValidation[task.id]
          const hasError = validation ? (!validation.hasAccountable || !validation.hasResponsible) : false

          return (
            <TaskCellContent
              task={task}
              hasError={hasError}
              isReadOnly={isReadOnly}
              onTaskUpdate={onTaskUpdate}
            />
          )
        },
        size: 250,
        minSize: 200,
      }),
    ]

    // Add member columns
    members.forEach((member) => {
      cols.push(
        columnHelper.accessor(member.id, {
          id: member.id,
          header: () => (
            <div className="px-2 py-2 text-center">
              <div className="font-semibold text-sm truncate">{member.name}</div>
              {member.department && (
                <div className="text-xs text-gray-500 truncate">{member.department.name}</div>
              )}
            </div>
          ),
          cell: (info) => {
            const cellData = info.getValue() as RaciCellData
            const cellKey = `${cellData.taskId}-${cellData.memberId}`
            const isLoading = loadingCell === cellKey

            return (
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                )}
                <RaciCell
                  taskId={cellData.taskId}
                  memberId={cellData.memberId}
                  currentRole={cellData.role}
                  assignmentId={cellData.assignmentId ?? undefined}
                  onRoleChange={(role) =>
                    handleRoleChange(
                      cellData.taskId,
                      cellData.memberId,
                      role,
                      cellData.assignmentId ?? undefined
                    )
                  }
                  disabled={isReadOnly || isLoading}
                />
              </div>
            )
          },
          size: 100,
          minSize: 80,
        })
      )
    })

    // Add "Add Member" column if not read-only
    if (onAddMember && !isReadOnly) {
      cols.push(
        columnHelper.display({
          id: 'add-member',
          header: () => (
            <Button size="sm" variant="ghost" onClick={onAddMember} className="w-full h-full">
              <Plus className="h-4 w-4" />
            </Button>
          ),
          cell: () => <div className="h-12" />,
          size: 60,
          minSize: 60,
        })
      )
    }

    return cols
  }, [members, columnHelper, onAddTask, onAddMember, isReadOnly, taskValidation, loadingCell, handleRoleChange, onTaskUpdate])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (tasks.length === 0 || members.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-gray-500 mb-4">
          {tasks.length === 0
            ? 'No tasks yet. Add your first task to get started.'
            : 'No members yet. Add members to assign RACI roles.'}
        </p>
        {!isReadOnly && (
          <div className="flex gap-2 justify-center">
            {tasks.length === 0 && onAddTask && (
              <Button onClick={onAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            )}
            {members.length === 0 && onAddMember && (
              <Button onClick={onAddMember} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="border-r last:border-r-0 text-left"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  {!isReadOnly && (
                    <th className="border-r w-12 bg-gray-50">
                      <GripVertical className="h-4 w-4 text-gray-400 mx-auto" />
                    </th>
                  )}
                </tr>
              ))}
            </thead>
            <tbody>
              <SortableContext items={localTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {table.getRowModel().rows.map((row) => (
                  <SortableRow key={row.id} row={row} isReadOnly={isReadOnly}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn('border-r last:border-r-0', cell.column.id !== 'task' && 'p-0')}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </SortableRow>
                ))}
              </SortableContext>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 border-t px-4 py-3">
          <div className="flex items-center gap-6 text-xs">
            <span className="font-semibold text-gray-700">Legend:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-900 font-semibold border border-blue-300">
                R
              </span>
              <span className="text-gray-600">Responsible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-green-100 text-green-900 font-semibold border border-green-300">
                A
              </span>
              <span className="text-gray-600">Accountable</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-900 font-semibold border border-yellow-300">
                C
              </span>
              <span className="text-gray-600">Consulted</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-purple-100 text-purple-900 font-semibold border border-purple-300">
                I
              </span>
              <span className="text-gray-600">Informed</span>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  )
}
