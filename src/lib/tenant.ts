// Multi-Tenant Utilities and Middleware

import { type PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type { MemberRole } from '@/types/raci'

export interface TenantContext {
  organizationId: string
  userId: string
  memberId: string
  memberRole: MemberRole
}

/**
 * Get organization membership for a user
 * Throws if user is not a member of the organization
 */
export async function getOrganizationMembership(
  db: PrismaClient,
  organizationId: string,
  userId: string
) {
  const member = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
      department: true,
    },
  })

  if (!member) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You are not a member of this organization',
    })
  }

  if (member.status !== 'ACTIVE') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Your membership is not active',
    })
  }

  return member
}

/**
 * Verify user has access to a specific organization
 */
export async function verifyOrganizationAccess(
  db: PrismaClient,
  organizationId: string,
  userId: string
): Promise<TenantContext> {
  const member = await getOrganizationMembership(db, organizationId, userId)

  return {
    organizationId,
    userId,
    memberId: member.id,
    memberRole: member.role as MemberRole,
  }
}

/**
 * Verify user has minimum role in organization
 */
export async function verifyMinimumRole(
  db: PrismaClient,
  organizationId: string,
  userId: string,
  minimumRole: MemberRole
) {
  const member = await getOrganizationMembership(db, organizationId, userId)

  const roleHierarchy: Record<MemberRole, number> = {
    OWNER: 4,
    ADMIN: 3,
    MEMBER: 2,
    VIEWER: 1,
  }

  if (roleHierarchy[member.role as MemberRole] < roleHierarchy[minimumRole]) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `This action requires ${minimumRole} role or higher`,
    })
  }

  return member
}

/**
 * Ensure a resource belongs to the specified organization (tenant isolation)
 */
export async function verifyResourceOwnership(
  db: PrismaClient,
  resourceType: 'project' | 'matrix' | 'template',
  resourceId: string,
  organizationId: string
) {
  let resource

  switch (resourceType) {
    case 'project':
      resource = await db.project.findUnique({
        where: { id: resourceId },
        select: { organizationId: true },
      })
      break
    case 'matrix':
      resource = await db.rACIMatrix.findUnique({
        where: { id: resourceId },
        select: { organizationId: true },
      })
      break
    case 'template':
      resource = await db.template.findUnique({
        where: { id: resourceId },
        select: { organizationId: true },
      })
      break
  }

  if (!resource) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `${resourceType} not found`,
    })
  }

  if (resource.organizationId !== organizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this resource',
    })
  }

  return true
}

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(db: PrismaClient, userId: string) {
  const memberships = await db.member.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      organization: true,
    },
    orderBy: {
      joinedAt: 'desc',
    },
  })

  return memberships.map((m) => ({
    ...m.organization,
    memberRole: m.role as MemberRole,
    memberId: m.id,
  }))
}
