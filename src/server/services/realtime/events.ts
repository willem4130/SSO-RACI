/**
 * Real-time Event Broadcasting Service
 * Server-Sent Events (SSE) implementation for real-time updates
 */

export interface RealtimeEvent {
  type: 'presence' | 'activity' | 'matrix_update' | 'task_update' | 'comment' | 'assignment'
  matrixId: string
  userId: string
  data: unknown
  timestamp: number
}

export interface EventListener {
  matrixId: string
  userId: string
  send: (event: RealtimeEvent) => void
}

class RealtimeEventService {
  private listeners: Map<string, EventListener[]> = new Map()

  /**
   * Subscribe to real-time updates for a matrix
   */
  subscribe(matrixId: string, userId: string, send: (event: RealtimeEvent) => void): () => void {
    const listener: EventListener = { matrixId, userId, send }

    const existing = this.listeners.get(matrixId) || []
    existing.push(listener)
    this.listeners.set(matrixId, existing)

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(matrixId) || []
      const filtered = listeners.filter(l => l !== listener)
      if (filtered.length === 0) {
        this.listeners.delete(matrixId)
      } else {
        this.listeners.set(matrixId, filtered)
      }
    }
  }

  /**
   * Broadcast event to all listeners of a matrix (except sender)
   */
  broadcast(event: RealtimeEvent, excludeUserId?: string): void {
    const listeners = this.listeners.get(event.matrixId) || []

    for (const listener of listeners) {
      // Don't send event back to the user who triggered it
      if (excludeUserId && listener.userId === excludeUserId) {
        continue
      }

      try {
        listener.send(event)
      } catch (error) {
        console.error('Error sending real-time event:', error)
      }
    }
  }

  /**
   * Broadcast to a specific user
   */
  broadcastToUser(userId: string, event: RealtimeEvent): void {
    const listeners = this.listeners.get(event.matrixId) || []

    for (const listener of listeners) {
      if (listener.userId === userId) {
        try {
          listener.send(event)
        } catch (error) {
          console.error('Error sending real-time event:', error)
        }
      }
    }
  }

  /**
   * Get number of active listeners for a matrix
   */
  getListenerCount(matrixId: string): number {
    return (this.listeners.get(matrixId) || []).length
  }

  /**
   * Get all matrices being watched
   */
  getActiveMatrices(): string[] {
    return Array.from(this.listeners.keys())
  }
}

// Singleton instance
export const realtimeEventService = new RealtimeEventService()
