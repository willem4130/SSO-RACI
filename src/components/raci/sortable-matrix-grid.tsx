'use client'

import { useState } from 'react'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { RaciMatrixGrid } from './raci-matrix-grid'
import type { RaciTask, RaciMember } from '@/types/raci'
import { RaciRole } from '@prisma/client'

interface SortableMatrixGridProps {
  tasks: RaciTask[]
  members: RaciMember[]
  onTaskReorder: (taskIds: string[]) => Promise<void>
  onAssignmentChange: (
    taskId: string,
    memberId: string,
    role: RaciRole | null,
    assignmentId?: string
  ) => Promise<void>
  onAddTask?: () => void
  onAddMember?: () => void
  isReadOnly?: boolean
  showValidation?: boolean
  enableDragDrop?: boolean
}

export function SortableMatrixGrid({
  tasks,
  members,
  onTaskReorder,
  onAssignmentChange,
  onAddTask,
  onAddMember,
  isReadOnly = false,
  showValidation = true,
  enableDragDrop = true,
}: SortableMatrixGridProps) {
  const [sortedTasks, setSortedTasks] = useState(tasks)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedTasks.findIndex((task) => task.id === active.id)
      const newIndex = sortedTasks.findIndex((task) => task.id === over.id)

      const newTasks = arrayMove(sortedTasks, oldIndex, newIndex)
      setSortedTasks(newTasks)

      // Call the reorder callback with the new order
      await onTaskReorder(newTasks.map((task) => task.id))
    }

    setActiveId(null)
  }

  // Update sorted tasks when tasks prop changes
  if (tasks !== sortedTasks) {
    setSortedTasks(tasks)
  }

  if (!enableDragDrop || isReadOnly) {
    return (
      <RaciMatrixGrid
        tasks={tasks}
        members={members}
        onAssignmentChange={onAssignmentChange}
        onAddTask={onAddTask}
        onAddMember={onAddMember}
        isReadOnly={isReadOnly}
        showValidation={showValidation}
      />
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedTasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <RaciMatrixGrid
          tasks={sortedTasks}
          members={members}
          onAssignmentChange={onAssignmentChange}
          onAddTask={onAddTask}
          onAddMember={onAddMember}
          isReadOnly={isReadOnly}
          showValidation={showValidation}
        />
      </SortableContext>
    </DndContext>
  )
}
