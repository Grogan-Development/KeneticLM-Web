# Pre-Deployment Checklist

## Required Environment Variables

Ensure these are set in Railway Dashboard before first deploy:

- [ ] `MINIMAX_API_KEY` - Your MiniMax Token Plan API key
- [ ] `MINIMAX_BASE_URL` - Set to `https://api.minimax.io/anthropic`
- [ ] `DAYTONA_API_KEY` - Your Daytona API key
- [ ] `DAYTONA_SERVER_URL` - Set to `https://app.daytona.io/api`
- [ ] `DAYTONA_TARGET` - Set to `us` (or your preferred region)
- [ ] `NEXT_PUBLIC_APP_URL` - Will be updated after Railway generates domain

## Files to Verify

- [ ] `package.json` - Has correct Node version and start script
- [ ] `railway.json` - Railway configuration present
- [ ] `next.config.ts` - Has CORS headers and build config
- [ ] `.env.local.example` - Documents all required env vars
- [ ] `DEPLOYMENT.md` - Full deployment guide available

## Build Verification

- [ ] Local build passes: `npm run build`
- [ ] No critical errors in console
- [ ] All dependencies installed

## GitHub Repository

- [ ] Repository created: `grogan-development/KeneticLM-Web`
- [ ] All files committed and pushed
- [ ] `.gitignore` excludes node_modules and .env files
- [ ] README.md explains the project

## Railway Setup

- [ ] Railway project created from GitHub repo
- [ ] Environment variables configured
- [ ] Domain generated
- [ ] Deploy triggered

## Post-Deployment Tests

- [ ] Homepage loads without errors
- [ ] AI chat responds (test with a simple message)
- [ ] Sandbox is created automatically on first visit
- [ ] No CORS errors in browser console

## Notes for grogan-development/KeneticLM-Web

**Repo URL**: https://github.com/grogan-development/KeneticLM-Web

**Tech Stack**: Next.js 15 + MiniMax M2.7 + Daytona Sandboxes

**Key Features**:
- AI-powered code editor with streaming chat
- Isolated Daytona sandboxes for each session
- File explorer, Monaco editor, terminal panel, web preview
- Hardcoded AI tools for file operations and command execution

**Deployment**: Automatic via Railway on push to main branch
