# AI Code Editor with Daytona Sandboxes

A stunning AI-first code editor built with Next.js, Anthropic SDK for MiniMax Token Plan, AI Elements, and Daytona sandboxes for isolated development environments.

## Features

- **AI Chat Assistant**: Streaming AI conversations powered by MiniMax M2.7 model
- **Daytona Sandboxes**: Isolated development environments (1 vCPU, 1GB RAM, 3GB disk)
- **File Explorer**: Visual file tree for browsing sandbox files
- **Code Editor**: Monaco Editor with syntax highlighting
- **Terminal**: Integrated terminal (placeholder for PTY integration)
- **Web Preview**: Preview running applications from sandbox
- **AI Tools**: Hardcoded tools for file operations, command execution, code running, Git operations

## Architecture

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS 4 + shadcn/ui
- **AI Components**: AI Elements component library
- **AI Provider**: MiniMax Token Plan via Anthropic-compatible API
- **Sandbox Infrastructure**: Daytona.io SDK
- **AI Tools**: Hardcoded tools calling Daytona Toolbox API (NOT MCP)
- **Deployment**: Railway-ready

## How It Works

1. User opens the editor → Next.js app creates a Daytona sandbox via SDK
2. Sandbox provides: file system, process execution, PTY terminal, Git, preview URLs
3. AI assistant uses MiniMax M2.7 model via Token Plan API
4. User projects/code live inside Daytona sandboxes, not on Railway
5. Web preview uses Daytona's proxy URLs (`{port}-{sandboxId}.proxy.daytona.io`)

## Getting Started

### Prerequisites

- Node.js 18+
- MiniMax Token Plan subscription + API Key (get from https://platform.minimax.io/subscribe/token-plan)
- Daytona API Key (get from https://app.daytona.io/dashboard/settings/api-keys)

### Installation

1. Navigate to the project:
   ```bash
   cd /Users/zgrogan/Repos/KeneticLM-Web
   ```
2. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
3. Add your API keys to `.env.local`
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

```env
# MiniMax Token Plan API
# Get from https://platform.minimax.io/user-center/basic-information/interface-key
MINIMAX_API_KEY=your_minimax_token_plan_key_here
MINIMAX_BASE_URL=https://api.minimax.io/anthropic

# Daytona
DAYTONA_API_KEY=your_daytona_api_key_here
DAYTONA_SERVER_URL=https://app.daytona.io/api
DAYTONA_TARGET=us
```

**Important**: MiniMax Token Plan API Keys are different from pay-as-you-go API Keys and only work during active subscription periods.

## Deployment (Railway)

1. Push to GitHub
2. Connect Railway to your repository
3. Add environment variables in Railway dashboard
4. Deploy

## AI Tools

The AI assistant has these hardcoded tools:

| Tool | Description |
|------|-------------|
| `listFiles` | List files in a directory |
| `readFile` | Read file contents |
| `writeFile` | Write content to a file |
| `createDirectory` | Create a directory |
| `executeCommand` | Execute shell commands |
| `codeRun` | Execute code snippets |
| `gitClone` | Clone Git repositories |
| `getPreviewUrl` | Get preview URLs for running services |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui, AI Elements, Tailwind CSS 4 |
| AI | Anthropic SDK → MiniMax Token Plan API |
| Model | MiniMax-M2.7 |
| Sandboxes | Daytona TypeScript SDK |
| Editor | Monaco Editor |
| Deployment | Railway |

## Project Structure

```
app/
├── page.tsx              # Main editor UI
├── layout.tsx            # Root layout
├── api/
│   └── chat/route.ts     # AI chat API using Anthropic SDK
components/
├── ai-elements/          # AI Elements components
├── ui/                   # shadcn/ui components
lib/
├── daytona.ts           # Daytona SDK client
├── ai/
│   ├── minimax.ts       # MiniMax Anthropic SDK client
│   └── tools.ts         # AI tool definitions
```

## License

MIT
