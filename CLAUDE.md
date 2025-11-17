# RACI Matrix Application

Production-ready Next.js 16 fullstack RACI (Responsible, Accountable, Consulted, Informed) matrix application with multi-language support (EN/NL), real-time collaboration, advanced analytics, and workflow automation.

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # i18n routing (en/nl)
│   │   ├── (auth)/               # Authentication pages
│   │   ├── (dashboard)/          # Main application
│   │   │   ├── organizations/    # Organization management
│   │   │   ├── projects/         # Project & matrix management
│   │   │   ├── templates/        # Template library
│   │   │   └── admin/            # Admin panel
│   │   └── api/                  # API routes & tRPC
│   └── globals.css               # Global styles
├── server/                       # Backend logic
│   ├── api/                      # tRPC routers
│   │   └── routers/              # API endpoints (organization, matrix, task, etc.)
│   ├── auth/                     # Authentication & RBAC
│   ├── services/                 # Business logic
│   │   ├── matrix/               # RACI validation, analytics, suggestions
│   │   ├── notification/         # Email & in-app notifications
│   │   ├── automation/           # Workflows & escalation
│   │   ├── realtime/             # SSE & presence
│   │   └── export/               # PDF, Excel, CSV export
│   └── db/                       # Prisma client
├── components/                   # React components
│   ├── raci/                     # RACI matrix grid & cells
│   ├── analytics/                # Charts & dashboards
│   ├── templates/                # Template browser
│   ├── shared/                   # Share & access control
│   ├── comments/                 # Comments & mentions
│   ├── admin/                    # Admin management UI
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utilities & middleware
├── hooks/                        # Custom React hooks
├── stores/                       # Zustand state management
├── i18n/                         # Translations (en/nl)
├── types/                        # TypeScript definitions
└── prisma/                       # Database schema
    └── schema.prisma             # Multi-tenant RACI schema
```

## Organization Rules

**Multi-tenant architecture:**
- All data scoped by organizationId for tenant isolation
- Organization → Department → Project → Matrix hierarchy
- Row-level security enforced in all queries

**API structure:**
- tRPC routers → `/server/api/routers/`, one per resource
- Business logic → `/server/services/`, grouped by domain
- Middleware → `/lib/`, reusable across routes

**Components:**
- RACI-specific → `/components/raci/`
- Feature components → `/components/{feature}/`
- Shared UI → `/components/ui/` (shadcn/ui only)
- One component per file, clear naming

**Services (Business Logic):**
- Matrix validation → `/server/services/matrix/validation.ts`
- Analytics → `/server/services/matrix/analytics.ts`
- Notifications → `/server/services/notification/`
- Real-time → `/server/services/realtime/`

**Modularity principles:**
- Single responsibility per file
- Clear separation: UI ↔ Logic ↔ Data
- Reusable utilities in `/lib/`
- Type definitions in `/types/`

## Code Quality - Zero Tolerance

After editing ANY file, run:

```bash
npm run typecheck
npm run lint
```

Fix ALL errors/warnings before continuing.

If changes require server restart:
1. Restart: `npm run dev`
2. Check console for errors
3. Fix ALL issues immediately

## Development Workflow

1. **Database changes**: Update `prisma/schema.prisma` → `npm run db:push`
2. **New API endpoint**: Create router in `/server/api/routers/` → add to root.ts
3. **New component**: Add to appropriate `/components/{category}/` folder
4. **i18n**: Add translations to `/i18n/locales/{en|nl}/` JSON files
5. **Tests**: Co-locate with code or add to `/tests/`

## Key Technical Patterns

**RACI Validation**: Exactly 1 Accountable, ≥1 Responsible per task
**Real-time**: Server-Sent Events (SSE) for live updates
**Permissions**: RBAC at org level + resource-level access control
**Multi-language**: next-intl with locale routing
**State**: TanStack Query + Zustand for complex UI state
