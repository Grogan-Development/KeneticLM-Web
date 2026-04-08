# Railway Deployment Guide

## Prerequisites

1. **GitHub Repository**: Push this code to `grogan-development/KeneticLM-Web`
2. **Railway Account**: Sign up at https://railway.app
3. **API Keys**:
   - MiniMax Token Plan API Key (https://platform.minimax.io/user-center/basic-information/interface-key)
   - Daytona API Key (https://app.daytona.io/dashboard/settings/api-keys)

## Step-by-Step Deployment

### 1. Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: AI Code Editor with MiniMax and Daytona"

# Add remote (replace with your actual repo URL)
git remote add origin https://github.com/grogan-development/KeneticLM-Web.git

# Push
git push -u origin main
```

### 2. Create Railway Project

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `grogan-development/KeneticLM-Web`
5. Click "Deploy"

### 3. Configure Environment Variables

In Railway Dashboard → Your Project → Variables, add:

```
MINIMAX_API_KEY=your_minimax_token_plan_key_here
MINIMAX_BASE_URL=https://api.minimax.io/anthropic
DAYTONA_API_KEY=your_daytona_api_key_here
DAYTONA_SERVER_URL=https://app.daytona.io/api
DAYTONA_TARGET=us
NEXT_PUBLIC_APP_URL=https://your-railway-domain.up.railway.app
```

### 4. Generate Domain

1. In Railway Dashboard → Your Service → Settings
2. Click "Generate Domain" (or use Custom Domain)
3. Copy the generated URL (e.g., `https://ai-editor-production.up.railway.app`)
4. Update `NEXT_PUBLIC_APP_URL` environment variable with this URL

### 5. Deploy

Railway will automatically deploy when you push to GitHub or click "Deploy" in the dashboard.

## Verification

After deployment, test these endpoints:

1. **Homepage**: `https://your-domain.up.railway.app` - Should show the AI Editor UI
2. **API**: `https://your-domain.up.railway.app/api/chat` (POST request) - Should accept chat messages

## Troubleshooting

### Build Failures

Check the Build Logs in Railway Dashboard:
- Ensure `MINIMAX_API_KEY` is set (build-time error if missing)
- Check for TypeScript errors (ignored in config, but visible in logs)

### Runtime Errors

Check the Deploy Logs:
- Verify all environment variables are set
- Ensure Daytona API key is valid
- Check MiniMax Token Plan is active

### CORS Issues

The API routes already have CORS headers configured in `next.config.ts`. If issues persist:
1. Check `NEXT_PUBLIC_APP_URL` matches your actual domain
2. Verify no trailing slashes in URLs

## Architecture on Railway

```
┌─────────────────────────────────────────┐
│           Railway Cloud                 │
│  ┌───────────────────────────────────┐  │
│  │   Next.js App (AI Editor)         │  │
│  │   - Port: 3000 (auto-configured)  │  │
│  │   - Domain: *.railway.app         │  │
│  │                                   │  │
│  │   ┌──────────────────────────┐   │  │
│  │   │   Chat API Route         │   │  │
│  │   │   - Anthropic SDK        │   │  │
│  │   │   → MiniMax Token Plan   │   │  │
│  │   └──────────────────────────┘   │  │
│  │                                   │  │
│  │   ┌──────────────────────────┐   │  │
│  │   │   Daytona SDK           │   │  │
│  │   │   → Create Sandboxes    │   │  │
│  │   │   → File Operations     │   │  │
│  │   │   → Command Execution   │   │  │
│  │   └──────────────────────────┘   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   Daytona Cloud      │
        │   - User Sandboxes    │
        │   - File Storage      │
        │   - Process Execution │
        └──────────────────────┘
```

## Updates

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Railway will automatically redeploy.

## Support

- Railway Docs: https://docs.railway.app
- MiniMax Docs: https://platform.minimax.io/docs
- Daytona Docs: https://daytona.io/docs
