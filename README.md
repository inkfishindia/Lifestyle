# Dan Lifestyle PWA

Personal lifestyle tracker — habits, health, nutrition, reading, growth, energy. Built for mobile-first, 30-second daily logging with time-aware context.

## Stack

- **Frontend**: Alpine.js SPA (single `index.html`)
- **Backend**: Supabase (PostgreSQL + REST API, no server needed)
- **Hosting**: Static PWA (GitHub Pages / Vercel / any static host)
- **Offline**: Service worker with cache-first for assets, network-first for API

## Architecture

```
app/
├── index.html          # SPA shell — Alpine.js templates, all views
├── manifest.json       # PWA manifest (standalone, dark theme)
├── sw.js               # Service worker (offline support)
├── css/styles.css      # Dark theme, mobile-first, Command Centre design tokens
├── js/app.js           # Alpine.js app — state, Supabase calls, all logic
└── icons/              # PWA icons (192, 512)
```

No build step. No bundler. Edit and reload.

## Supabase

- **Project**: Dan-agency-yds (repurposed)
- **Region**: ap-south-1 (Mumbai)
- **URL**: `https://ocnpkjgjgyfslgewvqjt.supabase.co`
- **Auth**: Anon key (single user, RLS allows all)
- **Tables**: 14 (9 logging + 5 reference)

## How to Run

```bash
# Local dev — any static server
cd dan-lifestyle
python3 -m http.server 8080
# Open http://localhost:8080/app/

# No npm, no install, no build
```

## Design Principles

1. **Time-aware** — cards show/hide based on hour of day (sleep=morning, habits=9PM+, EOD=10PM+)
2. **30-second floor** — every interaction is one tap. The minimum viable log is 90 seconds.
3. **Auto-save** — every tap writes to Supabase immediately. Toast confirms. No submit buttons on cards.
4. **Drawer forms** — Exercise, Reading, Experience use bottom drawers with explicit Save (multi-field)
5. **Dark theme** — borrowed from YDS Command Centre design tokens
6. **Mobile-first** — 390px target, big tap targets (32px+ dots, 36px+ buttons)

## Coaching System

This PWA is the data layer for the coaching agents defined in `.claude/agents/`. The coaches are:

| Agent | Domain | What they read/write |
|-------|--------|---------------------|
| James Clear | Habits, streaks, identity | `habits`, `habit_logs` |
| Andrew Huberman | Sleep, energy, meals, exercise | `daily_log`, `energy_logs`, `meal_logs`, `exercise_logs` |
| Naval Ravikant | Reading, learning | `reading_items`, `reading_sessions`, `takeaways` |
| Ali Abdaal | Growth, experiences, play | `experience_logs`, `experiments`, `side_quests`, `cringe_budget` |
| Rory Sutherland | Cross-domain patterns, optimization | `daily_log` (meta fields), all tables (read-only analysis) |

## 10x Levers (Wired In)

| # | Lever | Implementation |
|---|-------|---------------|
| 1 | Calendar as Environment | Recurring Google Calendar events (Lunch, Sport, Sacred Peak, Wind Down) |
| 3 | One-Question Check-in | 3 PM push notification: "Energy 1-5?" + lunch/habit reminders |
| 5 | Skip Button Protocol | One-tap Skip + inline "Why?" buttons on habits |
| 10 | HRV on Waking | HRV field in sleep card, color-coded against rolling 14-day baseline |

## Env / Config

All config is hardcoded in `app/js/app.js` (lines 7-8):
- `SUPABASE_URL` — project REST endpoint
- `SUPABASE_KEY` — anon/publishable key

No `.env` file needed. Single user app.
