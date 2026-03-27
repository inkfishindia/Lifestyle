---
name: sunday
description: "Weekly lifestyle review. The most important touchpoint of the week. Use on Sundays or when Dan says 'weekly review', 'how was my week', 'sunday review'. Rory Sutherland (optimizer) runs cross-domain analysis, all coaches contribute. Produces insights, names patterns, recommends ONE adjustment for next week."
user_invocable: true
---

# Sunday — Weekly Lifestyle Review

**Rory Sutherland leads the analysis. All coaches contribute.**

## Flow (10 minutes total)

### Step 1: Fetch Data
Dispatch **data** agent for a weekly snapshot — all 18 queries in one batch.

### Step 2: Dispatch Rory (Optimizer)
Pass the full data snapshot to Rory. He analyzes cross-domain patterns:
- Habit compliance rates (which stuck, which slipped)
- Meal adherence (lunch timing, pre-sport nutrition)
- Energy patterns (which days were high/low and what preceded them)
- Reading progress
- Growth activities
- Cross-domain correlations (keystone habits, cascades, dead zones)

### Step 3: Dispatch Specialists (selective)
Only dispatch a coach if their domain needs attention:
- James if habits are slipping
- Andrew if energy/nutrition is off
- Naval if reading has stalled
- Ali if no growth activity happened

Pass them the SAME data snapshot — they don't re-fetch.

### Step 4: Present Review

```
## Week [X] Review

### The Numbers
| Domain | Score | Trend |
|--------|-------|-------|
| Habits | 5/7 days with 2+ habits | ↑ from 4/7 last week |
| Meals | Lunch on time 6/7 | ↔ steady |
| Energy | 4 high, 2 mid, 1 low | ↑ improving |
| Reading | 3 sessions, 45 pages | ↑ from 0 last week |
| Growth | Tried pottery Saturday | New! |

### Pattern Found
[Rory names the pattern with a memorable label]

### What Worked
- [Specific thing that worked and why]

### What Didn't
- [Specific thing that didn't work + Rory's reframe]

### One Adjustment for Next Week
[Single, specific change framed as a 2-week experiment]
```

### Step 5: Save
- Write weekly report to `data/weekly/YYYY-WXX.md` (local, human-readable)
- Write to `weekly_insights` table in Supabase (structured, queryable)

## Rules
- ONE adjustment per week. Not five. Not three. ONE.
- Name every pattern. Named patterns are sticky.
- Lead with what WORKED before what didn't.
- Frame adjustments as experiments, not permanent changes.
