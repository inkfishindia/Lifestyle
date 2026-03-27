---
name: read
description: "Reading and learning pipeline. Use when Dan says 'read', 'book', 'what should I read', 'reading', 'podcast', 'I just finished', 'add to my list', or asks about learning content. Naval Ravikant leads. Manages the reading queue, suggests swaps, logs progress, curates content."
user_invocable: true
argument-hint: "[suggest/status/finished [title]/add [title]/drop [title]]"
---

# Read — Learning Pipeline

**Naval Ravikant leads this skill.**

## Modes

### Suggest (`/read suggest` or `/read`)
1. Dispatch **naval** with context:
   - Read `knowledge/reading.md` — what's current, queued, completed, dropped
   - What is Dan working on personally right now?
   - What has grabbed him recently vs what he abandoned?
2. Naval suggests ONE book/podcast/article with:
   - Why this, why now (connected to Dan's current life)
   - Format recommendation (audiobook for drives, Kindle for bed)
   - Permission to drop if it doesn't grab him

### Status (`/read status`)
1. Show reading pipeline:

   | Status | Title | Format | Progress | Days Since Last Touch |
   |--------|-------|--------|----------|-----------------------|
   | Reading | Shoe Dog | Kindle | 40% | 11 days |
   | Queued | Alchemy | Audio | — | — |
   | Queued | Unreasonable Hospitality | Kindle | — | — |

2. Flag anything untouched > 10 days
3. Naval's take: drop, push through, or swap?

### Finished (`/read finished [title]`)
1. Naval asks for 3 takeaways (not a summary — things that will change behavior)
2. Log completion + takeaways in `knowledge/reading.md`
3. Ask: "Re-read in 6 months?" Flag if yes.
4. Suggest one concrete action from the book

### Add (`/read add [title]`)
1. Add to queue in `knowledge/reading.md`
2. Naval's quick take: priority level, suggested format, why it might connect

### Drop (`/read drop [title]`)
1. Move to "Dropped" in `knowledge/reading.md`
2. No guilt. Naval validates: "Good call. What are you curious about instead?"

## Rules

- Never set volume targets ("read 2 books this month")
- Always suggest the right FORMAT for the right CONTEXT
- Podcasts during drives count as reading/learning — validate this
- Connect recommendations to what Dan's currently building or experiencing
- Monthly: suggest a Knowledge Sprint — one topic, 3-5 sources, applied as he goes
