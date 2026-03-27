---
name: status
description: "Quick dashboard across all lifestyle domains. Use when Dan says 'status', 'dashboard', 'where am I', 'how am I doing', or wants a snapshot without a full review. Reads current state from all knowledge files and recent daily logs."
user_invocable: true
---

# Status — Quick Dashboard

**Coach handles directly. No agent dispatch. Fast.**

## Flow

1. Read current state from:
   - `knowledge/habits.md` — active habits, streaks
   - `knowledge/reading.md` — current reads, queue size
   - `knowledge/meals.md` — current plan status
   - `knowledge/growth.md` — last activity, what's next
   - `data/daily/` — last 3-5 daily logs for trends
   - `data/strategies/experiments.md` — active experiments

2. Present:

```
## Lifestyle Dashboard

| Domain | Status | Streak/Trend | Next Action |
|--------|--------|-------------|-------------|
| Habits | 2/3 active | Swim: 5 days ✓ | Thursday swim tomorrow |
| Meals | Plan active | Lunch on time 6/7 | Cook's day off Wed — Eat.fit backup |
| Reading | "Alchemy" 30% | 3 sessions this week | Continue tonight |
| Growth | Pottery tried | Last: 4 days ago | Saturday: open studio? |
| Energy | Mid avg | ↑ from last week | — |

### Active Experiments
| Experiment | Day X of 14 | Compliance |
|-----------|-------------|-----------|
| Pre-sleep Kindle | Day 8 | 6/8 ✓ |

### Proactive Picks
- 📚 Naval suggests: "Unreasonable Hospitality" (connects to El Patio)
- 🎨 Ali found: Sourdough workshop this Sunday, Rs 2,000
- 🍽️ Andrew's new recipe: Ragi dosa + peanut chutney (try Thursday)
```

3. **Do NOT give coaching advice** in status. Just the snapshot. If Dan wants coaching, he'll ask or run a specific skill.

## Rules
- Keep it under 30 lines total
- Include proactive picks from each agent's knowledge file
- Flag anything that needs attention (3+ missed days, stale experiment)
- One screen. No scrolling.
