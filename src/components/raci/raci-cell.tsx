'use client'

import { useState } from 'react'
import { RaciRole } from '@prisma/client'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RaciCellProps {
  taskId: string
  memberId: string
  currentRole: RaciRole | null
  assignmentId?: string
  onRoleChange: (role: RaciRole | null) => void
  disabled?: boolean
}

const roleColors: Record<RaciRole, string> = {
  RESPONSIBLE: 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200',
  ACCOUNTABLE: 'bg-green-100 text-green-900 border-green-300 hover:bg-green-200',
  CONSULTED: 'bg-yellow-100 text-yellow-900 border-yellow-300 hover:bg-yellow-200',
  INFORMED: 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200',
}

const roleLabels: Record<RaciRole, string> = {
  RESPONSIBLE: 'R',
  ACCOUNTABLE: 'A',
  CONSULTED: 'C',
  INFORMED: 'I',
}

const roleNames: Record<RaciRole, string> = {
  RESPONSIBLE: 'Responsible',
  ACCOUNTABLE: 'Accountable',
  CONSULTED: 'Consulted',
  INFORMED: 'Informed',
}

export function RaciCell({
  taskId,
  memberId,
  currentRole,
  assignmentId,
  onRoleChange,
  disabled = false,
}: RaciCellProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleRoleSelect = (role: RaciRole | null) => {
    onRoleChange(role)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          'h-12 w-full border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500',
          'flex items-center justify-center font-semibold text-sm',
          currentRole ? roleColors[currentRole] : 'bg-gray-50 hover:bg-gray-100 border-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {currentRole ? roleLabels[currentRole] : ''}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        {Object.values(RaciRole).map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => handleRoleSelect(role)}
            className={cn('cursor-pointer', currentRole === role && 'bg-gray-100')}
          >
            <span className={cn('mr-2 px-2 py-1 rounded font-semibold text-xs', roleColors[role])}>
              {roleLabels[role]}
            </span>
            {roleNames[role]}
          </DropdownMenuItem>
        ))}
        {currentRole && (
          <>
            <DropdownMenuItem
              onClick={() => handleRoleSelect(null)}
              className="cursor-pointer text-red-600"
            >
              Clear Assignment
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
