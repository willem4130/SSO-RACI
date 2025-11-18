// Organization Router - Multi-tenant management

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { getUserOrganizations, verifyOrganizationAccess, verifyMinimumRole } from '@/lib/tenant'
import { TRPCError } from '@trpc/server'

export const organizationRouter = createTRPCRouter({
  // Get all organizations for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserOrganizations(ctx.db, ctx.session.user.id)
  }),

  // Get single organization by ID
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    await verifyOrganizationAccess(ctx.db, input.id, ctx.session.user.id)

    return ctx.db.organization.findUnique({
      where: { id: input.id },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
            matrices: true,
          },
        },
      },
    })
  }),

  // Create new organization
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z
          .string()
          .min(1)
          .max(50)
          .regex(/^[a-z0-9-]+$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug is unique
      const existing = await ctx.db.organization.findUnique({
        where: { slug: input.slug },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Organization slug already exists',
        })
      }

      // Create organization
      const organization = await ctx.db.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          ownerId: ctx.session.user.id,
        },
      })

      // Create owner membership
      await ctx.db.member.create({
        data: {
          organizationId: organization.id,
          userId: ctx.session.user.id,
          email: ctx.session.user.email!,
          name: ctx.session.user.name || 'Unknown',
          role: 'OWNER',
          status: 'ACTIVE',
        },
      })

      return organization
    }),

  // Update organization
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        settings: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMinimumRole(ctx.db, input.id, ctx.session.user.id, 'ADMIN')

      return ctx.db.organization.update({
        where: { id: input.id },
        data: {
          name: input.name,
          settings: input.settings ? JSON.stringify(input.settings) : undefined,
        },
      })
    }),

  // Archive organization (soft delete)
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyMinimumRole(ctx.db, input.id, ctx.session.user.id, 'OWNER')

      return ctx.db.organization.update({
        where: { id: input.id },
        data: { archivedAt: new Date() },
      })
    }),

  // Restore archived organization
  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyMinimumRole(ctx.db, input.id, ctx.session.user.id, 'OWNER')

      return ctx.db.organization.update({
        where: { id: input.id },
        data: { archivedAt: null },
      })
    }),

  // Get organization statistics
  getStats: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    await verifyOrganizationAccess(ctx.db, input.id, ctx.session.user.id)

    const [projects, matrices, members, departments] = await Promise.all([
      ctx.db.project.count({
        where: { organizationId: input.id, deletedAt: null },
      }),
      ctx.db.rACIMatrix.count({
        where: { organizationId: input.id, deletedAt: null },
      }),
      ctx.db.member.count({
        where: { organizationId: input.id, status: 'ACTIVE' },
      }),
      ctx.db.department.count({
        where: { organizationId: input.id, archivedAt: null },
      }),
    ])

    return {
      projects,
      matrices,
      members,
      departments,
    }
  }),
})
