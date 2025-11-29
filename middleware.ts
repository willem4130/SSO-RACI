import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware that bypasses all authentication
// This allows public access to the entire application
export function middleware(request: NextRequest) {
  // Always allow access - no auth checks
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
