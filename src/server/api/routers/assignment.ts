// Assignment Router - RACI role assignments

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { verifyOrganizationAccess } from '@/lib/tenant'
import { validateAssignment } from '@/server/services/matrix/validation'

export const assignmentRouter = createTRPCRouter({
  // Create new assignment
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        taskId: z.string(),
        memberId: z.string(),
        raciRole: z.enum(['RESPONSIBLE', 'ACCOUNTABLE', 'CONSULTED', 'INFORMED']),
        notes: z.string().optional(),
        workload: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await verifyOrganizationAccess(
        ctx.db,
        input.organizationId,
        ctx.session.user.id
      )

      // Validate assignment before creating
      const validation = await validateAssignment(
        ctx.db,
        input.taskId,
        input.memberId,
        input.raciRole
      )

      if (!validation.valid) {
        throw new Error(validation.error)
      }

      const assignment = await ctx.db.assignment.create({
        data: {
          taskId: input.taskId,
          memberId: input.memberId,
          raciRole: input.raciRole,
          assignedBy: member.memberId,
          notes: input.notes,
          workload: input.workload,
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          task: {
            select: {
              id: true,
              name: true,
              matrix: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      // Create activity log
      await ctx.db.activityLog.create({
        data: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          action: `assigned_${input.raciRole.toLowerCase()}`,
          targetUser: input.memberId,
          metadata: JSON.stringify({
            taskId: input.taskId,
            taskName: assignment.task.name,
          }),
        },
      })

      return assignment
    }),

  // Update assignment
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        organizationId: z.string(),
        notes: z.string().optional(),
        workload: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)

      return ctx.db.assignment.update({
        where: { id: input.id },
        data: {
          notes: input.notes,
          workload: input.workload,
        },
      })
    }),

  // Delete assignment
  delete: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)

      return ctx.db.assignment.delete({
        where: { id: input.id },
      })
    }),

  // Get assignments for a specific member
  getByMember: protectedProcedure
    .input(z.object({ memberId: z.string(), organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)

      return ctx.db.assignment.findMany({
        where: {
          memberId: input.memberId,
          task: {
            archivedAt: null,
            matrix: {
              deletedAt: null,
            },
          },
        },
        include: {
          task: {
            select: {
              id: true,
              name: true,
              status: true,
              priority: true,
              dueDate: true,
              matrix: {
                select: {
                  id: true,
                  name: true,
                  project: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          assignedAt: 'desc',
        },
      })
    }),
})
