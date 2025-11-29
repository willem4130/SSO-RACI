# Login Information

## Production URL

**https://raci-matrix.vercel.app**

## Authentication Options

### Option 1: Create Your Own Account (Recommended)

1. Go to: **https://raci-matrix.vercel.app/signup**
2. Fill in the signup form:
   - **Name**: Your name
   - **Email**: Any email address (no verification required)
   - **Password**: Minimum 8 characters
3. Click "Sign Up"
4. You'll be automatically logged in

### Option 2: Demo Credentials

For testing purposes, you can use the demo account:

```
Email:    demo@raci.app
Password: password123
```

**Login URL**: https://raci-matrix.vercel.app/login

## What You'll Find

After logging in, you'll have access to:

- **Dashboard** - Overview of your organizations and projects
- **Demo Organization** - "Demo Organization" with sample data
- **Sample Project** - "Sample Project" in the Engineering department
- **RACI Matrix** - "Project Kickoff RACI" with 3 sample tasks
- **Sample Tasks**:
  - Project Planning (Not Started, High Priority)
  - Requirements Gathering (In Progress, High Priority)
  - Design Review (Not Started, Medium Priority)

## Database Information

**Current Setup**: SQLite (in-memory on Vercel)
- Data is **ephemeral** - resets on each deployment
- For persistent data, you'll need to set up PostgreSQL

### Setting Up Persistent Database

1. Create a PostgreSQL database:
   - **Vercel Postgres**: `vercel storage create postgres`
   - Or use: Neon, Supabase, Railway, etc.

2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

3. Set environment variables in Vercel:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add DIRECT_URL production
   ```

4. Run migrations:
   ```bash
   npm run db:push
   npm run db:seed  # To create demo data
   ```

## Security Note

The demo credentials are for testing only. For production use:
- Create your own account with a strong password
- Set up a proper PostgreSQL database
- Consider adding two-factor authentication
- Enable rate limiting with Upstash Redis

## Features Available

✅ User authentication (signup/login/logout)
✅ Multi-tenant organizations
✅ Project management
✅ RACI matrix creation
✅ Task assignment with RACI roles
✅ Real-time collaboration (when configured)
✅ Comments and mentions
✅ Export to PDF/Excel
✅ Template library
✅ Analytics dashboard

## Need Help?

- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment details
- See [DEPLOY_CLI.md](./DEPLOY_CLI.md) for CLI commands
- Read [README.md](./README.md) for project overview

---

**Enjoy using your RACI Matrix application!** 🎉
