---
name: curate
description: "Force all agents to refresh their proactive recommendations. Use when Dan says 'curate', 'refresh', 'what's new', 'update recommendations', or periodically to keep suggestions fresh. Each agent researches and updates their knowledge file with top picks, horizon expanders, and new finds."
user_invocable: true
argument-hint: "[all/books/meals/growth/habits]"
---

# Curate — Refresh Proactive Recommendations

**All agents research and update their curated picks.**

## Modes

### Full Refresh (`/curate` or `/curate all`)
Dispatch all agents in parallel:

1. **Naval** — refresh reading.md:
   - WebSearch for new books in Dan's interest areas
   - Check if current queue is stale (items queued > 30 days)
   - Update: Top 3 next reads, Top 3 per category, Horizon expanders
   - Find 3 specific podcast episodes relevant to what Dan's dealing with now
   - Look for new podcasts Dan might not know about

2. **Andrew** — refresh meals.md:
   - WebSearch for new healthy restaurants/cloud kitchens in Bangalore
   - Find 3 new recipes matched to Dan's tastes (simple, Bangalore-friendly)
   - Update seasonal recommendations based on current month
   - Check for new tiffin services or meal delivery options
   - Find 2 food horizon expanders (cuisines/ingredients Dan hasn't tried)

3. **Ali** — refresh growth.md:
   - WebSearch for current Bangalore workshops, events, pop-ups, classes
   - Update: Top 3 to try next, Top 3 per category
   - Find 2 comfort zone pushes based on Dan's growth map
   - Check for new creative spaces, studios, or communities
   - Find skill-stacking opportunities based on what Dan's tried

4. **James** — refresh habits.md:
   - Review current habit compliance from daily logs
   - Identify graduation candidates (4+ weeks at 80%+)
   - Suggest next habit to add (if Dan is ready for a 4th)
   - Update floor versions if current ones aren't being used

### Domain-Specific (`/curate books`, `/curate meals`, `/curate growth`, `/curate habits`)
Dispatch only the relevant agent. Same process, single domain.

## Output

Present a combined "What's New" view:

```
## Fresh Picks

### 📚 Reading (Naval)
| Pick | Why Now |
|------|---------|
| [book 1] | [connection to Dan's current life] |
| [podcast ep] | [specific relevance] |
| [horizon expander] | [why it would stretch him] |

### 🍽️ Food (Andrew)
| Pick | What | Why Try It |
|------|------|-----------|
| [recipe] | [description] | [matches his taste + nutritional benefit] |
| [restaurant] | [cuisine] | [new discovery in Bangalore] |

### 🎨 Growth (Ali)
| Pick | Where/When | Why Dan |
|------|-----------|---------|
| [activity] | [specific details] | [connects to his interests] |
| [comfort zone push] | [details] | [the stretch] |

### ✅ Habits (James)
| Update | Details |
|--------|---------|
| [graduation candidate] | [ready to move to background] |
| [next habit suggestion] | [why now + floor version] |
```

## Rules
- ALL recommendations must come from actual research (WebSearch), not generic suggestions
- Include specific details: titles, venues, dates, costs, links
- Horizon expanders should be genuinely outside Dan's usual orbit — not more of the same
- Update the knowledge files as a side effect — not just display
- Run this at least monthly. Ideal: weekly during /sunday
