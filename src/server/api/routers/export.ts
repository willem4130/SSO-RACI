// Export Router - PDF, Excel, CSV generation
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { verifyOrganizationAccess } from '@/lib/tenant';
import { exportService } from '@/server/services/export';
import { db } from '@/server/db';

export const exportRouter = createTRPCRouter({
  /**
   * Export a matrix in specified format
   */
  exportMatrix: protectedProcedure
    .input(
      z.object({
        matrixId: z.string(),
        format: z.enum(['pdf', 'excel', 'csv']),
        includeComments: z.boolean().default(false),
        includeAnalytics: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to the matrix
      const matrix = await ctx.db.rACIMatrix.findUnique({
        where: { id: input.matrixId },
        select: { organizationId: true },
      });

      if (!matrix) {
        throw new Error('Matrix not found');
      }

      await verifyOrganizationAccess(ctx.db, matrix.organizationId, ctx.session.user.id);

      // Generate export
      const result = await exportService.exportMatrix(input.matrixId, input.format, {
        includeComments: input.includeComments,
        includeAnalytics: input.includeAnalytics,
      });

      // Log export action
      await ctx.db.auditLog.create({
        data: {
          organizationId: matrix.organizationId,
          userId: ctx.session.user.id,
          resourceType: 'MATRIX',
          resourceId: input.matrixId,
          action: 'EXPORTED',
          changes: JSON.stringify({ format: input.format }),
        },
      });

      // Return base64 encoded buffer and metadata
      return {
        data: result.buffer.toString('base64'),
        filename: result.filename,
        mimeType: result.mimeType,
      };
    }),

  /**
   * Export workload report for organization
   */
  exportWorkloadReport: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        format: z.enum(['excel', 'csv']),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);

      const dateRange =
        input.startDate && input.endDate
          ? { start: input.startDate, end: input.endDate }
          : undefined;

      const result = await exportService.exportWorkloadReport(
        input.organizationId,
        input.format,
        dateRange
      );

      // Log export action
      await ctx.db.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          resourceType: 'ORGANIZATION',
          resourceId: input.organizationId,
          action: 'EXPORTED',
          changes: JSON.stringify({ type: 'workload_report', format: input.format }),
        },
      });

      return {
        data: result.buffer.toString('base64'),
        filename: result.filename,
        mimeType: result.mimeType,
      };
    }),

  /**
   * Get export history for an organization
   */
  getExportHistory: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);

      const exports = await ctx.db.auditLog.findMany({
        where: {
          organizationId: input.organizationId,
          action: 'EXPORTED',
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: input.limit,
      });

      return exports.map((log) => ({
        id: log.id,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        userId: log.userId,
        timestamp: log.timestamp,
        details: log.changes ? JSON.parse(log.changes) : {},
      }));
    }),

  /**
   * Preview export data (for UI preview before download)
   */
  previewExportData: protectedProcedure
    .input(
      z.object({
        matrixId: z.string(),
        includeComments: z.boolean().default(false),
        includeAnalytics: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const matrix = await db.rACIMatrix.findUnique({
        where: { id: input.matrixId },
        select: {
          organizationId: true,
          name: true,
          description: true,
          _count: {
            select: {
              tasks: true,
              comments: true,
            },
          },
        },
      });

      if (!matrix) {
        throw new Error('Matrix not found');
      }

      await verifyOrganizationAccess(ctx.db, matrix.organizationId, ctx.session.user.id);

      return {
        matrixName: matrix.name,
        matrixDescription: matrix.description,
        taskCount: matrix._count.tasks,
        commentCount: matrix._count.comments,
        willIncludeComments: input.includeComments && matrix._count.comments > 0,
        willIncludeAnalytics: input.includeAnalytics,
      };
    }),
});
