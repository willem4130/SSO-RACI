/**
 * Server-Sent Events (SSE) endpoint for real-time updates
 * GET /api/realtime/[matrixId]
 */

import { NextRequest } from 'next/server'
import { realtimeEventService } from '@/server/services/realtime/events'
import { presenceService } from '@/server/services/realtime/presence'
import { getSessionFromCookie } from '@/server/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matrixId: string }> }
) {
  try {
    const { matrixId } = await params

    // Verify authentication
    const session = await getSessionFromCookie()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.id
    const userName = session.name || session.email

    // Create a TransformStream for SSE
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()

    // Send SSE message helper
    const send = (data: unknown) => {
      const message = `data: ${JSON.stringify(data)}\n\n`
      writer.write(encoder.encode(message))
    }

    // Subscribe to real-time events
    const unsubscribe = realtimeEventService.subscribe(matrixId, userId, send)

    // Join presence
    presenceService.join(matrixId, userId, userName)

    // Broadcast presence join event
    realtimeEventService.broadcast(
      {
        type: 'presence',
        matrixId,
        userId,
        data: {
          action: 'join',
          userId,
          userName,
          users: presenceService.getPresence(matrixId),
        },
        timestamp: Date.now(),
      },
      userId // Don't send to self
    )

    // Send initial presence data to connecting user
    send({
      type: 'presence',
      matrixId,
      userId: 'system',
      data: {
        action: 'initial',
        users: presenceService.getPresence(matrixId),
      },
      timestamp: Date.now(),
    })

    // Heartbeat interval to keep connection alive and update presence
    const heartbeatInterval = setInterval(() => {
      presenceService.heartbeat(matrixId, userId)
      send({ type: 'heartbeat', timestamp: Date.now() })
    }, 15000) // Every 15 seconds

    // Cleanup on connection close
    request.signal.addEventListener('abort', () => {
      clearInterval(heartbeatInterval)
      presenceService.leave(matrixId, userId)
      unsubscribe()

      // Broadcast presence leave event
      realtimeEventService.broadcast(
        {
          type: 'presence',
          matrixId,
          userId,
          data: {
            action: 'leave',
            userId,
            userName,
            users: presenceService.getPresence(matrixId),
          },
          timestamp: Date.now(),
        },
        userId
      )

      writer.close()
    })

    // Return SSE response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error('SSE error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
