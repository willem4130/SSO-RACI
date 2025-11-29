# Deploy to Vercel using CLI

This guide will walk you through deploying the RACI Matrix application using the Vercel CLI.

## Prerequisites

- Node.js installed
- GitHub repository (or Git initialized)
- Production database ready (PostgreSQL recommended)

## Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

This will open a browser window to authenticate.

## Step 3: Prepare Environment Variables

Create a `.env.production` file (this won't be committed):

```bash
# Database (PostgreSQL for production)
DATABASE_URL="postgresql://user:password@host:5432/raci_matrix?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/raci_matrix"

# App
NODE_ENV="production"

# Optional: Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Optional: API Security
API_SECRET_KEY="your-secure-key-minimum-32-chars"

# Optional: Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN="https://abc@def.ingest.sentry.io/123"
SENTRY_ORG="your-org"
SENTRY_PROJECT="raci-matrix"
SENTRY_AUTH_TOKEN="your-token"
```

## Step 4: Deploy to Production

Run the deployment command:

```bash
vercel --prod
```

The CLI will:
1. Ask you to link to an existing project or create a new one
2. Ask for project name (e.g., "raci-matrix")
3. Detect Next.js framework automatically
4. Upload your code
5. Build and deploy

### First Time Setup Prompts

```
? Set up and deploy "~/Dev/SSO/RACI"? [Y/n] Y
? Which scope do you want to deploy to? Your Name
? Link to existing project? [y/N] N
? What's your project's name? raci-matrix
? In which directory is your code located? ./
```

## Step 5: Add Environment Variables via CLI

You can add environment variables using the CLI:

```bash
# Add production environment variables
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NODE_ENV production

# Add preview environment variables (for PR previews)
vercel env add DATABASE_URL preview
vercel env add DIRECT_URL preview

# Add development environment variables
vercel env add DATABASE_URL development
vercel env add DIRECT_URL development
```

When prompted, paste the values from your `.env.production` file.

### Or Add All at Once via Script

```bash
#!/bin/bash

# Add all environment variables to production
vercel env add DATABASE_URL production < <(echo "$DATABASE_URL")
vercel env add DIRECT_URL production < <(echo "$DIRECT_URL")
vercel env add NODE_ENV production < <(echo "production")

# Add optional variables if you have them
# vercel env add UPSTASH_REDIS_REST_URL production < <(echo "$UPSTASH_REDIS_REST_URL")
# vercel env add UPSTASH_REDIS_REST_TOKEN production < <(echo "$UPSTASH_REDIS_REST_TOKEN")
```

## Step 6: Verify Deployment

After deployment completes, you'll see:

```
✅ Production: https://raci-matrix.vercel.app [Ready]
📝 Inspect: https://vercel.com/your-name/raci-matrix/...
```

Visit the URLs to verify:
1. Main app: `https://raci-matrix.vercel.app`
2. Health check: `https://raci-matrix.vercel.app/api/health`

## Quick Deploy Script

For subsequent deployments, you can use this simple command:

```bash
# Deploy to production
vercel --prod

# Or preview deployment (without --prod flag)
vercel
```

## Automatic Git Deployments

Once linked, Vercel will automatically deploy:

- **Production**: Every push to `main` branch
- **Preview**: Every pull request
- **Development**: Every push to other branches

To enable automatic deployments, connect your GitHub repository:

```bash
# Link to GitHub
vercel git connect
```

Or do it via the Vercel dashboard: Settings → Git → Connect

## Project Settings via CLI

View project settings:

```bash
vercel project ls
vercel project inspect raci-matrix
```

## Useful CLI Commands

```bash
# List all deployments
vercel ls

# View deployment logs
vercel logs https://raci-matrix.vercel.app

# View environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME production

# Pull environment variables locally
vercel env pull .env.local

# Promote a preview deployment to production
vercel promote https://raci-matrix-git-feature.vercel.app

# Rollback to previous deployment
vercel rollback

# Remove deployment
vercel rm raci-matrix
```

## Troubleshooting

### Build Fails

Check logs:
```bash
vercel logs --follow
```

Common issues:
- Missing environment variables → Add via `vercel env add`
- Database connection fails → Verify DATABASE_URL
- Prisma generate fails → Ensure DATABASE_URL is set

### Environment Variables Not Loading

```bash
# List all env vars
vercel env ls

# Pull them locally to verify
vercel env pull .env.local
cat .env.local
```

### Redeploy After Adding Environment Variables

```bash
vercel --prod --force
```

## Custom Domain

Add a custom domain via CLI:

```bash
vercel domains add yourdomain.com
vercel domains inspect yourdomain.com
```

Or via dashboard: Project Settings → Domains

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) will run on every PR:
- Linting
- Type checking
- Tests
- Build verification

Vercel will deploy previews automatically after CI passes.

## Production Checklist

Before sharing your URL:

- [ ] Production database is set up and accessible
- [ ] All environment variables are configured
- [ ] Health check endpoint returns 200: `/api/health`
- [ ] Authentication works (if applicable)
- [ ] Rate limiting is enabled (optional)
- [ ] Sentry is configured (optional)
- [ ] Custom domain configured (optional)
- [ ] Analytics verified in Vercel dashboard

## Next Steps

1. Share your production URL: `https://raci-matrix.vercel.app`
2. Monitor in Vercel dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
3. Set up custom domain (optional)
4. Configure DNS records (if using custom domain)
5. Monitor errors in Sentry (if configured)

---

**Your app is now live!** Share the production URL with your team.
