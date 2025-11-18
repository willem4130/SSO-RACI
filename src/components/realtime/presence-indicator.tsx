/**
 * Presence Indicator Component
 * Shows who's currently viewing the matrix
 */

'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Users } from 'lucide-react'
import type { PresenceUser } from '@/hooks/use-realtime'

interface PresenceIndicatorProps {
  users: PresenceUser[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
}

export function PresenceIndicator({
  users,
  maxDisplay = 5,
  size = 'md',
  className = '',
}: PresenceIndicatorProps) {
  if (users.length === 0) {
    return null
  }

  const displayUsers = users.slice(0, maxDisplay)
  const remainingCount = Math.max(0, users.length - maxDisplay)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getColorClass = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500',
    ]
    return colors[index % colors.length]
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <Users className="h-4 w-4 text-muted-foreground" />

        <div className="flex -space-x-2">
          {displayUsers.map((user, index) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger asChild>
                <Avatar className={`${sizeClasses[size]} border-2 border-background ring-2 ring-background`}>
                  <AvatarFallback className={getColorClass(index)}>
                    {getInitials(user.userName)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{user.userName}</p>
                <p className="text-xs text-muted-foreground">Currently viewing</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className={`${sizeClasses[size]} border-2 border-background`}>
                  <AvatarFallback className="bg-muted">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {remainingCount} more {remainingCount === 1 ? 'viewer' : 'viewers'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <span className="text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? 'viewer' : 'viewers'}
        </span>
      </div>
    </TooltipProvider>
  )
}
