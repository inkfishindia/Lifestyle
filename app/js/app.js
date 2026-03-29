// ================================================
// Dan Lifestyle PWA — Alpine.js + Supabase
// ================================================

const SUPABASE_URL = 'https://ocnpkjgjgyfslgewvqjt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbnBramdqZ3lmc2xnZXd2cWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjA5MjYsImV4cCI6MjA4ODk5NjkyNn0.jfXOLcbYmdySETqvI1MVDLocv73gY-exOa6jWp5GXbA';

// ---- Supabase REST helpers ----
const sb = {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },

  async query(table, params = '') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: this.headers });
    return r.ok ? r.json() : [];
  },

  async upsert(table, data, onConflict) {
    const h = { ...this.headers, 'Prefer': 'return=representation,resolution=merge-duplicates' };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST', headers: h, body: JSON.stringify(data)
    });
    return r.ok ? r.json() : null;
  },

  async insert(table, data) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST', headers: this.headers, body: JSON.stringify(data)
      });
      return r.ok ? r.json() : null;
    } catch {
      this._queueOffline({ method: 'insert', table, data });
      return null;
    }
  },

  async update(table, id, data) {
    try {
    const h = { ...this.headers };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH', headers: h, body: JSON.stringify(data)
    });
    return r.ok ? r.json() : null;
    } catch {
      this._queueOffline({ method: 'update', table, id, data });
      return null;
    }
  },

  _queueOffline(item) {
    const queue = JSON.parse(localStorage.getItem('dl_offline_queue') || '[]');
    queue.push({ ...item, queued_at: new Date().toISOString() });
    localStorage.setItem('dl_offline_queue', JSON.stringify(queue));
  }
};

// ---- Helpers ----
function todayStr() {
  // Local date (IST), not UTC — critical for night owl schedule
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentHour() {
  return new Date().getHours();
}

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const diff = (new Date(todayStr()) - new Date(dateStr)) / 86400000;
  return Math.round(diff);
}

function dayLabels() {
  const days = ['S','M','T','W','T','F','S'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({ date: d.toISOString().slice(0, 10), label: days[d.getDay()] });
  }
  return result;
}

// ---- Alpine App ----
document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    // Auth
    authRequired: false,
    authed: false,
    authPassword: '',
    authError: '',

    view: 'log',
    drawer: null,
    doneForToday: false,
    quickLogText: '',
    showOnboarding: false,
    onboardStep: 1,
    onboard: { wakeTime: '10:00', sleepTime: '02:30', sports: [], bookTitle: '', bookAuthor: '', food: '', oneChange: '' },
    // Settings forms
    newHabitName: '', newHabitFloor: '',
    newBookTitle: '',
    newExpName: '', newExpCriteria: '',
    toast: { show: false, message: '', error: false },
    _toastTimer: null,

    // Coach
    coachMessages: [],
    activeExperiment: null,
    // Live chat
    chatMessages: [],
    chatInput: '',
    chatCoach: 'coach',
    chatStreaming: false,
    availableCoaches: [],

    // Today's daily log
    today: {},
    // Energy readings
    energyReadings: [],
    currentEnergy: { energy: 0, mood: 0, focus: 0 },
    // Habits
    activeHabits: [],
    habitLogs: [],
    weekHabitLogs: [],
    skipReasonHabitId: null,
    weeklyVotes: 0,
    hrvBaseline: 45, // will be computed from rolling average
    // Meals
    mealLogs: [],
    mealSlots: ['breakfast', 'lunch', 'pre_sport', 'dinner', 'late_snack'],
    // Reading pipeline
    activeBooks: [],
    activeBook: null,
    readingQueue: [],
    completedBooks: [],
    bookTakeaways: [],

    // Podcasts
    podcastQueue: [],
    recentPodcasts: [],
    lastPodcast: null,
    podcastsThisWeek: 0,

    // Takeaways (cross-domain)
    allTakeaways: [],
    unappliedTakeaways: [],
    appliedThisMonth: 0,

    // Learning sprint
    activeSprint: null,

    // Stats
    stats: {
      sleepHours: null, sleepDot: '', sleepLabel: '', sleepDebt: '0',
      energyCurve: [], energyLabel: '',
      cascadeRisk: false, cascadeDot: '', cascadeLabel: '', cascadeColor: '', cascadeDetail: '',
      currentBook: '', bookProgress: 0, lastReadLabel: '',
      lastExperience: '', lastExpDaysAgo: '',
      lunchDot: '', lunchColor: '', lunchLabel: 'Not yet',
      caffeineOk: true,
      weeklyPattern: '',
      satisfactionTrend: [],
      podcastLabel: '', takeawayLabel: ''
    },
    alerts: [],

    // Forms
    exerciseForm: { type: '', duration: null, intensity: '' },
    readingForm: { item_id: '', duration: null, progress: null },
    expForm: { name: '', category: '', energy: 0, fun: 0, solo_or_social: '' },
    addBookForm: { title: '', author: '', format: 'kindle' },
    podcastForm: { show: '', episode: '', duration: null, context: '', takeaway: '' },
    queuePodcastForm: { show: '', episode: '' },
    takeawayForm: { text: '', appliedTo: '' },
    takeawaySource: '',
    takeawaySourceType: 'book',
    takeawaySourceId: null,
    takeawayCount: 0,

    // Computed
    get greeting() {
      const h = currentHour();
      if (h < 12) return 'Good morning, Dan';
      if (h < 17) return 'Good afternoon, Dan';
      return 'Good evening, Dan';
    },

    get dateLabel() {
      return new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
    },

    get habitsCompletedOf14() {
      // Count days with did_it=true across all habits in last 14 days
      return this.weekHabitLogs.filter(l => l.did_it).length;
    },

    get currentEnergySlot() {
      const h = currentHour();
      if (h < 14) return 'morning';
      if (h < 19) return 'afternoon';
      return 'evening';
    },

    get mealsLoggedToday() {
      return this.mealLogs.filter(m => m.date === todayStr()).length;
    },

    // ---- Save feedback ----
    flash(msg = 'Saved', isError = false) {
      clearTimeout(this._toastTimer);
      this.toast = { show: true, message: msg, error: isError };
      this._toastTimer = setTimeout(() => { this.toast.show = false; }, 1200);
    },

    // ---- Time-aware card visibility ----
    shouldShow(card) {
      const h = currentHour();
      const d = new Date().getDay();
      switch (card) {
        case 'sleep': return h >= 7 && h < 14;
        case 'energy': return true;
        case 'habits': return h >= 21 || h < 3;
        case 'meal': return true;
        case 'eod': return h >= 22 || h < 3;
        case 'caffeine': return h >= 14;
        case 'reading': return h >= 20 || h < 3;
        case 'podcast': return h >= 20 || h < 3 || d === 0 || d === 6;
        default: return true;
      }
    },

    // ---- Auth ----
    async checkAuth() {
      try {
        const res = await fetch('/api/agents');
        if (res.status === 401) {
          this.authRequired = true;
          return false;
        }
        this.authed = true;
        return true;
      } catch (e) {
        // No server (static mode) — no auth needed
        return true;
      }
    },

    async submitAuth() {
      this.authError = '';
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: this.authPassword })
        });
        if (res.ok) {
          this.authed = true;
          this.authPassword = '';
          this.init();
        } else {
          this.authError = 'Wrong password';
        }
      } catch (e) {
        this.authError = 'Connection error';
      }
    },

    // ---- Init ----
    async init() {
      // Check auth before loading anything
      const authOk = await this.checkAuth();
      if (!authOk && this.authRequired) return;

      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
      }

      // Request notification permission (Lever #3)
      this.requestNotifications();

      // Load all data in parallel
      await Promise.all([
        this.loadDailyLog(),
        this.loadEnergy(),
        this.loadHabits(),
        this.loadMeals(),
        this.loadReadingPipeline(),
        this.loadPodcasts(),
        this.loadTakeaways(),
        this.loadActiveSprint(),
        this.loadStats(),
        this.loadExperiment()
      ]);

      this.computeAlerts();
      this.generateCoachMessages();
      this.computeHrvBaseline();
      this.scheduleCheckin();
      this.syncOfflineQueue();

      // Show onboarding if no habits and never onboarded
      if (this.activeHabits.length === 0 && !localStorage.getItem('dl_onboarded')) {
        this.showOnboarding = true;
      }
      this.loadCoaches();
    },

    // ---- Data Loading ----
    async loadDailyLog() {
      const date = todayStr();
      const rows = await sb.query('daily_log', `date=eq.${date}`);
      if (rows.length) {
        this.today = rows[0];
      } else {
        const created = await sb.insert('daily_log', { date });
        this.today = created?.[0] || { date };
      }
    },

    async loadEnergy() {
      const date = todayStr();
      this.energyReadings = await sb.query('energy_logs', `date=eq.${date}&order=logged_at.asc`);
      const slot = this.currentEnergySlot;
      const existing = this.energyReadings.find(e => e.slot === slot);
      this.currentEnergy = existing || { energy: 0, mood: 0, focus: 0 };
    },

    async loadHabits() {
      this.activeHabits = await sb.query('habits', 'status=eq.active&order=created_at.asc');

      // Today's logs
      this.habitLogs = await sb.query('habit_logs', `date=eq.${todayStr()}`);

      // 14-day logs for fractions
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 14);
      const weekStr = weekAgo.toISOString().slice(0, 10);
      this.weekHabitLogs = await sb.query('habit_logs', `date=gte.${weekStr}&order=date.asc`);

      // Weekly votes
      this.weeklyVotes = this.weekHabitLogs.filter(l => l.did_it).length;
    },

    async loadMeals() {
      this.mealLogs = await sb.query('meal_logs', `date=eq.${todayStr()}`);
    },

    async loadBooks() {
      this.activeBooks = await sb.query('reading_items', 'status=eq.active&order=created_at.desc');
    },

    // ---- Reading Pipeline ----
    async loadReadingPipeline() {
      const [active, queue, completed, takeaways] = await Promise.all([
        sb.query('reading_items', 'status=eq.active&limit=1'),
        sb.query('reading_items', 'status=eq.queue&order=queue_position.asc&limit=5'),
        sb.query('reading_items', 'status=eq.completed&order=completed_date.desc&limit=10'),
        sb.query('takeaways', 'source_type=eq.book&order=created_at.desc')
      ]);
      this.activeBook = active[0] || null;
      this.activeBooks = active; // keep for existing reading drawer compat
      this.readingQueue = queue;
      // Attach takeaway counts to completed books
      this.completedBooks = completed.map(b => ({
        ...b,
        takeaway_count: takeaways.filter(t => t.item_id === b.id).length
      }));
      this.bookTakeaways = this.activeBook
        ? takeaways.filter(t => t.item_id === this.activeBook.id)
        : [];
    },

    shouldPromptEnjoyment() {
      if (!this.activeBook) return false;
      if (!this.activeBook.last_enjoyment_check) return this.activeBook.started_date != null;
      return daysAgo(this.activeBook.last_enjoyment_check) >= 7;
    },

    async setEnjoyment(val) {
      if (!this.activeBook) return;
      if (val === 'drop') {
        await sb.update('reading_items', this.activeBook.id, {
          status: 'dropped', enjoyment: 'meh', last_enjoyment_check: todayStr()
        });
        this.flash('Book dropped');
        await this.promoteNextBook();
        await this.loadReadingPipeline();
        return;
      }
      await sb.update('reading_items', this.activeBook.id, {
        enjoyment: val, last_enjoyment_check: todayStr()
      });
      this.activeBook.enjoyment = val;
      this.activeBook.last_enjoyment_check = todayStr();
      this.flash(val === 'yes' ? 'Keep going!' : 'Noted — give it a few more pages');
    },

    async promoteNextBook() {
      if (this.readingQueue.length === 0) return;
      const next = this.readingQueue[0];
      await sb.update('reading_items', next.id, {
        status: 'active', started_date: todayStr(), queue_position: null
      });
      // Reorder remaining queue
      for (let i = 1; i < this.readingQueue.length; i++) {
        await sb.update('reading_items', this.readingQueue[i].id, { queue_position: i });
      }
    },

    async startBook(id) {
      await sb.update('reading_items', id, {
        status: 'active', started_date: todayStr(), queue_position: null
      });
      this.flash('Started reading');
      await this.loadReadingPipeline();
    },

    async addToQueue() {
      if (!this.addBookForm.title.trim()) return;
      const pos = this.readingQueue.length + 1;
      if (pos > 5) { this.flash('Queue full (max 5)', true); return; }
      await sb.insert('reading_items', {
        title: this.addBookForm.title.trim(),
        author: this.addBookForm.author.trim(),
        format: this.addBookForm.format,
        status: 'queue',
        queue_position: pos,
        progress_pct: 0
      });
      this.addBookForm = { title: '', author: '', format: 'kindle' };
      this.drawer = null;
      this.flash('Added to queue');
      await this.loadReadingPipeline();
    },

    async removeFromQueue(id) {
      await sb.update('reading_items', id, { status: 'dropped' });
      this.flash('Removed');
      await this.loadReadingPipeline();
    },

    async completeBook() {
      if (!this.activeBook) return;
      await sb.update('reading_items', this.activeBook.id, {
        status: 'completed', completed_date: todayStr(), progress_pct: 100
      });
      // Open takeaway drawer
      this.takeawaySource = this.activeBook.title;
      this.takeawaySourceType = 'book';
      this.takeawaySourceId = this.activeBook.id;
      this.takeawayCount = 0;
      this.takeawayForm = { text: '', appliedTo: '' };
      this.drawer = 'takeaway';
      this.flash('Completed! Log your takeaways.');
      await this.promoteNextBook();
      await this.loadReadingPipeline();
    },

    // ---- Podcasts ----
    async loadPodcasts() {
      const [queued, recent] = await Promise.all([
        sb.query('podcast_logs', 'status=eq.queued&order=created_at.asc&limit=3'),
        sb.query('podcast_logs', 'status=eq.logged&order=date.desc&limit=5')
      ]);
      this.podcastQueue = queued;
      this.recentPodcasts = recent;
      this.lastPodcast = recent[0] || null;
      // Count this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      this.podcastsThisWeek = recent.filter(p => p.date >= weekAgo.toISOString().slice(0, 10)).length;
    },

    async logPodcast() {
      if (!this.podcastForm.show.trim() || !this.podcastForm.episode.trim()) return;
      const data = {
        date: todayStr(),
        show: this.podcastForm.show.trim(),
        episode_title: this.podcastForm.episode.trim(),
        context: this.podcastForm.context || null,
        duration_min: this.podcastForm.duration || null,
        status: 'logged',
        captured_takeaway: !!this.podcastForm.takeaway.trim()
      };
      if (this.podcastForm.takeaway.trim()) {
        data.takeaway_text = this.podcastForm.takeaway.trim();
      }
      await sb.insert('podcast_logs', data);
      // Also save as a takeaway if provided
      if (this.podcastForm.takeaway.trim()) {
        await sb.insert('takeaways', {
          source_type: 'podcast',
          source_title: data.show + ' — ' + data.episode_title,
          takeaway_text: this.podcastForm.takeaway.trim()
        });
      }
      this.podcastForm = { show: '', episode: '', duration: null, context: '', takeaway: '' };
      this.drawer = null;
      this.flash('Podcast logged');
      await this.loadPodcasts();
      await this.loadTakeaways();
    },

    async queueEpisode() {
      if (!this.queuePodcastForm.show.trim() || !this.queuePodcastForm.episode.trim()) return;
      if (this.podcastQueue.length >= 3) { this.flash('Queue full (max 3)', true); return; }
      await sb.insert('podcast_logs', {
        show: this.queuePodcastForm.show.trim(),
        episode_title: this.queuePodcastForm.episode.trim(),
        status: 'queued'
      });
      this.queuePodcastForm = { show: '', episode: '' };
      this.drawer = null;
      this.flash('Episode queued');
      await this.loadPodcasts();
    },

    async markListened(id) {
      await sb.update('podcast_logs', id, { status: 'logged', date: todayStr() });
      this.flash('Marked as listened');
      await this.loadPodcasts();
    },

    async savePodcastTakeaway(id, text) {
      if (!text.trim()) return;
      const pod = this.recentPodcasts.find(p => p.id === id) || this.lastPodcast;
      await sb.update('podcast_logs', id, { captured_takeaway: true, takeaway_text: text.trim() });
      if (pod) {
        await sb.insert('takeaways', {
          source_type: 'podcast',
          source_title: pod.show + ' — ' + pod.episode_title,
          takeaway_text: text.trim()
        });
      }
      this.flash('Takeaway captured');
      await this.loadPodcasts();
      await this.loadTakeaways();
    },

    async skipPodcastTakeaway(id) {
      await sb.update('podcast_logs', id, { captured_takeaway: false });
      this.lastPodcast.captured_takeaway = false;
    },

    // ---- Takeaways (cross-domain) ----
    async loadTakeaways() {
      const all = await sb.query('takeaways', 'order=created_at.desc&limit=50');
      this.allTakeaways = all;
      this.unappliedTakeaways = all.filter(t => !t.applied_to);
      const monthStart = todayStr().slice(0, 7);
      this.appliedThisMonth = all.filter(t => t.applied_date && t.applied_date.startsWith(monthStart)).length;
    },

    async saveTakeaway() {
      if (!this.takeawayForm.text.trim()) return;
      if (this.takeawayCount >= 3) { this.flash('Max 3 takeaways per source', true); return; }
      await sb.insert('takeaways', {
        item_id: this.takeawaySourceId,
        source_type: this.takeawaySourceType,
        source_title: this.takeawaySource,
        takeaway_text: this.takeawayForm.text.trim(),
        applied_to: this.takeawayForm.appliedTo.trim() || null,
        applied_date: this.takeawayForm.appliedTo.trim() ? todayStr() : null
      });
      this.takeawayCount++;
      this.takeawayForm = { text: '', appliedTo: '' };
      this.flash('Takeaway saved (' + this.takeawayCount + '/3)');
      if (this.takeawayCount >= 3) {
        this.drawer = null;
      }
      await this.loadTakeaways();
    },

    async markTakeawayApplied(id) {
      this.takeawayForm = { text: '', appliedTo: '' };
      this.takeawaySourceId = id;
      this.drawer = 'apply-takeaway';
    },

    async submitApplyTakeaway() {
      if (!this.takeawayForm.appliedTo.trim()) return;
      await sb.update('takeaways', this.takeawaySourceId, {
        applied_to: this.takeawayForm.appliedTo.trim(),
        applied_date: todayStr()
      });
      this.drawer = null;
      this.flash('Applied!');
      await this.loadTakeaways();
    },

    openTakeawayDrawer(sourceType, sourceTitle, sourceId) {
      this.takeawaySource = sourceTitle;
      this.takeawaySourceType = sourceType;
      this.takeawaySourceId = sourceId;
      this.takeawayCount = this.allTakeaways.filter(t =>
        t.source_type === sourceType && (t.item_id === sourceId || t.source_title === sourceTitle)
      ).length;
      this.takeawayForm = { text: '', appliedTo: '' };
      this.drawer = 'takeaway';
    },

    // ---- Learning Sprint ----
    async loadActiveSprint() {
      const month = todayStr().slice(0, 7);
      const sprints = await sb.query('learning_sprints', `status=eq.active&order=created_at.desc&limit=1`);
      this.activeSprint = sprints[0] || null;
      if (this.activeSprint && typeof this.activeSprint.sources === 'string') {
        this.activeSprint.sources = JSON.parse(this.activeSprint.sources);
      }
    },

    get sprintProgress() {
      if (!this.activeSprint?.sources?.length) return 0;
      const consumed = this.activeSprint.sources.filter(s => s.consumed).length;
      return Math.round((consumed / this.activeSprint.sources.length) * 100);
    },

    get sprintConsumedCount() {
      if (!this.activeSprint?.sources) return 0;
      return this.activeSprint.sources.filter(s => s.consumed).length;
    },

    async markSprintSourceConsumed(idx) {
      if (!this.activeSprint) return;
      const sources = [...this.activeSprint.sources];
      sources[idx].consumed = !sources[idx].consumed;
      await sb.update('learning_sprints', this.activeSprint.id, { sources: JSON.stringify(sources) });
      this.activeSprint.sources = sources;
      this.flash(sources[idx].consumed ? 'Source completed' : 'Unmarked');
    },

    async loadStats() {
      const date = todayStr();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStr = weekAgo.toISOString().slice(0, 10);

      // Sleep stats
      const sleepWeek = await sb.query('daily_log', `date=gte.${weekStr}&select=sleep_hours,sleep_quality,day_type,week_satisfaction&order=date.asc`);
      if (this.today.sleep_hours) {
        this.stats.sleepHours = parseFloat(this.today.sleep_hours).toFixed(1);
        this.stats.sleepDot = this.today.sleep_quality === 3 ? 'green' : this.today.sleep_quality === 2 ? 'amber' : 'red';
        this.stats.sleepLabel = ['', 'Groggy', 'Okay', 'Rested'][this.today.sleep_quality] || '';
      }
      const sleepHours = sleepWeek.filter(d => d.sleep_hours).map(d => parseFloat(d.sleep_hours));
      const avgSleep = sleepHours.length ? sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length : 7;
      this.stats.sleepDebt = (7 - avgSleep).toFixed(1);

      // Energy curve (today's readings)
      const todayEnergy = await sb.query('energy_logs', `date=eq.${date}&order=logged_at.asc`);
      this.stats.energyCurve = todayEnergy.map(e => e.energy || 0);
      if (todayEnergy.length) {
        const labels = todayEnergy.map(e => e.energy);
        this.stats.energyLabel = labels.join(' → ');
      }

      // Cascade risk
      const lunch = this.mealLogs.find(m => m.slot === 'lunch');
      const afternoonEnergy = todayEnergy.find(e => e.slot === 'afternoon');
      if (lunch || afternoonEnergy) {
        this.stats.cascadeRisk = true;
        const lunchOk = !!lunch;
        const energyOk = afternoonEnergy ? afternoonEnergy.energy >= 3 : true;
        if (lunchOk && energyOk) {
          this.stats.cascadeDot = 'green';
          this.stats.cascadeLabel = 'LOW';
          this.stats.cascadeColor = 'green';
          this.stats.cascadeDetail = 'Lunch on time ✓';
        } else if (!lunchOk) {
          this.stats.cascadeDot = 'red';
          this.stats.cascadeLabel = 'HIGH';
          this.stats.cascadeColor = 'red';
          this.stats.cascadeDetail = 'Lunch missed';
        } else {
          this.stats.cascadeDot = 'amber';
          this.stats.cascadeLabel = 'MEDIUM';
          this.stats.cascadeColor = 'amber';
          this.stats.cascadeDetail = 'Low afternoon energy';
        }
      }

      // Reading
      if (this.activeBook) {
        this.stats.currentBook = this.activeBook.title;
        this.stats.bookProgress = this.activeBook.progress_pct || 0;
        const sessions = await sb.query('reading_sessions', `item_id=eq.${this.activeBook.id}&order=date.desc&limit=1`);
        if (sessions.length) {
          const ago = daysAgo(sessions[0].date);
          this.stats.lastReadLabel = `${sessions[0].duration_min} min · ${ago === 0 ? 'today' : ago + 'd ago'}`;
        }
      } else if (this.activeBooks.length) {
        const book = this.activeBooks[0];
        this.stats.currentBook = book.title;
        this.stats.bookProgress = book.progress_pct || 0;
      }

      // Podcast stats
      this.stats.podcastLabel = this.podcastsThisWeek + ' episode' + (this.podcastsThisWeek !== 1 ? 's' : '') + ' this week';

      // Takeaway stats
      const unapplied = this.unappliedTakeaways.length;
      this.stats.takeawayLabel = unapplied > 0 ? unapplied + ' unapplied' : 'All applied';

      // Experience
      const exps = await sb.query('experience_logs', 'order=date.desc&limit=1');
      if (exps.length) {
        this.stats.lastExperience = exps[0].name;
        const ago = daysAgo(exps[0].date);
        this.stats.lastExpDaysAgo = ago === 0 ? 'Today' : ago + ' days ago';
      }

      // Lunch status (reuse lunch from cascade check)
      const lunchForStatus = this.mealLogs.find(m => m.slot === 'lunch');
      if (lunchForStatus) {
        this.stats.lunchDot = 'green';
        this.stats.lunchColor = 'green';
        this.stats.lunchLabel = lunchForStatus.logged_time ? lunchForStatus.logged_time.slice(0,5) : 'Done';
      } else {
        const h = currentHour();
        this.stats.lunchDot = h >= 14 ? 'red' : 'amber';
        this.stats.lunchColor = h >= 14 ? 'red' : 'amber';
        this.stats.lunchLabel = h >= 14 ? 'Missed' : 'Not yet';
      }

      // Caffeine window (sleep target 2:30 AM = 26.5 hrs from midnight)
      if (this.today.caffeine_last) {
        const parts = this.today.caffeine_last.split(':');
        const caffHour = parseInt(parts[0]) + parseInt(parts[1]) / 60;
        const sleepTarget = 2.5; // 2:30 AM
        const hoursToSleep = caffHour < sleepTarget ? sleepTarget - caffHour : (24 - caffHour) + sleepTarget;
        this.stats.caffeineOk = hoursToSleep >= 6.5;
      } else {
        this.stats.caffeineOk = true;
      }

      // Satisfaction trend
      const satWeeks = await sb.query('daily_log', 'week_satisfaction=not.is.null&order=date.desc&limit=8');
      this.stats.satisfactionTrend = satWeeks.map(d => d.week_satisfaction).reverse();
    },

    // ---- Alerts ----
    computeAlerts() {
      this.alerts = [];
      // Never miss twice
      // Check yesterday's habit logs
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      const yMisses = this.weekHabitLogs.filter(l => l.date === yStr && !l.did_it);
      if (yMisses.length > 0) {
        const habit = this.activeHabits.find(h => h.id === yMisses[0].habit_id);
        this.alerts.push({
          id: 'nmt',
          type: 'red',
          message: `Never miss twice — ${habit?.floor_version || 'floor version'} is enough tonight.`
        });
      }
    },

    // ---- Coach Messages (generated from data) ----
    async generateCoachMessages() {
      // 1. Load agent-written messages from Supabase (the real ones)
      const dbMessages = await sb.query('coach_messages', `date=gte.${todayStr()}&order=created_at.desc`);
      this.coachMessages = dbMessages.map(m => ({
        id: m.id,
        coach: m.coach,
        message: m.message,
        time: new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        actions: m.actions || [],
        read: m.read
      }));

      // 2. Add real-time local nudges (time-sensitive, don't need agent session)
      const h = currentHour();

      if (this.today.sleep_hours && parseFloat(this.today.sleep_hours) < 6.5) {
        this.coachMessages.push({ coach: 'Andrew', message: 'NSDR at 3 PM today. 15 minutes. Non-negotiable.', time: 'Now', actions: [{ label: 'Got it', type: 'dismiss' }] });
      }

      if (h >= 12 && h < 14 && !this.mealLogs.find(m => m.slot === 'lunch')) {
        this.coachMessages.push({ coach: 'Andrew', message: 'Lunch time. Eat something — even dal chawal. Crash hits in 2 hours.', time: 'Now', actions: [] });
      }

      if (this.today.sleep_hours && parseFloat(this.today.sleep_hours) < 6) {
        this.coachMessages.push({ coach: 'James', message: 'Floor version day. Habits shrink automatically — your sleep was under 6 hours.', time: 'Now', actions: [] });
      }

      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      const yMisses = this.weekHabitLogs.filter(l => l.date === yStr && !l.did_it);
      if (yMisses.length > 0) {
        const habit = this.activeHabits.find(h => h.id === yMisses[0].habit_id);
        this.coachMessages.push({ coach: 'James', message: `Never miss twice. ${habit?.floor_version || 'Floor version'} is enough tonight.`, time: 'Now', actions: [] });
      }

      if (this.activeExperiment) {
        const reviewDate = new Date(this.activeExperiment.review_date);
        const today = new Date(todayStr());
        if (reviewDate <= today) {
          this.coachMessages.push({ coach: 'Rory', message: `Experiment "${this.activeExperiment.name}" — review time. Keep, drop, or adapt?`, time: 'Now', actions: [{ label: 'Keep', type: 'exp_keep' }, { label: 'Drop', type: 'exp_drop' }, { label: 'Adapt', type: 'exp_adapt' }] });
        }
      }
    },

    async handleCoachAction(action) {
      if (action.type === 'dismiss') {
        // Remove the message
      } else if (action.type === 'drop_book' && this.activeBook) {
        await sb.update('reading_items', this.activeBook.id, { status: 'dropped' });
        await this.promoteNextBook();
        await this.loadReadingPipeline();
        this.flash('Book dropped');
      } else if (action.type === 'add_book') {
        this.drawer = 'add-book';
      } else if (action.type?.startsWith('exp_') && this.activeExperiment) {
        const outcome = action.type.replace('exp_', '');
        await sb.update('experiments', this.activeExperiment.id, { status: outcome === 'keep' ? 'kept' : outcome === 'drop' ? 'dropped' : 'adapted' });
        this.activeExperiment = null;
        this.flash('Experiment ' + outcome + 'ed');
      }
      this.generateCoachMessages();
    },

    // ---- Experiment ----
    async loadExperiment() {
      const exps = await sb.query('experiments', 'status=eq.active&limit=1');
      if (exps.length) {
        const exp = exps[0];
        const reviewDate = new Date(exp.review_date);
        const today = new Date(todayStr());
        exp.days_remaining = Math.max(0, Math.ceil((reviewDate - today) / 86400000));
        exp.did_today = false; // TODO: track in a daily experiment log
        this.activeExperiment = exp;
      }
    },

    async logExperimentDay(didIt) {
      if (!this.activeExperiment) return;
      this.activeExperiment.did_today = didIt;
      this.flash(didIt ? 'Logged: Yes' : 'Logged: No');
    },

    // ---- Quick Log Parser ----
    async parseQuickLog() {
      const text = this.quickLogText.trim().toLowerCase();
      if (!text) return;

      // Exercise patterns
      const exerciseMatch = text.match(/^(swam|swim|tennis|walked|walk|ran|run|gym|cold shower|yoga|swimming)\s*(\d+)?\s*(min|mins|minutes|hr|hrs|hour)?/);
      if (exerciseMatch) {
        const typeMap = { swam: 'swimming', swim: 'swimming', tennis: 'tennis', walked: 'walk', walk: 'walk', ran: 'walk', run: 'walk', gym: 'gym', 'cold shower': 'cold_shower', yoga: 'yoga', swimming: 'swimming' };
        const type = typeMap[exerciseMatch[1]] || 'other';
        let duration = parseInt(exerciseMatch[2]) || 30;
        if (exerciseMatch[3]?.startsWith('hr')) duration *= 60;
        await sb.insert('exercise_logs', { date: todayStr(), exercise_type: type, duration_min: duration, intensity: 'moderate' });
        this.quickLogText = '';
        this.flash(`${type} ${duration} min logged`);
        return;
      }

      // Meal patterns
      const mealMatch = text.match(/(ate|had|eaten|lunch|breakfast|dinner|snack|meal)/);
      if (mealMatch) {
        const h = currentHour();
        let slot = h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 18 ? 'pre_sport' : h < 21 ? 'dinner' : 'late_snack';
        if (text.includes('breakfast')) slot = 'breakfast';
        if (text.includes('lunch')) slot = 'lunch';
        if (text.includes('dinner')) slot = 'dinner';
        if (text.includes('snack')) slot = 'late_snack';
        const now = new Date().toTimeString().slice(0, 5);
        const existing = this.getMealLog(slot);
        if (!existing) {
          const created = await sb.insert('meal_logs', { date: todayStr(), slot, logged_time: now, protein: 'med', was_junk: false });
          if (created?.[0]) this.mealLogs.push(created[0]);
        }
        this.quickLogText = '';
        this.flash(`${slot} logged`);
        return;
      }

      // Reading patterns
      const readMatch = text.match(/read\s*(\d+)?\s*(min|mins|minutes|pages)?/);
      if (readMatch && this.activeBooks.length) {
        const duration = parseInt(readMatch[1]) || 20;
        await sb.insert('reading_sessions', { item_id: this.activeBooks[0].id, date: todayStr(), duration_min: duration, time_slot: currentHour() >= 21 ? 'pre_sleep' : 'other' });
        this.quickLogText = '';
        this.flash(`Reading ${duration} min logged`);
        return;
      }

      // Experience patterns
      const expMatch = text.match(/^(tried|went to|did)\s+(.+)/);
      if (expMatch) {
        await sb.insert('experience_logs', { date: todayStr(), name: expMatch[2], first_time: true });
        this.quickLogText = '';
        this.flash(`Experience "${expMatch[2]}" logged`);
        return;
      }

      // Habit patterns
      const habitDoneMatch = text.match(/^(did|done|completed)\s+(.+)/);
      if (habitDoneMatch) {
        const name = habitDoneMatch[2];
        const habit = this.activeHabits.find(h => h.name.toLowerCase().includes(name));
        if (habit) {
          await this.toggleHabit(habit.id);
          this.quickLogText = '';
          return;
        }
      }

      const habitSkipMatch = text.match(/^(skipped|skip)\s+(.+)/);
      if (habitSkipMatch) {
        const name = habitSkipMatch[2];
        const habit = this.activeHabits.find(h => h.name.toLowerCase().includes(name));
        if (habit) {
          await this.skipHabit(habit.id);
          this.quickLogText = '';
          return;
        }
      }

      this.flash('Couldn\'t parse — try "swam 30 min" or "ate lunch"', true);
    },

    // ---- Done For Today ----
    markDoneForToday() {
      this.doneForToday = true;
      this.flash('You\'re done. Go live.');
    },

    // ---- Habit Fraction (replaces streak grid) ----
    getHabitFraction(habitId) {
      const hits = this.weekHabitLogs.filter(l => l.habit_id === habitId && l.did_it).length;
      return `${hits} of 14`;
    },

    // ---- Actions: Daily Log ----
    async saveDailyField(field) {
      if (!this.today.id) return;
      const res = await sb.update('daily_log', this.today.id, { [field]: this.today[field] });
      this.flash(res ? 'Saved' : 'Save failed', !res);
    },

    async setSleepQuality(val) {
      this.today.sleep_quality = val;
      await this.saveDailyField('sleep_quality');
    },

    async toggleDaily(field) {
      this.today[field] = !this.today[field];
      await this.saveDailyField(field);
    },

    async setDailyDot(field, val) {
      this.today[field] = val;
      await this.saveDailyField(field);
    },

    // ---- Actions: Energy ----
    async setEnergy(field, val) {
      this.currentEnergy[field] = val;
      const slot = this.currentEnergySlot;
      const date = todayStr();
      const data = { date, slot, [field]: val };

      // Upsert
      const existing = this.energyReadings.find(e => e.slot === slot);
      if (existing) {
        const res = await sb.update('energy_logs', existing.id, { [field]: val });
        existing[field] = val;
        this.flash(res ? 'Saved' : 'Save failed', !res);
      } else {
        const created = await sb.upsert('energy_logs', data);
        if (created?.[0]) {
          this.energyReadings.push(created[0]);
          this.currentEnergy = created[0];
          this.flash('Saved');
        }
      }
    },

    // ---- Actions: Habits ----
    getHabitLog(habitId) {
      return this.habitLogs.find(l => l.habit_id === habitId);
    },

    async toggleHabit(habitId) {
      const existing = this.getHabitLog(habitId);
      if (existing) {
        // Toggle done state
        const newVal = !existing.did_it;
        existing.did_it = newVal;
        await sb.update('habit_logs', existing.id, { did_it: newVal, miss_type: null });
        this.skipReasonHabitId = null;
      } else {
        const data = { habit_id: habitId, date: todayStr(), did_it: true, floor_used: false };
        const created = await sb.insert('habit_logs', data);
        if (created?.[0]) this.habitLogs.push(created[0]);
      }
      this.weeklyVotes = [...this.weekHabitLogs, ...this.habitLogs].filter(l => l.did_it).length;
      this.flash('✓ Logged');
    },

    // Skip Button Protocol (Lever #5) — one tap skip, then show why
    async skipHabit(habitId) {
      const existing = this.getHabitLog(habitId);
      if (existing) {
        existing.did_it = false;
        await sb.update('habit_logs', existing.id, { did_it: false });
      } else {
        const data = { habit_id: habitId, date: todayStr(), did_it: false, floor_used: false };
        const created = await sb.insert('habit_logs', data);
        if (created?.[0]) this.habitLogs.push(created[0]);
      }
      this.skipReasonHabitId = habitId;
      this.weeklyVotes = [...this.weekHabitLogs, ...this.habitLogs].filter(l => l.did_it).length;
      this.flash('Skipped — why?');
    },

    async toggleFloor(habitId) {
      const log = this.getHabitLog(habitId);
      if (!log) return;
      log.floor_used = !log.floor_used;
      await sb.update('habit_logs', log.id, { floor_used: log.floor_used });
    },

    async setMissType(val) {
      if (!this.skipReasonHabitId || !val) return;
      const log = this.getHabitLog(this.skipReasonHabitId);
      if (log) {
        log.miss_type = val;
        await sb.update('habit_logs', log.id, { miss_type: val });
      }
      this.skipReasonHabitId = null;
    },

    // getHabitWeek removed — using getHabitFraction() instead (no streak heatmaps)

    // ---- Actions: Meals ----
    getMealLog(slot) {
      return this.mealLogs.find(m => m.slot === slot);
    },

    async logMeal(slot, protein) {
      const existing = this.getMealLog(slot);
      const now = new Date().toTimeString().slice(0, 5);
      if (existing) {
        existing.protein = protein;
        await sb.update('meal_logs', existing.id, { protein, logged_time: now });
      } else {
        const data = { date: todayStr(), slot, protein, logged_time: now, was_junk: false };
        const created = await sb.insert('meal_logs', data);
        if (created?.[0]) this.mealLogs.push(created[0]);
      }
      this.flash('Meal logged');
    },

    async toggleMealJunk(slot) {
      const existing = this.getMealLog(slot);
      if (existing) {
        existing.was_junk = !existing.was_junk;
        await sb.update('meal_logs', existing.id, { was_junk: existing.was_junk });
      }
    },

    // ---- Actions: Exercise ----
    async saveExercise() {
      if (!this.exerciseForm.type) return;
      await sb.insert('exercise_logs', {
        date: todayStr(),
        exercise_type: this.exerciseForm.type,
        duration_min: this.exerciseForm.duration,
        intensity: this.exerciseForm.intensity
      });
      this.exerciseForm = { type: '', duration: null, intensity: '' };
      this.drawer = null;
      this.flash('Exercise logged');
    },

    // ---- Actions: Reading ----
    async saveReading() {
      if (!this.readingForm.item_id) return;
      const book = this.activeBooks.find(b => b.id === this.readingForm.item_id);
      const progressBefore = book?.progress_pct || 0;
      await sb.insert('reading_sessions', {
        item_id: this.readingForm.item_id,
        date: todayStr(),
        time_slot: currentHour() >= 21 ? 'pre_sleep' : currentHour() < 12 ? 'morning' : 'other',
        duration_min: this.readingForm.duration,
        progress_before: progressBefore,
        progress_after: this.readingForm.progress
      });
      // Update book progress + started_date
      if (book && this.readingForm.progress) {
        const updates = { progress_pct: this.readingForm.progress };
        if (!book.started_date) updates.started_date = todayStr();
        await sb.update('reading_items', book.id, updates);
        book.progress_pct = this.readingForm.progress;
        if (updates.started_date) book.started_date = updates.started_date;
      }
      // Check if complete (100%)
      if (this.readingForm.progress >= 100) {
        this.readingForm = { item_id: '', duration: null, progress: null };
        this.drawer = null;
        await this.completeBook();
        return;
      }
      this.readingForm = { item_id: '', duration: null, progress: null };
      this.drawer = null;
      this.flash('Reading logged');
      await this.loadReadingPipeline();
    },

    // ---- Actions: Experience ----
    async saveExperience() {
      if (!this.expForm.name) return;
      await sb.insert('experience_logs', {
        date: todayStr(),
        name: this.expForm.name,
        category: this.expForm.category,
        energy_after: this.expForm.energy,
        fun_score: this.expForm.fun,
        solo_or_social: this.expForm.solo_or_social,
        first_time: true
      });
      this.expForm = { name: '', category: '', energy: 0, fun: 0, solo_or_social: '' };
      this.drawer = null;
      this.flash('Experience logged');
    },

    // ---- Lever #3: One-Question Check-in Notification ----
    requestNotifications() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    },

    scheduleCheckin() {
      // Schedule a 3 PM energy check-in notification
      const now = new Date();
      const target = new Date();
      target.setHours(15, 0, 0, 0);
      if (now > target) target.setDate(target.getDate() + 1);
      const ms = target - now;

      setTimeout(() => {
        this.sendCheckinNotification();
        // Reschedule for next day
        setInterval(() => this.sendCheckinNotification(), 24 * 60 * 60 * 1000);
      }, ms);

      // Also schedule lunch reminder at 12:10 PM (Lever #2)
      const lunch = new Date();
      lunch.setHours(12, 10, 0, 0);
      if (now < lunch) {
        setTimeout(() => this.sendLunchReminder(), lunch - now);
      }

      // Habit reminder at 11:30 PM
      const habitReminder = new Date();
      habitReminder.setHours(23, 30, 0, 0);
      if (now < habitReminder) {
        setTimeout(() => this.sendHabitReminder(), habitReminder - now);
      }
    },

    sendCheckinNotification() {
      if (Notification.permission !== 'granted') return;
      new Notification('Energy check — 1 tap', {
        body: 'How is your energy right now? (1-5)',
        icon: 'icons/icon-192.png',
        tag: 'energy-checkin',
        renotify: true
      });
    },

    sendLunchReminder() {
      if (Notification.permission !== 'granted') return;
      const lunch = this.mealLogs.find(m => m.slot === 'lunch');
      if (!lunch) {
        new Notification('Eat something now', {
          body: 'Even dal chawal. Crash hits in 2 hours.',
          icon: 'icons/icon-192.png',
          tag: 'lunch-reminder'
        });
      }
    },

    sendHabitReminder() {
      if (Notification.permission !== 'granted') return;
      const unlogged = this.activeHabits.filter(h => !this.getHabitLog(h.id));
      if (unlogged.length > 0) {
        new Notification('Habits not logged yet', {
          body: `${unlogged.map(h => h.name).join(', ')} — 30 seconds`,
          icon: 'icons/icon-192.png',
          tag: 'habit-reminder'
        });
      }
    },

    // ---- Lever #10: HRV Baseline ----
    async computeHrvBaseline() {
      // Rolling 14-day average
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const rows = await sb.query('daily_log',
        `hrv_morning=not.is.null&date=gte.${twoWeeksAgo.toISOString().slice(0, 10)}&select=hrv_morning`
      );
      if (rows.length >= 3) {
        const avg = rows.reduce((sum, r) => sum + r.hrv_morning, 0) / rows.length;
        this.hrvBaseline = Math.round(avg);
      }
    },

    // ---- Onboarding ----
    async completeOnboarding() {
      // Create first habit from "one thing to change"
      if (this.onboard.oneChange) {
        await sb.insert('habits', {
          name: this.onboard.oneChange,
          standard_version: this.onboard.oneChange,
          floor_version: '2-minute version',
          status: 'active',
          phase: 'experiment'
        });
      }
      // Add book if provided
      if (this.onboard.bookTitle) {
        await sb.insert('reading_items', {
          title: this.onboard.bookTitle,
          author: this.onboard.bookAuthor || null,
          status: 'active',
          progress_pct: 0
        });
      }
      // Save preferences to localStorage
      localStorage.setItem('dl_onboarded', 'true');
      localStorage.setItem('dl_wake', this.onboard.wakeTime);
      localStorage.setItem('dl_sleep', this.onboard.sleepTime);
      localStorage.setItem('dl_sports', JSON.stringify(this.onboard.sports));
      localStorage.setItem('dl_food', this.onboard.food);

      this.showOnboarding = false;
      // Reload data
      await Promise.all([this.loadHabits(), this.loadBooks()]);
      this.flash('Welcome! Let\'s go.');
    },

    // ---- Settings: Habits ----
    async addHabit() {
      if (!this.newHabitName || this.activeHabits.length >= 3) return;
      const created = await sb.insert('habits', {
        name: this.newHabitName,
        floor_version: this.newHabitFloor || '2-minute version',
        status: 'active',
        phase: 'experiment'
      });
      if (created?.[0]) this.activeHabits.push(created[0]);
      this.newHabitName = '';
      this.newHabitFloor = '';
      this.flash('Habit added');
    },

    async pauseHabit(id) {
      await sb.update('habits', id, { status: 'paused' });
      this.activeHabits = this.activeHabits.filter(h => h.id !== id);
      this.flash('Habit paused');
    },

    async graduateHabit(id) {
      await sb.update('habits', id, { status: 'graduated', phase: 'graduated' });
      this.activeHabits = this.activeHabits.filter(h => h.id !== id);
      this.flash('Habit graduated!');
    },

    // ---- Settings: Books ----
    async addBook() {
      if (!this.newBookTitle) return;
      const created = await sb.insert('reading_items', {
        title: this.newBookTitle,
        status: 'active',
        progress_pct: 0
      });
      if (created?.[0]) this.activeBooks.push(created[0]);
      this.newBookTitle = '';
      this.flash('Book added');
    },

    async dropBook(id) {
      await sb.update('reading_items', id, { status: 'dropped' });
      this.activeBooks = this.activeBooks.filter(b => b.id !== id);
      this.flash('Book dropped');
    },

    // ---- Settings: Experiments ----
    async startExperiment() {
      if (!this.newExpName) return;
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + 14);
      const created = await sb.insert('experiments', {
        name: this.newExpName,
        success_criteria: this.newExpCriteria,
        started_date: todayStr(),
        review_date: reviewDate.toISOString().slice(0, 10),
        status: 'active'
      });
      if (created?.[0]) {
        created[0].days_remaining = 14;
        this.activeExperiment = created[0];
      }
      this.newExpName = '';
      this.newExpCriteria = '';
      this.drawer = null;
      this.flash('Experiment started — 14 days');
    },

    // ---- Offline Write Queue ----
    async syncOfflineQueue() {
      const queue = JSON.parse(localStorage.getItem('dl_offline_queue') || '[]');
      if (!queue.length) return;
      const failed = [];
      for (const item of queue) {
        try {
          if (item.method === 'insert') {
            await sb.insert(item.table, item.data);
          } else if (item.method === 'update') {
            await sb.update(item.table, item.id, item.data);
          }
        } catch {
          failed.push(item);
        }
      }
      localStorage.setItem('dl_offline_queue', JSON.stringify(failed));
      if (queue.length > failed.length) {
        this.flash(`Synced ${queue.length - failed.length} offline entries`);
      }
    },

    // ---- Live Chat with Coaches ----
    coachColors: {
      coach: '#94a3b8', james: '#3b82f6', andrew: '#22c55e',
      naval: '#a78bfa', ali: '#f59e0b', rory: '#ec4899'
    },

    async loadCoaches() {
      try {
        const res = await fetch('/api/agents');
        if (res.ok) {
          this.availableCoaches = await res.json();
        }
      } catch (e) {
        // API not available — static mode
        this.availableCoaches = [];
      }
    },

    async sendChat() {
      const text = this.chatInput.trim();
      if (!text || this.chatStreaming) return;

      this.chatInput = '';
      this.chatMessages.push({ role: 'user', content: text });
      this.chatStreaming = true;

      // Add empty assistant message to stream into
      const assistantMsg = { role: 'assistant', content: '', coach: this.chatCoach };
      this.chatMessages.push(assistantMsg);

      this.$nextTick(() => this.scrollChat());

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coach: this.chatCoach,
            messages: this.chatMessages
              .filter(m => m.role === 'user' || (m.role === 'assistant' && m.content))
              .slice(-10)
              .map(m => ({ role: m.role, content: m.content }))
          })
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantMsg.content += parsed.text;
                this.$nextTick(() => this.scrollChat());
              }
              if (parsed.error) {
                assistantMsg.content += `\n\n[Error: ${parsed.error}]`;
              }
            } catch (e) { /* skip unparseable */ }
          }
        }
      } catch (err) {
        assistantMsg.content = `Connection error: ${err.message}`;
      }

      this.chatStreaming = false;
      this.$nextTick(() => this.scrollChat());
    },

    scrollChat() {
      const el = document.getElementById('chat-scroll');
      if (el) el.scrollTop = el.scrollHeight;
    },

    selectCoach(name) {
      if (this.chatCoach !== name) {
        this.chatCoach = name;
        this.chatMessages = [];
      }
    },

    coachDisplayName(name) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }));
});
