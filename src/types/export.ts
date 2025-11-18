// Export type definitions
export type ExportFormat = 'pdf' | 'excel' | 'csv';

export type ExportOptions = {
  format: ExportFormat;
  includeComments?: boolean;
  includeMetadata?: boolean;
  includeAnalytics?: boolean;
};

export type MatrixExportData = {
  matrix: {
    id: string;
    name: string;
    description: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    project: {
      name: string;
      description: string | null;
    };
    createdBy: {
      name: string;
      email: string;
    };
  };
  tasks: Array<{
    id: string;
    name: string;
    description: string | null;
    orderIndex: number;
    status: string;
    priority: string;
    dueDate: Date | null;
    assignments: Array<{
      raciRole: string;
      member: {
        name: string;
        email: string;
      };
    }>;
  }>;
  members: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  comments?: Array<{
    author: {
      name: string;
    };
    content: string;
    createdAt: Date;
  }>;
  analytics?: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    workloadDistribution: Record<string, {
      name: string;
      responsible: number;
      accountable: number;
      consulted: number;
      informed: number;
      total: number;
    }>;
    validationStatus: {
      isValid: boolean;
      issues: Array<{
        taskId: string;
        taskName: string;
        message: string;
      }>;
    };
  };
};

export type WorkloadReport = {
  organizationId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
    department: string | null;
    totalAssignments: number;
    byRole: {
      responsible: number;
      accountable: number;
      consulted: number;
      informed: number;
    };
    byMatrix: Array<{
      matrixId: string;
      matrixName: string;
      projectName: string;
      assignmentCount: number;
    }>;
    estimatedHours: number | null;
  }>;
  summary: {
    totalMembers: number;
    totalAssignments: number;
    averageAssignmentsPerMember: number;
    mostLoadedMember: {
      name: string;
      assignmentCount: number;
    };
  };
};
