/**
 * Activity Feed Component
 * Shows recent matrix activity in real-time
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/trpc/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Activity,
  UserPlus,
  Edit3,
  Trash2,
  CheckCircle2,
  ArrowUpDown,
  MessageSquare,
  Users,
} from 'lucide-react'
import type { RealtimeEvent } from '@/hooks/use-realtime'

interface ActivityFeedProps {
  matrixId: string
  limit?: number
  onRealtimeEvent?: (event: RealtimeEvent) => void
  className?: string
}

interface ActivityItem {
  id: string
  action: string
  userId: string
  userName?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

const actionIcons = {
  task_created: Edit3,
  task_updated: Edit3,
  task_deleted: Trash2,
  task_reordered: ArrowUpDown,
  task_completed: CheckCircle2,
  assignment_added: UserPlus,
  assignment_removed: UserPlus,
  comment_added: MessageSquare,
  member_added: Users,
  matrix_updated: Edit3,
}

const actionLabels: Record<string, string> = {
  task_created: 'created a task',
  task_updated: 'updated a task',
  task_deleted: 'deleted a task',
  task_reordered: 'reordered tasks',
  task_completed: 'completed a task',
  assignment_added: 'assigned a role',
  assignment_removed: 'removed an assignment',
  comment_added: 'added a comment',
  member_added: 'added a member',
  matrix_updated: 'updated the matrix',
}

const actionColors: Record<string, string> = {
  task_created: 'text-green-600',
  task_updated: 'text-blue-600',
  task_deleted: 'text-red-600',
  task_reordered: 'text-purple-600',
  task_completed: 'text-emerald-600',
  assignment_added: 'text-indigo-600',
  assignment_removed: 'text-orange-600',
  comment_added: 'text-cyan-600',
  member_added: 'text-pink-600',
  matrix_updated: 'text-violet-600',
}

export function ActivityFeed({ matrixId, limit = 50, className = '' }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // Fetch initial activities
  const params = useParams()
  const orgId = params.id as string

  const { data: initialActivities } = api.realtime.getActivity.useQuery({
    matrixId,
    organizationId: orgId,
    limit,
  })

  // Set initial data
  useEffect(() => {
    if (initialActivities) {
      setActivities(
        initialActivities.map(a => ({
          id: a.id,
          action: a.action,
          userId: a.userId,
          metadata: a.metadata ? (JSON.parse(a.metadata) as Record<string, unknown>) : undefined,
          createdAt: a.createdAt,
        }))
      )
    }
  }, [initialActivities])

  const getInitials = (name: string = 'U') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getActivityIcon = (action: string) => {
    const Icon = actionIcons[action as keyof typeof actionIcons] || Activity
    return <Icon className="h-4 w-4" />
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>Recent changes and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(activity.userName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName || 'Someone'}</span>{' '}
                        <span className="text-muted-foreground">
                          {actionLabels[activity.action] || activity.action}
                        </span>
                      </p>
                      <Badge
                        variant="outline"
                        className={`h-5 ${actionColors[activity.action] || 'text-foreground'}`}
                      >
                        {getActivityIcon(activity.action)}
                      </Badge>
                    </div>

                    {activity.metadata && (
                      <p className="text-xs text-muted-foreground">
                        {activity.metadata.taskName as string}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {getTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
