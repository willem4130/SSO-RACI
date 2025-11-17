import { createTRPCRouter } from '@/server/api/trpc'
import { organizationRouter } from '@/server/api/routers/organization'
import { matrixRouter } from '@/server/api/routers/matrix'
import { taskRouter } from '@/server/api/routers/task'
import { assignmentRouter } from '@/server/api/routers/assignment'

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  organization: organizationRouter,
  matrix: matrixRouter,
  task: taskRouter,
  assignment: assignmentRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
