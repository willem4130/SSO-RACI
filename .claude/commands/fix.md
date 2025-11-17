---
name: fix
description: Run typechecking and linting, then spawn parallel agents to fix all issues
---

# Project Code Quality Check

Run all quality checks, collect errors, and spawn parallel agents to fix them.

## Step 1: Run Quality Checks

```bash
npm run typecheck
npm run lint
```

## Step 2: Parse Errors

Group errors by domain:
- **Type errors**: TypeScript compilation issues
- **Lint errors**: ESLint violations
- **Format errors**: Prettier formatting issues

Create a list of all files with issues and their specific problems.

## Step 3: Spawn Parallel Agents

**IMPORTANT**: Use a SINGLE response with MULTIPLE Task tool calls to run agents in parallel.

For each domain with issues, spawn an agent:
- **type-fixer** agent: Fix TypeScript errors
- **lint-fixer** agent: Fix ESLint violations
- **format-fixer** agent: Run `npm run format` to fix formatting

Each agent should:
1. Receive list of files and specific errors
2. Fix all errors in their domain
3. Run the check command to verify
4. Report completion

## Step 4: Verify All Fixes

After all agents complete, run full check:

```bash
npm run typecheck && npm run lint
```

Ensure all issues are resolved.
