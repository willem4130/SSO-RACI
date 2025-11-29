import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'demo@raci.app' },
    update: {},
    create: {
      email: 'demo@raci.app',
      name: 'Demo User',
      password: hashedPassword,
    },
  })

  console.log('✅ Created demo user:', user.email)

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      ownerId: user.id,
      settings: JSON.stringify({
        locale: 'en',
        timezone: 'UTC',
        features: {
          realtime: true,
          analytics: true,
          templates: true,
        },
      }),
    },
  })

  console.log('✅ Created organization:', org.name)

  // Create organization member
  const member = await prisma.member.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: user.id,
      email: user.email,
      name: user.name || 'Demo User',
      role: 'OWNER',
      status: 'ACTIVE',
    },
  })

  console.log('✅ Created member:', member.email)

  // Create demo department
  const department = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Engineering',
      code: 'ENG',
      orderSort: 0,
    },
  })

  console.log('✅ Created department:', department.name)

  // Create demo project
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      departmentId: department.id,
      name: 'Sample Project',
      description: 'A demo project to get you started',
      ownerId: member.id,
      status: 'ACTIVE',
    },
  })

  console.log('✅ Created project:', project.name)

  // Create demo RACI matrix
  const matrix = await prisma.rACIMatrix.create({
    data: {
      organizationId: org.id,
      projectId: project.id,
      name: 'Project Kickoff RACI',
      description: 'Responsibilities for project kickoff',
      createdById: member.id,
      version: 1,
    },
  })

  console.log('✅ Created RACI matrix:', matrix.name)

  // Create demo tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        matrixId: matrix.id,
        name: 'Project Planning',
        description: 'Define project scope and objectives',
        orderIndex: 0,
        status: 'NOT_STARTED',
        priority: 'HIGH',
      },
    }),
    prisma.task.create({
      data: {
        matrixId: matrix.id,
        name: 'Requirements Gathering',
        description: 'Collect and document requirements',
        orderIndex: 1,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      },
    }),
    prisma.task.create({
      data: {
        matrixId: matrix.id,
        name: 'Design Review',
        description: 'Review and approve technical design',
        orderIndex: 2,
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
      },
    }),
  ])

  console.log('✅ Created tasks:', tasks.length)

  // Create assignments
  await prisma.assignment.createMany({
    data: [
      {
        taskId: tasks[0].id,
        memberId: member.id,
        raciRole: 'ACCOUNTABLE',
        assignedBy: member.id,
      },
      {
        taskId: tasks[1].id,
        memberId: member.id,
        raciRole: 'RESPONSIBLE',
        assignedBy: member.id,
      },
      {
        taskId: tasks[2].id,
        memberId: member.id,
        raciRole: 'CONSULTED',
        assignedBy: member.id,
      },
    ],
  })

  console.log('✅ Created RACI assignments')

  console.log('\n🎉 Database seeded successfully!\n')
  console.log('📝 Demo Credentials:')
  console.log('   Email: demo@raci.app')
  console.log('   Password: password123')
  console.log('\n🔗 Login at: https://raci-matrix.vercel.app/login\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
