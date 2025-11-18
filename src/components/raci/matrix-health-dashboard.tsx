'use client'

import { useState } from 'react'
import { AlertCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HealthScoreBadge } from './health-score-badge'
import { QuickMetricsCards } from './quick-metrics-cards'
import { SmartSuggestionsPanel, type SmartSuggestion } from './smart-suggestions-panel'
import { cn } from '@/lib/utils'

export interface ValidationIssue {
  taskId: string
  taskName: string
  type: string
  message: string
  severity: 'error' | 'warning'
  memberId?: string
  memberName?: string
}

export interface MatrixHealthData {
  healthScore: number
  isValid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  suggestions: SmartSuggestion[]
  metrics: {
    totalTasks: number
    validTasks: number
    tasksCoverage: number
    avgAssignmentsPerTask: number
    avgAssignmentsPerMember: number
  }
}

interface MatrixHealthDashboardProps {
  data: MatrixHealthData | null
  loading?: boolean
  onRefresh?: () => void
  onApplySuggestion?: (suggestion: SmartSuggestion) => void
  onDismissSuggestion?: (suggestion: SmartSuggestion) => void
  className?: string
}

export function MatrixHealthDashboard({
  data,
  loading = false,
  onRefresh,
  onApplySuggestion,
  onDismissSuggestion,
  className,
}: MatrixHealthDashboardProps) {
  const [showErrors, setShowErrors] = useState(true)
  const [showWarnings, setShowWarnings] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)

  if (loading) {
    return (
      <div className={cn('rounded-lg border bg-white p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-400 animate-pulse" />
          <h2 className="text-lg font-semibold text-gray-400">Matrix Health Dashboard</h2>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={cn('rounded-lg border bg-gray-50 p-6 text-center', className)}>
        <p className="text-sm text-muted-foreground">No validation data available</p>
        {onRefresh && (
          <Button size="sm" variant="outline" onClick={onRefresh} className="mt-2">
            Load Health Data
          </Button>
        )}
      </div>
    )
  }

  const { healthScore, errors, warnings, suggestions, metrics } = data

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Health Score */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold">Matrix Health</h2>
          </div>
          {onRefresh && (
            <Button size="sm" variant="ghost" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>

        <div className="mb-4">
          <HealthScoreBadge score={healthScore} size="lg" />
        </div>

        {/* Quick Metrics */}
        <QuickMetricsCards
          metrics={metrics}
          errorCount={errors.length}
          warningCount={warnings.length}
        />
      </div>

      {/* Critical Errors Section */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-100 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-red-900">Critical Errors ({errors.length})</h3>
            </div>
            {showErrors ? (
              <ChevronUp className="h-4 w-4 text-red-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-red-600" />
            )}
          </button>

          {showErrors && (
            <div className="px-4 pb-4 space-y-2">
              {errors.map((error, index) => (
                <div
                  key={`${error.taskId}-${error.type}-${index}`}
                  className="bg-white rounded-lg border border-red-200 p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-900">{error.taskName}</p>
                      <p className="text-xs text-red-700 mt-0.5">{error.message}</p>
                      {error.memberName && (
                        <p className="text-xs text-red-600 mt-1">Member: {error.memberName}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-yellow-100 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Warnings ({warnings.length})</h3>
            </div>
            {showWarnings ? (
              <ChevronUp className="h-4 w-4 text-yellow-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-yellow-600" />
            )}
          </button>

          {showWarnings && (
            <div className="px-4 pb-4 space-y-2">
              {warnings.map((warning, index) => (
                <div
                  key={`${warning.taskId}-${warning.type}-${index}`}
                  className="bg-white rounded-lg border border-yellow-200 p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-900">{warning.taskName}</p>
                      <p className="text-xs text-yellow-700 mt-0.5">{warning.message}</p>
                      {warning.memberName && (
                        <p className="text-xs text-yellow-600 mt-1">Member: {warning.memberName}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Smart Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="rounded-lg border border-purple-200 bg-purple-50">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-purple-900">
                Smart Suggestions ({suggestions.length})
              </h3>
            </div>
            {showSuggestions ? (
              <ChevronUp className="h-4 w-4 text-purple-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-purple-600" />
            )}
          </button>

          {showSuggestions && (
            <div className="p-4 bg-white rounded-b-lg">
              <SmartSuggestionsPanel
                suggestions={suggestions}
                onApplySuggestion={onApplySuggestion}
                onDismissSuggestion={onDismissSuggestion}
              />
            </div>
          )}
        </div>
      )}

      {/* All Clear State */}
      {errors.length === 0 && warnings.length === 0 && suggestions.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-900">
            <Activity className="h-5 w-5 text-green-600" />
            <p className="font-medium">Matrix is healthy!</p>
          </div>
          <p className="text-sm text-green-700 mt-1">
            No errors, warnings, or optimization suggestions.
          </p>
        </div>
      )}
    </div>
  )
}
