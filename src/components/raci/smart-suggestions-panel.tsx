'use client'

import { Lightbulb, ArrowRight, Zap, BarChart2, FileText, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SmartSuggestion {
  taskId: string
  taskName: string
  type: 'OPTIMIZE' | 'REDISTRIBUTE' | 'SIMPLIFY' | 'CLARIFY'
  message: string
  action: string
  impact: 'high' | 'medium' | 'low'
}

interface SmartSuggestionsPanelProps {
  suggestions: SmartSuggestion[]
  onApplySuggestion?: (suggestion: SmartSuggestion) => void
  onDismissSuggestion?: (suggestion: SmartSuggestion) => void
  className?: string
}

export function SmartSuggestionsPanel({
  suggestions,
  onApplySuggestion,
  onDismissSuggestion,
  className,
}: SmartSuggestionsPanelProps) {
  if (suggestions.length === 0) {
    return (
      <div className={cn('rounded-lg border bg-white p-6 text-center', className)}>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-900">No suggestions</p>
          <p className="text-xs text-muted-foreground">Your matrix is well-optimized!</p>
        </div>
      </div>
    )
  }

  const getSuggestionIcon = (type: SmartSuggestion['type']) => {
    switch (type) {
      case 'OPTIMIZE':
        return Zap
      case 'REDISTRIBUTE':
        return BarChart2
      case 'SIMPLIFY':
        return FileText
      case 'CLARIFY':
        return Lightbulb
    }
  }

  const getSuggestionColor = (impact: SmartSuggestion['impact']) => {
    switch (impact) {
      case 'high':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          badge: 'bg-purple-100 text-purple-700',
        }
      case 'medium':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          badge: 'bg-blue-100 text-blue-700',
        }
      case 'low':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-700',
        }
    }
  }

  const getSuggestionTypeLabel = (type: SmartSuggestion['type']) => {
    switch (type) {
      case 'OPTIMIZE':
        return 'Optimize'
      case 'REDISTRIBUTE':
        return 'Redistribute'
      case 'SIMPLIFY':
        return 'Simplify'
      case 'CLARIFY':
        return 'Clarify'
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-purple-600" />
        <h3 className="font-semibold text-sm">Smart Suggestions ({suggestions.length})</h3>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const Icon = getSuggestionIcon(suggestion.type)
          const colors = getSuggestionColor(suggestion.impact)

          return (
            <div
              key={`${suggestion.taskId}-${index}`}
              className={cn(
                'rounded-lg border p-3 transition-all hover:shadow-sm',
                colors.bg,
                colors.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('rounded p-1.5', colors.badge)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn('text-xs font-semibold uppercase tracking-wide', colors.text)}
                    >
                      {getSuggestionTypeLabel(suggestion.type)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/60 font-medium">
                      {suggestion.impact} impact
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{suggestion.taskName}</p>
                  <p className="text-xs text-gray-600 mb-2">{suggestion.message}</p>
                  <div className="flex items-center gap-2">
                    {onApplySuggestion && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => onApplySuggestion(suggestion)}
                      >
                        {suggestion.action}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                    {onDismissSuggestion && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => onDismissSuggestion(suggestion)}
                      >
                        Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
