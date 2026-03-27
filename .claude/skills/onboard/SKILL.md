---
name: onboard
description: "First-time setup for the lifestyle coaching system. Use on first session or when Dan says 'onboard', 'set me up', 'let's get started', 'first session'. All coaches participate to establish baseline: schedule, food, habits, reading, growth interests. Populates all knowledge files."
user_invocable: true
---

# Onboard — First Session Setup

**All coaches participate. Coach coordinates.**

## Flow (20-30 min, one-time)

### Step 1: Schedule Baseline (Coach asks)
Quick-fire questions to populate `knowledge/routines.md`:
- What time do you actually wake up most days?
- What time do you actually sleep?
- Any sport currently happening? What days/times?
- Any fixed commitments that can't move?

Write answers to `knowledge/routines.md`.

### Step 2: Food Baseline (Andrew asks)
- Do you have a cook? How many meals do they make?
- Veg or non-veg? Any restrictions?
- What do you typically eat for breakfast/lunch/dinner right now?
- What do you snack on late at night?
- Favorite cuisines or Bangalore restaurants?

Write answers to `knowledge/meals.md`.
Andrew generates first weekly meal plan.

### Step 3: Habits Selection (James asks)
- Based on everything we know from your profile, here are the 3 habits I'd start with and why: [James recommends]
- Dan confirms, adjusts, or picks different ones
- James sets up each habit with: identity, cue, standard version, floor version, celebration
- Max 3 habits. Non-negotiable.

Write to `knowledge/habits.md`.

### Step 4: Reading Queue (Naval asks)
- What are you reading right now? (anything — books, podcasts, articles)
- What's the last book/podcast that really grabbed you?
- What topics are you most curious about right now?
- Naval populates top 3 next reads, top 3 per category, horizon expanders
- Naval uses WebSearch to find specific books/podcasts matched to Dan's answers

Write to `knowledge/reading.md`.

### Step 5: Growth Interests (Ali asks)
- What hobbies have you done before and enjoyed?
- What have you always wanted to try but haven't?
- Art, music, sport, food, performance — what pulls you?
- Ali populates top 3 to try, horizon expanders
- Ali uses WebSearch to find specific Bangalore venues/events

Write to `knowledge/growth.md`.

### Step 6: Bangalore Resources (Ali + Andrew research)
- WebSearch for swimming pools, tennis courts near Dan
- WebSearch for healthy meal delivery in Bangalore
- WebSearch for current workshops, events, creative spaces

Write to `knowledge/bangalore.md`.

### Step 7: First Experiments (Coach frames)
Based on the onboarding, launch 2-3 experiments:
- One habit experiment (James's pick)
- One meal experiment (Andrew's pick — probably "eat lunch by 1 PM for 14 days")
- One growth micro-experiment (Ali's pick — "try one new thing this weekend")

Write to `data/strategies/experiments.md`.

### Step 8: Set Calendar Blocks (Coach + Calendar MCP)
- Block sport sessions on Google Calendar
- Set 12:15 PM lunch alarm/event
- Block creative peak time if not already blocked

## Output
Present a summary table:

| Domain | Baseline | First Experiment | Coach |
|--------|----------|-----------------|-------|
| Habits | [3 selected] | [2-week trial] | James |
| Meals | [plan generated] | Lunch by 1 PM | Andrew |
| Reading | [queue populated] | Kindle on pillow | Naval |
| Growth | [interests mapped] | [one thing this weekend] | Ali |

"System ready. Run `/checkin` daily. Run `/sunday` weekly. Everything else on demand."
