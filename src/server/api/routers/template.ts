import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { predefinedTemplates } from '@/lib/templates/predefined-templates'

export const templateRouter = createTRPCRouter({
  // List all predefined templates
  listPredefined: protectedProcedure.query(async () => {
    return predefinedTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      taskCount: template.tasks.length,
      memberRoleCount: template.memberRoles.length,
    }))
  }),

  // Get template details by ID
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const template = predefinedTemplates.find((t) => t.id === input.id)
    if (!template) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Template not found',
      })
    }
    return template
  }),

  // Create matrix from template
  createFromTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        matrixName: z.string().min(1),
        projectId: z.string(),
        memberMapping: z.record(z.string(), z.string()), // Maps role name to member ID
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = predefinedTemplates.find((t) => t.id === input.templateId)
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        })
      }

      // Verify project access
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          organization: {
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      })

      if (!project) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Project not found or access denied',
        })
      }

      // Get member ID for createdBy
      const member = await ctx.db.member.findFirst({
        where: {
          organizationId: project.organizationId,
          userId: ctx.session.user.id,
        },
      })

      if (!member) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Create matrix with tasks and assignments
      const matrix = await ctx.db.rACIMatrix.create({
        data: {
          name: input.matrixName,
          description: template.description,
          organizationId: project.organizationId,
          projectId: input.projectId,
          createdById: member.id,
          tasks: {
            create: template.tasks.map((task) => ({
              name: task.name,
              description: task.description,
              orderIndex: task.order,
              assignments: {
                create: task.roles
                  .map((role) => {
                    const memberId = input.memberMapping[role.memberRole]
                    if (!memberId) return null
                    return {
                      memberId,
                      raciRole: role.raciRole,
                      assignedBy: member.id,
                    }
                  })
                  .filter((a) => a !== null),
              },
            })),
          },
        },
        include: {
          tasks: {
            include: {
              assignments: {
                include: {
                  member: true,
                },
              },
            },
          },
        },
      })

      return matrix
    }),

  // Save current matrix as custom template
  saveAsTemplate: protectedProcedure
    .input(
      z.object({
        matrixId: z.string(),
        templateName: z.string().min(1),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get matrix with full data
      const matrix = await ctx.db.rACIMatrix.findFirst({
        where: {
          id: input.matrixId,
          project: {
            organization: {
              members: {
                some: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
        include: {
          tasks: {
            include: {
              assignments: {
                include: {
                  member: true,
                },
              },
            },
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
      })

      if (!matrix) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Matrix not found or access denied',
        })
      }

      // Get member for createdById
      const member = await ctx.db.member.findFirst({
        where: {
          organizationId: matrix.organizationId,
          userId: ctx.session.user.id,
        },
      })

      if (!member) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // Create custom template with structure as JSON string
      const templateStructure = {
        tasks: matrix.tasks.map((task: any) => ({
          name: task.name,
          description: task.description,
          order: task.orderIndex,
          roles: task.assignments.map((a: any) => ({
            memberRole: a.member.name,
            raciRole: a.raciRole,
          })),
        })),
        memberRoles: Array.from(
          new Set(matrix.tasks.flatMap((t: any) => t.assignments.map((a: any) => a.member.name)))
        ),
      }

      const template = await ctx.db.template.create({
        data: {
          name: input.templateName,
          description: input.description ?? matrix.description ?? '',
          category: 'CUSTOM',
          industry: 'General',
          language: 'en',
          isPublic: input.isPublic,
          createdById: member.id,
          organizationId: matrix.organizationId,
          structure: JSON.stringify(templateStructure),
        },
      })

      return template
    }),
})
