// RACI Matrix Validation Service - Enhanced Phase 1.2
// Advanced business rules enforcement, conflict detection, and smart suggestions

import type { PrismaClient } from '@prisma/client'
import type { ValidationError, ValidationResult, RACIRole } from '@/types/raci'

// Enhanced validation types
export interface ValidationSuggestion {
  taskId: string
  taskName: string
  type: 'OPTIMIZE' | 'REDISTRIBUTE' | 'SIMPLIFY' | 'CLARIFY'
  message: string
  action: string
  impact: 'high' | 'medium' | 'low'
}

export interface EnhancedValidationResult extends ValidationResult {
  suggestions: ValidationSuggestion[]
  healthScore: number // 0-100
  metrics: {
    totalTasks: number
    validTasks: number
    tasksCoverage: number // % of tasks with proper assignments
    avgAssignmentsPerTask: number
    avgAssignmentsPerMember: number
  }
}

/**
 * Validate an entire RACI matrix
 * Returns validation errors and warnings
 */
export async function validateRACIMatrix(
  db: PrismaClient,
  matrixId: string
): Promise<ValidationResult> {
  const matrix = await db.rACIMatrix.findUnique({
    where: { id: matrixId },
    include: {
      tasks: {
        include: {
          assignments: {
            include: {
              member: true,
            },
          },
        },
        where: {
          archivedAt: null,
        },
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  })

  if (!matrix) {
    return {
      isValid: false,
      errors: [
        {
          taskId: '',
          taskName: 'N/A',
          type: 'MISSING_ACCOUNTABLE',
          message: 'Matrix not found',
          severity: 'error',
        },
      ],
      warnings: [],
    }
  }

  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validate each task
  for (const task of matrix.tasks) {
    const taskValidation = validateTask(task)
    errors.push(...taskValidation.errors)
    warnings.push(...taskValidation.warnings)
  }

  // Check for workload distribution
  const workloadWarnings = await validateWorkloadDistribution(db, matrixId)
  warnings.push(...workloadWarnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate a single task's RACI assignments
 */
function validateTask(task: {
  id: string
  name: string
  assignments: Array<{
    id: string
    raciRole: string
    member: { id: string; name: string }
  }>
}): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // RULE 1: Exactly ONE Accountable per task
  const accountableAssignments = task.assignments.filter((a) => a.raciRole === 'ACCOUNTABLE')

  if (accountableAssignments.length === 0) {
    errors.push({
      taskId: task.id,
      taskName: task.name,
      type: 'MISSING_ACCOUNTABLE',
      message: `Task "${task.name}" has no Accountable person assigned`,
      severity: 'error',
    })
  } else if (accountableAssignments.length > 1) {
    errors.push({
      taskId: task.id,
      taskName: task.name,
      type: 'MULTIPLE_ACCOUNTABLE',
      message: `Task "${task.name}" has multiple Accountable people (${accountableAssignments.map((a) => a.member.name).join(', ')})`,
      severity: 'error',
    })
  }

  // RULE 2: At least ONE Responsible per task
  const responsibleAssignments = task.assignments.filter((a) => a.raciRole === 'RESPONSIBLE')

  if (responsibleAssignments.length === 0) {
    warnings.push({
      taskId: task.id,
      taskName: task.name,
      type: 'MISSING_RESPONSIBLE',
      message: `Task "${task.name}" has no Responsible person assigned`,
      severity: 'warning',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check for workload distribution issues
 * Warn if a member has too many assignments
 */
async function validateWorkloadDistribution(
  db: PrismaClient,
  matrixId: string
): Promise<ValidationError[]> {
  const warnings: ValidationError[] = []

  // Get all assignments for this matrix
  const assignments = await db.assignment.findMany({
    where: {
      task: {
        matrixId,
        archivedAt: null,
      },
    },
    include: {
      member: true,
      task: true,
    },
  })

  // Group by member and count assignments
  const memberAssignments = new Map<
    string,
    {
      name: string
      responsible: number
      accountable: number
      total: number
    }
  >()

  for (const assignment of assignments) {
    const existing = memberAssignments.get(assignment.memberId) || {
      name: assignment.member.name,
      responsible: 0,
      accountable: 0,
      total: 0,
    }

    existing.total++
    if (assignment.raciRole === 'RESPONSIBLE') existing.responsible++
    if (assignment.raciRole === 'ACCOUNTABLE') existing.accountable++

    memberAssignments.set(assignment.memberId, existing)
  }

  // Warn if member has too many assignments (configurable threshold)
  const OVERLOAD_THRESHOLD = 10
  const ACCOUNTABLE_THRESHOLD = 5

  for (const [memberId, stats] of memberAssignments) {
    if (stats.total > OVERLOAD_THRESHOLD) {
      warnings.push({
        taskId: '',
        taskName: 'Multiple tasks',
        type: 'OVERLOAD_WARNING',
        message: `${stats.name} has ${stats.total} assignments (threshold: ${OVERLOAD_THRESHOLD})`,
        severity: 'warning',
      })
    }

    if (stats.accountable > ACCOUNTABLE_THRESHOLD) {
      warnings.push({
        taskId: '',
        taskName: 'Multiple tasks',
        type: 'OVERLOAD_WARNING',
        message: `${stats.name} is Accountable for ${stats.accountable} tasks (threshold: ${ACCOUNTABLE_THRESHOLD})`,
        severity: 'warning',
      })
    }
  }

  return warnings
}

/**
 * Validate a single assignment before creating
 */
export async function validateAssignment(
  db: PrismaClient,
  taskId: string,
  memberId: string,
  raciRole: RACIRole
): Promise<{ valid: boolean; error?: string }> {
  // Check if assignment already exists
  const existing = await db.assignment.findUnique({
    where: {
      taskId_memberId_raciRole: {
        taskId,
        memberId,
        raciRole,
      },
    },
  })

  if (existing) {
    return {
      valid: false,
      error: 'This assignment already exists',
    }
  }

  // If ACCOUNTABLE, check if another Accountable exists
  if (raciRole === 'ACCOUNTABLE') {
    const existingAccountable = await db.assignment.findFirst({
      where: {
        taskId,
        raciRole: 'ACCOUNTABLE',
      },
      include: {
        member: true,
      },
    })

    if (existingAccountable) {
      return {
        valid: false,
        error: `Task already has an Accountable person: ${existingAccountable.member.name}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Get validation summary for a matrix
 */
export async function getValidationSummary(
  db: PrismaClient,
  matrixId: string
): Promise<{
  totalTasks: number
  validTasks: number
  errorCount: number
  warningCount: number
}> {
  const validation = await validateRACIMatrix(db, matrixId)

  const tasks = await db.task.findMany({
    where: {
      matrixId,
      archivedAt: null,
    },
  })

  return {
    totalTasks: tasks.length,
    validTasks: tasks.length - validation.errors.length,
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
  }
}

// ============================================================================
// PHASE 1.2: ENHANCED VALIDATION WITH SMART SUGGESTIONS
// ============================================================================

/**
 * Enhanced validation with suggestions and health score
 */
export async function validateMatrixEnhanced(
  db: PrismaClient,
  matrixId: string
): Promise<EnhancedValidationResult> {
  // Get base validation
  const baseValidation = await validateRACIMatrix(db, matrixId)

  // Get matrix data for suggestions
  const matrix = await db.rACIMatrix.findUnique({
    where: { id: matrixId },
    include: {
      tasks: {
        include: {
          assignments: {
            include: {
              member: true,
            },
          },
        },
        where: {
          archivedAt: null,
        },
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  })

  if (!matrix) {
    return {
      ...baseValidation,
      suggestions: [],
      healthScore: 0,
      metrics: {
        totalTasks: 0,
        validTasks: 0,
        tasksCoverage: 0,
        avgAssignmentsPerTask: 0,
        avgAssignmentsPerMember: 0,
      },
    }
  }

  // Generate smart suggestions
  const suggestions = await generateSmartSuggestions(db, matrix)

  // Calculate health score
  const healthScore = calculateMatrixHealthScore(
    matrix.tasks,
    baseValidation.errors.length,
    baseValidation.warnings.length
  )

  // Calculate metrics
  const metrics = calculateMatrixMetrics(matrix.tasks)

  return {
    ...baseValidation,
    suggestions,
    healthScore,
    metrics,
  }
}

/**
 * Generate smart suggestions for improving the RACI matrix
 */
async function generateSmartSuggestions(
  db: PrismaClient,
  matrix: {
    id: string
    tasks: Array<{
      id: string
      name: string
      assignments: Array<{
        id: string
        raciRole: string
        member: { id: string; name: string }
      }>
    }>
  }
): Promise<ValidationSuggestion[]> {
  const suggestions: ValidationSuggestion[] = []

  for (const task of matrix.tasks) {
    const roles = {
      responsible: task.assignments.filter((a) => a.raciRole === 'RESPONSIBLE').length,
      accountable: task.assignments.filter((a) => a.raciRole === 'ACCOUNTABLE').length,
      consulted: task.assignments.filter((a) => a.raciRole === 'CONSULTED').length,
      informed: task.assignments.filter((a) => a.raciRole === 'INFORMED').length,
    }

    // Suggestion: Too many Consulted (slows down decision-making)
    if (roles.consulted > 4) {
      suggestions.push({
        taskId: task.id,
        taskName: task.name,
        type: 'OPTIMIZE',
        message: `Task has ${roles.consulted} people marked as Consulted, which may slow decision-making`,
        action: 'Consider moving some Consulted stakeholders to Informed',
        impact: 'medium',
      })
    }

    // Suggestion: No communication (Consulted or Informed)
    if (roles.consulted === 0 && roles.informed === 0 && task.assignments.length > 0) {
      suggestions.push({
        taskId: task.id,
        taskName: task.name,
        type: 'CLARIFY',
        message: 'Task has no communication stakeholders (Consulted or Informed)',
        action: 'Consider who should be consulted for input or informed of progress',
        impact: 'low',
      })
    }

    // Suggestion: Too many Responsible (potential confusion)
    if (roles.responsible > 5) {
      suggestions.push({
        taskId: task.id,
        taskName: task.name,
        type: 'SIMPLIFY',
        message: `Task has ${roles.responsible} Responsible people, which may cause confusion`,
        action: 'Consider breaking this task into subtasks or consolidating responsibilities',
        impact: 'high',
      })
    }

    // Suggestion: Only Accountable (no doers)
    if (roles.accountable === 1 && task.assignments.length === 1) {
      suggestions.push({
        taskId: task.id,
        taskName: task.name,
        type: 'CLARIFY',
        message: 'Task only has an Accountable person with no other roles',
        action:
          'Consider if this person should also be Responsible, or if others should be involved',
        impact: 'medium',
      })
    }

    // Suggestion: Excessive total assignments
    if (task.assignments.length > 10) {
      suggestions.push({
        taskId: task.id,
        taskName: task.name,
        type: 'SIMPLIFY',
        message: `Task has ${task.assignments.length} total assignments`,
        action: 'This task may be too complex. Consider breaking it down or reducing stakeholders',
        impact: 'high',
      })
    }
  }

  // Check for workload imbalance across members
  const memberWorkload = new Map<
    string,
    { name: string; responsible: number; accountable: number; total: number }
  >()

  for (const task of matrix.tasks) {
    for (const assignment of task.assignments) {
      const existing = memberWorkload.get(assignment.member.id) || {
        name: assignment.member.name,
        responsible: 0,
        accountable: 0,
        total: 0,
      }

      existing.total++
      if (assignment.raciRole === 'RESPONSIBLE') existing.responsible++
      if (assignment.raciRole === 'ACCOUNTABLE') existing.accountable++

      memberWorkload.set(assignment.member.id, existing)
    }
  }

  // Suggest redistribution if someone is overloaded
  for (const [memberId, stats] of memberWorkload) {
    if (stats.total > 12) {
      suggestions.push({
        taskId: '',
        taskName: 'Multiple tasks',
        type: 'REDISTRIBUTE',
        message: `${stats.name} has ${stats.total} total assignments (${stats.responsible} Responsible, ${stats.accountable} Accountable)`,
        action: 'Consider redistributing some assignments to balance workload',
        impact: 'high',
      })
    }

    if (stats.accountable > 6) {
      suggestions.push({
        taskId: '',
        taskName: 'Multiple tasks',
        type: 'REDISTRIBUTE',
        message: `${stats.name} is Accountable for ${stats.accountable} tasks`,
        action: 'This person has too much ownership. Consider delegating some accountability',
        impact: 'high',
      })
    }
  }

  return suggestions
}

/**
 * Calculate overall matrix health score (0-100)
 */
function calculateMatrixHealthScore(
  tasks: Array<{
    id: string
    assignments: Array<{ raciRole: string }>
  }>,
  errorCount: number,
  warningCount: number
): number {
  if (tasks.length === 0) return 100

  let score = 100

  // Deduct points for errors (critical issues)
  score -= errorCount * 10

  // Deduct points for warnings (minor issues)
  score -= warningCount * 3

  // Bonus for complete coverage
  const tasksWithAssignments = tasks.filter((t) => t.assignments.length > 0).length
  const coverage = tasksWithAssignments / tasks.length
  if (coverage === 1) {
    score += 10
  }

  // Floor at 0, cap at 100
  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate matrix metrics
 */
function calculateMatrixMetrics(
  tasks: Array<{
    id: string
    assignments: Array<{
      raciRole: string
      member: { id: string }
    }>
  }>
): {
  totalTasks: number
  validTasks: number
  tasksCoverage: number
  avgAssignmentsPerTask: number
  avgAssignmentsPerMember: number
} {
  const totalTasks = tasks.length
  const tasksWithAssignments = tasks.filter((t) => t.assignments.length > 0).length

  // Count valid tasks (have 1 Accountable and 1+ Responsible)
  const validTasks = tasks.filter((task) => {
    const accountable = task.assignments.filter((a) => a.raciRole === 'ACCOUNTABLE').length
    const responsible = task.assignments.filter((a) => a.raciRole === 'RESPONSIBLE').length
    return accountable === 1 && responsible >= 1
  }).length

  const totalAssignments = tasks.reduce((sum, task) => sum + task.assignments.length, 0)
  const avgAssignmentsPerTask = totalTasks > 0 ? totalAssignments / totalTasks : 0

  // Calculate unique members
  const uniqueMembers = new Set<string>()
  for (const task of tasks) {
    for (const assignment of task.assignments) {
      uniqueMembers.add(assignment.member.id)
    }
  }

  const avgAssignmentsPerMember = uniqueMembers.size > 0 ? totalAssignments / uniqueMembers.size : 0

  return {
    totalTasks,
    validTasks,
    tasksCoverage: totalTasks > 0 ? (tasksWithAssignments / totalTasks) * 100 : 0,
    avgAssignmentsPerTask: Math.round(avgAssignmentsPerTask * 10) / 10,
    avgAssignmentsPerMember: Math.round(avgAssignmentsPerMember * 10) / 10,
  }
}

/**
 * Detect RACI conflicts in a matrix
 */
export async function detectConflicts(
  db: PrismaClient,
  matrixId: string
): Promise<{
  conflicts: Array<{
    type: 'MULTIPLE_ACCOUNTABLE' | 'MISSING_ACCOUNTABLE' | 'MISSING_RESPONSIBLE' | 'ROLE_OVERLOAD'
    taskId: string
    taskName: string
    details: string
    severity: 'critical' | 'high' | 'medium'
  }>
}> {
  const matrix = await db.rACIMatrix.findUnique({
    where: { id: matrixId },
    include: {
      tasks: {
        include: {
          assignments: {
            include: {
              member: true,
            },
          },
        },
        where: {
          archivedAt: null,
        },
      },
    },
  })

  if (!matrix) {
    return { conflicts: [] }
  }

  const conflicts: Array<{
    type: 'MULTIPLE_ACCOUNTABLE' | 'MISSING_ACCOUNTABLE' | 'MISSING_RESPONSIBLE' | 'ROLE_OVERLOAD'
    taskId: string
    taskName: string
    details: string
    severity: 'critical' | 'high' | 'medium'
  }> = []

  for (const task of matrix.tasks) {
    const accountable = task.assignments.filter((a) => a.raciRole === 'ACCOUNTABLE')
    const responsible = task.assignments.filter((a) => a.raciRole === 'RESPONSIBLE')

    if (accountable.length === 0) {
      conflicts.push({
        type: 'MISSING_ACCOUNTABLE',
        taskId: task.id,
        taskName: task.name,
        details: 'No one is accountable for this task',
        severity: 'critical',
      })
    }

    if (accountable.length > 1) {
      conflicts.push({
        type: 'MULTIPLE_ACCOUNTABLE',
        taskId: task.id,
        taskName: task.name,
        details: `Multiple people accountable: ${accountable.map((a) => a.member.name).join(', ')}`,
        severity: 'critical',
      })
    }

    if (responsible.length === 0) {
      conflicts.push({
        type: 'MISSING_RESPONSIBLE',
        taskId: task.id,
        taskName: task.name,
        details: 'No one is responsible for doing this task',
        severity: 'high',
      })
    }

    if (task.assignments.length > 15) {
      conflicts.push({
        type: 'ROLE_OVERLOAD',
        taskId: task.id,
        taskName: task.name,
        details: `${task.assignments.length} total assignments - task may be too complex`,
        severity: 'medium',
      })
    }
  }

  return { conflicts }
}
