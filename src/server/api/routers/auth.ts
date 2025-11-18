// Authentication Router - Login, Signup, Logout
import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { hashPassword, verifyPassword, validatePassword } from '@/server/auth/password'
import { createSession, setSessionCookie, clearSessionCookie } from '@/server/auth/session'
import { TRPCError } from '@trpc/server'

export const authRouter = createTRPCRouter({
  // Sign up new user
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate password strength
      const passwordValidation = validatePassword(input.password)
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors.join(', '),
        })
      }

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        })
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password)

      // Create user
      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: hashedPassword,
        },
      })

      // Create session
      const token = createSession({
        id: user.id,
        email: user.email,
        name: user.name || user.email,
      })

      await setSessionCookie(token)

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }
    }),

  // Log in existing user
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find user
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        })
      }

      // Verify password
      const isValid = await verifyPassword(input.password, user.password)

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        })
      }

      // Create session
      const token = createSession({
        id: user.id,
        email: user.email,
        name: user.name || user.email,
      })

      await setSessionCookie(token)

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      }
    }),

  // Log out current user
  logout: publicProcedure.mutation(async () => {
    await clearSessionCookie()
    return { success: true }
  }),

  // Get current user session
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    return user
  }),
})
