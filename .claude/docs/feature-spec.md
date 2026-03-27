# Feature Spec — Dan Lifestyle PWA

## Architecture: 3 Screens

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│   LOG    │  │  COACH   │  │  STATUS  │
│          │  │          │  │          │
│ Quick log│  │ Chat feed│  │ Sleep    │
│ Habits   │  │ Nudges   │  │ Energy   │
│ Energy   │  │ Weekly   │  │ Habits   │
│ Meals    │  │ Exper.   │  │ Lunch    │
│ Done ✓   │  │          │  │ Caffeine │
└──────────┘  └──────────┘  └──────────┘
     ↑              ↑             ↑
  Primary       Coach-led     At-a-glance
   input        dialogue       readout
```

## Feature Verdicts

### MVP (Build Now)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Quick Log** | Text input at top of Log screen. "Swam 30 min" → auto-routes to exercise_logs. "Ate dosa at 1" → meal_logs. "Tried pottery" → experience_logs. THE primary input. |
| 2 | **Experiment Tracker** | The atomic unit. Name, hypothesis, start/end, daily binary, result. Card on Coach screen with countdown to review. |
| 3 | **Coach Chat** | Chat feed on Coach screen. Coaches initiate 70%. Feels like WhatsApp — open to find a sharp friend's message. NOT a support ticket. |
| 4 | **Weekly Review** | /sunday output on Coach screen. 3 named insights, 1 adjustment, strategy scorecard. Short witty briefing. |
| 5 | **Onboarding** | 5 screens max. Wake time, sport prefs, current reading, food situation, one thing to change. NOT a goal-setting form. |
| 6 | **Settings** | Set once forget. Chronotype, notification times, coach preferences. Tiny. |
| 7 | **"Done for Today"** | One tap closure. "You're done. Go live." Without this = ambient guilt. Most underrated feature. |
| 8 | **Floor Version Toggle** | Already built. Front and center on every habit. |
| 9 | **Coach-Initiated Nudges** | Timed chat messages, NOT notifications. 12:15 PM "Lunch time." 4:30 PM "Swim or skip?" |

### v2 (After MVP)

| Feature | Why v2 |
|---------|--------|
| Analytics/Insights Dashboard | Rory's visual output. NEVER raw data. Exactly 3 named insights/week. |
| Photo Gallery | Only if auto-populated. Never user-managed. |
| Bangalore Discovery | Behind the scenes for Ali. Dan sees ONE recommendation, not a directory. |
| Graduation Ceremony | Celebrate + stop tracking when habit is automatic. |

### NO (Never Build)

| Feature | Why NO |
|---------|--------|
| Reading Library | Over-architect trap. Kindle tracks progress. Naval needs 3 data points only. |
| Calendar View (in-app) | Google Calendar exists. Two calendars = checks neither. |
| Habit Streak Heatmap | Guilt machine. Show "X of last 14 days" as fraction. Never a calendar grid. |
| Goal Setting Screen | Goals have guilt and no expiry. Experiments have hypotheses and end dates. |
| Journal/Notes | Free-text = noise. Quick log + mood_word captures everything. |
| Notification Center | Where notifications die. Nudges arrive in coach chat. |
| Social/Community | Happens at Bangalore parties. |

## Cross-Coach Data Flows (MVP)

These fire automatically based on data — the compound value.

| Trigger | Action | Priority |
|---------|--------|----------|
| Sleep < 6 hrs | Auto "floor version day" — habits shrink without Dan deciding | MVP |
| Lunch missed by 1:30 PM | James pre-adjusts evening expectations. Rory logs cascade risk. | MVP |
| Energy 3 PM < 3 | Naval deprioritizes heavy reading → suggests light article/podcast | MVP |
| Sport day detected (Calendar) | Pre-sport snack + post-sport protein auto-added | MVP |
| Habit missed yesterday | "Never miss twice" + floor version promoted | MVP |
| Sleep consistency <6h for 4+ nights | Ali pauses new experience recommendations | v2 |
| Decision load high | James auto-reduces evening habit expectations | v2 |
| New experience logged | Rory correlates novelty → same-week satisfaction | v2 |

## Dynamic Calendar Events (MVP)

| Event | Trigger | When |
|-------|---------|------|
| Lunch block | Setup (recurring) | 12:15-1 PM daily |
| Coffee window opens | 90 min after detected wake time | Dynamic |
| Last coffee cutoff | 6.5 hrs before sleep target | Dynamic |
| NSDR block | Auto when sleep < 6.5 hrs | 3 PM |
| Pre-sport snack | Sport block detected in calendar | 45 min before |

## App Boundary

The app is the LOGIC layer. Everything else is a sensor or delivery mechanism.

| In the App | In Existing Tools |
|-----------|------------------|
| Quick log + habit toggles | Raw sleep data, HRV → Apple Health |
| Coach chat + nudges | Workouts, pace → Garmin/Apple Fitness |
| Energy check-ins | Book progress → Kindle |
| Meal timing + adherence | Schedule, blocks → Google Calendar |
| Cross-domain insight engine | Recipes → Notion/Keep |
| Experiment tracker | Photos → Google Photos |
| Rory's weekly patterns | Email → Gmail |

## Display Rules

- Habit progress: "X of last 14 days" fraction. NEVER calendar grids or heatmaps.
- Insights: Exactly 3 named patterns per week. One sentence each. NOT charts.
- Meals: Confirm timing + protein, not plan meals. Logging ≠ planning.
- Reading: "Reading / not reading / what book / enjoying it" — 3 data points. Not a library.
- Experiments: The atomic unit. Everything is a 2-week experiment. Not permanent habits.
