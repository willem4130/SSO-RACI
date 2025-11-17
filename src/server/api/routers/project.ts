import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const projectRouter = createTRPCRouter({
  // List projects by organization
  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const projects = await ctx.db.project.findMany({
        where: {
          organizationId: input.organizationId,
          organization: {
            members: {
              some: { userId: ctx.session.user.id },
            },
          },
        },
        include: {
          department: true,
          _count: { select: { matrices: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return projects;
    }),

  // Get project by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          organization: {
            members: {
              some: { userId: ctx.session.user.id },
            },
          },
        },
        include: {
          department: true,
          matrices: {
            include: {
              _count: { select: { tasks: true } },
            },
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return project;
    }),

  // Create project
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        organizationId: z.string(),
        departmentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify organization access and get member ID
      const member = await ctx.db.member.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
        },
      });

      if (!member) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          organizationId: input.organizationId,
          departmentId: input.departmentId,
          ownerId: member.id,
        },
        include: {
          department: true,
        },
      });

      return project;
    }),

  // Update project
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        departmentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify access
      const project = await ctx.db.project.findFirst({
        where: {
          id,
          organization: {
            members: {
              some: { userId: ctx.session.user.id },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return await ctx.db.project.update({
        where: { id },
        data,
        include: { department: true },
      });
    }),

  // Delete project
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify access and check if user is admin/owner
      const project = await ctx.db.project.findFirst({
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
      });

      if (!project) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db.project.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
