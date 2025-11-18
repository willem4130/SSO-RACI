// Permission and Authorization Types

import type { MemberRole } from './raci'

export interface PermissionContext {
  organizationId: string
  userId: string
  memberRole: MemberRole
}

export interface ResourcePermission {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canShare: boolean
  canManageMembers: boolean
}

export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
}

export function hasMinimumRole(userRole: MemberRole, requiredRole: MemberRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function getOrganizationPermissions(role: MemberRole): ResourcePermission {
  switch (role) {
    case 'OWNER':
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        canManageMembers: true,
      }
    case 'ADMIN':
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
        canManageMembers: true,
      }
    case 'MEMBER':
      return {
        canView: true,
        canEdit: true,
        canDelete: false,
        canShare: true,
        canManageMembers: false,
      }
    case 'VIEWER':
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
        canManageMembers: false,
      }
  }
}
