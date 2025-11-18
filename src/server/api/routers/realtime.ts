/**
 * Real-time tRPC Router
 * Handles presence, activities, and real-time notifications
 */

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { presenceService } from '@/server/services/realtime/presence'
import { realtimeEventService } from '@/server/services/realtime/events'

export const realtimeRouter = createTRPCRouter({
  /**
   * Get current presence for a matrix
   */
  getPresence: protectedProcedure
    .input(z.object({ matrixId: z.string() }))
    .query(async ({ input }) => {
      const users = presenceService.getPresence(input.matrixId)
      return { users }
    }),

  /**
   * Get recent activity for a matrix
   */
  getActivity: protectedProcedure
    .input(
      z.object({
        matrixId: z.string(),
        organizationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db.activityLog.findMany({
        where: {
          matrixId: input.matrixId,
          organizationId: input.organizationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
      })

      return activities
    }),

  /**
   * Log a new activity and broadcast it
   */
  logActivity: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        matrixId: z.string(),
        action: z.string(),
        targetUser: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create activity log
      const activity = await ctx.db.activityLog.create({
        data: {
          organizationId: input.organizationId,
          matrixId: input.matrixId,
          userId: ctx.session.user.id,
          action: input.action,
          targetUser: input.targetUser,
          metadata: input.metadata ? (JSON.stringify(input.metadata) as string) : null,
        },
      })

      // Broadcast real-time event
      realtimeEventService.broadcast({
        type: 'activity',
        matrixId: input.matrixId,
        userId: ctx.session.user.id,
        data: {
          id: activity.id,
          action: input.action,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name,
          targetUser: input.targetUser,
          metadata: input.metadata,
          createdAt: activity.createdAt,
        },
        timestamp: Date.now(),
      })

      return activity
    }),

  /**
   * Broadcast a matrix update event
   */
  broadcastMatrixUpdate: protectedProcedure
    .input(
      z.object({
        matrixId: z.string(),
        updateType: z.enum(['task_created', 'task_updated', 'task_deleted', 'task_reordered']),
        data: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Broadcast real-time event
      realtimeEventService.broadcast(
        {
          type: 'matrix_update',
          matrixId: input.matrixId,
          userId: ctx.session.user.id,
          data: {
            updateType: input.updateType,
            ...input.data,
          },
          timestamp: Date.now(),
        },
        ctx.session.user.id // Exclude sender
      )

      return { success: true }
    }),

  /**
   * Broadcast an assignment change
   */
  broadcastAssignment: protectedProcedure
    .input(
      z.object({
        matrixId: z.string(),
        taskId: z.string(),
        memberId: z.string(),
        raciRole: z.enum(['RESPONSIBLE', 'ACCOUNTABLE', 'CONSULTED', 'INFORMED']),
        action: z.enum(['added', 'removed']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      realtimeEventService.broadcast(
        {
          type: 'assignment',
          matrixId: input.matrixId,
          userId: ctx.session.user.id,
          data: {
            taskId: input.taskId,
            memberId: input.memberId,
            raciRole: input.raciRole,
            action: input.action,
          },
          timestamp: Date.now(),
        },
        ctx.session.user.id
      )

      return { success: true }
    }),

  /**
   * Get real-time statistics
   */
  getStats: protectedProcedure.query(() => {
    const activeMatrices = realtimeEventService.getActiveMatrices()
    const stats = activeMatrices.map(matrixId => ({
      matrixId,
      listeners: realtimeEventService.getListenerCount(matrixId),
      viewers: presenceService.getPresence(matrixId).length,
    }))

    return {
      totalActiveMatrices: activeMatrices.length,
      matrices: stats,
    }
  }),
})
