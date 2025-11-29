// JWT session management
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const SESSION_COOKIE_NAME = 'raci-session'
const SESSION_EXPIRY = '7d' // 7 days

// Auth bypass - provides a mock user for testing without auth
// Set BYPASS_AUTH=true to skip authentication (useful for demos)
const BYPASS_AUTH = process.env.BYPASS_AUTH?.trim() === 'true' || process.env.NODE_ENV === 'development'
const MOCK_USER: SessionUser = {
  id: 'demo-user-001',
  email: 'demo@raci.app',
  name: 'Demo User',
}

export interface SessionUser {
  id: string
  email: string
  name: string
}

export interface SessionPayload extends SessionUser {
  iat: number
  exp: number
}

/**
 * Create a JWT session token
 */
export function createSession(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: SESSION_EXPIRY,
  })
}

/**
 * Verify and decode a JWT session token
 */
export function verifySession(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    }
  } catch {
    return null
  }
}

/**
 * Set session cookie in response
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Get session from cookie
 * If BYPASS_AUTH is enabled, returns mock user if no session exists (auth bypass)
 */
export async function getSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    // Auth bypass: return mock user for testing without login
    if (BYPASS_AUTH) {
      return MOCK_USER
    }
    return null
  }

  return verifySession(token)
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
