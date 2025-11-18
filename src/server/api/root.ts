import { createTRPCRouter } from '@/server/api/trpc'
import { authRouter } from '@/server/api/routers/auth'
import { organizationRouter } from '@/server/api/routers/organization'
import { matrixRouter } from '@/server/api/routers/matrix'
import { taskRouter } from '@/server/api/routers/task'
import { assignmentRouter } from '@/server/api/routers/assignment'
import { templateRouter } from '@/server/api/routers/template'
import { memberRouter } from '@/server/api/routers/member'
import { projectRouter } from '@/server/api/routers/project'
import { departmentRouter } from '@/server/api/routers/department'

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  organization: organizationRouter,
  matrix: matrixRouter,
  task: taskRouter,
  assignment: assignmentRouter,
  template: templateRouter,
  member: memberRouter,
  project: projectRouter,
  department: departmentRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter
