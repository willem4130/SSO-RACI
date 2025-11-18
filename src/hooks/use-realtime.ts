/**
 * React hook for real-time collaboration features
 * Handles SSE connection, presence, and live updates
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

export interface PresenceUser {
  userId: string
  userName: string
  joinedAt: number
  lastSeen: number
}

export interface RealtimeEvent {
  type: 'presence' | 'activity' | 'matrix_update' | 'task_update' | 'comment' | 'assignment' | 'heartbeat'
  matrixId: string
  userId: string
  data: unknown
  timestamp: number
}

export interface UseRealtimeOptions {
  matrixId: string
  onEvent?: (event: RealtimeEvent) => void
  onPresenceChange?: (users: PresenceUser[]) => void
  onMatrixUpdate?: (data: unknown) => void
  onCommentUpdate?: (data: unknown) => void
  enabled?: boolean
}

export function useRealtime({
  matrixId,
  onEvent,
  onPresenceChange,
  onMatrixUpdate,
  onCommentUpdate,
  enabled = true,
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const connect = useCallback(() => {
    if (!enabled || !matrixId || eventSourceRef.current) {
      return
    }

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    try {
      const eventSource = new EventSource(`/api/realtime/${matrixId}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        console.log('[Realtime] Connected to matrix:', matrixId)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent

          // Call generic event handler
          onEvent?.(data)

          // Handle specific event types
          switch (data.type) {
            case 'presence': {
              const presenceData = data.data as {
                action: string
                users: PresenceUser[]
              }
              setPresence(presenceData.users)
              onPresenceChange?.(presenceData.users)
              break
            }

            case 'matrix_update':
            case 'task_update':
            case 'assignment': {
              onMatrixUpdate?.(data.data)
              break
            }

            case 'comment': {
              onCommentUpdate?.(data.data)
              break
            }

            case 'heartbeat': {
              // Heartbeat received, connection is alive
              break
            }

            default:
              console.log('[Realtime] Unknown event type:', data.type)
          }
        } catch (error) {
          console.error('[Realtime] Error parsing event:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[Realtime] Connection error:', error)
        setIsConnected(false)

        // Close and cleanup
        eventSource.close()
        eventSourceRef.current = null

        // Attempt to reconnect after 5 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[Realtime] Attempting to reconnect...')
            connect()
          }, 5000)
        }
      }
    } catch (error) {
      console.error('[Realtime] Failed to connect:', error)
      setIsConnected(false)
    }
  }, [matrixId, enabled, onEvent, onPresenceChange, onMatrixUpdate, onCommentUpdate])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (eventSourceRef.current) {
      console.log('[Realtime] Disconnecting from matrix:', matrixId)
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
      setPresence([])
    }
  }, [matrixId])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    presence,
    presenceCount: presence.length,
    reconnect: connect,
    disconnect,
  }
}
