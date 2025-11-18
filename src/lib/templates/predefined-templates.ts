import type { MatrixCategory } from '@prisma/client'

export interface TemplateTask {
  name: string
  description: string
  order: number
  roles: {
    memberRole: string // e.g., "Project Manager", "Developer", "QA"
    raciRole: 'RESPONSIBLE' | 'ACCOUNTABLE' | 'CONSULTED' | 'INFORMED'
  }[]
}

export interface RaciTemplate {
  id: string
  name: string
  description: string
  category: MatrixCategory
  memberRoles: string[] // Generic role names that can be mapped to actual members
  tasks: TemplateTask[]
}

export const predefinedTemplates: RaciTemplate[] = [
  // 1. Software Development - Sprint Planning
  {
    id: 'software-sprint-planning',
    name: 'Sprint Planning & Execution',
    description: 'Complete agile sprint workflow from planning to deployment',
    category: 'SOFTWARE_DEVELOPMENT',
    memberRoles: [
      'Product Owner',
      'Scrum Master',
      'Tech Lead',
      'Developer',
      'QA Engineer',
      'DevOps',
    ],
    tasks: [
      {
        name: 'Sprint Planning',
        description: 'Define sprint goals and select backlog items',
        order: 1,
        roles: [
          { memberRole: 'Product Owner', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Scrum Master', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Tech Lead', raciRole: 'CONSULTED' },
          { memberRole: 'Developer', raciRole: 'CONSULTED' },
          { memberRole: 'QA Engineer', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Technical Design',
        description: 'Create technical architecture and implementation plan',
        order: 2,
        roles: [
          { memberRole: 'Tech Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Developer', raciRole: 'RESPONSIBLE' },
          { memberRole: 'DevOps', raciRole: 'CONSULTED' },
          { memberRole: 'Product Owner', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Feature Development',
        description: 'Implement new features and functionality',
        order: 3,
        roles: [
          { memberRole: 'Tech Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Developer', raciRole: 'RESPONSIBLE' },
          { memberRole: 'QA Engineer', raciRole: 'CONSULTED' },
          { memberRole: 'Scrum Master', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Code Review',
        description: 'Review and approve code changes',
        order: 4,
        roles: [
          { memberRole: 'Tech Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Developer', raciRole: 'RESPONSIBLE' },
          { memberRole: 'QA Engineer', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Quality Assurance Testing',
        description: 'Test features for bugs and quality issues',
        order: 5,
        roles: [
          { memberRole: 'QA Engineer', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'QA Engineer', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Developer', raciRole: 'CONSULTED' },
          { memberRole: 'Product Owner', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Deployment',
        description: 'Deploy to production environment',
        order: 6,
        roles: [
          { memberRole: 'DevOps', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'DevOps', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Tech Lead', raciRole: 'CONSULTED' },
          { memberRole: 'Scrum Master', raciRole: 'INFORMED' },
        ],
      },
    ],
  },

  // 2. Project Management - Project Lifecycle
  {
    id: 'project-lifecycle',
    name: 'Project Lifecycle Management',
    description: 'End-to-end project management from initiation to closure',
    category: 'PROJECT_MANAGEMENT',
    memberRoles: ['Project Manager', 'Sponsor', 'Team Lead', 'Team Member', 'Stakeholder'],
    tasks: [
      {
        name: 'Project Initiation',
        description: 'Define project charter and objectives',
        order: 1,
        roles: [
          { memberRole: 'Sponsor', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Project Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Team Lead', raciRole: 'CONSULTED' },
          { memberRole: 'Stakeholder', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Requirements Gathering',
        description: 'Collect and document project requirements',
        order: 2,
        roles: [
          { memberRole: 'Project Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Team Lead', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Stakeholder', raciRole: 'CONSULTED' },
          { memberRole: 'Team Member', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Project Planning',
        description: 'Create detailed project plan and schedule',
        order: 3,
        roles: [
          { memberRole: 'Project Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Project Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Team Lead', raciRole: 'CONSULTED' },
          { memberRole: 'Sponsor', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Execution & Monitoring',
        description: 'Execute tasks and monitor progress',
        order: 4,
        roles: [
          { memberRole: 'Team Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Team Member', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Project Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Stakeholder', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Risk Management',
        description: 'Identify and mitigate project risks',
        order: 5,
        roles: [
          { memberRole: 'Project Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Team Lead', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Sponsor', raciRole: 'CONSULTED' },
          { memberRole: 'Team Member', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Project Closure',
        description: 'Complete project deliverables and documentation',
        order: 6,
        roles: [
          { memberRole: 'Sponsor', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Project Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Team Lead', raciRole: 'CONSULTED' },
          { memberRole: 'Stakeholder', raciRole: 'INFORMED' },
        ],
      },
    ],
  },

  // 3. Marketing Campaign
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign Launch',
    description: 'Plan and execute a multi-channel marketing campaign',
    category: 'MARKETING',
    memberRoles: [
      'Marketing Director',
      'Campaign Manager',
      'Content Creator',
      'Designer',
      'Analyst',
      'Social Media Manager',
    ],
    tasks: [
      {
        name: 'Campaign Strategy',
        description: 'Define campaign objectives and target audience',
        order: 1,
        roles: [
          { memberRole: 'Marketing Director', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Campaign Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Analyst', raciRole: 'CONSULTED' },
          { memberRole: 'Content Creator', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Content Creation',
        description: 'Develop campaign messaging and content',
        order: 2,
        roles: [
          { memberRole: 'Campaign Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Content Creator', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Designer', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Marketing Director', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Design & Creative',
        description: 'Create visual assets and branding materials',
        order: 3,
        roles: [
          { memberRole: 'Designer', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Designer', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Campaign Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Marketing Director', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Campaign Launch',
        description: 'Deploy campaign across all channels',
        order: 4,
        roles: [
          { memberRole: 'Campaign Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Social Media Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Content Creator', raciRole: 'CONSULTED' },
          { memberRole: 'Marketing Director', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Performance Tracking',
        description: 'Monitor campaign metrics and KPIs',
        order: 5,
        roles: [
          { memberRole: 'Analyst', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Analyst', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Campaign Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Marketing Director', raciRole: 'INFORMED' },
        ],
      },
    ],
  },

  // 4. HR - Employee Onboarding
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding Process',
    description: 'Comprehensive new hire onboarding workflow',
    category: 'HR',
    memberRoles: [
      'HR Manager',
      'Hiring Manager',
      'IT Support',
      'Team Lead',
      'Mentor',
      'HR Coordinator',
    ],
    tasks: [
      {
        name: 'Pre-boarding Preparation',
        description: 'Prepare workspace, equipment, and documentation',
        order: 1,
        roles: [
          { memberRole: 'HR Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'HR Coordinator', raciRole: 'RESPONSIBLE' },
          { memberRole: 'IT Support', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Hiring Manager', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'First Day Orientation',
        description: 'Welcome new hire and complete initial paperwork',
        order: 2,
        roles: [
          { memberRole: 'HR Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'HR Coordinator', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Hiring Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Team Lead', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'System Access Setup',
        description: 'Provision accounts and access permissions',
        order: 3,
        roles: [
          { memberRole: 'IT Support', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'IT Support', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Team Lead', raciRole: 'CONSULTED' },
          { memberRole: 'HR Coordinator', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Role Training',
        description: 'Conduct job-specific training sessions',
        order: 4,
        roles: [
          { memberRole: 'Team Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Mentor', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Hiring Manager', raciRole: 'CONSULTED' },
          { memberRole: 'HR Manager', raciRole: 'INFORMED' },
        ],
      },
      {
        name: '30-Day Check-in',
        description: 'Review progress and address concerns',
        order: 5,
        roles: [
          { memberRole: 'Hiring Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Hiring Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'HR Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Mentor', raciRole: 'INFORMED' },
        ],
      },
    ],
  },

  // 5. Product Launch
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Cross-functional product launch coordination',
    category: 'PRODUCT',
    memberRoles: [
      'Product Manager',
      'Engineering Lead',
      'Marketing Lead',
      'Sales Lead',
      'Support Lead',
      'Designer',
    ],
    tasks: [
      {
        name: 'Product Definition',
        description: 'Define product requirements and specifications',
        order: 1,
        roles: [
          { memberRole: 'Product Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Product Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Engineering Lead', raciRole: 'CONSULTED' },
          { memberRole: 'Designer', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Development',
        description: 'Build and test product features',
        order: 2,
        roles: [
          { memberRole: 'Engineering Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Engineering Lead', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Product Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Designer', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Go-to-Market Strategy',
        description: 'Plan launch positioning and messaging',
        order: 3,
        roles: [
          { memberRole: 'Marketing Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Marketing Lead', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Product Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Sales Lead', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Sales Enablement',
        description: 'Train sales team and create materials',
        order: 4,
        roles: [
          { memberRole: 'Sales Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Sales Lead', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Product Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Marketing Lead', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Support Preparation',
        description: 'Prepare customer support for launch',
        order: 5,
        roles: [
          { memberRole: 'Support Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Support Lead', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Product Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Engineering Lead', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Launch Execution',
        description: 'Coordinate product launch across teams',
        order: 6,
        roles: [
          { memberRole: 'Product Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Product Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Marketing Lead', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Sales Lead', raciRole: 'INFORMED' },
        ],
      },
    ],
  },

  // 6. Budget Planning
  {
    id: 'budget-planning',
    name: 'Annual Budget Planning',
    description: 'Financial planning and budget allocation process',
    category: 'FINANCE',
    memberRoles: ['CFO', 'Finance Manager', 'Department Head', 'Budget Analyst', 'Controller'],
    tasks: [
      {
        name: 'Budget Guidelines',
        description: 'Define budget planning parameters and timeline',
        order: 1,
        roles: [
          { memberRole: 'CFO', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Finance Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Controller', raciRole: 'CONSULTED' },
          { memberRole: 'Department Head', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Department Budget Requests',
        description: 'Collect budget requests from all departments',
        order: 2,
        roles: [
          { memberRole: 'Department Head', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Department Head', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Finance Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Budget Analyst', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Budget Analysis',
        description: 'Analyze and consolidate budget requests',
        order: 3,
        roles: [
          { memberRole: 'Finance Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Budget Analyst', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Controller', raciRole: 'CONSULTED' },
          { memberRole: 'CFO', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Budget Approval',
        description: 'Review and approve final budget',
        order: 4,
        roles: [
          { memberRole: 'CFO', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'CFO', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Finance Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Department Head', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Budget Communication',
        description: 'Communicate approved budgets to departments',
        order: 5,
        roles: [
          { memberRole: 'Finance Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Finance Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Department Head', raciRole: 'INFORMED' },
          { memberRole: 'Budget Analyst', raciRole: 'INFORMED' },
        ],
      },
    ],
  },

  // 7. Security Incident Response
  {
    id: 'security-incident',
    name: 'Security Incident Response',
    description: 'Handle security incidents and breaches',
    category: 'IT_SECURITY',
    memberRoles: [
      'Security Officer',
      'IT Manager',
      'System Admin',
      'Legal',
      'Communications',
      'Executive',
    ],
    tasks: [
      {
        name: 'Incident Detection',
        description: 'Identify and confirm security incident',
        order: 1,
        roles: [
          { memberRole: 'Security Officer', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'System Admin', raciRole: 'RESPONSIBLE' },
          { memberRole: 'IT Manager', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Immediate Containment',
        description: 'Contain threat and prevent further damage',
        order: 2,
        roles: [
          { memberRole: 'Security Officer', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'System Admin', raciRole: 'RESPONSIBLE' },
          { memberRole: 'IT Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Executive', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Investigation',
        description: 'Analyze incident scope and impact',
        order: 3,
        roles: [
          { memberRole: 'Security Officer', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Security Officer', raciRole: 'RESPONSIBLE' },
          { memberRole: 'IT Manager', raciRole: 'CONSULTED' },
          { memberRole: 'Legal', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Legal Assessment',
        description: 'Evaluate legal and compliance obligations',
        order: 4,
        roles: [
          { memberRole: 'Legal', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Legal', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Security Officer', raciRole: 'CONSULTED' },
          { memberRole: 'Executive', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'External Communication',
        description: 'Notify affected parties and authorities',
        order: 5,
        roles: [
          { memberRole: 'Executive', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Communications', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Legal', raciRole: 'CONSULTED' },
          { memberRole: 'Security Officer', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Remediation',
        description: 'Implement fixes and security improvements',
        order: 6,
        roles: [
          { memberRole: 'IT Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'System Admin', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Security Officer', raciRole: 'CONSULTED' },
          { memberRole: 'Executive', raciRole: 'INFORMED' },
        ],
      },
    ],
  },

  // 8. Event Planning
  {
    id: 'event-planning',
    name: 'Corporate Event Planning',
    description: 'Plan and execute corporate events',
    category: 'EVENT_PLANNING',
    memberRoles: [
      'Event Manager',
      'Executive Sponsor',
      'Venue Coordinator',
      'Marketing',
      'Finance',
      'Logistics',
    ],
    tasks: [
      {
        name: 'Event Concept',
        description: 'Define event goals and theme',
        order: 1,
        roles: [
          { memberRole: 'Executive Sponsor', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Event Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Marketing', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Budget Planning',
        description: 'Create event budget and funding plan',
        order: 2,
        roles: [
          { memberRole: 'Event Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Event Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Finance', raciRole: 'CONSULTED' },
          { memberRole: 'Executive Sponsor', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Venue Selection',
        description: 'Research and book event venue',
        order: 3,
        roles: [
          { memberRole: 'Event Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Venue Coordinator', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Logistics', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Marketing & Promotion',
        description: 'Promote event and manage registrations',
        order: 4,
        roles: [
          { memberRole: 'Marketing', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Marketing', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Event Manager', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Logistics Coordination',
        description: 'Arrange catering, AV, and materials',
        order: 5,
        roles: [
          { memberRole: 'Logistics', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Logistics', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Venue Coordinator', raciRole: 'CONSULTED' },
          { memberRole: 'Event Manager', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Event Execution',
        description: 'Run event and manage on-site operations',
        order: 6,
        roles: [
          { memberRole: 'Event Manager', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Event Manager', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Logistics', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Executive Sponsor', raciRole: 'INFORMED' },
        ],
      },
    ],
  },

  // 9. Content Publishing Workflow
  {
    id: 'content-publishing',
    name: 'Content Publishing Workflow',
    description: 'Create and publish content across channels',
    category: 'MARKETING',
    memberRoles: [
      'Content Director',
      'Writer',
      'Editor',
      'Designer',
      'SEO Specialist',
      'Publisher',
    ],
    tasks: [
      {
        name: 'Content Planning',
        description: 'Plan content calendar and topics',
        order: 1,
        roles: [
          { memberRole: 'Content Director', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Content Director', raciRole: 'RESPONSIBLE' },
          { memberRole: 'SEO Specialist', raciRole: 'CONSULTED' },
          { memberRole: 'Writer', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Content Creation',
        description: 'Write and develop content',
        order: 2,
        roles: [
          { memberRole: 'Writer', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Writer', raciRole: 'RESPONSIBLE' },
          { memberRole: 'SEO Specialist', raciRole: 'CONSULTED' },
          { memberRole: 'Content Director', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Content Editing',
        description: 'Review and edit content for quality',
        order: 3,
        roles: [
          { memberRole: 'Editor', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Editor', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Writer', raciRole: 'CONSULTED' },
          { memberRole: 'Content Director', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Visual Design',
        description: 'Create graphics and visual elements',
        order: 4,
        roles: [
          { memberRole: 'Designer', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Designer', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Content Director', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'SEO Optimization',
        description: 'Optimize content for search engines',
        order: 5,
        roles: [
          { memberRole: 'SEO Specialist', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'SEO Specialist', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Writer', raciRole: 'CONSULTED' },
          { memberRole: 'Content Director', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Publishing',
        description: 'Publish content to live channels',
        order: 6,
        roles: [
          { memberRole: 'Publisher', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Publisher', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Content Director', raciRole: 'CONSULTED' },
        ],
      },
    ],
  },

  // 10. Vendor Selection
  {
    id: 'vendor-selection',
    name: 'Vendor Selection Process',
    description: 'Evaluate and select external vendors',
    category: 'PROCUREMENT',
    memberRoles: [
      'Procurement Lead',
      'Department Head',
      'Finance',
      'Legal',
      'Technical Evaluator',
      'Executive',
    ],
    tasks: [
      {
        name: 'Requirements Definition',
        description: 'Define vendor requirements and criteria',
        order: 1,
        roles: [
          { memberRole: 'Department Head', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Department Head', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Procurement Lead', raciRole: 'CONSULTED' },
          { memberRole: 'Technical Evaluator', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Vendor Research',
        description: 'Identify and research potential vendors',
        order: 2,
        roles: [
          { memberRole: 'Procurement Lead', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Procurement Lead', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Department Head', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Technical Evaluation',
        description: 'Assess vendor technical capabilities',
        order: 3,
        roles: [
          { memberRole: 'Technical Evaluator', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Technical Evaluator', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Department Head', raciRole: 'CONSULTED' },
          { memberRole: 'Procurement Lead', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Financial Analysis',
        description: 'Review pricing and financial terms',
        order: 4,
        roles: [
          { memberRole: 'Finance', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Finance', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Procurement Lead', raciRole: 'CONSULTED' },
        ],
      },
      {
        name: 'Legal Review',
        description: 'Review contracts and legal terms',
        order: 5,
        roles: [
          { memberRole: 'Legal', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Legal', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Procurement Lead', raciRole: 'CONSULTED' },
          { memberRole: 'Finance', raciRole: 'INFORMED' },
        ],
      },
      {
        name: 'Vendor Selection',
        description: 'Make final vendor selection decision',
        order: 6,
        roles: [
          { memberRole: 'Executive', raciRole: 'ACCOUNTABLE' },
          { memberRole: 'Department Head', raciRole: 'RESPONSIBLE' },
          { memberRole: 'Procurement Lead', raciRole: 'CONSULTED' },
          { memberRole: 'Finance', raciRole: 'CONSULTED' },
        ],
      },
    ],
  },
]
