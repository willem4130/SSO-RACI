'use client'

import { CheckCircle2, Users, BarChart3, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickMetricsCardsProps {
  metrics: {
    totalTasks: number
    validTasks: number
    tasksCoverage: number // 0-1 (percentage)
    avgAssignmentsPerTask: number
    avgAssignmentsPerMember: number
  }
  errorCount?: number
  warningCount?: number
  className?: string
}

export function QuickMetricsCards({
  metrics,
  errorCount = 0,
  warningCount = 0,
  className,
}: QuickMetricsCardsProps) {
  const coveragePercent = Math.round(metrics.tasksCoverage * 100)

  const cards = [
    {
      label: 'Valid Tasks',
      value: `${metrics.validTasks}/${metrics.totalTasks}`,
      description: `${Math.round((metrics.validTasks / metrics.totalTasks) * 100)}% complete`,
      icon: CheckCircle2,
      color: metrics.validTasks === metrics.totalTasks ? 'text-green-600' : 'text-yellow-600',
      bgColor: metrics.validTasks === metrics.totalTasks ? 'bg-green-50' : 'bg-yellow-50',
    },
    {
      label: 'Coverage',
      value: `${coveragePercent}%`,
      description: 'Tasks with assignments',
      icon: BarChart3,
      color:
        coveragePercent >= 90
          ? 'text-green-600'
          : coveragePercent >= 70
            ? 'text-yellow-600'
            : 'text-orange-600',
      bgColor:
        coveragePercent >= 90
          ? 'bg-green-50'
          : coveragePercent >= 70
            ? 'bg-yellow-50'
            : 'bg-orange-50',
    },
    {
      label: 'Avg Assignments',
      value: metrics.avgAssignmentsPerTask.toFixed(1),
      description: 'Per task',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ]

  // Add error/warning card if there are issues
  if (errorCount > 0 || warningCount > 0) {
    cards.push({
      label: 'Issues',
      value: `${errorCount + warningCount}`,
      description: `${errorCount} errors, ${warningCount} warnings`,
      icon: AlertTriangle,
      color: errorCount > 0 ? 'text-red-600' : 'text-yellow-600',
      bgColor: errorCount > 0 ? 'bg-red-50' : 'bg-yellow-50',
    })
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="rounded-lg border bg-white p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">{card.label}</p>
                <p className="text-2xl font-bold tabular-nums mb-0.5">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
              <div className={cn('rounded-lg p-2', card.bgColor)}>
                <Icon className={cn('h-4 w-4', card.color)} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
