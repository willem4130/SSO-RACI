# Next.js Fullstack Template 🚀

> **Production-ready Next.js 16 template with tRPC, Prisma, shadcn/ui, Vercel Analytics, Sentry, and rate-limited API routes**

A complete, opinionated fullstack Next.js starter that includes everything you need to build and deploy production-ready applications.

## ⚡ Quick Start

### Option 1: Using degit (Recommended - No Git History)

```bash
npx degit willem4130/nextjs-fullstack-template my-app
cd my-app
npm install
```

### Option 2: Using GitHub Template

1. Click "Use this template" button on GitHub
2. Create your repository
3. Clone and install:

```bash
git clone https://github.com/willem4130/your-new-repo.git
cd your-new-repo
npm install
```

### Option 3: Using npx (Coming Soon)

```bash
npx create-nextjs-fullstack my-app
cd my-app
```

## 🎯 What's Included

### Core Stack

- ⚡ **Next.js 16** - App Router, React 19, Turbopack
- 🔷 **TypeScript** - Strict mode, full type safety
- 🎨 **Tailwind CSS 3** - Utility-first styling
- 🧩 **shadcn/ui** - Beautiful, accessible components

### Backend & Data

- 🔄 **tRPC v11** - End-to-end typesafe APIs
- 🗄️ **Prisma ORM** - Type-safe database client
- 🐘 **PostgreSQL** - Production database (configured)
- ✅ **Zod** - Runtime validation

### Features

- 📊 **Admin Dashboard** - Professional UI with sidebar navigation
- 🔒 **Protected API Routes** - Rate limiting, authentication, validation
- 🛡️ **Rate Limiting** - Upstash Redis integration
- 📈 **Analytics** - Vercel Analytics + Speed Insights (privacy-friendly)
- 🐛 **Error Tracking** - Sentry integration with session replay
- 🌍 **Environment Validation** - Type-safe env vars with @t3-oss/env-nextjs

### Developer Experience

- 🧪 **Testing** - Vitest (unit) + Playwright (e2e)
- 📝 **Code Quality** - ESLint, Prettier, Husky, lint-staged
- 📚 **Documentation** - Complete setup guides included

## 📦 What's Pre-configured

### Admin Dashboard (`/admin`)

- **Dashboard** - Stats cards, recent activity, metrics
- **Users** - User management with data tables
- **Settings** - Application configuration

### API Routes (`/api`)

- **Health Check** - `/api/health`
- **Documentation** - `/api` (auto-generated)
- **Posts CRUD** - `/api/posts` with full CRUD operations
- **Rate Limited** - All endpoints protected
- **Validated** - Zod schemas for all inputs

### Components

10 shadcn/ui components pre-installed:
- Card, Table, Button, Dropdown Menu, Badge
- Avatar, Separator, Input, Label, Select

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

Optional (but recommended):
```bash
# Upstash Redis (rate limiting) - https://upstash.com
UPSTASH_REDIS_REST_URL="your-url"
UPSTASH_REDIS_REST_TOKEN="your-token"

# API Authentication
API_SECRET_KEY="generate-with-openssl-rand-base64-32"

# Sentry (error tracking) - https://sentry.io
NEXT_PUBLIC_SENTRY_DSN="your-dsn"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
SENTRY_AUTH_TOKEN="your-token"
```

### 3. Set Up Database

```bash
# Push schema to database
npm run db:push

# Or create migration
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Explore the Features

- **Homepage**: `/` - Landing page
- **Admin Dashboard**: `/admin/dashboard` - Admin interface
- **API Docs**: `/api` - API documentation
- **Sentry Test**: `/sentry-test` - Error tracking test page

## 📖 Documentation

Comprehensive guides included in the repository:

- **[ANALYTICS.md](./ANALYTICS.md)** - Vercel Analytics setup
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[SENTRY_SETUP.md](./SENTRY_SETUP.md)** - Error tracking guide

## 🛠️ Available Scripts

### Development

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run typecheck    # Run TypeScript type checking
```

### Testing

```bash
npm run test         # Run Vitest unit tests
npm run test:ui      # Open Vitest UI
npm run test:e2e     # Run Playwright e2e tests
npm run test:e2e:ui  # Open Playwright UI
```

### Database

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
```

## 🏗️ Project Structure

```
nextjs-fullstack-template/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Protected routes
│   │   ├── (public)/          # Public routes
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   ├── error.tsx          # Error boundary
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/                   # Utilities
│   │   ├── api-middleware.ts  # API helpers
│   │   └── rate-limit.ts      # Rate limiting
│   ├── server/                # Backend code
│   │   ├── api/               # tRPC routers
│   │   └── db/                # Prisma client
│   ├── trpc/                  # tRPC client config
│   └── env.js                 # Environment validation
├── prisma/
│   └── schema.prisma          # Database schema
├── tests/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # E2E tests
└── public/                    # Static files
```

## 🔧 Customization

### Update Project Name

1. Update `package.json` name field
2. Update database name in `.env`
3. Update metadata in `src/app/layout.tsx`

### Add Authentication

The template is ready for authentication. Recommended options:

- **NextAuth.js** - OAuth, credentials, magic links
- **Clerk** - Drop-in authentication
- **Better Auth** - Modern auth library

### Add More API Routes

Follow the pattern in `src/app/api/posts/route.ts`:

```typescript
import { protectedRoute, apiResponse, validateRequest } from '@/lib/api-middleware'

export async function GET(request: NextRequest) {
  return protectedRoute(request, async (req) => {
    // Your logic here
    return apiResponse({ data: 'your-data' })
  })
}
```

### Add More shadcn/ui Components

```bash
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add toast
```

## 🚢 Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

**Complete Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Set Environment Variables** (required)
   ```bash
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   NODE_ENV="production"
   ```

4. **Deploy!**
   - Vercel auto-detects Next.js configuration
   - Build command: `prisma generate && next build` (pre-configured)
   - Every push to `main` auto-deploys to production
   - Pull requests create preview deployments

### What's Included

Vercel automatically configures:
- ✅ Analytics (privacy-friendly)
- ✅ Speed Insights
- ✅ Edge Functions for API routes
- ✅ Serverless Functions
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments for PRs

### Production Checklist

- [ ] Database configured (PostgreSQL recommended)
- [ ] Environment variables set in Vercel
- [ ] Upstash Redis for rate limiting (optional but recommended)
- [ ] Sentry for error tracking (optional)
- [ ] Custom domain configured (optional)

**Full deployment guide with troubleshooting**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🤝 Contributing

This is a template repository. Feel free to:

1. Fork it
2. Customize for your needs
3. Share improvements via PR

## 📝 License

MIT License - use freely for personal and commercial projects.

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org)
- [tRPC](https://trpc.io)
- [Prisma](https://prisma.io)
- [shadcn/ui](https://ui.shadcn.com)
- [Vercel Analytics](https://vercel.com/analytics)
- [Sentry](https://sentry.io)

---

**Ready to build?** Start with `npx degit willem4130/nextjs-fullstack-template my-app` 🚀
