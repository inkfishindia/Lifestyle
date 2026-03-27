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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST', headers: this.headers, body: JSON.stringify(data)
    });
    return r.ok ? r.json() : null;
  },

  async update(table, id, data) {
    const h = { ...this.headers };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH', headers: h, body: JSON.stringify(data)
    });
    return r.ok ? r.json() : null;
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
    // Reading
    activeBooks: [],
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
      satisfactionTrend: []
    },
    alerts: [],

    // Forms
    exerciseForm: { type: '', duration: null, intensity: '' },
    readingForm: { item_id: '', duration: null, progress: null },
    expForm: { name: '', category: '', energy: 0, fun: 0, solo_or_social: '' },

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
      switch (card) {
        case 'sleep': return h >= 7 && h < 14;
        case 'energy': return true; // always
        case 'habits': return h >= 21 || h < 3;
        case 'meal': return true; // always, contextual
        case 'eod': return h >= 22 || h < 3;
        case 'caffeine': return h >= 14;
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
        this.loadBooks(),
        this.loadStats(),
        this.loadExperiment()
      ]);

      this.computeAlerts();
      this.generateCoachMessages();
      this.computeHrvBaseline();
      this.scheduleCheckin();
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
      if (this.activeBooks.length) {
        const book = this.activeBooks[0];
        this.stats.currentBook = book.title;
        this.stats.bookProgress = book.progress_pct || 0;
        const sessions = await sb.query('reading_sessions', `item_id=eq.${book.id}&order=date.desc&limit=1`);
        if (sessions.length) {
          const ago = daysAgo(sessions[0].date);
          this.stats.lastReadLabel = `${sessions[0].duration_min} min · ${ago === 0 ? 'today' : ago + 'd ago'}`;
        }
      }

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
    generateCoachMessages() {
      this.coachMessages = [];
      const h = currentHour();

      // Andrew: sleep deficit
      if (this.today.sleep_hours && parseFloat(this.today.sleep_hours) < 6.5) {
        this.coachMessages.push({ coach: 'Andrew', message: 'NSDR at 3 PM today. 15 minutes. Non-negotiable.', time: 'Today', actions: [{ label: 'Got it', type: 'dismiss' }] });
      }

      // Andrew: lunch nudge at 12:15+
      if (h >= 12 && h < 14 && !this.mealLogs.find(m => m.slot === 'lunch')) {
        this.coachMessages.push({ coach: 'Andrew', message: 'Lunch time. Eat something — even dal chawal. Crash hits in 2 hours.', time: 'Now', actions: [] });
      }

      // James: never miss twice
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      const yMisses = this.weekHabitLogs.filter(l => l.date === yStr && !l.did_it);
      if (yMisses.length > 0) {
        const habit = this.activeHabits.find(h => h.id === yMisses[0].habit_id);
        this.coachMessages.push({ coach: 'James', message: `Never miss twice. ${habit?.floor_version || 'Floor version'} is enough tonight.`, time: 'Today', actions: [] });
      }

      // James: floor version day (sleep < 6hrs)
      if (this.today.sleep_hours && parseFloat(this.today.sleep_hours) < 6) {
        this.coachMessages.push({ coach: 'James', message: 'Floor version day. Habits shrink automatically — your sleep was under 6 hours.', time: 'Today', actions: [] });
      }

      // Naval: book stalled
      if (this.activeBooks.length) {
        // Will show stalled message if no sessions in 10+ days (loaded in loadStats)
        if (this.stats.lastReadLabel && this.stats.lastReadLabel.includes('d ago')) {
          const daysMatch = this.stats.lastReadLabel.match(/(\d+)d ago/);
          if (daysMatch && parseInt(daysMatch[1]) >= 10) {
            this.coachMessages.push({ coach: 'Naval', message: `"${this.stats.currentBook}" — keep or drop? It's been ${daysMatch[1]} days.`, time: 'Today', actions: [{ label: 'Keep', type: 'dismiss' }, { label: 'Drop', type: 'drop_book' }] });
          }
        }
      }

      // Ali: no experience in 21+ days
      if (this.stats.lastExpDaysAgo) {
        const match = this.stats.lastExpDaysAgo.match(/(\d+)/);
        if (match && parseInt(match[1]) >= 21) {
          this.coachMessages.push({ coach: 'Ali', message: 'Your cringe budget hasn\'t been touched in 3 weeks. One low-stakes push for this weekend?', time: 'Today', actions: [] });
        }
      }

      // Rory: afternoon energy cascade
      const afternoonEnergy = this.energyReadings.find(e => e.slot === 'afternoon');
      if (afternoonEnergy && afternoonEnergy.energy < 3) {
        this.coachMessages.push({ coach: 'Rory', message: 'Afternoon crash detected. Light reading tonight — skip the dense stuff.', time: 'Today', actions: [] });
      }

      // Experiment review due
      if (this.activeExperiment) {
        const reviewDate = new Date(this.activeExperiment.review_date);
        const today = new Date(todayStr());
        if (reviewDate <= today) {
          this.coachMessages.push({ coach: 'Rory', message: `Experiment "${this.activeExperiment.name}" — review time. Keep, drop, or adapt?`, time: 'Today', actions: [{ label: 'Keep', type: 'exp_keep' }, { label: 'Drop', type: 'exp_drop' }, { label: 'Adapt', type: 'exp_adapt' }] });
        }
      }
    },

    async handleCoachAction(action) {
      if (action.type === 'dismiss') {
        // Remove the message
      } else if (action.type === 'drop_book' && this.activeBooks.length) {
        await sb.update('reading_items', this.activeBooks[0].id, { status: 'dropped' });
        this.activeBooks.shift();
        this.flash('Book dropped');
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
      // Update book progress
      if (book && this.readingForm.progress) {
        await sb.update('reading_items', book.id, { progress_pct: this.readingForm.progress });
        book.progress_pct = this.readingForm.progress;
      }
      this.readingForm = { item_id: '', duration: null, progress: null };
      this.drawer = null;
      this.flash('Reading logged');
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
