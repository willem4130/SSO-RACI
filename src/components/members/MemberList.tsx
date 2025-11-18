'use client'

import { useState } from 'react'
import { api } from '@/trpc/react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MoreVertical, UserPlus, Mail, Shield, Eye, Users } from 'lucide-react'
import { toast } from 'sonner'

interface MemberListProps {
  organizationId: string
}

const roleIcons = {
  OWNER: Shield,
  ADMIN: Shield,
  MEMBER: Users,
  VIEWER: Eye,
}

const roleBadgeVariant = {
  OWNER: 'default',
  ADMIN: 'secondary',
  MEMBER: 'outline',
  VIEWER: 'outline',
} as const

const statusBadgeVariant = {
  ACTIVE: 'default',
  INVITED: 'secondary',
  SUSPENDED: 'destructive',
} as const

export function MemberList({ organizationId }: MemberListProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER')
  const [editRole, setEditRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER')

  const {
    data: members,
    isLoading,
    refetch,
  } = api.member.listByOrganization.useQuery({
    organizationId,
  })

  const inviteMutation = api.member.invite.useMutation({
    onSuccess: () => {
      toast.success('Member invited successfully')
      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('MEMBER')
      refetch()
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to invite member')
    },
  })

  const updateRoleMutation = api.member.updateRole.useMutation({
    onSuccess: () => {
      toast.success('Member role updated successfully')
      setEditingMember(null)
      refetch()
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update member role')
    },
  })

  const removeMutation = api.member.remove.useMutation({
    onSuccess: () => {
      toast.success('Member removed successfully')
      refetch()
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to remove member')
    },
  })

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address')
      return
    }
    inviteMutation.mutate({
      organizationId,
      email: inviteEmail,
      role: inviteRole,
    })
  }

  const handleUpdateRole = (memberId: string) => {
    updateRoleMutation.mutate({
      memberId,
      role: editRole,
    })
  }

  const handleRemove = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMutation.mutate({ memberId })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading members...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Members</h2>
          <p className="text-muted-foreground">Manage organization members and their roles</p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map(
              (member: {
                id: string
                name: string
                email: string
                role: string
                status: string
                joinedAt: Date
                department?: { name: string } | null
              }) => {
                const RoleIcon = roleIcons[member.role as keyof typeof roleIcons]
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={roleBadgeVariant[member.role as keyof typeof roleBadgeVariant]}
                        className="flex items-center gap-1 w-fit"
                      >
                        <RoleIcon className="h-3 w-3" />
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.department?.name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusBadgeVariant[member.status as keyof typeof statusBadgeVariant]
                        }
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMember(member.id)
                              setEditRole(member.role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER')
                            }}
                          >
                            Edit Role
                          </DropdownMenuItem>
                          {member.status === 'INVITED' && (
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Invitation
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemove(member.id)}
                          >
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              }
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>Send an invitation to join your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as 'ADMIN' | 'MEMBER' | 'VIEWER')}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {inviteRole === 'ADMIN' && 'Can manage members and settings'}
                {inviteRole === 'MEMBER' && 'Can create and edit projects'}
                {inviteRole === 'VIEWER' && 'Can only view projects'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog
        open={editingMember !== null}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Role</DialogTitle>
            <DialogDescription>Change the role and permissions for this member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editRole}
                onValueChange={(value) =>
                  setEditRole(value as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER')
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingMember && handleUpdateRole(editingMember)}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
