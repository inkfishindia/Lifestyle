---
name: meals
description: "Meal planning and nutrition management. Use when Dan says 'meals', 'meal plan', 'what should I eat', 'plan my week', 'hungry', or asks about nutrition. Andrew Huberman leads. Generates weekly meal plans, daily adjustments, cook instructions, shopping lists, and pre/post sport nutrition."
user_invocable: true
argument-hint: "[plan/today/adjust]"
---

# Meals — Nutrition Planning

**Andrew Huberman leads this skill.**

## Modes

### Weekly Plan (`/meals plan`)
1. Dispatch **andrew** with Dan's schedule for the week:
   - Read `knowledge/routines.md` for sport days
   - Check Google Calendar for social events, late nights, travel
2. Andrew generates a full weekly meal plan following chrono-nutrition rules:
   - Breakfast template (10:30-11 AM)
   - Lunch (12:30 PM — non-negotiable)
   - Pre-sport snack (4:30-5 PM on sport days)
   - Dinner (8:30-9 PM)
   - Late-night creative fuel (11 PM if working late)
3. Include cook instructions if applicable
4. Include shopping/stocking list (snacks, fruits, pre-sport bars)
5. Write to `knowledge/meals.md`

### Today (`/meals today`)
1. Andrew checks today's schedule (sport? social? late night planned?)
2. Generates today's specific meals
3. If it's before lunch — emphasis on what to eat NOW
4. If pre-sport — emphasis on the snack timing

### Adjust (`/meals adjust [situation]`)
1. Dan says "cook isn't coming today" or "going out for dinner"
2. Andrew adjusts the plan: backup options (Eat.fit, tiffin, specific restaurants)
3. Maintains nutritional intent despite the change

## Output Format

| Meal | Time | What | Why |
|------|------|------|-----|
| Breakfast | 10:30 | Ragi porridge + eggs + banana | Slow-release energy, protein |
| Lunch | 12:30 | Rice + dal + palya + curd | Largest meal — peak insulin sensitivity |
| Pre-sport | 4:30 | Banana + almonds | Glucose without insulin spike |
| Dinner | 8:30 | Grilled chicken + chapati + salad | Post-workout recovery |
| Late-night | 11:00 | Makhana + dark chocolate | Sustained creative fuel, no crash |

## Rules

- Always check the sport schedule before generating a plan
- Always include the 12:15 PM lunch alarm reminder for new users
- Bangalore-specific options — local foods, seasonal produce, actual restaurants/services
- Cook instructions should be simple enough for a part-time cook
- Never suggest supplements as food replacements
