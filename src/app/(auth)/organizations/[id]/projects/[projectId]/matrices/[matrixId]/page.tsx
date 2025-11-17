'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Users, Save, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RaciMatrixGrid } from '@/components/raci/raci-matrix-grid';
import { ValidationSummary } from '@/components/raci/validation-summary';
import type { RaciTask, RaciMember } from '@/types/raci';
import type { RaciRole } from '@prisma/client';

export default function MatrixEditorPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const projectId = params.projectId as string;
  const matrixId = params.matrixId as string;

  // Mock data - will be replaced with tRPC queries
  const [matrixName] = useState('Sprint Planning Matrix');
  const [showValidation, setShowValidation] = useState(true);

  // Sample tasks and members
  const [tasks, setTasks] = useState<RaciTask[]>([
    {
      id: '1',
      name: 'Define Requirements',
      description: 'Gather and document project requirements',
      orderIndex: 0,
      status: 'NOT_STARTED',
      priority: 'HIGH',
      assignments: [
        {
          id: 'a1',
          taskId: '1',
          memberId: 'm1',
          raciRole: 'ACCOUNTABLE' as RaciRole,
        },
        {
          id: 'a2',
          taskId: '1',
          memberId: 'm2',
          raciRole: 'RESPONSIBLE' as RaciRole,
        },
        {
          id: 'a3',
          taskId: '1',
          memberId: 'm3',
          raciRole: 'CONSULTED' as RaciRole,
        },
      ],
    },
    {
      id: '2',
      name: 'Create Design Mockups',
      description: 'Design UI/UX mockups',
      orderIndex: 1,
      status: 'NOT_STARTED',
      priority: 'HIGH',
      assignments: [
        {
          id: 'a4',
          taskId: '2',
          memberId: 'm3',
          raciRole: 'ACCOUNTABLE' as RaciRole,
        },
        {
          id: 'a5',
          taskId: '2',
          memberId: 'm2',
          raciRole: 'CONSULTED' as RaciRole,
        },
      ],
    },
    {
      id: '3',
      name: 'Implement Frontend',
      description: 'Build React components',
      orderIndex: 2,
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      assignments: [],
    },
  ]);

  const members: RaciMember[] = [
    {
      id: 'm1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'ADMIN',
      department: { id: 'd1', name: 'Engineering', code: 'eng' },
    },
    {
      id: 'm2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'MEMBER',
      department: { id: 'd1', name: 'Engineering', code: 'eng' },
    },
    {
      id: 'm3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      role: 'MEMBER',
      department: { id: 'd2', name: 'Design', code: 'design' },
    },
  ];

  const handleAssignmentChange = async (
    taskId: string,
    memberId: string,
    role: RaciRole | null,
    assignmentId?: string
  ) => {
    // Update local state
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) return task;

        let newAssignments = [...task.assignments];

        if (role === null) {
          // Remove assignment
          newAssignments = newAssignments.filter((a) => a.id !== assignmentId);
        } else if (assignmentId) {
          // Update existing assignment
          newAssignments = newAssignments.map((a) =>
            a.id === assignmentId ? { ...a, raciRole: role } : a
          );
        } else {
          // Add new assignment
          newAssignments.push({
            id: `a-${Date.now()}`,
            taskId,
            memberId,
            raciRole: role,
          });
        }

        return { ...task, assignments: newAssignments };
      })
    );

    // TODO: Call tRPC mutation to persist change
    console.log('Assignment changed:', { taskId, memberId, role, assignmentId });
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<RaciTask>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
    // TODO: Call tRPC mutation to persist task updates
    console.log('Task updated:', { taskId, updates });
  };

  const handleAddTask = () => {
    const newTask: RaciTask = {
      id: `task-${Date.now()}`,
      name: 'New Task',
      orderIndex: tasks.length,
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      assignments: [],
    };
    setTasks([...tasks, newTask]);
  };

  const handleSave = () => {
    // TODO: Call tRPC mutation to save matrix
    console.log('Saving matrix...', { tasks });
    alert('Matrix saved! (This is a mock - will be connected to tRPC)');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  router.push(`/organizations/${orgId}/projects/${projectId}`)
                }
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{matrixName}</h1>
                <p className="text-sm text-muted-foreground">
                  {tasks.length} tasks • {members.length} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValidation(!showValidation)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Validation
              </Button>
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Members
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
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
                  showValidation={showValidation}
                  onAddTask={handleAddTask}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {showValidation && (
              <ValidationSummary tasks={tasks} />
            )}

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold mb-3">Quick Guide</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-green-100 text-green-900 flex items-center justify-center text-xs font-bold">
                    A
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      Accountable
                    </div>
                    <div className="text-xs">
                      Ultimately answerable (exactly 1)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-bold">
                    R
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      Responsible
                    </div>
                    <div className="text-xs">
                      Does the work (at least 1)
                    </div>
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
    </div>
  );
}
