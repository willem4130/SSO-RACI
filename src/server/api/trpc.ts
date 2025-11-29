/**
 * This is the primary configuration file for your tRPC server.
 * It's where you initialize the tRPC context, define middleware, and create reusable procedures.
 */
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { db } from '@/server/db'
import { getSessionFromCookie } from '@/server/auth/session'

/**
 * Creates the context for incoming requests
 * If BYPASS_AUTH is enabled, ensures demo user exists in database
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getSessionFromCookie()

  // If using BYPASS_AUTH, ensure the mock user exists in database
  if (session && process.env.BYPASS_AUTH === 'true') {
    try {
      await db.user.upsert({
        where: { id: session.id },
        update: {},
        create: {
          id: session.id,
          email: session.email,
          name: session.name,
          password: 'bypass-auth-no-password',
        },
      })
    } catch (error) {
      // Ignore errors - user might already exist
      console.log('BYPASS_AUTH: User sync skipped', error)
    }
  }

  return {
    db,
    session,
    ...opts,
  }
}

/**
 * Initialize tRPC with transformer and error formatter
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * Reusable router and procedure helpers
 */
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

/**
 * Public procedure - can be accessed by anyone
 */
export const publicProcedure = t.procedure

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }

  return next({
    ctx: {
      ...ctx,
      session: { user: ctx.session },
    },
  })
})
