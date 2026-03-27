---
name: log
description: "Quick capture for anything lifestyle-related. Use when Dan says 'log', 'note', 'remember', or drops a quick thought about habits, meals, reading, growth, or personal life. Routes to the right Supabase table automatically. 30 seconds, no friction."
user_invocable: true
argument-hint: "[anything]"
---

# Quick Log

Capture Dan's input and route to the correct Supabase table:

1. **Parse the input** — what type is it?
   - **Habit done** ("swam today", "did pushups") → INSERT into `habit_logs`
   - **Meal note** ("ate late", "cook didn't come", "had ragi for lunch") → INSERT into `meal_logs`
   - **Energy note** ("energy crashed", "feeling great") → INSERT into `energy_logs`
   - **Reading note** ("started Alchemy", "finished Shoe Dog") → UPDATE `reading_items` status + INSERT `reading_sessions`
   - **Growth note** ("tried pottery", "want to try climbing") → INSERT into `experience_logs` or update `knowledge/growth.md`
   - **Exercise** ("swam 30 min", "played tennis") → INSERT into `exercise_logs`
   - **Decision** → append to `data/sessions/decisions.md` (local file)
   - **General thought** → append to `data/sessions/activity-log.md` (local file)

2. **Confirm back** in one line:
   ```
   Logged: swimming 30 min → exercise_logs. ✓
   ```

3. **Do NOT expand or elaborate** — just capture and confirm
