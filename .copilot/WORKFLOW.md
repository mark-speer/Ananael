# Ananael Development Workflow

**Version**: 1.0  
**Updated**: 2026-09-08

## Overview

All version control operations (branching, merging, syncing, committing) are managed through **GitHub Desktop**. Copilot focuses on code changes, testing, building, and PR creation.

## Workflow: Before → During → After

### Before Session (GitHub Desktop)
1. Open GitHub Desktop
2. Select the **Ananael** repository
3. Click **Current Branch** → select your working branch
4. Open the repository in VS Code or your editor

### During Session (Editor + Copilot)
- Edit code, write tests, build
- Use Copilot for `code-review` (ask: "review my changes")
- Ask Copilot to create a PR when ready: "create a PR"

### After Session (GitHub Desktop)
1. Review changes in GitHub Desktop → **Changes** tab
2. Enter a commit message
3. Click **Commit to [branch]**
4. Click **Push**

---

## Disabled Copilot Skills

The following skills are **disabled** because GitHub Desktop owns these operations:

| Skill | Why Disabled | Alternative |
|-------|---|---|
| `sync` | Use GitHub Desktop: Fetch → Pull | GitHub Desktop buttons |
| `merge` | Use GitHub Desktop: Current Branch → Merge | GitHub Desktop UI |
| `sync-upstream` | Use GitHub Desktop: Rebase UI | GitHub Desktop UI |
| `commit` | Enforces GitHub Desktop workflow | GitHub Desktop commit UI |

---

## Active Copilot Skills

These skills remain available:

- **`code-review`** — Reviews your code changes
- **`create-pr`** — Creates a pull request for your changes
- **`update-pr`** — Updates an existing pull request
- **`create-draft-pr`** — Creates a draft pull request

---

## Common Tasks in GitHub Desktop

### Switch Branches
1. Click **Current Branch** dropdown
2. Select target branch
3. Done — your local files update automatically

### Create a Branch
1. Click **Current Branch** → **New Branch**
2. Enter branch name (e.g., `agents/feature-xyz`)
3. Choose base branch → Create

### Merge a Branch
1. Switch to target branch (e.g., `main`)
2. Click **Current Branch** → **Merge into Current Branch**
3. Select source branch → Confirm

### Sync with Remote (Fetch + Pull)
1. Click **Fetch** button
2. Click **Pull** to merge remote changes

### Push Changes
1. Click **Push** button in top menu

---

## Why GitHub Desktop Primary?

✅ **Clearer**: One tool for version control  
✅ **Safer**: Visual feedback on what changes  
✅ **Focused**: Copilot does code; GitHub Desktop does git  
✅ **Simpler**: No CLI dependencies or worktree complexity  

---

## Need Help?

- **GitHub Desktop**: https://docs.github.com/en/desktop
- **Git**: https://git-scm.com/doc
- **Repository**: https://github.com/mark-speer/Ananael
