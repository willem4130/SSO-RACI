// RACI Matrix Application - Type Definitions

export type RACIRole = "RESPONSIBLE" | "ACCOUNTABLE" | "CONSULTED" | "INFORMED";

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type MemberStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED" | "ON_HOLD";

export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "ON_HOLD";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ShareAccess = "VIEW" | "COMMENT" | "EDIT";

export type AuditAction = "CREATED" | "UPDATED" | "DELETED" | "SHARED" | "RESTORED" | "EXPORTED";

export type NotificationType = "ASSIGNMENT" | "MENTION" | "COMMENT" | "SHARE" | "DEADLINE" | "CONFLICT";

// Validation result types
export interface ValidationError {
  taskId: string;
  taskName: string;
  type: "MISSING_ACCOUNTABLE" | "MULTIPLE_ACCOUNTABLE" | "MISSING_RESPONSIBLE" | "NO_ASSIGNMENTS" | "OVERLOAD_WARNING";
  message: string;
  severity: "error" | "warning";
  memberId?: string;
  memberName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Matrix grid types for UI
export interface MatrixGridData {
  tasks: TaskWithAssignments[];
  members: MemberWithDepartment[];
}

export interface TaskWithAssignments {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  status: TaskStatus;
  priority: TaskPriority;
  assignments: AssignmentData[];
  children?: TaskWithAssignments[];
}

export interface AssignmentData {
  id: string;
  taskId: string;
  memberId: string;
  raciRole: RACIRole;
  notes?: string;
  workload?: number;
}

export interface MemberWithDepartment {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

// Template structure
export interface TemplateStructure {
  tasks: TemplateTask[];
  defaultAssignments: TemplateAssignment[];
}

export interface TemplateTask {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  parentId?: string;
}

export interface TemplateAssignment {
  taskId: string;
  raciRole: RACIRole;
  roleTitle: string; // "Project Manager", "Developer", etc.
}

// Analytics types
export interface WorkloadAnalytics {
  memberId: string;
  memberName: string;
  responsible: number;
  accountable: number;
  consulted: number;
  informed: number;
  total: number;
  overloadWarning: boolean;
}

export interface BottleneckAnalysis {
  criticalMembers: {
    memberId: string;
    memberName: string;
    criticalTaskCount: number;
    riskLevel: "high" | "medium" | "low";
  }[];
  singlePointsOfFailure: {
    taskId: string;
    taskName: string;
    accountable: string;
  }[];
}

// Additional component-specific types
export type RaciTask = TaskWithAssignments;
export type RaciMember = MemberWithDepartment;
export type RaciCellData = {
  taskId: string;
  memberId: string;
  role: RACIRole | null;
  assignmentId?: string | null;
};
