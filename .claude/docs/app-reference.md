# App Reference — Dan Lifestyle PWA

Full inventory of the app. Read this before building anything.

## Project Boundary

This is **dan-lifestyle** — a standalone PWA. It has NO relationship to:

| Other Project | Stack | Data Store | Location |
|--------------|-------|-----------|----------|
| yds-command-centre | Express + Alpine.js + Notion + Claude | Notion + Google Sheets | `market/yds-command-centre/` |
| yds-factory-os | (TBD) | (TBD) | `market/yds-factory-os/` |
| Colin (dan/) | Claude Code agents | Markdown files | `market/dan/` |

**This app**: Static PWA (no server) + Alpine.js + **Supabase** (PostgreSQL). No Notion, no Express, no Claude API. CSS was forked from Command Centre — zero runtime dependency.

## File Map

```
app/
├── index.html              # 230 lines — SPA shell, all views and drawers
├── manifest.json           # PWA config (standalone, #0a0a0a theme)
├── sw.js                   # Service worker — cache-first assets, network-first API
├── css/styles.css          # 420 lines — dark theme, all components
├── js/app.js               # 600 lines — Alpine.js app, Supabase REST, all logic
└── icons/                  # PWA icons (empty — needs 192 + 512 PNGs)

.claude/
├── agents/                 # coach.md, james.md, andrew.md (+ naval, ali, rory TBD)
├── docs/app-reference.md   # THIS FILE
├── rules/                  # (empty)
└── skills/                 # checkin, experiment, grow, log, meals, push, read, sunday

data/                       # JSON data dirs (legacy — now in Supabase)
├── daily/
├── weekly/
├── strategies/
└── sessions/

knowledge/                  # Coach knowledge base
├── INDEX.md
├── bangalore.md, coaching-principles.md, dan-profile.md
├── frameworks.md, growth.md, habits.md, meals.md, reading.md, routines.md
└── research/
```

## Supabase Schema (14 tables)

### Logging Tables (Dan writes these)

| Table | Key Fields | Frequency | Card |
|-------|-----------|-----------|------|
| `daily_log` | date (UNIQUE), sleep_start/end, sleep_quality (1-3), sleep_hours (generated), morning_sunlight, caffeine_first/last, hot_shower_before_bed, water_litres, electrolytes, day_type, decision_load (1-5), mood_word, highlight, override_used/reason, friction_log, week_satisfaction (1-10), hrv_morning (1-200) | 1/day | Sleep, EOD |
| `energy_logs` | date, slot (morning/afternoon/evening), energy/mood/focus (1-5) | 3/day | Right Now |
| `meal_logs` | date, slot (breakfast/lunch/pre_sport/dinner/late_snack), logged_time, protein (low/med/high), was_junk | 3-5/day | Meals |
| `habit_logs` | habit_id (FK), date, did_it (bool), floor_used (bool), miss_type (forgot/no_time/low_energy/external/planned_skip) | per habit/day | Habits |
| `exercise_logs` | date, exercise_type, duration_min, intensity (light/moderate/hard), pre/post_meal flags | per session | Drawer |
| `reading_sessions` | item_id (FK), date, time_slot, duration_min, progress_before/after, energy_before | per session | Drawer |
| `experience_logs` | date, name, category, venue, cost_inr, solo_or_social, energy_after, fun_score, would_repeat, first_time, note | per event | Drawer |
| `podcast_logs` | date, show, episode_title, context, captured_takeaway, takeaway_text | per listen | (no UI yet) |
| `takeaways` | item_id (FK), takeaway_text, applied_to, applied_date | max 3/book | (no UI yet) |

### Reference Tables (system/coach managed)

| Table | Key Fields | Constraint |
|-------|-----------|------------|
| `habits` | name, identity_statement, standard_version, floor_version, cue, reward, status, phase | Max 3 active (app-enforced) |
| `reading_items` | title, author, format, category, status, progress_pct, worth_rereading, connected_to | Master book registry |
| `experiments` | name, category, started_date, review_date, success_criteria, status, outcome | 2-week trials |
| `side_quests` | name, venue, category, cost_inr, scheduling, why_dan, priority, status | Ali-curated queue |
| `cringe_budget` | month, what, cringe_level (1-5), survived | 4 credits/month |

### Constraints & Indexes

- `daily_log.date` — UNIQUE
- `energy_logs(date, slot)` — UNIQUE
- `meal_logs(date, slot)` — UNIQUE
- `habit_logs(habit_id, date)` — UNIQUE
- All tables: RLS enabled, `allow_all` policy (single user)
- Indexes on `date DESC` for all logging tables
- `sleep_hours` is a GENERATED column (computed from sleep_start/end, handles overnight)

## Views

### Log View (`view === 'log'`)

Time-aware cards. `showAllCards` toggle overrides time filtering.

| Card | Shows When | Fields |
|------|-----------|--------|
| Alert Banner | Yesterday had a habit miss | "Never miss twice — [floor version]" |
| Sleep Last Night | 7 AM - 2 PM | sleep_start, sleep_end, sleep_quality, morning_sunlight, hrv_morning |
| Right Now (Energy) | Always | energy, mood, focus (dot selectors 1-5) |
| Habits | 9 PM - 3 AM | per active habit: ✓ button, Skip button, floor toggle, miss_type selector |
| Meals | Always | 5 slots, protein level buttons, junk toggle |
| End of Day | 10 PM - 3 AM | day_type, decision_load, mood_word, highlight |
| Caffeine | After 2 PM | caffeine_first, caffeine_last |

### Dashboard View (`view === 'dash'`)

Single-screen overview. All widgets.

| Widget | Data Source | Layout |
|--------|-----------|--------|
| Sleep | daily_log | Value + quality dot + debt |
| Energy | energy_logs (today) | Sparkline of readings |
| Cascade Risk | meal_logs + energy_logs | Traffic light (green/amber/red) |
| Habits 7-day | habit_logs (week) | Per-habit streak grid + weekly votes |
| Now Reading | reading_items + reading_sessions | Title + progress bar + last session |
| Last Side Quest | experience_logs | Name + days ago + cringe budget dots |
| Weekly Domino | (computed) | Rory's pattern text |
| Routine/Disrupted | daily_log.day_type + habit compliance | Two percentage widgets |
| Week Satisfaction | daily_log.week_satisfaction | Sparkline trend (8 weeks) |

### Drawers (bottom sheets)

| Drawer | Trigger | Fields | Save button |
|--------|---------|--------|-------------|
| Exercise | "+ Exercise" quick-add | type (6 options), duration, intensity | Yes |
| Reading | "+ Reading" quick-add | book (select), duration, progress % | Yes |
| Experience | "+ Experience" quick-add | name, category (6), energy, fun, solo/social | Yes |

## Alpine.js State (`app.js`)

### Reactive Properties

| Property | Type | Purpose |
|----------|------|---------|
| `view` | `'log'` / `'dash'` | Current view |
| `drawer` | `null` / `'exercise'` / `'reading'` / `'experience'` | Open drawer |
| `showAllCards` | bool | Override time-aware filtering |
| `toast` | `{ show, message, error }` | Save feedback pill |
| `today` | object | Current day's `daily_log` row |
| `energyReadings` | array | Today's energy_logs |
| `currentEnergy` | object | Current slot's energy/mood/focus |
| `activeHabits` | array | Habits where status=active |
| `habitLogs` | array | Today's habit_logs |
| `weekHabitLogs` | array | Last 7 days habit_logs |
| `skipReasonHabitId` | uuid/null | Which habit is showing skip reason buttons |
| `weeklyVotes` | number | Count of did_it=true this week |
| `hrvBaseline` | number | Rolling 14-day HRV average |
| `mealLogs` | array | Today's meal_logs |
| `activeBooks` | array | reading_items where status=active |
| `stats` | object | Dashboard computed stats |
| `alerts` | array | Log view alert banners |
| `dashAlerts` | array | Dashboard alert banners |
| `exerciseForm` | object | Exercise drawer form state |
| `readingForm` | object | Reading drawer form state |
| `expForm` | object | Experience drawer form state |

### Key Methods

| Method | What it does |
|--------|-------------|
| `init()` | Register SW, request notifications, load all data, compute alerts/HRV |
| `shouldShow(card)` | Time-aware card visibility (returns bool) |
| `flash(msg, isError)` | Show save toast for 1.2s |
| `loadDailyLog()` | Fetch or create today's daily_log row |
| `loadEnergy()` | Fetch today's energy readings |
| `loadHabits()` | Fetch active habits + today's + week's habit logs |
| `loadMeals()` | Fetch today's meal logs |
| `loadBooks()` | Fetch active reading items |
| `loadStats()` | Compute all dashboard stats (sleep, energy, cascade, reading, experience, compliance, satisfaction) |
| `saveDailyField(field)` | PATCH one field on today's daily_log |
| `setSleepQuality(val)` | Set sleep quality 1-3 |
| `toggleDaily(field)` | Toggle a boolean field on daily_log |
| `setEnergy(field, val)` | Upsert energy/mood/focus for current slot |
| `toggleHabit(habitId)` | Mark habit done (insert or toggle) |
| `skipHabit(habitId)` | Mark habit skipped + show reason buttons |
| `toggleFloor(habitId)` | Toggle floor version on a completed habit |
| `setMissType(val)` | Save skip reason and close reason buttons |
| `logMeal(slot, protein)` | Log or update a meal's protein level |
| `toggleMealJunk(slot)` | Toggle junk flag on a meal |
| `saveExercise()` | Save exercise drawer form |
| `saveReading()` | Save reading drawer form + update book progress |
| `saveExperience()` | Save experience drawer form |
| `computeAlerts()` | Check yesterday's habit misses for Never Miss Twice |
| `computeDashAlerts()` | Same for dashboard view |
| `computeHrvBaseline()` | Rolling 14-day HRV average |
| `requestNotifications()` | Ask for browser notification permission |
| `scheduleCheckin()` | Schedule 3 PM energy, 12:10 PM lunch, 11:30 PM habit notifications |

### Supabase REST Helper (`sb`)

Lightweight wrapper — no SDK, just fetch.

| Method | HTTP | Usage |
|--------|------|-------|
| `sb.query(table, params)` | GET | Read with filters |
| `sb.upsert(table, data)` | POST (merge-duplicates) | Insert or update on conflict |
| `sb.insert(table, data)` | POST | Insert new row |
| `sb.update(table, id, data)` | PATCH | Update by id |

### Helpers

| Function | Purpose |
|----------|---------|
| `todayStr()` | Local date as YYYY-MM-DD (IST, not UTC) |
| `currentHour()` | Current hour (0-23) |
| `daysAgo(dateStr)` | Days between dateStr and today |
| `dayLabels()` | Last 7 days as `[{date, label}]` for streak grids |

## CSS Architecture (`styles.css`)

### Design Tokens (`:root`)

```
--bg-primary: #0a0a0a      --text-primary: #e5e5e5
--bg-secondary: #111111    --text-secondary: #888888
--bg-card: #161616         --text-muted: #666666
--bg-hover: #1c1c1c        --accent: #3b82f6
--bg-input: #1a1a1a        --green: #22c55e
--border: #222222          --amber: #f59e0b
--border-light: #2a2a2a    --red: #ef4444
--radius: 12px             --radius-sm: 8px
```

### Component Classes

| Class | Purpose |
|-------|---------|
| `.container` | Max 430px centered, 16px padding |
| `.header` | Sticky top bar with title + nav tabs |
| `.card` | Dark card with border, 12px radius |
| `.card-title` | Uppercase 11px label |
| `.card-badge` | Pill badge (e.g. "8.4h", "1/21 votes") |
| `.alert` / `.alert-red/amber/green` | Conditional banner |
| `.dot-row` / `.dot-group` / `.dot` | Energy/mood/focus selectors |
| `.toggle-btn` / `.toggle-row` | Toggle buttons (quality, sunlight, etc.) |
| `.habit-row` / `.habit-check` / `.habit-floor` | Habit logging row |
| `.habit-check.skip` | Skip button (Lever #5) |
| `.time-input` / `.time-row` | Time pickers |
| `.select` / `.text-input` | Form inputs |
| `.quick-add` / `.quick-add-btn` | Fixed bottom bar |
| `.nav-tab` | Header tab buttons |
| `.widget-grid` / `.widget` | Dashboard grid |
| `.widget-full` | Full-width widget |
| `.streak-grid` / `.streak-cell` | 7-day habit grid |
| `.sparkline` / `.spark-bar` | Mini bar chart |
| `.progress-bar` / `.progress-fill` | Reading progress |
| `.drawer-overlay` / `.drawer` | Bottom sheet drawers |
| `.save-toast` | Save confirmation pill |
| `.status-dot` | Colored dot (green/amber/red) |

## Notifications (Lever #3)

Scheduled via `setTimeout` on app init (re-fires daily via `setInterval`):

| Time | Notification | Condition |
|------|-------------|-----------|
| 12:10 PM | "Eat something now" | Lunch not logged |
| 3:00 PM | "Energy check — 1 tap" | Always |
| 11:30 PM | "Habits not logged yet" | Any habit unlogged |

Requires browser notification permission (requested on first load).

## Google Calendar Events (Lever #1)

Recurring events on danish@yourdesignstore.in:

| Event | Schedule | Color | Reminder |
|-------|----------|-------|----------|
| Lunch | Daily 12:30-1:00 PM | Basil (green) | 20 min before |
| Sport Time | MWF 5:00-7:00 PM | Peacock (teal) | 30 min before |
| Sacred Peak — Build | Daily 9:30 PM-2:00 AM | Blueberry | 5 min before |
| Wind Down | Daily 2:00-2:30 AM | Graphite | 10 min before |

## What's NOT Built Yet

| Feature | Spec exists | Priority |
|---------|------------|----------|
| Podcast logging UI | Yes (table exists) | Low |
| Takeaways UI | Yes (table exists) | Medium |
| Location awareness | Spec'd but no code | Medium |
| Offline queue + sync | SW caches but no queue for failed writes | High |
| Weekly review (/sunday) | Spec'd in CLAUDE.md | High |
| Computed compliance (routine vs disrupted) | Placeholder random values | Medium |
| Streak computation view | Schema supports, no DB view | Medium |
| PWA icons | Directory exists, no PNGs | Low |
| Hosting (GitHub Pages / Vercel) | Not deployed yet | High |
