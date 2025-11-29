# Deployment Guide - RACI Matrix Application

This guide will help you deploy the RACI Matrix application to Vercel with a production-ready pipeline connected to your GitHub repository.

## Prerequisites

- GitHub account with repository access
- Vercel account (free tier works great)
- Production database (PostgreSQL recommended)

## Step 1: Prepare Your Database

### Option A: Vercel Postgres (Recommended for quick setup)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Create Database → Postgres
3. Copy the connection strings (you'll need both `DATABASE_URL` and `DIRECT_URL`)

### Option B: External PostgreSQL Provider

Popular options:
- **Neon** - Free tier with 3 GB storage
- **Supabase** - Free tier with 500 MB database
- **Railway** - $5/month for 512 MB RAM
- **PlanetScale** - Free tier (MySQL, requires schema changes)

**Note**: The current schema uses SQLite. For production, you'll need to update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

After changing, run:
```bash
npm run db:push
```

## Step 2: Push Your Code to GitHub

If not already done:

```bash
git init
git add .
git commit -m "Initial commit - RACI Matrix Application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 3: Connect to Vercel

### Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration
5. Click "Deploy" (it will fail initially - this is expected without environment variables)

### Or Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

## Step 4: Configure Environment Variables

In your Vercel project dashboard, go to Settings → Environment Variables and add:

### Required Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string | Production, Preview, Development |
| `DIRECT_URL` | Your direct PostgreSQL connection (for migrations) | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

### Optional but Recommended

| Variable | Value | Notes |
|----------|-------|-------|
| `UPSTASH_REDIS_REST_URL` | Your Upstash Redis URL | For rate limiting - [Get free tier](https://upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis token | Required if using rate limiting |
| `API_SECRET_KEY` | Generate: `openssl rand -base64 32` | For API authentication |
| `NEXT_PUBLIC_SENTRY_DSN` | Your Sentry DSN | Error tracking - [Sign up](https://sentry.io) |
| `SENTRY_ORG` | Your Sentry organization slug | For source map uploads |
| `SENTRY_PROJECT` | Your Sentry project name | For source map uploads |
| `SENTRY_AUTH_TOKEN` | Your Sentry auth token | For source map uploads |

### Example Environment Variables

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# App
NODE_ENV="production"

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AYQxASQ..."

# API Security
API_SECRET_KEY="your-generated-secret-key-minimum-32-characters"

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN="https://abc@def.ingest.sentry.io/123"
SENTRY_ORG="your-org"
SENTRY_PROJECT="raci-matrix"
SENTRY_AUTH_TOKEN="sntrys_abc..."
```

## Step 5: Deploy

Once environment variables are set:

1. Go to Deployments tab
2. Click "Redeploy" on the failed deployment
3. Or push a new commit to trigger automatic deployment

```bash
git add .
git commit -m "Configure for production"
git push
```

## Step 6: Verify Deployment

After deployment succeeds, verify:

1. Visit your deployment URL
2. Check the health endpoint: `https://your-app.vercel.app/api/health`
3. Test authentication and database connectivity
4. Monitor errors in Sentry dashboard (if configured)

## Automatic Deployments

Vercel will automatically deploy:

- **Production**: Commits to `main` branch → your-app.vercel.app
- **Preview**: Pull requests → unique preview URLs
- **Development**: Other branches → development preview URLs

## Database Migrations

For schema changes in production:

```bash
# Create migration locally
npm run db:migrate

# Commit migration files
git add prisma/migrations
git commit -m "Add database migration"
git push

# Vercel will run migrations automatically via the build command
```

## Build Configuration

The `vercel.json` file is pre-configured with:

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

This ensures Prisma client is generated before building.

## Monitoring & Performance

### Built-in Vercel Features (Automatic)

- Vercel Analytics - Enabled automatically
- Speed Insights - Enabled automatically
- Edge Functions - For API routes
- CDN - Global content delivery

### Sentry Integration

If configured, you'll get:
- Real-time error tracking
- Performance monitoring
- Session replay
- Source maps for production debugging

## Troubleshooting

### Build Fails with "Cannot find module '@prisma/client'"

**Solution**: The build command includes `prisma generate`. Ensure `DATABASE_URL` is set.

### Database Connection Errors

**Solution**:
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Ensure database allows connections from Vercel IPs (0.0.0.0/0 for simplicity)
- Check if database requires SSL: add `?sslmode=require` to connection string

### Rate Limiting Not Working

**Solution**:
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Rate limiting gracefully degrades if Redis is unavailable

### Environment Variables Not Loading

**Solution**:
- Ensure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new environment variables
- Check that variable names match exactly (case-sensitive)

## Custom Domain

To add a custom domain:

1. Go to Settings → Domains
2. Add your domain
3. Configure DNS records as instructed
4. SSL certificate is automatic

## Best Practices

1. **Never commit `.env` files** - Use Vercel environment variables
2. **Use Preview deployments** - Test changes before merging to main
3. **Enable Sentry** - Catch production errors early
4. **Set up Upstash Redis** - Protect your API with rate limiting
5. **Monitor Analytics** - Track performance and user behavior
6. **Use connection pooling** - Add `?pgbouncer=true` to database URL for better performance
7. **Enable branch protection** - Require PR reviews before merging to main

## Security Checklist

- [ ] `API_SECRET_KEY` is set and secure (32+ characters)
- [ ] Database credentials are not in code
- [ ] Rate limiting is enabled
- [ ] CORS headers are configured (in `vercel.json`)
- [ ] Sentry is configured for error tracking
- [ ] Environment variables are set for all environments

## Cost Optimization

- **Vercel Free Tier**: 100 GB bandwidth, unlimited previews
- **Upstash Free Tier**: 10,000 requests/day
- **Neon Free Tier**: 3 GB storage, 1 GB RAM
- **Sentry Free Tier**: 5,000 errors/month

This setup can run entirely on free tiers for development and small-scale production use.

## Next Steps

1. Set up continuous integration tests (GitHub Actions)
2. Configure branch protection rules
3. Set up monitoring and alerts
4. Plan database backup strategy
5. Configure custom domain
6. Set up staging environment

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

**Ready to deploy?** Follow the steps above and your RACI Matrix application will be live in minutes!
