// Task Router - Task management within RACI matrices

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { verifyOrganizationAccess, verifyResourceOwnership } from '@/lib/tenant'

export const taskRouter = createTRPCRouter({
  // Create new task in matrix
  create: protectedProcedure
    .input(
      z.object({
        matrixId: z.string(),
        organizationId: z.string(),
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        parentTaskId: z.string().optional(),
        orderIndex: z.number().int().min(0),
        status: z
          .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD'])
          .default('NOT_STARTED'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)
      await verifyResourceOwnership(ctx.db, 'matrix', input.matrixId, input.organizationId)

      return ctx.db.task.create({
        data: {
          matrixId: input.matrixId,
          name: input.name,
          description: input.description,
          parentTaskId: input.parentTaskId,
          orderIndex: input.orderIndex,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate,
        },
      })
    }),

  // Update task
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        organizationId: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        status: z
          .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD'])
          .optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        dueDate: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: { matrix: true },
      })

      if (!task) throw new Error('Task not found')

      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)
      await verifyResourceOwnership(ctx.db, 'matrix', task.matrixId, input.organizationId)

      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate,
        },
      })
    }),

  // Reorder tasks (drag-drop)
  reorder: protectedProcedure
    .input(
      z.object({
        matrixId: z.string(),
        organizationId: z.string(),
        taskOrders: z.array(
          z.object({
            id: z.string(),
            orderIndex: z.number().int().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)
      await verifyResourceOwnership(ctx.db, 'matrix', input.matrixId, input.organizationId)

      // Update all task orders in a transaction
      const updates = input.taskOrders.map((item) =>
        ctx.db.task.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex },
        })
      )

      await ctx.db.$transaction(updates)

      return { success: true }
    }),

  // Delete task (soft delete by archiving)
  delete: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: { matrix: true },
      })

      if (!task) throw new Error('Task not found')

      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)
      await verifyResourceOwnership(ctx.db, 'matrix', task.matrixId, input.organizationId)

      return ctx.db.task.update({
        where: { id: input.id },
        data: { archivedAt: new Date() },
      })
    }),

  // Mark task as complete
  markComplete: protectedProcedure
    .input(z.object({ id: z.string(), organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: { matrix: true },
      })

      if (!task) throw new Error('Task not found')

      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)

      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    }),
})
