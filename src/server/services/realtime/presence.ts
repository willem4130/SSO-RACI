/**
 * Real-time Presence Tracking Service
 * Tracks who's currently viewing which matrices
 */

export interface PresenceInfo {
  userId: string
  userName: string
  matrixId: string
  joinedAt: number
  lastSeen: number
}

export interface MatrixPresence {
  matrixId: string
  users: PresenceInfo[]
}

class PresenceService {
  private presence: Map<string, PresenceInfo> = new Map()
  private presenceTimeout = 30000 // 30 seconds

  /**
   * User joins a matrix
   */
  join(matrixId: string, userId: string, userName: string): void {
    const key = `${matrixId}:${userId}`
    this.presence.set(key, {
      userId,
      userName,
      matrixId,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    })
  }

  /**
   * User leaves a matrix
   */
  leave(matrixId: string, userId: string): void {
    const key = `${matrixId}:${userId}`
    this.presence.delete(key)
  }

  /**
   * Update last seen timestamp (heartbeat)
   */
  heartbeat(matrixId: string, userId: string): void {
    const key = `${matrixId}:${userId}`
    const info = this.presence.get(key)
    if (info) {
      info.lastSeen = Date.now()
    }
  }

  /**
   * Get all users currently viewing a matrix
   */
  getPresence(matrixId: string): PresenceInfo[] {
    const now = Date.now()
    const users: PresenceInfo[] = []

    // Clean up stale presence and collect active users
    for (const [key, info] of this.presence.entries()) {
      if (info.matrixId === matrixId) {
        // Remove if last seen is older than timeout
        if (now - info.lastSeen > this.presenceTimeout) {
          this.presence.delete(key)
        } else {
          users.push(info)
        }
      }
    }

    return users
  }

  /**
   * Get all matrices a user is currently viewing
   */
  getUserPresence(userId: string): string[] {
    const now = Date.now()
    const matrices: string[] = []

    for (const [key, info] of this.presence.entries()) {
      if (info.userId === userId) {
        if (now - info.lastSeen > this.presenceTimeout) {
          this.presence.delete(key)
        } else {
          matrices.push(info.matrixId)
        }
      }
    }

    return matrices
  }

  /**
   * Cleanup stale presence data
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, info] of this.presence.entries()) {
      if (now - info.lastSeen > this.presenceTimeout) {
        this.presence.delete(key)
      }
    }
  }
}

// Singleton instance
export const presenceService = new PresenceService()

// Run cleanup every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    presenceService.cleanup()
  }, 60000)
}
