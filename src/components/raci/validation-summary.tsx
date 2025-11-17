'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { RaciTask, ValidationError } from '@/types/raci';
import { cn } from '@/lib/utils';

interface ValidationSummaryProps {
  tasks: RaciTask[];
  className?: string;
}

export function ValidationSummary({ tasks, className }: ValidationSummaryProps) {
  const validationErrors = useMemo<ValidationError[]>(() => {
    const errors: ValidationError[] = [];

    tasks.forEach((task) => {
      const accountableAssignments = task.assignments.filter(
        (a) => a.raciRole === 'ACCOUNTABLE'
      );
      const responsibleAssignments = task.assignments.filter(
        (a) => a.raciRole === 'RESPONSIBLE'
      );

      // Check for no assignments
      if (task.assignments.length === 0) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          type: 'NO_ASSIGNMENTS',
          severity: 'error',
          message: 'Task has no role assignments',
        });
        return;
      }

      // Check for missing or multiple accountable
      if (accountableAssignments.length === 0) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          type: 'MISSING_ACCOUNTABLE',
          severity: 'error',
          message: 'Missing Accountable (A) assignment',
        });
      } else if (accountableAssignments.length > 1) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          type: 'MULTIPLE_ACCOUNTABLE',
          severity: 'error',
          message: `Has ${accountableAssignments.length} Accountable assignments (should be exactly 1)`,
        });
      }

      // Check for missing responsible
      if (responsibleAssignments.length === 0) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          type: 'MISSING_RESPONSIBLE',
          severity: 'error',
          message: 'Missing Responsible (R) assignment',
        });
      }
    });

    return errors;
  }, [tasks]);

  const isValid = validationErrors.length === 0;
  const totalTasks = tasks.length;
  const validTasks = totalTasks - new Set(validationErrors.map(e => e.taskId)).size;

  return (
    <div className={cn('border rounded-lg p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {isValid ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Matrix Validation: Passed</h3>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">
              Matrix Validation: {validationErrors.length} Issue{validationErrors.length !== 1 ? 's' : ''}
            </h3>
          </>
        )}
      </div>

      {/* Summary stats */}
      <div className="mb-3 text-sm text-gray-600">
        <p>
          {validTasks} of {totalTasks} tasks valid
        </p>
      </div>

      {/* Error list */}
      {validationErrors.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t">
          <p className="text-sm font-medium text-gray-700">Issues to resolve:</p>
          <div className="space-y-1.5">
            {validationErrors.map((error, index) => (
              <div
                key={`${error.taskId}-${error.type}-${index}`}
                className="flex items-start gap-2 text-sm bg-red-50 p-2 rounded"
              >
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-red-900">{error.taskName}:</span>{' '}
                  <span className="text-red-700">{error.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules reminder */}
      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
        <p className="font-medium mb-1">RACI Rules:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Each task must have exactly 1 Accountable (A) person</li>
          <li>Each task must have at least 1 Responsible (R) person</li>
          <li>Consulted (C) and Informed (I) are optional</li>
        </ul>
      </div>
    </div>
  );
}
