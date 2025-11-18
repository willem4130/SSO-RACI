import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

export const departmentRouter = createTRPCRouter({
  // List departments by organization
  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const departments = await ctx.db.department.findMany({
        where: {
          organizationId: input.organizationId,
          organization: {
            members: {
              some: { userId: ctx.session.user.id },
            },
          },
        },
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })
      return departments
    }),

  // Create department
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        organizationId: z.string(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check permission
      const hasPermission = await ctx.db.member.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      })

      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const department = await ctx.db.department.create({
        data: {
          name: input.name,
          organizationId: input.organizationId,
          code: input.name.toLowerCase().replace(/\s+/g, '-'), // Generate code from name
          parentId: input.parentId,
        },
      })

      return department
    }),

  // Update department
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, parentId } = input
      const data: { name?: string; code?: string; parentId?: string } = {}

      if (name) {
        data.name = name
        data.code = name.toLowerCase().replace(/\s+/g, '-')
      }
      if (parentId !== undefined) {
        data.parentId = parentId
      }

      // Verify access
      const department = await ctx.db.department.findFirst({
        where: {
          id,
          organization: {
            members: {
              some: {
                userId: ctx.session.user.id,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      })

      if (!department) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      return await ctx.db.department.update({
        where: { id },
        data,
      })
    }),

  // Delete department
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify access
      const department = await ctx.db.department.findFirst({
        where: {
          id: input.id,
          organization: {
            members: {
              some: {
                userId: ctx.session.user.id,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      })

      if (!department) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      await ctx.db.department.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
