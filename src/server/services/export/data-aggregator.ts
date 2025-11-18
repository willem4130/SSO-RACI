// Export data aggregation service
import { db } from '@/server/db';
import type { MatrixExportData, WorkloadReport } from '@/types/export';

export class ExportDataAggregator {
  /**
   * Fetch and aggregate all data needed for matrix export
   */
  async getMatrixExportData(
    matrixId: string,
    options: {
      includeComments?: boolean;
      includeAnalytics?: boolean;
    } = {}
  ): Promise<MatrixExportData> {
    const matrix = await db.rACIMatrix.findUnique({
      where: { id: matrixId },
      include: {
        project: {
          select: {
            name: true,
            description: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        tasks: {
          include: {
            assignments: {
              include: {
                member: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!matrix) {
      throw new Error('Matrix not found');
    }

    // Get all unique members from assignments
    const memberMap = new Map<string, { id: string; name: string; email: string }>();
    matrix.tasks.forEach((task) => {
      task.assignments.forEach((assignment) => {
        if (!memberMap.has(assignment.memberId)) {
          memberMap.set(assignment.memberId, {
            id: assignment.memberId,
            name: assignment.member.name,
            email: assignment.member.email,
          });
        }
      });
    });

    const exportData: MatrixExportData = {
      matrix: {
        id: matrix.id,
        name: matrix.name,
        description: matrix.description,
        version: matrix.version,
        createdAt: matrix.createdAt,
        updatedAt: matrix.updatedAt,
        project: matrix.project,
        createdBy: matrix.createdBy,
      },
      tasks: matrix.tasks.map((task) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        orderIndex: task.orderIndex,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignments: task.assignments.map((a) => ({
          raciRole: a.raciRole,
          member: a.member,
        })),
      })),
      members: Array.from(memberMap.values()),
    };

    // Include comments if requested
    if (options.includeComments) {
      const comments = await db.comment.findMany({
        where: { matrixId },
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      exportData.comments = comments.map((c) => ({
        author: c.author,
        content: c.content,
        createdAt: c.createdAt,
      }));
    }

    // Include analytics if requested
    if (options.includeAnalytics) {
      exportData.analytics = await this.calculateMatrixAnalytics(matrix.id, exportData);
    }

    return exportData;
  }

  /**
   * Calculate analytics for matrix export
   */
  private async calculateMatrixAnalytics(
    matrixId: string,
    data: MatrixExportData
  ): Promise<MatrixExportData['analytics']> {
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter((t) => t.status === 'COMPLETED').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate workload distribution
    const workloadDistribution: Record<string, {
      name: string;
      responsible: number;
      accountable: number;
      consulted: number;
      informed: number;
      total: number;
    }> = {};

    data.tasks.forEach((task) => {
      task.assignments.forEach((assignment) => {
        const memberId = assignment.member.email;
        if (!workloadDistribution[memberId]) {
          workloadDistribution[memberId] = {
            name: assignment.member.name,
            responsible: 0,
            accountable: 0,
            consulted: 0,
            informed: 0,
            total: 0,
          };
        }

        const role = assignment.raciRole.toLowerCase() as 'responsible' | 'accountable' | 'consulted' | 'informed';
        workloadDistribution[memberId][role]++;
        workloadDistribution[memberId].total++;
      });
    });

    // Validate RACI rules
    const issues: Array<{ taskId: string; taskName: string; message: string }> = [];

    data.tasks.forEach((task) => {
      const accountableCount = task.assignments.filter(
        (a) => a.raciRole === 'ACCOUNTABLE'
      ).length;
      const responsibleCount = task.assignments.filter(
        (a) => a.raciRole === 'RESPONSIBLE'
      ).length;

      if (accountableCount === 0) {
        issues.push({
          taskId: task.id,
          taskName: task.name,
          message: 'No Accountable person assigned',
        });
      } else if (accountableCount > 1) {
        issues.push({
          taskId: task.id,
          taskName: task.name,
          message: 'Multiple Accountable people assigned',
        });
      }

      if (responsibleCount === 0) {
        issues.push({
          taskId: task.id,
          taskName: task.name,
          message: 'No Responsible person assigned',
        });
      }
    });

    return {
      totalTasks,
      completedTasks,
      completionRate,
      workloadDistribution,
      validationStatus: {
        isValid: issues.length === 0,
        issues,
      },
    };
  }

  /**
   * Generate workload report for organization
   */
  async generateWorkloadReport(
    organizationId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<WorkloadReport> {
    const whereClause = {
      organizationId,
      ...(dateRange && {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }),
    };

    const matrices = await db.rACIMatrix.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            name: true,
          },
        },
        tasks: {
          include: {
            assignments: {
              include: {
                member: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    department: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Aggregate member workload
    const memberWorkload = new Map<string, {
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
    }>();

    matrices.forEach((matrix) => {
      matrix.tasks.forEach((task) => {
        task.assignments.forEach((assignment) => {
          const memberId = assignment.member.id;

          if (!memberWorkload.has(memberId)) {
            memberWorkload.set(memberId, {
              id: assignment.member.id,
              name: assignment.member.name,
              email: assignment.member.email,
              department: assignment.member.department?.name ?? null,
              totalAssignments: 0,
              byRole: {
                responsible: 0,
                accountable: 0,
                consulted: 0,
                informed: 0,
              },
              byMatrix: [],
              estimatedHours: null,
            });
          }

          const memberData = memberWorkload.get(memberId)!;
          memberData.totalAssignments++;

          // Update role counts
          const role = assignment.raciRole.toLowerCase() as 'responsible' | 'accountable' | 'consulted' | 'informed';
          memberData.byRole[role]++;

          // Update matrix breakdown
          let matrixEntry = memberData.byMatrix.find((m) => m.matrixId === matrix.id);
          if (!matrixEntry) {
            matrixEntry = {
              matrixId: matrix.id,
              matrixName: matrix.name,
              projectName: matrix.project.name,
              assignmentCount: 0,
            };
            memberData.byMatrix.push(matrixEntry);
          }
          matrixEntry.assignmentCount++;
        });
      });
    });

    const members = Array.from(memberWorkload.values());
    const totalAssignments = members.reduce((sum, m) => sum + m.totalAssignments, 0);
    const mostLoadedMember = members.reduce((max, m) =>
      m.totalAssignments > max.totalAssignments ? m : max
    , members[0] ?? { name: 'N/A', totalAssignments: 0 });

    return {
      organizationId,
      dateRange: dateRange ?? {
        start: new Date(0),
        end: new Date(),
      },
      members,
      summary: {
        totalMembers: members.length,
        totalAssignments,
        averageAssignmentsPerMember: members.length > 0 ? totalAssignments / members.length : 0,
        mostLoadedMember: {
          name: mostLoadedMember.name,
          assignmentCount: mostLoadedMember.totalAssignments,
        },
      },
    };
  }
}
