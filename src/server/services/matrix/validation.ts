// RACI Matrix Validation Service
// Business rules enforcement for RACI assignments

import type { PrismaClient } from "@prisma/client";
import type { ValidationError, ValidationResult, RACIRole } from "@/types/raci";

/**
 * Validate an entire RACI matrix
 * Returns validation errors and warnings
 */
export async function validateRACIMatrix(
  db: PrismaClient,
  matrixId: string,
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
          orderIndex: "asc",
        },
      },
    },
  });

  if (!matrix) {
    return {
      isValid: false,
      errors: [
        {
          taskId: "",
          taskName: "N/A",
          type: "MISSING_ACCOUNTABLE",
          message: "Matrix not found",
          severity: "error",
        },
      ],
      warnings: [],
    };
  }

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate each task
  for (const task of matrix.tasks) {
    const taskValidation = validateTask(task);
    errors.push(...taskValidation.errors);
    warnings.push(...taskValidation.warnings);
  }

  // Check for workload distribution
  const workloadWarnings = await validateWorkloadDistribution(db, matrixId);
  warnings.push(...workloadWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single task's RACI assignments
 */
function validateTask(task: {
  id: string;
  name: string;
  assignments: Array<{
    id: string;
    raciRole: string;
    member: { id: string; name: string };
  }>;
}): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // RULE 1: Exactly ONE Accountable per task
  const accountableAssignments = task.assignments.filter(
    (a) => a.raciRole === "ACCOUNTABLE",
  );

  if (accountableAssignments.length === 0) {
    errors.push({
      taskId: task.id,
      taskName: task.name,
      type: "MISSING_ACCOUNTABLE",
      message: `Task "${task.name}" has no Accountable person assigned`,
      severity: "error",
    });
  } else if (accountableAssignments.length > 1) {
    errors.push({
      taskId: task.id,
      taskName: task.name,
      type: "MULTIPLE_ACCOUNTABLE",
      message: `Task "${task.name}" has multiple Accountable people (${accountableAssignments.map((a) => a.member.name).join(", ")})`,
      severity: "error",
    });
  }

  // RULE 2: At least ONE Responsible per task
  const responsibleAssignments = task.assignments.filter(
    (a) => a.raciRole === "RESPONSIBLE",
  );

  if (responsibleAssignments.length === 0) {
    warnings.push({
      taskId: task.id,
      taskName: task.name,
      type: "MISSING_RESPONSIBLE",
      message: `Task "${task.name}" has no Responsible person assigned`,
      severity: "warning",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for workload distribution issues
 * Warn if a member has too many assignments
 */
async function validateWorkloadDistribution(
  db: PrismaClient,
  matrixId: string,
): Promise<ValidationError[]> {
  const warnings: ValidationError[] = [];

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
  });

  // Group by member and count assignments
  const memberAssignments = new Map<
    string,
    {
      name: string;
      responsible: number;
      accountable: number;
      total: number;
    }
  >();

  for (const assignment of assignments) {
    const existing = memberAssignments.get(assignment.memberId) || {
      name: assignment.member.name,
      responsible: 0,
      accountable: 0,
      total: 0,
    };

    existing.total++;
    if (assignment.raciRole === "RESPONSIBLE") existing.responsible++;
    if (assignment.raciRole === "ACCOUNTABLE") existing.accountable++;

    memberAssignments.set(assignment.memberId, existing);
  }

  // Warn if member has too many assignments (configurable threshold)
  const OVERLOAD_THRESHOLD = 10;
  const ACCOUNTABLE_THRESHOLD = 5;

  for (const [memberId, stats] of memberAssignments) {
    if (stats.total > OVERLOAD_THRESHOLD) {
      warnings.push({
        taskId: "",
        taskName: "Multiple tasks",
        type: "OVERLOAD_WARNING",
        message: `${stats.name} has ${stats.total} assignments (threshold: ${OVERLOAD_THRESHOLD})`,
        severity: "warning",
      });
    }

    if (stats.accountable > ACCOUNTABLE_THRESHOLD) {
      warnings.push({
        taskId: "",
        taskName: "Multiple tasks",
        type: "OVERLOAD_WARNING",
        message: `${stats.name} is Accountable for ${stats.accountable} tasks (threshold: ${ACCOUNTABLE_THRESHOLD})`,
        severity: "warning",
      });
    }
  }

  return warnings;
}

/**
 * Validate a single assignment before creating
 */
export async function validateAssignment(
  db: PrismaClient,
  taskId: string,
  memberId: string,
  raciRole: RACIRole,
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
  });

  if (existing) {
    return {
      valid: false,
      error: "This assignment already exists",
    };
  }

  // If ACCOUNTABLE, check if another Accountable exists
  if (raciRole === "ACCOUNTABLE") {
    const existingAccountable = await db.assignment.findFirst({
      where: {
        taskId,
        raciRole: "ACCOUNTABLE",
      },
      include: {
        member: true,
      },
    });

    if (existingAccountable) {
      return {
        valid: false,
        error: `Task already has an Accountable person: ${existingAccountable.member.name}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get validation summary for a matrix
 */
export async function getValidationSummary(
  db: PrismaClient,
  matrixId: string,
): Promise<{
  totalTasks: number;
  validTasks: number;
  errorCount: number;
  warningCount: number;
}> {
  const validation = await validateRACIMatrix(db, matrixId);

  const tasks = await db.task.findMany({
    where: {
      matrixId,
      archivedAt: null,
    },
  });

  return {
    totalTasks: tasks.length,
    validTasks: tasks.length - validation.errors.length,
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
  };
}
