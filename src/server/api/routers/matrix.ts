// RACI Matrix Router - Core matrix management

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { verifyOrganizationAccess, verifyResourceOwnership } from "@/lib/tenant";
import {
  validateRACIMatrix,
  getValidationSummary,
  validateMatrixEnhanced,
  detectConflicts,
} from "@/server/services/matrix/validation";

export const matrixRouter = createTRPCRouter({
  // List all matrices in a project
  listByProject: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        projectId: z.string(),
        includeArchived: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);

      return ctx.db.rACIMatrix.findMany({
        where: {
          projectId: input.projectId,
          deletedAt: null,
          ...(input.includeArchived ? {} : { archivedAt: null }),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              comments: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }),

  // Get single matrix with full data
  getById: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);
      await verifyResourceOwnership(ctx.db, "matrix", input.id, input.organizationId);

      const matrix = await ctx.db.rACIMatrix.findUnique({
        where: { id: input.id },
        include: {
          project: {
            include: {
              department: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tasks: {
            where: { archivedAt: null },
            include: {
              assignments: {
                include: {
                  member: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                      department: {
                        select: {
                          id: true,
                          name: true,
                          code: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              orderIndex: "asc",
            },
          },
        },
      });

      if (!matrix) {
        throw new Error("Matrix not found");
      }

      return matrix;
    }),

  // Create new RACI matrix
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        projectId: z.string(),
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        templateId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await verifyOrganizationAccess(
        ctx.db,
        input.organizationId,
        ctx.session.user.id,
      );

      const matrix = await ctx.db.rACIMatrix.create({
        data: {
          organizationId: input.organizationId,
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          templateId: input.templateId,
          createdById: member.memberId,
        },
      });

      // Create audit log
      await ctx.db.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          resourceType: "matrix",
          resourceId: matrix.id,
          action: "CREATED",
        },
      });

      // If template provided, apply it
      if (input.templateId) {
        // TODO: Apply template logic will be implemented
      }

      return matrix;
    }),

  // Update matrix
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        organizationId: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);
      await verifyResourceOwnership(ctx.db, "matrix", input.id, input.organizationId);

      return ctx.db.rACIMatrix.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
      });
    }),

  // Archive matrix
  archive: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);
      await verifyResourceOwnership(ctx.db, "matrix", input.id, input.organizationId);

      return ctx.db.rACIMatrix.update({
        where: { id: input.id },
        data: { archivedAt: new Date() },
      });
    }),

  // Delete matrix (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);
      await verifyResourceOwnership(ctx.db, "matrix", input.id, input.organizationId);

      return ctx.db.rACIMatrix.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),

  // Validate matrix
  validate: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);
      await verifyResourceOwnership(ctx.db, "matrix", input.id, input.organizationId);

      return validateRACIMatrix(ctx.db, input.id);
    }),

  // Get validation summary
  getValidationSummary: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);
      await verifyResourceOwnership(ctx.db, "matrix", input.id, input.organizationId);

      return getValidationSummary(ctx.db, input.id);
    }),

  // Get all members for matrix (for assignment dropdowns)
  getMembers: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);

      return ctx.db.member.findMany({
        where: {
          organizationId: input.organizationId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });
    }),

  // ============================================================================
  // PHASE 1.2: ENHANCED VALIDATION ENDPOINTS
  // ============================================================================

  /**
   * Get enhanced validation with smart suggestions and health score
   */
  validateEnhanced: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);
      await verifyResourceOwnership(ctx.db, "matrix", input.id, input.organizationId);

      return validateMatrixEnhanced(ctx.db, input.id);
    }),

  /**
   * Detect RACI conflicts in the matrix
   */
  detectConflicts: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);
      await verifyResourceOwnership(ctx.db, "matrix", input.id, input.organizationId);

      return detectConflicts(ctx.db, input.id);
    }),

  /**
   * Get matrix health score only (lightweight endpoint)
   */
  getHealthScore: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id);
      await verifyResourceOwnership(ctx.db, "matrix", input.id, input.organizationId);

      const validation = await validateMatrixEnhanced(ctx.db, input.id);

      return {
        healthScore: validation.healthScore,
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        suggestionCount: validation.suggestions.length,
      };
    }),
});
