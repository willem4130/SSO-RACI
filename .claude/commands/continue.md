---
name: continue
description: Document session state and generate continuation prompt for seamless resumption
---

# Session Continuation

## Current State Summary

**Context Usage:** Check `/context` to see current token usage

**Completed Tasks:**
- List all completed tasks from TodoWrite
- Highlight major milestones achieved
- Note any blockers or issues encountered

**In-Progress Tasks:**
- Current task being worked on
- Files currently being modified
- Any pending operations

**Next Steps:**
- Immediate next tasks from TodoWrite
- Dependencies or prerequisites
- Expected deliverables

## Files Modified This Session

List all files created/modified:
1. `path/to/file.ts` - Description of changes
2. `path/to/file2.tsx` - Description of changes

## Key Decisions Made

- Architecture choices
- Library selections
- Implementation patterns chosen

## Continuation Prompt

Generate a comprehensive prompt for the next session:

```
Continue implementing the RACI Matrix Application from where we left off.

**Completed:**
[List completed items]

**Current Focus:**
[Current task with context]

**Next Steps:**
1. [Immediate next task]
2. [Following task]
3. [etc.]

**Important Context:**
- [Any critical information to remember]
- [Pending decisions]
- [Known issues]

**Code Quality:**
- Run `/fix` if any linting/type errors
- Run `/commit` after significant milestones
- Maintain zero-tolerance quality standard

Continue implementation following the CLAUDE.md guidelines and the phased rollout plan.
```

## Export State

Save current state:
```bash
git status
git diff --stat
```

Ensure all work is committed or documented for safe continuation.
