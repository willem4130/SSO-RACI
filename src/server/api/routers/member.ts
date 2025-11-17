import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

export const memberRouter = createTRPCRouter({
  // List members by organization
  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const members = await ctx.db.member.findMany({
        where: {
          organizationId: input.organizationId,
          organization: {
            members: {
              some: { userId: ctx.session.user.id },
            },
          },
        },
        include: {
          user: { select: { name: true, email: true } },
          department: true,
        },
        orderBy: { joinedAt: 'desc' },
      });
      return members;
    }),

  // Add member to organization
  add: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
        departmentId: z.string().optional(),
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
      });

      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Get user details
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { name: true, email: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const member = await ctx.db.member.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          email: user.email,
          name: user.name ?? user.email,
          role: input.role,
          departmentId: input.departmentId,
        },
        include: {
          user: { select: { name: true, email: true } },
          department: true,
        },
      });

      return member;
    }),

  // Update member role
  updateRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
        departmentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.member.findUnique({
        where: { id: input.memberId },
        include: { organization: true },
      });

      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Check permission
      const hasPermission = await ctx.db.member.findFirst({
        where: {
          organizationId: member.organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return await ctx.db.member.update({
        where: { id: input.memberId },
        data: {
          role: input.role,
          departmentId: input.departmentId,
        },
        include: {
          user: { select: { name: true, email: true } },
          department: true,
        },
      });
    }),

  // Remove member
  remove: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.member.findUnique({
        where: { id: input.memberId },
      });

      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Check permission
      const hasPermission = await ctx.db.member.findFirst({
        where: {
          organizationId: member.organizationId,
          userId: ctx.session.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.db.member.delete({
        where: { id: input.memberId },
      });

      return { success: true };
    }),
});
