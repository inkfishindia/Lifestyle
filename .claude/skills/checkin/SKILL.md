---
name: checkin
description: "Daily lifestyle check-in. Log habits, meals, energy, reading, and growth in under 2 minutes. Use when Dan says 'checkin', 'log my day', 'how did today go', or at end of day. Writes to Supabase. Coach handles directly — dispatches data agent first to see what's already logged via the PWA."
user_invocable: true
---

# Daily Check-In

**Goal: < 2 minutes. Binary. No friction.**

## Flow

1. **Dispatch `data` agent** for daily snapshot — see what Dan already logged via the PWA

2. **Ask Dan about anything NOT yet logged** (quick-fire, one message):
   ```
   Today's check-in:

   Habits — which did you hit?
   [ ] [habit 1]
   [ ] [habit 2]
   [ ] [habit 3]

   Meals — lunch on time? (yes/late/skipped)
   Energy — high / mid / low
   Reading/learning — anything today? (yes/no + what)
   Growth — try anything new? (yes/no + what)

   One-line note (optional):
   ```

3. **Write** responses to Supabase via `execute_sql`:
   - Habit completions → `habit_logs` table
   - Meals → `meal_logs` table
   - Energy → `energy_logs` table
   - Reading → `reading_sessions` table
   - Daily summary → `daily_log` table

4. **Quick pattern check** (do silently, only surface if notable):
   - 3rd missed habit in a row? → Flag it, suggest dispatching James
   - Energy "low" 3+ days running? → Suggest dispatching Andrew
   - No reading for 7+ days? → Gentle nudge, offer to dispatch Naval
   - No growth activity for 3+ weeks? → Suggest dispatching Ali

5. **Respond** with confirmation + ONE insight if available:
   ```
   Logged. 2 of 3 habits. Lunch on time — nice.

   [Optional: "Swimming dropped to 1 of last 5. Want James to look at this?"]
   ```

## Rules

- NEVER make this feel like a chore. If Dan gives minimal answers, that's fine.
- NEVER ask follow-up questions during checkin. Save that for coach sessions.
- ALWAYS write to Supabase even if Dan only gives partial info
- If Dan says "same as yesterday" — query yesterday's data, confirm, write same
- If data already logged via PWA, just confirm and surface any patterns
