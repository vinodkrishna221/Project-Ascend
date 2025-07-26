# Ascend Project - GitHub Commands & Workflow Guide

## Table of Contents
- [Initial Setup](#initial-setup)
- [Daily Workflow Commands](#daily-workflow-commands)
- [Branch Management](#branch-management)
- [Collaboration Best Practices](#collaboration-best-practices)
- [Common Scenarios & Solutions](#common-scenarios--solutions)
- [Project-Specific Tips](#project-specific-tips)
- [Troubleshooting](#troubleshooting)

## Initial Setup

### First Time Repository Setup
```bash
# Clone the repository
git clone https://github.com/your-org/ascend.git
cd ascend

# Set up your identity (do this once per machine)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up project-specific configuration
git config user.name "Your Name"
git config user.email "your.work.email@company.com"

# Add upstream remote (if working with forks)
git remote add upstream https://github.com/original-org/ascend.git

# Verify remotes
git remote -v
```

### Project Structure Awareness
Before making changes, understand our project structure:
```
ascend/
├── web/                    # Next.js web application
├── mobile/                 # React Native mobile app
├── shared/                 # Shared code between platforms
├── docs/                   # Documentation
├── .kiro/                  # Kiro AI assistant configuration
│   ├── steering/          # AI guidance files
│   └── specs/             # Feature specifications
└── scripts/               # Build and utility scripts
```

## Daily Workflow Commands

### Starting Your Work Day
```bash
# 1. Switch to main branch
git checkout main

# 2. Pull latest changes from remote
git pull origin main

# 3. Check repository status
git status

# 4. View recent commits
git log --oneline -10

# 5. Create a new feature branch
git checkout -b feature/your-feature-name
```

### During Development
```bash
# Check what files you've modified
git status

# See detailed changes in files
git diff

# See changes for a specific file
git diff path/to/file.tsx

# Add files to staging area
git add .                           # Add all changes
git add path/to/specific/file.tsx   # Add specific file
git add web/src/components/         # Add entire directory

# Commit your changes
git commit -m "feat: add user authentication component

- Implement email verification flow
- Add college domain validation
- Include error handling for invalid domains
- Update tests for auth components"

# Push your branch to remote
git push origin feature/your-feature-name
```

### End of Work Day
```bash
# Make sure all changes are committed
git status

# Push any remaining commits
git push origin feature/your-feature-name

# Optional: Clean up merged branches
git branch --merged | grep -v main | xargs -n 1 git branch -d
```

## Branch Management

### Branch Naming Conventions
Follow these patterns for consistency:

```bash
# Feature branches
git checkout -b feature/user-authentication
git checkout -b feature/post-creation-flow
git checkout -b feature/community-moderation

# Bug fix branches
git checkout -b fix/login-validation-error
git checkout -b fix/mobile-navigation-crash

# Hotfix branches (for urgent production fixes)
git checkout -b hotfix/security-vulnerability

# Documentation branches
git checkout -b docs/api-documentation
git checkout -b docs/setup-instructions

# Kiro spec branches
git checkout -b spec/student-verification-system
git checkout -b spec/guild-election-feature
```

### Working with Branches
```bash
# List all branches
git branch -a

# Switch between branches
git checkout main
git checkout feature/user-auth

# Create and switch to new branch
git checkout -b feature/new-feature

# Delete local branch (after merging)
git branch -d feature/completed-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Rename current branch
git branch -m new-branch-name
```

## Collaboration Best Practices

### Before Starting Work
```bash
# Always start from latest main
git checkout main
git pull origin main

# Check if your feature branch exists remotely
git ls-remote --heads origin feature/your-feature

# If it exists, check it out and pull latest
git checkout feature/your-feature
git pull origin feature/your-feature
```

### Keeping Your Branch Updated
```bash
# Method 1: Merge main into your branch
git checkout feature/your-feature
git merge main

# Method 2: Rebase your branch on main (cleaner history)
git checkout feature/your-feature
git rebase main

# If conflicts occur during rebase:
# 1. Fix conflicts in files
# 2. Add resolved files: git add .
# 3. Continue rebase: git rebase --continue
```

### Creating Pull Requests
```bash
# Push your branch first
git push origin feature/your-feature

# Then create PR through GitHub web interface
# Or use GitHub CLI if installed:
gh pr create --title "Add user authentication system" --body "Implements email verification and college domain validation"
```

## Common Scenarios & Solutions

### Scenario 1: You Made Changes to Wrong Branch
```bash
# If you haven't committed yet
git stash                           # Save your changes
git checkout correct-branch         # Switch to correct branch
git stash pop                       # Apply your changes

# If you already committed
git checkout wrong-branch
git log --oneline -5                # Find your commit hash
git checkout correct-branch
git cherry-pick <commit-hash>       # Apply the commit to correct branch
```

### Scenario 2: Accidentally Committed to Main
```bash
# Reset main to previous state (if you haven't pushed)
git reset --hard HEAD~1

# Create new branch with your changes
git checkout -b feature/your-feature
git cherry-pick <your-commit-hash>
```

### Scenario 3: Need to Undo Last Commit
```bash
# Undo last commit but keep changes
git reset --soft HEAD~1

# Undo last commit and discard changes
git reset --hard HEAD~1

# Undo last commit that was already pushed (creates new commit)
git revert HEAD
```

### Scenario 4: Merge Conflicts
```bash
# When pulling or merging causes conflicts
git status                          # See conflicted files

# Edit conflicted files (look for <<<<<<< markers)
# After resolving conflicts:
git add .
git commit -m "resolve merge conflicts"
```

### Scenario 5: Working on Multiple Features
```bash
# Save current work without committing
git stash push -m "WIP: user authentication"

# Switch to other branch and work
git checkout feature/other-feature

# Come back and restore your work
git checkout feature/user-auth
git stash pop
```

## Project-Specific Tips

### Working with Monorepo Structure
```bash
# Make changes specific to web app
cd web/
git add src/components/auth/
git commit -m "feat(web): add authentication components"

# Make changes specific to mobile app
cd mobile/
git add src/screens/auth/
git commit -m "feat(mobile): add authentication screens"

# Make changes to shared code
cd shared/
git add types/user.ts
git commit -m "feat(shared): add user type definitions"
```

### Working with Kiro Specs
```bash
# When creating new feature specs
git checkout -b spec/new-feature-name
cd .kiro/specs/
mkdir new-feature-spec
# Create requirements.md, design.md, tasks.md
git add .kiro/specs/new-feature-spec/
git commit -m "spec: add new feature specification"
```

### Supabase Schema Changes
```bash
# When updating database schema
git add supabase/migrations/
git commit -m "db: add user verification table

- Add college_student_database table
- Add verification_method enum
- Update profiles table with new fields"
```

### Environment Files
```bash
# Never commit environment files
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# But do commit example files
git add .env.example
git commit -m "docs: add environment variables example"
```

## Advanced Git Commands

### Viewing History and Changes
```bash
# View commit history with graph
git log --graph --oneline --all

# View changes in last 5 commits
git log -p -5

# View files changed in last commit
git show --name-only HEAD

# View changes between branches
git diff main..feature/your-branch

# View changes between commits
git diff HEAD~2..HEAD
```

### Cleaning Up
```bash
# Remove untracked files (be careful!)
git clean -n                        # Preview what will be deleted
git clean -f                        # Delete untracked files
git clean -fd                       # Delete untracked files and directories

# Remove local branches that are merged
git branch --merged | grep -v main | xargs -n 1 git branch -d
```

### Searching in Git
```bash
# Search for text in commit messages
git log --grep="authentication"

# Search for text in code changes
git log -S "function loginUser"

# Search in current files
git grep "TODO" -- "*.tsx"
```

## Troubleshooting

### Common Issues and Solutions

**Issue: "Your branch is ahead of origin/main by X commits"**
```bash
# You have local commits not pushed yet
git push origin your-branch-name
```

**Issue: "Your branch is behind origin/main by X commits"**
```bash
# Remote has new commits you don't have
git pull origin main
```

**Issue: "fatal: not a git repository"**
```bash
# You're not in the project directory
cd path/to/ascend
# Or initialize git if needed
git init
```

**Issue: "Permission denied (publickey)"**
```bash
# Set up SSH key or use HTTPS
git remote set-url origin https://github.com/your-org/ascend.git
```

**Issue: "Merge conflict in file.tsx"**
```bash
# Open the file and look for conflict markers:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> branch-name

# Edit the file to resolve conflicts, then:
git add file.tsx
git commit -m "resolve merge conflict in file.tsx"
```

### Recovery Commands
```bash
# Recover deleted file
git checkout HEAD -- path/to/deleted/file.tsx

# Recover from accidental reset
git reflog                          # Find the commit you want
git reset --hard HEAD@{2}          # Reset to that state

# Recover deleted branch
git reflog                          # Find the branch's last commit
git checkout -b recovered-branch <commit-hash>
```

## Git Aliases for Efficiency

Add these to your `~/.gitconfig` file:
```bash
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    ca = commit -a
    cm = commit -m
    cam = commit -am
    cp = cherry-pick
    df = diff
    dc = diff --cached
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
    last = log -1 HEAD
    unstage = reset HEAD --
    visual = !gitk
    pushf = push --force-with-lease
    amend = commit --amend --no-edit
```

## Team Workflow Summary

### Daily Routine
1. **Morning**: `git checkout main && git pull origin main`
2. **Start Feature**: `git checkout -b feature/feature-name`
3. **Regular Commits**: `git add . && git commit -m "descriptive message"`
4. **End of Day**: `git push origin feature/feature-name`
5. **Feature Complete**: Create Pull Request via GitHub

### Code Review Process
1. Push feature branch: `git push origin feature/feature-name`
2. Create Pull Request on GitHub
3. Address review feedback: Make changes, commit, push
4. After approval: Merge via GitHub (squash and merge recommended)
5. Clean up: `git checkout main && git pull origin main && git branch -d feature/feature-name`

### Emergency Hotfix Process
1. `git checkout main && git pull origin main`
2. `git checkout -b hotfix/critical-fix`
3. Make minimal fix and test
4. `git commit -m "hotfix: fix critical issue"`
5. `git push origin hotfix/critical-fix`
6. Create PR with "HOTFIX" label for immediate review

Remember: **Always test your changes locally before pushing, and never push directly to main branch!**

## Getting Help

- **Git Documentation**: `git help <command>` or `man git-<command>`
- **GitHub CLI Help**: `gh help` or `gh <command> --help`
- **Project-Specific Questions**: Check our `DEVELOPMENT_GUIDE.md`
- **Team Communication**: Use our designated Slack/Discord channel for Git questions

Happy coding! 🚀