# Learning & Development — Full Feature Spec

## Philosophy

Learning isn't reading. It's **input → processing → application → identity shift**. The app tracks the full pipeline across 3 input channels (books, podcasts, articles/videos) and 1 output layer (takeaways applied to life).

The over-architect trap is real. Every feature below is constrained to prevent the system from becoming the hobby.

---

## Architecture: One Card Per Domain

The feature-spec.md said "NO" to a Reading Library. That was right for v1 — you needed habits first. But now the identity argument holds: **a visible pipeline is proof you're becoming a reader again**. The constraint isn't "don't build it" — it's "build it so tight it can't become a procrastination tool."

```
┌─────────────────────────────────────────────────────────────────┐
│  LOG VIEW                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Reading Now │  │ Listening   │  │ Learning    │            │
│  │ (1 card)    │  │ (1 card)    │  │ Sprint      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  Shows after 8 PM — reading/listening happens at night          │
│                                                                 │
│  STATUS VIEW                                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │ Knowledge Pipeline (replaces current reading     │          │
│  │ widget with richer version)                      │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  DRAWERS (existing + new)                                       │
│  ├── Reading (existing — upgrade)                               │
│  ├── Podcast (new)                                              │
│  └── Add to Queue (new)                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Reading Card (Log View)

Replaces the "+ Reading" button with a persistent card. Shows after 8 PM (reading window).

```
┌─────────────────────────────────────────┐
│  READING NOW                            │
│  The Name of the Wind — Patrick Rothfuss│
│  Kindle  •  Started 12 days ago         │
│  Enjoying it?  [Yes]  [Meh]  [Drop]    │
│                                         │
│  UP NEXT                                │
│  Unreasonable Hospitality               │
│  Almanack of Naval Ravikant             │
│                                         │
│  [+ Add to queue]                       │
├─────────────────────────────────────────┤
│  COMPLETED (builds over time)           │
│  Atomic Habits — 3 takeaways logged     │
│  Alchemy — 2 takeaways logged           │
└─────────────────────────────────────────┘
```

### Constraints

| Constraint | Why |
|-----------|-----|
| Queue max: 5 books | Forces prioritization. No 200-book graveyard. |
| No categories or tags | Every taxonomy becomes a procrastination tool |
| No cover images at MVP | Cover browsing is the Instagram scroll of reading apps |
| No star ratings | Binary only: worth re-reading yes/no |
| Completed list is append-only | Can't reorganize. Past tense = safe. |
| "Enjoying it?" auto-prompt every 7 days | Generates coaching data without Dan initiating |
| On completion: 3 takeaways prompted | `applied_to` field is the real output |

### Data: `reading_items` table (EXISTS)

```
id, title, author, format, category, status, progress_pct,
worth_rereading, connected_to, created_at
```

**Status values**: `queue` → `active` → `completed` | `dropped`

**New columns needed:**
```sql
ALTER TABLE reading_items ADD COLUMN enjoyment TEXT CHECK (enjoyment IN ('yes', 'meh', 'drop'));
ALTER TABLE reading_items ADD COLUMN last_enjoyment_check DATE;
ALTER TABLE reading_items ADD COLUMN started_date DATE;
ALTER TABLE reading_items ADD COLUMN completed_date DATE;
ALTER TABLE reading_items ADD COLUMN queue_position INTEGER;
```

### Data: `takeaways` table (EXISTS, no UI)

```
id, item_id (FK → reading_items), takeaway_text, applied_to, applied_date
```

Max 3 per item (app-enforced).

### Functions Needed (app.js)

| Function | Purpose |
|----------|---------|
| `loadReadingPipeline()` | Fetch active book + queue (max 5) + completed (last 10) + takeaways |
| `setEnjoyment(value)` | Update enjoyment on active book ('yes'/'meh'/'drop'). If 'drop' → confirm → mark dropped, promote next from queue |
| `promoteNextBook()` | Move queue_position=1 to active, shift others up |
| `addToQueue(title, author, format)` | Insert to reading_items with status='queue', queue_position=next |
| `removeFromQueue(id)` | Delete from queue, reorder positions |
| `reorderQueue(id, newPosition)` | Swap queue positions |
| `completeBook(id)` | Set status='completed', completed_date=today, open takeaway drawer |
| `saveTakeaway(itemId, text, appliedTo)` | Insert to takeaways (max 3 check) |
| `shouldPromptEnjoyment()` | Returns true if active book's last_enjoyment_check is 7+ days ago |
| `logReadingSession(duration, progress)` | Existing saveReading() — enhanced to update started_date on first session |

### HTML: Reading Card

```html
<!-- READING CARD — shows 8PM+ -->
<div class="card" x-show="shouldShow('reading')">
  <!-- Active Book -->
  <template x-if="activeBook">
    <div>
      <div class="card-header">
        <span class="card-title">Reading Now</span>
        <span class="card-badge" x-text="activeBook.progress_pct + '%'"></span>
      </div>
      <div class="reading-title" x-text="activeBook.title + ' — ' + activeBook.author"></div>
      <div class="reading-meta">
        <span x-text="activeBook.format"></span>
        <span>•</span>
        <span x-text="'Started ' + daysAgo(activeBook.started_date) + 'd ago'"></span>
      </div>
      <!-- Progress bar -->
      <div class="progress-bar mt-8">
        <div class="progress-fill" :style="'width:' + activeBook.progress_pct + '%'"></div>
      </div>
      <!-- Enjoyment prompt (every 7 days) -->
      <div class="toggle-row mt-8" x-show="shouldPromptEnjoyment()">
        <span class="text-sm text-muted">Enjoying it?</span>
        <button class="toggle-btn" :class="{ active: activeBook.enjoyment === 'yes' }"
                @click="setEnjoyment('yes')">Yes</button>
        <button class="toggle-btn" :class="{ active: activeBook.enjoyment === 'meh' }"
                @click="setEnjoyment('meh')">Meh</button>
        <button class="toggle-btn" :class="{ 'active-red': activeBook.enjoyment === 'drop' }"
                @click="setEnjoyment('drop')">Drop</button>
      </div>
      <!-- Log reading button -->
      <button class="toggle-btn active mt-8" style="width:100%;"
              @click="drawer = 'reading'">Log reading session</button>
    </div>
  </template>

  <!-- No active book -->
  <template x-if="!activeBook && readingQueue.length > 0">
    <div>
      <div class="card-header">
        <span class="card-title">Start reading</span>
      </div>
      <div class="reading-title" x-text="readingQueue[0].title"></div>
      <button class="toggle-btn active mt-8" @click="startBook(readingQueue[0].id)">Start this one</button>
    </div>
  </template>

  <!-- Queue -->
  <div x-show="readingQueue.length > 0" style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 12px;">
    <div class="card-title mb-8">Up next</div>
    <template x-for="book in readingQueue" :key="book.id">
      <div class="flex-between" style="padding: 6px 0;">
        <span style="font-size: 13px;" x-text="book.title"></span>
        <button class="text-xs text-muted" @click="removeFromQueue(book.id)" style="background:none; border:none; cursor:pointer;">✕</button>
      </div>
    </template>
  </div>

  <!-- Add to queue -->
  <button class="toggle-btn mt-8" style="width:100%;"
          @click="drawer = 'add-book'" x-show="readingQueue.length < 5">+ Add to queue</button>

  <!-- Completed -->
  <div x-show="completedBooks.length > 0" style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 12px;">
    <details>
      <summary class="card-title" style="cursor:pointer;">Completed (<span x-text="completedBooks.length"></span>)</summary>
      <template x-for="book in completedBooks" :key="book.id">
        <div style="padding: 8px 0; border-bottom: 1px solid var(--border);">
          <div style="font-size: 13px; font-weight: 600;" x-text="book.title"></div>
          <div class="text-xs text-muted" x-text="(book.takeaway_count || 0) + ' takeaways logged'"></div>
        </div>
      </template>
    </details>
  </div>
</div>
```

---

## 2. Podcast Card (Log View)

Same philosophy: minimal, identity-building, no library trap.

```
┌─────────────────────────────────────────┐
│  LISTENING                              │
│  Last: Acquired — LVMH (2d ago)         │
│  Takeaway captured?  [Yes]  [No]        │
│                                         │
│  QUEUED EPISODES                        │
│  Steven Bartlett — How I Built This     │
│  Ali Abdaal — 3 Rules of Productivity   │
│                                         │
│  [+ Log a listen]                       │
└─────────────────────────────────────────┘
```

### Constraints

| Constraint | Why |
|-----------|-----|
| No podcast app integration | Spotify/Apple already track listening. This tracks *takeaways*. |
| Episode queue max: 3 | You'll listen or you won't. No 50-episode backlog. |
| Focus on takeaway capture | The value isn't listening — it's what you took from it |
| Context field required | Where were you? (drive, walk, gym) — correlates with retention |
| No show management | Dan follows ~4 shows. Don't build a podcast app. |

### Data: `podcast_logs` table (EXISTS, no UI)

```
id, date, show, episode_title, context, captured_takeaway (bool),
takeaway_text, created_at
```

**New columns needed:**
```sql
ALTER TABLE podcast_logs ADD COLUMN status TEXT DEFAULT 'logged' CHECK (status IN ('queued', 'logged'));
ALTER TABLE podcast_logs ADD COLUMN duration_min INTEGER;
```

### Functions Needed (app.js)

| Function | Purpose |
|----------|---------|
| `loadPodcasts()` | Fetch queued episodes + last 5 logged |
| `logPodcast(show, episode, context, duration)` | Insert to podcast_logs with status='logged' |
| `queueEpisode(show, episode)` | Insert with status='queued' (max 3 check) |
| `markListened(id)` | Update queued → logged, prompt for takeaway |
| `savePodcastTakeaway(id, text)` | Update captured_takeaway=true, takeaway_text |
| `lastPodcast` | Computed: most recent logged episode |

### HTML: Podcast Card

```html
<!-- PODCAST CARD — shows 8PM+ or weekends -->
<div class="card" x-show="shouldShow('podcast')">
  <div class="card-header">
    <span class="card-title">Listening</span>
    <span class="card-badge" x-text="podcastsThisWeek + ' this week'"></span>
  </div>

  <!-- Last listened -->
  <template x-if="lastPodcast">
    <div>
      <div style="font-size: 14px; font-weight: 600;" x-text="lastPodcast.show + ' — ' + lastPodcast.episode_title"></div>
      <div class="reading-meta">
        <span x-text="daysAgo(lastPodcast.date) + 'd ago'"></span>
        <span>•</span>
        <span x-text="lastPodcast.context"></span>
      </div>
      <div class="toggle-row mt-8" x-show="!lastPodcast.captured_takeaway">
        <span class="text-sm text-muted">Capture a takeaway?</span>
        <button class="toggle-btn" @click="drawer = 'podcast-takeaway'">Yes</button>
        <button class="toggle-btn" @click="skipPodcastTakeaway(lastPodcast.id)">Skip</button>
      </div>
      <div x-show="lastPodcast.captured_takeaway" class="text-sm" style="color: var(--green); margin-top: 8px;">
        ✓ Takeaway captured
      </div>
    </div>
  </template>

  <!-- Queued episodes -->
  <div x-show="podcastQueue.length > 0" style="margin-top: 12px; border-top: 1px solid var(--border); padding-top: 12px;">
    <div class="card-title mb-8">Queued</div>
    <template x-for="ep in podcastQueue" :key="ep.id">
      <div class="flex-between" style="padding: 6px 0;">
        <span style="font-size: 13px;" x-text="ep.show + ' — ' + ep.episode_title"></span>
        <button class="toggle-btn" style="padding:4px 10px; font-size:11px;" @click="markListened(ep.id)">Done</button>
      </div>
    </template>
  </div>

  <!-- Log / Queue -->
  <div class="flex gap-8 mt-8">
    <button class="toggle-btn" style="flex:1;" @click="drawer = 'log-podcast'">+ Log a listen</button>
    <button class="toggle-btn" style="flex:1;" @click="drawer = 'queue-podcast'" x-show="podcastQueue.length < 3">+ Queue episode</button>
  </div>
</div>
```

---

## 3. Takeaways Layer (Cross-Domain)

The real output of learning. Books and podcasts feed into this. Takeaways have an `applied_to` field — that's the metric that matters.

### Data: `takeaways` table (EXISTS)

Already has: `item_id, takeaway_text, applied_to, applied_date`

**New columns needed:**
```sql
ALTER TABLE takeaways ADD COLUMN source_type TEXT DEFAULT 'book' CHECK (source_type IN ('book', 'podcast', 'article', 'experience'));
ALTER TABLE takeaways ADD COLUMN source_title TEXT;
-- item_id stays nullable — podcasts don't have a FK to reading_items
```

### Functions Needed

| Function | Purpose |
|----------|---------|
| `loadTakeaways()` | Fetch all takeaways, grouped by source |
| `saveTakeaway(sourceType, sourceTitle, itemId, text)` | Insert takeaway |
| `markTakeawayApplied(id, appliedTo)` | Update applied_to + applied_date |
| `unappliedTakeaways` | Computed: takeaways without applied_to |

### Status View: Knowledge Pipeline Widget

Replaces the simple "Now Reading" widget:

```
┌─────────────────────────────────────────┐
│  KNOWLEDGE PIPELINE                     │
│                                         │
│  Reading: The Name of the Wind (47%)    │
│  ████████████░░░░░░░░░░░░  12d active   │
│                                         │
│  Listening: 2 episodes this week        │
│  Last: Acquired — LVMH                  │
│                                         │
│  Takeaways: 3 unapplied                 │
│  "Reframe problems as..." — Alchemy     │
│  "The 20-mile march..." — Great by...   │
│                                         │
│  Applied this month: 2                  │
└─────────────────────────────────────────┘
```

---

## 4. Learning Sprint Card (Status View)

Monthly focused learning on one topic. Naval curates, Dan executes.

```
┌─────────────────────────────────────────┐
│  MARCH SPRINT: Pricing Psychology       │
│  Sources: 3 of 5 consumed              │
│  ██████████████░░░░░░░░░░              │
│  Applied insights: 1                    │
│  "Anchor high, discount selectively"    │
└─────────────────────────────────────────┘
```

### Data: New table `learning_sprints`

```sql
CREATE TABLE learning_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,          -- '2026-03'
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  sources JSONB DEFAULT '[]',   -- [{title, type, consumed: bool}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Sprint insights go into the existing `takeaways` table with `source_type = 'sprint'`.

### Functions Needed

| Function | Purpose |
|----------|---------|
| `loadActiveSprint()` | Fetch current month's sprint |
| `markSprintSourceConsumed(index)` | Update JSONB array |
| `sprintProgress` | Computed: consumed / total sources |

---

## 5. New Drawers

### Add Book Drawer

```html
<div class="drawer" :class="{ open: drawer === 'add-book' }">
  <div class="drawer-handle"></div>
  <div class="card-title mb-8">Add to Reading Queue</div>
  <input type="text" class="text-input mb-8" placeholder="Title" x-model="addBookForm.title">
  <input type="text" class="text-input mb-8" placeholder="Author" x-model="addBookForm.author">
  <div class="toggle-row">
    <template x-for="f in ['kindle','physical','audiobook','pdf']" :key="f">
      <button class="toggle-btn" :class="{ active: addBookForm.format === f }"
              @click="addBookForm.format = f" x-text="f" style="text-transform:capitalize;"></button>
    </template>
  </div>
  <button class="toggle-btn active mt-12" style="width:100%;" @click="addToQueue()">Add</button>
</div>
```

### Log Podcast Drawer

```html
<div class="drawer" :class="{ open: drawer === 'log-podcast' }">
  <div class="drawer-handle"></div>
  <div class="card-title mb-8">Log a Listen</div>
  <input type="text" class="text-input mb-8" placeholder="Show name" x-model="podcastForm.show">
  <input type="text" class="text-input mb-8" placeholder="Episode title" x-model="podcastForm.episode">
  <div class="time-row">
    <label>Mins</label>
    <input type="number" class="time-input" x-model.number="podcastForm.duration" placeholder="45">
  </div>
  <div class="toggle-row mt-8">
    <template x-for="c in ['drive','walk','gym','cooking','commute']" :key="c">
      <button class="toggle-btn" :class="{ active: podcastForm.context === c }"
              @click="podcastForm.context = c" x-text="c" style="text-transform:capitalize;"></button>
    </template>
  </div>
  <div class="mb-8 mt-8">
    <input type="text" class="text-input" placeholder="One takeaway (optional)" x-model="podcastForm.takeaway">
  </div>
  <button class="toggle-btn active mt-12" style="width:100%;" @click="logPodcast()">Save</button>
</div>
```

### Takeaway Drawer (triggered on book completion or manual)

```html
<div class="drawer" :class="{ open: drawer === 'takeaway' }">
  <div class="drawer-handle"></div>
  <div class="card-title mb-8">Capture Takeaway</div>
  <div class="text-sm text-muted mb-8" x-text="takeawaySource"></div>
  <textarea class="text-input mb-8" rows="3" placeholder="What stuck with you?"
            x-model="takeawayForm.text" style="resize:none;"></textarea>
  <input type="text" class="text-input mb-8" placeholder="Applied to... (optional)"
         x-model="takeawayForm.appliedTo">
  <button class="toggle-btn active" style="width:100%;" @click="saveTakeaway()">Save</button>
  <div class="text-xs text-muted mt-8" x-text="takeawayCount + ' of 3 logged'"></div>
</div>
```

---

## 6. Complete State & Methods Inventory

### New Alpine State

```js
// Reading pipeline
activeBook: null,           // Single active reading_item
readingQueue: [],           // status='queue', ordered by queue_position (max 5)
completedBooks: [],         // status='completed', last 10
bookTakeaways: [],          // takeaways for active book

// Podcasts
podcastQueue: [],           // status='queued' (max 3)
recentPodcasts: [],         // status='logged', last 5
lastPodcast: null,          // Most recent logged
podcastsThisWeek: 0,        // Count

// Takeaways
allTakeaways: [],           // All takeaways
unappliedTakeaways: [],     // No applied_to yet

// Learning sprint
activeSprint: null,

// Form state
addBookForm: { title: '', author: '', format: 'kindle' },
podcastForm: { show: '', episode: '', duration: null, context: '', takeaway: '' },
takeawayForm: { text: '', appliedTo: '' },
takeawaySource: '',         // Display string for takeaway drawer
takeawaySourceType: '',     // 'book' | 'podcast'
takeawaySourceId: null,     // FK
takeawayCount: 0,           // Current count for this source
```

### New Methods Summary

| Method | Lines (est.) | Supabase calls |
|--------|-------------|----------------|
| `loadReadingPipeline()` | 25 | 3 queries (active, queue, completed + takeaway counts) |
| `setEnjoyment(val)` | 15 | 1 update + conditional promote |
| `promoteNextBook()` | 10 | 2 updates (activate next, reorder queue) |
| `startBook(id)` | 8 | 1 update |
| `addToQueue()` | 12 | 1 insert (with position calc) |
| `removeFromQueue(id)` | 8 | 1 delete + reorder |
| `completeBook()` | 12 | 1 update + open takeaway drawer |
| `loadPodcasts()` | 15 | 2 queries (queued, recent) |
| `logPodcast()` | 15 | 1 insert + optional takeaway |
| `queueEpisode()` | 10 | 1 insert |
| `markListened(id)` | 8 | 1 update |
| `savePodcastTakeaway(id, text)` | 8 | 1 update |
| `loadTakeaways()` | 10 | 1 query |
| `saveTakeaway()` | 12 | 1 insert |
| `markTakeawayApplied(id, appliedTo)` | 8 | 1 update |
| `loadActiveSprint()` | 8 | 1 query |
| `markSprintSourceConsumed(idx)` | 10 | 1 update |
| `shouldPromptEnjoyment()` | 5 | 0 (computed) |
| `shouldShow('reading')` | 1 | 0 (hour check) |
| `shouldShow('podcast')` | 1 | 0 (hour check) |

**Total: ~20 new methods, ~200 lines of JS, ~4 new drawers**

### Updated `shouldShow()` Cases

```js
case 'reading': return h >= 20 || h < 3;   // 8 PM - 3 AM
case 'podcast': return h >= 20 || h < 3 || (d === 0 || d === 6);  // evenings + weekends
```

---

## 7. SQL Migrations

Run these in Supabase SQL editor:

```sql
-- Reading items enhancements
ALTER TABLE reading_items ADD COLUMN IF NOT EXISTS enjoyment TEXT CHECK (enjoyment IN ('yes', 'meh'));
ALTER TABLE reading_items ADD COLUMN IF NOT EXISTS last_enjoyment_check DATE;
ALTER TABLE reading_items ADD COLUMN IF NOT EXISTS started_date DATE;
ALTER TABLE reading_items ADD COLUMN IF NOT EXISTS completed_date DATE;
ALTER TABLE reading_items ADD COLUMN IF NOT EXISTS queue_position INTEGER;

-- Podcast enhancements
ALTER TABLE podcast_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'logged' CHECK (status IN ('queued', 'logged'));
ALTER TABLE podcast_logs ADD COLUMN IF NOT EXISTS duration_min INTEGER;

-- Takeaways enhancements
ALTER TABLE takeaways ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'book' CHECK (source_type IN ('book', 'podcast', 'article', 'sprint', 'experience'));
ALTER TABLE takeaways ADD COLUMN IF NOT EXISTS source_title TEXT;

-- Learning sprints (new table)
CREATE TABLE IF NOT EXISTS learning_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE learning_sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON learning_sprints FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reading_items_status ON reading_items(status);
CREATE INDEX IF NOT EXISTS idx_podcast_logs_status ON podcast_logs(status);
CREATE INDEX IF NOT EXISTS idx_takeaways_source ON takeaways(source_type);
```

---

## 8. CSS Additions

```css
/* Reading card */
.reading-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
}

.reading-meta {
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Takeaway card */
.takeaway-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  line-height: 1.5;
}

.takeaway-source {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.takeaway-applied {
  font-size: 11px;
  color: var(--green);
}

/* Sprint progress */
.sprint-card {
  border-color: var(--accent);
}
```

---

## 9. Coach Integration

### Naval's New Data Points

Naval now has richer coaching data:

| Signal | Coach Action |
|--------|-------------|
| Book stalled 10+ days | "Keep or drop?" prompt (exists) |
| Enjoyment = 'meh' for 2+ checks | "Life's too short. Drop it or give it 20 more pages." |
| 0 takeaways on completed book | "What changed because of this book? If nothing, that's OK — but name it." |
| No podcast takeaways in 2 weeks | "Listening without capturing is entertainment, not learning." |
| Queue empty | Suggest 2-3 books based on current life context |
| Sprint stalled | "Which source is blocking? Skip it." |

### Rory's New Correlations

| Pattern | Query |
|---------|-------|
| Reading days → sleep quality | Do reading sessions correlate with better sleep? |
| Podcast context → takeaway rate | Which context (drive/walk/gym) produces more takeaways? |
| Sprint engagement → week satisfaction | Weeks with sprint progress → higher satisfaction? |

---

## 10. Build Order

| Step | What | Est. Lines |
|------|------|-----------|
| 1 | Run SQL migrations in Supabase | 0 (SQL editor) |
| 2 | Reading card + add-book drawer + pipeline methods | ~120 JS, ~50 HTML |
| 3 | Podcast card + log-podcast drawer + methods | ~80 JS, ~40 HTML |
| 4 | Takeaway drawer + cross-domain takeaway methods | ~50 JS, ~30 HTML |
| 5 | Knowledge Pipeline widget (Status view) | ~40 JS, ~30 HTML |
| 6 | Learning Sprint card (Status view) | ~30 JS, ~20 HTML |
| 7 | CSS additions | ~40 CSS |
| 8 | Update shouldShow() time rules | ~5 JS |
| 9 | Update loadStats() for new widgets | ~20 JS |
| 10 | Update app-reference.md | docs |

**Total: ~365 new lines JS, ~170 HTML, ~40 CSS**

---

## What We're NOT Building

| Trap | Why Not |
|------|---------|
| Article/video bookmark manager | Pocket exists. We track takeaways only. |
| Podcast subscription manager | Spotify does this. We log listens + takeaways. |
| Reading analytics (pages/hour, WPM) | Over-optimization. Binary: reading or not. |
| Book review system | Goodreads exists. We capture 3 takeaways, not reviews. |
| Social reading features | Dan reads alone. Social happens at Bangalore events. |
| Cover art / book metadata API | No external APIs. Dan types the title. 5 seconds. |
| Categories, tags, shelves | Every taxonomy is a procrastination tool. |
