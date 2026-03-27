# Plan: Live Coaching Agents on dan-lifestyle

## Goal
Add an Express backend so the 6 coaching agents (coach, james, andrew, naval, ali, rory) are active on the live site — not just in Claude Code terminal sessions.

## Current State (Option B — static PWA)
- Static Alpine.js PWA served from `app/`
- Supabase direct from browser (REST API, anon key)
- Coach view exists but only shows static `coachMessages` array — no AI behind it
- Deployed via Vercel static (`vercel.json` → `outputDirectory: "app"`)
- Agents exist as `.claude/agents/*.md` — Claude Code only

## Target State (Option A — agent-powered)
- Express server serves `app/` as static AND provides `/api/chat` endpoint
- Frontend coach view gets a chat input → picks a coach → streams response via SSE
- Each agent's system prompt is loaded from `.claude/agents/*.md` frontmatter + body
- Deploy to **Render** (always-on, avoids Vercel cold starts)

---

## Architecture

```
Browser (Alpine.js PWA)
    |
    | POST /api/chat { coach: "james", message: "..." }
    | ← SSE stream (text/event-stream)
    v
Express Server (server.js)
    |
    +-- GET /* → static files from app/
    |
    +-- POST /api/chat
    |     ├── Load agent prompt from agents/*.md
    |     ├── Build messages array (system prompt + conversation)
    |     ├── Call Claude API (streaming)
    |     └── Pipe SSE chunks to browser
    |
    +-- GET /api/agents → list available coaches
    |
    +-- (future) POST /api/skills/:name → trigger /checkin, /sunday, etc.
    |
    +-- Supabase stays direct from browser (no change)
```

## Files to Create

| File | Purpose |
|------|---------|
| `package.json` | Express, @anthropic-ai/sdk, dotenv, gray-matter |
| `server.js` | Express entry: static serving + API routes |
| `server/routes/chat.js` | POST /api/chat — agent routing + SSE streaming |
| `server/routes/agents.js` | GET /api/agents — list coaches with metadata |
| `server/services/agent-loader.js` | Parse .claude/agents/*.md → { name, description, systemPrompt } |
| `server/services/claude.js` | Claude SDK wrapper, streaming helper |
| `.env.example` | ANTHROPIC_API_KEY, PORT, ACCESS_PASSWORD |

## Files to Modify

| File | Change |
|------|--------|
| `app/index.html` | Add chat input to Coach view, wire SSE listener |
| `app/js/app.js` | Add `sendToCoach()`, `streamResponse()`, coach picker state |
| `app/css/styles.css` | Chat bubble styles, typing indicator |
| `vercel.json` | Remove (switching to Render) or update for serverless |

## Implementation Steps

### 1. Backend scaffold
```bash
npm init -y
npm install express @anthropic-ai/sdk dotenv gray-matter cors
```

### 2. Agent loader (`server/services/agent-loader.js`)
- Read all `.claude/agents/*.md` files
- Parse YAML frontmatter (name, description, model) with gray-matter
- Extract markdown body as system prompt
- Cache on startup, expose `getAgent(name)` and `listAgents()`

### 3. Chat route (`server/routes/chat.js`)
```
POST /api/chat
Body: { coach: "james", messages: [{ role: "user", content: "..." }] }
Response: SSE stream
```
- Load agent system prompt via agent-loader
- Prepend CLAUDE.md coaching philosophy as meta-system context
- Call Claude API with streaming
- Pipe `content_block_delta` events as SSE `data:` lines
- Send `[DONE]` event on stream end
- Model: use agent's frontmatter `model` field (opus for rory, sonnet for others → map to claude-sonnet-4-6 / claude-opus-4-6)

### 4. Agents list route (`server/routes/agents.js`)
```
GET /api/agents
Response: [{ name, description, color }]
```
Coach colors (from existing index.html):
- James: #3b82f6, Andrew: #22c55e, Naval: #a78bfa
- Ali: #f59e0b, Rory: #ec4899, Coach: #94a3b8

### 5. Frontend: Coach view upgrade
Current coach view shows static messages. Upgrade to:
- Coach selector pills at top (tap to pick who you're talking to)
- Chat input at bottom (text + send button)
- Message bubbles: user on right, coach on left (with coach name + color)
- SSE streaming: text appears word-by-word
- Conversation stored in Alpine state (not persisted to Supabase initially)
- Auto-scroll to bottom on new messages

### 6. Auth gate (optional)
- Same pattern as Command Centre: `ACCESS_PASSWORD` env var, cookie-based
- Or skip for now since Supabase anon key is already exposed (single user app)

### 7. Conversation context
Each chat call sends:
1. **System prompt**: agent's .md file content
2. **Coaching context**: latest daily_log, active habits, active experiment (fetched from Supabase server-side OR passed from frontend)
3. **Conversation history**: last N messages in the current session

### 8. Deploy to Render
- `render.yaml` or manual: Node.js, `npm start`, env vars
- Always-on (no cold starts)
- Env: `ANTHROPIC_API_KEY`, `ACCESS_PASSWORD`, `PORT`

## Cost Considerations
- Claude API calls per coach interaction (~500-2000 tokens per exchange)
- Rory on Opus is expensive — consider Sonnet for interactive chat, Opus only for /sunday deep analysis
- Rate limit: add simple in-memory rate limiter (max 30 messages/hour)

## What Stays the Same
- Supabase direct from browser — no change to data layer
- Log view and Status view — no change
- All existing app.js logic — additive only
- PWA offline support — service worker unchanged (chat requires online)

## Future: Skills as API
Once the backend exists, skills (/checkin, /meals, /sunday) can become API endpoints:
```
POST /api/skills/checkin → runs the checkin flow server-side
POST /api/skills/sunday → triggers Rory's weekly analysis
```
This is Phase 2 — get interactive chat working first.
