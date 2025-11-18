// Comment Router - Comments and mentions on matrices and tasks

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { verifyOrganizationAccess, verifyResourceOwnership } from '@/lib/tenant'
import { realtimeEventService } from '@/server/services/realtime/events'

export const commentRouter = createTRPCRouter({
  // Create new comment
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        matrixId: z.string().optional(),
        taskId: z.string().optional(),
        content: z.string().min(1).max(5000),
        mentions: z.array(z.string()).optional(), // Array of member IDs
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify organization access
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)

      // Get the member for this user in this organization
      const member = await ctx.db.member.findFirst({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
        },
      })

      if (!member) throw new Error('Member not found')

      // Verify matrix or task access if provided
      if (input.matrixId) {
        await verifyResourceOwnership(ctx.db, 'matrix', input.matrixId, input.organizationId)
      }

      if (input.taskId) {
        const task = await ctx.db.task.findUnique({
          where: { id: input.taskId },
          include: { matrix: true },
        })
        if (!task) throw new Error('Task not found')
        await verifyResourceOwnership(
          ctx.db,
          'matrix',
          task.matrixId,
          input.organizationId
        )
      }

      // Create comment
      const comment = await ctx.db.comment.create({
        data: {
          matrixId: input.matrixId,
          taskId: input.taskId,
          authorId: member.id,
          content: input.content,
          mentions: input.mentions ? JSON.stringify(input.mentions) : null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              userId: true,
            },
          },
        },
      })

      // Broadcast real-time event if matrixId is provided
      if (input.matrixId) {
        realtimeEventService.broadcast(
          {
            type: 'comment',
            matrixId: input.matrixId,
            userId: ctx.session.user.id,
            data: {
              commentId: comment.id,
              action: 'created',
              content: comment.content,
              authorName: member.name,
              taskId: input.taskId,
            },
            timestamp: Date.now(),
          },
          ctx.session.user.id // Exclude sender
        )

        // Log activity
        await ctx.db.activityLog.create({
          data: {
            organizationId: input.organizationId,
            matrixId: input.matrixId,
            userId: ctx.session.user.id,
            action: 'comment_added',
            metadata: JSON.stringify({ commentId: comment.id }),
          },
        })
      }

      return comment
    }),

  // List comments for matrix or task
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        matrixId: z.string().optional(),
        taskId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)

      // Verify matrix access if provided
      if (input.matrixId) {
        await verifyResourceOwnership(ctx.db, 'matrix', input.matrixId, input.organizationId)
      }

      // Verify task access if provided
      if (input.taskId) {
        const task = await ctx.db.task.findUnique({
          where: { id: input.taskId },
          include: { matrix: true },
        })
        if (!task) throw new Error('Task not found')
        await verifyResourceOwnership(
          ctx.db,
          'matrix',
          task.matrixId,
          input.organizationId
        )
      }

      const comments = await ctx.db.comment.findMany({
        where: {
          matrixId: input.matrixId,
          taskId: input.taskId,
          deletedAt: null,
          ...(input.cursor ? { id: { lt: input.cursor } } : {}),
        },
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              userId: true,
            },
          },
        },
      })

      // Parse mentions from JSON string
      const parsedComments = comments.map((comment) => ({
        ...comment,
        mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
      }))

      return {
        comments: parsedComments,
        nextCursor:
          comments.length === input.limit ? comments[comments.length - 1]?.id : undefined,
      }
    }),

  // Update comment
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        organizationId: z.string(),
        content: z.string().min(1).max(5000),
        mentions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)

      // Get the comment and verify ownership
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
        include: { author: true },
      })

      if (!comment) throw new Error('Comment not found')

      // Only author can edit their comment
      if (comment.author.userId !== ctx.session.user.id) {
        throw new Error('Unauthorized: You can only edit your own comments')
      }

      return ctx.db.comment.update({
        where: { id: input.id },
        data: {
          content: input.content,
          mentions: input.mentions ? JSON.stringify(input.mentions) : null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              userId: true,
            },
          },
        },
      })
    }),

  // Delete comment (soft delete)
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        organizationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)

      // Get the comment and verify ownership
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
        include: { author: true },
      })

      if (!comment) throw new Error('Comment not found')

      // Only author can delete their comment
      if (comment.author.userId !== ctx.session.user.id) {
        throw new Error('Unauthorized: You can only delete your own comments')
      }

      return ctx.db.comment.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      })
    }),

  // Get members for mention autocomplete
  getMentionableMembers: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        matrixId: z.string().optional(),
        query: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyOrganizationAccess(ctx.db, input.organizationId, ctx.session.user.id)

      // If matrixId provided, get members assigned to tasks in this matrix
      if (input.matrixId) {
        await verifyResourceOwnership(ctx.db, 'matrix', input.matrixId, input.organizationId)

        const members = await ctx.db.member.findMany({
          where: {
            organizationId: input.organizationId,
            status: 'ACTIVE',
            ...(input.query
              ? {
                  OR: [
                    { name: { contains: input.query } },
                    { email: { contains: input.query } },
                  ],
                }
              : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
          },
          take: 10,
        })

        return members
      }

      // Otherwise, get all organization members
      const members = await ctx.db.member.findMany({
        where: {
          organizationId: input.organizationId,
          status: 'ACTIVE',
          ...(input.query
            ? {
                OR: [
                  { name: { contains: input.query } },
                  { email: { contains: input.query } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          userId: true,
        },
        take: 10,
      })

      return members
    }),
})
