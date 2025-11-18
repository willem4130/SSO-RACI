'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HealthScoreBadgeProps {
  score: number // 0-100
  showTrend?: boolean
  previousScore?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function HealthScoreBadge({
  score,
  showTrend = false,
  previousScore,
  size = 'md',
  className,
}: HealthScoreBadgeProps) {
  // Calculate score color and category
  const getScoreColor = (s: number): string => {
    if (s >= 90) return 'text-green-700 bg-green-50 border-green-200'
    if (s >= 70) return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    if (s >= 50) return 'text-orange-700 bg-orange-50 border-orange-200'
    return 'text-red-700 bg-red-50 border-red-200'
  }

  const getScoreLabel = (s: number): string => {
    if (s >= 90) return 'Excellent'
    if (s >= 70) return 'Good'
    if (s >= 50) return 'Fair'
    return 'Needs Work'
  }

  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  // Calculate trend
  let trendIcon = null
  if (showTrend && previousScore !== undefined) {
    const diff = score - previousScore
    if (diff > 0) {
      trendIcon = <TrendingUp className="h-3 w-3 text-green-600" />
    } else if (diff < 0) {
      trendIcon = <TrendingDown className="h-3 w-3 text-red-600" />
    } else {
      trendIcon = <Minus className="h-3 w-3 text-gray-400" />
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-semibold',
        scoreColor,
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-2xl font-bold tabular-nums">{score}</span>
        <span className="text-xs opacity-70">/100</span>
      </div>
      <div className="h-4 w-px bg-current opacity-20" />
      <span className="text-xs font-medium">{scoreLabel}</span>
      {trendIcon && (
        <>
          <div className="h-4 w-px bg-current opacity-20" />
          {trendIcon}
        </>
      )}
    </div>
  )
}
