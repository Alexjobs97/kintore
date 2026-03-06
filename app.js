// app.js — FitTrack Main Application
// Handles: navigation, calendar, workout companion, run log, nutrition, progress

'use strict';

// ══════════════════════════════════════
//  STATE & PERSISTENCE
// ══════════════════════════════════════

const LS = {
  get: (k, fallback = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

let STATE = {
  plan: null,
  startDate: null,       // ISO string "YYYY-MM-DD"
  logs: {},              // "YYYY-MM-DD" → { type, sessionId, completed, difficulty, duration?, km? }
  runs: [],              // [{date, duration, km, notes}]
  nutrition: {},         // "YYYY-MM-DD" → {entries:[{name,protein,calories,carbs,fat}]}
  goals: { protein: 100, calories: 2300 },
  prefs: { name: '', tts: true, lang: 'it-IT' },
  activeFilter: 'all',
};

function loadState() {
  STATE.plan       = LS.get('plan') || (window.DEFAULT_PLAN ?? null);
  STATE.startDate  = LS.get('startDate');
  STATE.logs       = LS.get('logs', {});
  STATE.runs       = LS.get('runs', []);
  STATE.nutrition  = LS.get('nutrition', {});
  STATE.goals      = LS.get('goals', { protein: 100, calories: 2300 });
  STATE.prefs      = LS.get('prefs', { name: '', tts: true, lang: 'it-IT' });
}

function saveState() {
  LS.set('plan',      STATE.plan);
  LS.set('startDate', STATE.startDate);
  LS.set('logs',      STATE.logs);
  LS.set('runs',      STATE.runs);
  LS.set('nutrition', STATE.nutrition);
  LS.set('goals',     STATE.goals);
  LS.set('prefs',     STATE.prefs);
}

// ══════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function fromISO(iso) {
  const [y,m,d] = iso.split('-').map(Number);
  return new Date(y, m-1, d);
}

function getWeekNumber(dateStr) {
  if (!STATE.startDate) return 1;
  const start = fromISO(STATE.startDate);
  const date  = fromISO(dateStr);
  const diff  = Math.floor((date - start) / 86400000);
  return Math.min(4, Math.max(1, Math.floor(diff / 7) + 1));
}

function getWorkoutForDate(dateStr) {
  if (!STATE.plan || !STATE.startDate) return null;
  const start = fromISO(STATE.startDate);
  const date  = fromISO(dateStr);
  if (date < start) return null;
  const dow = date.getDay(); // 0=Sun
  return STATE.plan.weekSchedule[dow] ?? null;
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buona sera';
}

function diffLabel(v) {
  const map = { molto_facile:'Molto facile', facile:'Facile', okay:'Okay', difficile:'Difficile', molto_difficile:'Molto difficile' };
  return map[v] ?? v ?? '—';
}

function showToast(msg, duration = 2600) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  t.classList.remove('hidden');
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'), 350); }, duration);
}

// ══════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');
  const btn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (btn) btn.classList.add('active');

  // Render page-specific content
  const renders = {
    dashboard: renderDashboard,
    calendar:  renderCalendar,
    workout:   renderWorkoutPage,
    exercises: renderExerciseLibrary,
    run:       renderRunPage,
    nutrition: renderNutritionPage,
    progress:  renderProgressPage,
    settings:  renderSettingsPage,
  };
  renders[page]?.();
  window.scrollTo(0, 0);
}

// ══════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════

function renderDashboard() {
  const name = STATE.prefs.name ? `, ${STATE.prefs.name}` : '';
  document.getElementById('greeting-sub').textContent = greet() + '!';
  document.getElementById('greeting-main').textContent = `Ciao${name} 👋`;

  // Today's card
  const todayStr = today();
  const wo = getWorkoutForDate(todayStr);
  const log = STATE.logs[todayStr];

  if (!STATE.plan || !STATE.startDate) {
    document.getElementById('today-workout-name').textContent = 'Carica la tua scheda';
    document.getElementById('today-workout-meta').textContent = 'Vai in Impostazioni per iniziare.';
    document.getElementById('today-cta').textContent = '⚙️ Impostazioni';
    document.getElementById('today-cta').onclick = () => navigate('settings');
  } else if (!wo) {
    document.getElementById('today-workout-name').textContent = 'Riposo 😴';
    document.getElementById('today-workout-meta').textContent = 'Nessun allenamento previsto oggi.';
    document.getElementById('today-cta').textContent = '📊 Vedi progressi';
    document.getElementById('today-cta').onclick = () => navigate('progress');
  } else {
    document.getElementById('today-workout-name').textContent = wo.label;
    const extra = wo.type === 'cardio' ? `· Settimana ${getWeekNumber(todayStr)}` : '';
    document.getElementById('today-workout-meta').textContent = (log?.completed ? '✅ Completato oggi' : '⏳ In programma') + extra;
    if (log?.completed) {
      document.getElementById('today-cta').textContent = '📊 Vedi progressi';
      document.getElementById('today-cta').onclick = () => navigate('progress');
    } else {
      document.getElementById('today-cta').textContent = '▶ Inizia';
      document.getElementById('today-cta').onclick = () => navigate('workout');
    }
  }

  // Streak badge
  const streak = calcStreak();
  document.getElementById('streak-count').textContent = streak;

  // Week strip
  renderWeekStrip();

  // Quick stats
  const allLogs = Object.values(STATE.logs);
  const completed = allLogs.filter(l => l.completed && l.type !== 'cardio');
  const runs = STATE.runs;
  const totalKm = runs.reduce((a, r) => a + (r.km || 0), 0);
  const proteinDays = Object.values(STATE.nutrition);
  const avgProt = proteinDays.length ? Math.round(proteinDays.reduce((a, d) => {
    const dayTotal = (d.entries || []).reduce((s, e) => s + (e.protein || 0), 0);
    return a + dayTotal;
  }, 0) / proteinDays.length) : 0;
  const lastDiff = allLogs.filter(l => l.difficulty).slice(-1)[0]?.difficulty;

  document.getElementById('stat-done').textContent = completed.length;
  document.getElementById('stat-km').textContent   = totalKm.toFixed(1);
  document.getElementById('stat-prot').textContent = avgProt || '—';
  document.getElementById('stat-rate').textContent = lastDiff ? diffLabel(lastDiff).split(' ')[0] : '—';

  // Motivational
  if (STATE.plan?.note) document.getElementById('motivational-quote').textContent = STATE.plan.note;
}

function renderWeekStrip() {
  const strip = document.getElementById('week-overview');
  strip.innerHTML = '';
  const dayLabels = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  const now = new Date();
  const dow = now.getDay();
  // Show Mon–Sun of current week
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dow + i % 7);
    const iso = toISO(d);
    const wo  = getWorkoutForDate(iso);
    const log = STATE.logs[iso];
    const isToday = iso === today();
    const cell = document.createElement('div');
    cell.className = 'week-day-cell' + (isToday ? ' today' : '');
    let icon = wo?.emoji ?? '—';
    let status = '';
    if (log?.completed) status = '✅';
    else if (log && !log.completed && iso < today()) status = '😕';
    cell.innerHTML = `<div class="wdc-day">${dayLabels[d.getDay()]}</div><div class="wdc-icon">${icon}</div><div class="wdc-status">${status}</div>`;
    cell.onclick = () => navigate('workout');
    strip.appendChild(cell);
  }
}

function calcStreak() {
  let streak = 0;
  const d = new Date();
  while (true) {
    const iso = toISO(d);
    const wo  = getWorkoutForDate(iso);
    const log = STATE.logs[iso];
    if (!wo || wo.type === 'rest') { d.setDate(d.getDate()-1); if (streak === 0) continue; else break; }
    if (log?.completed) { streak++; d.setDate(d.getDate()-1); }
    else if (iso === today()) { d.setDate(d.getDate()-1); continue; }
    else break;
  }
  return streak;
}

// ══════════════════════════════════════
//  CALENDAR
// ══════════════════════════════════════

function renderCalendar() {
  if (!STATE.plan) { document.getElementById('calendar-grid').innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px">Carica prima una scheda nelle Impostazioni.</p>'; return; }

  const now = new Date();
  const year  = STATE.plan.year  ?? now.getFullYear();
  const month = (STATE.plan.month === 'Marzo' ? 2 : now.getMonth()); // simple mapping
  const monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  document.getElementById('cal-month-title').textContent = `${STATE.plan.month ?? monthNames[month]} ${year}`;

  // Set start date input
  if (STATE.startDate) document.getElementById('start-date-input').value = STATE.startDate;

  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // Header
  ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-header-cell'; h.textContent = d;
    grid.appendChild(h);
  });

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month+1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon

  // Empty cells before start
  for (let i = 0; i < startDow; i++) {
    const e = document.createElement('div'); e.className = 'cal-day empty'; grid.appendChild(e);
  }

  const todayStr = today();

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const iso  = toISO(date);
    const wo   = getWorkoutForDate(iso);
    const log  = STATE.logs[iso];
    const isToday = iso === todayStr;
    const isPast  = iso < todayStr;

    const cell = document.createElement('div');
    let classes = 'cal-day';
    if (isToday) classes += ' today';
    if (wo) classes += ` ${wo.type}`;
    if (isPast && wo && wo.type !== 'rest' && !log?.completed) classes += ' past-unlogged';
    cell.className = classes;

    const num  = `<div class="cal-day-num">${day}</div>`;
    const icon = wo ? `<div class="cal-day-icon">${wo.emoji}</div>` : '';
    let mood = '';
    if (log?.completed) mood = '<div class="cal-day-mood">😊</div>';
    else if (isPast && wo && wo.type !== 'rest' && wo.type !== 'rest_active' && !log?.completed) mood = '<div class="cal-day-mood">😕</div>';

    cell.innerHTML = num + icon + mood;
    cell.title = wo?.label ?? 'Riposo';
    cell.onclick = () => { if (wo) openDayDetail(iso, wo); };
    grid.appendChild(cell);
  }
}

function openDayDetail(iso, wo) {
  // Navigate to workout page with this date
  navigate('workout');
}

function applyStartDate() {
  const val = document.getElementById('start-date-input').value;
  if (!val) { showToast('Seleziona una data'); return; }
  STATE.startDate = val;
  saveState();
  renderCalendar();
  showToast('✅ Data di inizio impostata!');
}

// ══════════════════════════════════════
//  GOOGLE CALENDAR EXPORT
// ══════════════════════════════════════

function openGCalExport() { document.getElementById('gcal-modal').classList.remove('hidden'); }
function closeGcalModal(e) {
  if (!e || e.target === document.getElementById('gcal-modal'))
    document.getElementById('gcal-modal').classList.add('hidden');
}

function downloadICS() {
  if (!STATE.plan || !STATE.startDate) { showToast('Imposta prima la data di inizio'); return; }
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitTrack//IT',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:FitTrack Allenamenti',
  ];

  const start = fromISO(STATE.startDate);
  for (let i = 0; i < 35; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const iso = toISO(d);
    const wo  = getWorkoutForDate(iso);
    if (!wo || wo.type === 'rest') continue;
    const dtStart = iso.replace(/-/g,'');
    const dtEnd   = iso.replace(/-/g,'');
    const uid = `fittrack-${iso}-${wo.sessionId ?? 'rest'}@app`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:🏋️ ${wo.label}`,
      `DESCRIPTION:FitTrack – ${wo.label}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Ricorda: ${wo.label} tra 30 minuti!`,
      'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fittrack-allenamenti.ics';
  a.click();
  showToast('📅 File .ics scaricato!');
}

// ══════════════════════════════════════
//  WORKOUT PAGE
// ══════════════════════════════════════

let CURRENT_SESSION = null;

function renderWorkoutPage() {
  const todayStr = today();
  const wo = getWorkoutForDate(todayStr);
  const log = STATE.logs[todayStr];

  document.getElementById('workout-detail-container').classList.remove('hidden');
  document.getElementById('no-workout-today').classList.add('hidden');
  document.getElementById('cardio-detail-block').classList.add('hidden');
  document.getElementById('btn-start-companion').classList.add('hidden');
  document.getElementById('btn-mark-run').classList.add('hidden');
  document.getElementById('btn-mark-rest').classList.add('hidden');

  if (!STATE.plan || !STATE.startDate) {
    document.getElementById('wi-name').textContent = 'Carica una scheda';
    document.getElementById('wi-meta').innerHTML  = '';
    document.getElementById('wi-focus').innerHTML = '';
    document.getElementById('workout-exercise-list').innerHTML = '<p style="color:var(--muted);font-size:14px">Vai in Impostazioni e carica la scheda mensile.</p>';
    return;
  }

  if (!wo) {
    document.getElementById('workout-detail-container').classList.add('hidden');
    document.getElementById('no-workout-today').classList.remove('hidden');
    return;
  }

  document.getElementById('workout-page-title').textContent = `${wo.emoji} ${wo.label}`;

  if (wo.type === 'rest' || wo.type === 'rest_active') {
    const badge = document.getElementById('wi-session-badge');
    badge.textContent = wo.emoji;
    badge.style.background = 'var(--rest2)';
    document.getElementById('wi-name').textContent = wo.label;
    document.getElementById('wi-meta').innerHTML = '';
    document.getElementById('wi-focus').innerHTML = '';
    document.getElementById('workout-exercise-list').innerHTML = `
      <div class="card" style="text-align:center;padding:32px">
        <div style="font-size:48px;margin-bottom:12px">${wo.emoji}</div>
        <p style="font-size:16px;font-weight:700;margin-bottom:8px">${wo.label}</p>
        <p style="color:var(--muted);font-size:14px">${wo.type === 'rest_active' ? 'Camminata di 30–40 minuti, stretching leggero o yoga. Fa\' parte integrante del recupero.' : 'Riposo completo. Il recupero è parte essenziale dell\'allenamento.'}</p>
      </div>`;
    document.getElementById('btn-mark-rest').classList.remove('hidden');
    if (log?.completed) document.getElementById('btn-mark-rest').textContent = '✅ Già segnato';
    return;
  }

  if (wo.type === 'cardio') {
    const badge = document.getElementById('wi-session-badge');
    badge.textContent = '🏃';
    badge.style.background = 'var(--cardio)';
    document.getElementById('wi-name').textContent = 'Sessione di Corsa';
    const week = getWeekNumber(todayStr);
    const cardioInfo = STATE.plan.cardioByWeek?.[week] ?? {};
    document.getElementById('wi-meta').innerHTML = `⏱ ${cardioInfo.durationMin ?? '?'} min &nbsp;·&nbsp; Settimana ${week}`;
    document.getElementById('wi-focus').innerHTML = '';
    document.getElementById('workout-exercise-list').innerHTML = '';
    document.getElementById('cardio-detail-block').classList.remove('hidden');
    document.getElementById('cardio-week-info').innerHTML = `
      <p style="font-size:16px;font-weight:700;margin-bottom:8px">${cardioInfo.structure ?? '—'}</p>
      <p style="color:var(--muted);font-size:14px">${cardioInfo.notes ?? ''}</p>`;
    document.getElementById('btn-mark-run').classList.remove('hidden');
    CURRENT_SESSION = null;
    return;
  }

  // Strength session
  const session = STATE.plan.sessions?.[wo.sessionId];
  if (!session) return;
  CURRENT_SESSION = session;

  const badge = document.getElementById('wi-session-badge');
  badge.textContent = wo.sessionId;
  badge.style.background = 'var(--accent)';
  document.getElementById('wi-name').textContent = session.name;
  document.getElementById('wi-meta').innerHTML = `⏱ ${session.durationLabel} &nbsp;·&nbsp; ${session.exercises?.length ?? 0} esercizi`;
  document.getElementById('wi-focus').innerHTML = (session.focus || []).map(f => `<span class="focus-tag">${f}</span>`).join('');
  document.getElementById('btn-start-companion').classList.remove('hidden');
  if (log?.completed) {
    document.getElementById('btn-start-companion').textContent = '🔄 Rifai sessione';
  }

  // Exercise list
  const list = document.getElementById('workout-exercise-list');
  list.innerHTML = '';
  (session.exercises || []).forEach((ex, i) => {
    const row = document.createElement('div');
    row.className = `ex-row ${ex.type}`;
    const badge_ = ex.sets ? `${ex.sets}×${ex.reps}` : (ex.isTimer ? formatTime(ex.duration) : '');
    const restStr = ex.rest ? `${ex.rest}s rec.` : '';
    row.innerHTML = `
      <div class="ex-row-num">${String(i+1).padStart(2,'0')}</div>
      <div class="ex-row-info">
        <div class="ex-row-name">${ex.name}</div>
        <div class="ex-row-meta">${ex.desc?.substring(0, 60) ?? ''}…</div>
      </div>
      <div class="ex-row-badge">${badge_} ${restStr}</div>`;
    row.onclick = () => openExerciseDetail(ex.id);
    list.appendChild(row);
  });
}

function handleTodayCTA() { /* handled inline above */ }

function openRunLog() { navigate('run'); }

function markRestDone() {
  const todayStr = today();
  STATE.logs[todayStr] = { type: 'rest', completed: true, date: todayStr };
  saveState();
  showToast('✅ Riposo segnato!');
  renderWorkoutPage();
}

function formatTime(sec) {
  const m = Math.floor(sec/60), s = sec%60;
  return s ? `${m}m${s}s` : `${m} min`;
}

function openExerciseDetail(id) {
  navigate('exercises');
  setTimeout(() => {
    const el = document.getElementById(`ex-card-${id}`);
    if (el) { el.scrollIntoView({behavior:'smooth', block:'center'}); el.classList.add('open'); }
  }, 200);
}

// ══════════════════════════════════════
//  COMPANION MODE
// ══════════════════════════════════════

let COMP = {
  session: null, exercises: [], exIdx: 0,
  setIdx: 0, restTimer: null, ttsEnabled: true,
  lang: 'it-IT'
};

function openCompanion() {
  if (!CURRENT_SESSION) return;
  COMP.session   = CURRENT_SESSION;
  COMP.exercises = CURRENT_SESSION.exercises.filter(e => e.name);
  COMP.exIdx     = 0;
  COMP.setIdx    = 0;
  COMP.ttsEnabled = STATE.prefs.tts !== false;
  COMP.lang      = STATE.prefs.lang || 'it-IT';

  document.getElementById('companion-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  showCompExercise();
}

function closeCompanion() {
  if (COMP.restTimer) { clearInterval(COMP.restTimer); COMP.restTimer = null; }
  window.speechSynthesis?.cancel();
  document.getElementById('companion-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function showCompExercise() {
  document.getElementById('comp-exercise-view').classList.remove('hidden');
  document.getElementById('comp-rest-view').classList.add('hidden');
  document.getElementById('comp-done-view').classList.add('hidden');

  const ex = COMP.exercises[COMP.exIdx];
  if (!ex) { showCompDone(); return; }

  // Progress
  const pct = Math.round((COMP.exIdx / COMP.exercises.length) * 100);
  document.getElementById('comp-progress-text').textContent = `Esercizio ${COMP.exIdx+1} di ${COMP.exercises.length}`;
  document.getElementById('comp-progress-bar-fill').style.width = `${pct}%`;

  // Phase label
  const phaseMap = { warmup:'RISCALDAMENTO', cooldown:'DEFATICAMENTO', core:'CORE', cardio:'CARDIO' };
  document.getElementById('comp-phase-label').textContent = phaseMap[ex.type] ?? 'IN CORSO';

  // Exercise name
  document.getElementById('comp-exercise-name').textContent = ex.name;

  // Set dots
  const dotsEl = document.getElementById('comp-set-indicators');
  dotsEl.innerHTML = '';
  if (ex.sets) {
    for (let i = 0; i < ex.sets; i++) {
      const dot = document.createElement('div');
      dot.className = 'set-dot' + (i < COMP.setIdx ? ' done' : (i === COMP.setIdx ? ' current' : ''));
      dotsEl.appendChild(dot);
    }
  }

  // Reps / timer display
  const repsEl = document.getElementById('comp-reps-display');
  if (ex.isTimer && ex.duration && !ex.sets) {
    repsEl.textContent = formatTime(ex.duration);
  } else if (ex.reps) {
    const setNum = ex.sets ? `Serie ${COMP.setIdx+1} di ${ex.sets}` : '';
    repsEl.textContent = `${ex.reps} rep  ${setNum ? '· ' + setNum : ''}`;
  } else { repsEl.textContent = ''; }

  document.getElementById('comp-exercise-desc').textContent = ex.desc ?? '';

  const notesEl = document.getElementById('comp-notes-block');
  if (ex.notes) { notesEl.textContent = '💡 ' + ex.notes; notesEl.classList.remove('hidden'); }
  else { notesEl.classList.add('hidden'); }

  // Main button
  const btn = document.getElementById('comp-main-btn');
  const skipBtn = document.getElementById('comp-skip-btn');
  if (ex.isTimer && ex.duration && !ex.sets) {
    // Timer-based (warmup/cooldown)
    btn.textContent = '▶ INIZIA TIMER';
    btn.onclick = () => startTimedExercise(ex);
    skipBtn.style.display = '';
  } else {
    const setNum = COMP.setIdx + 1;
    btn.textContent = ex.sets ? `✓  HO FINITO IL SET ${setNum}` : '✓  FATTO';
    btn.onclick = companionAction;
    skipBtn.style.display = '';
  }

  // Announce via TTS
  speakExercise(ex);
}

function speakExercise(ex) {
  if (!COMP.ttsEnabled) return;
  let msg = '';
  if (ex.type === 'warmup') msg = `Riscaldamento. ${ex.desc?.split('.')[0] ?? ''}.`;
  else if (ex.type === 'cooldown') msg = `Defaticamento. ${ex.desc?.split('.')[0] ?? ''}.`;
  else {
    const setInfo = ex.sets ? `. ${ex.sets} serie da ${ex.reps} ripetizioni` : '';
    msg = `Esercizio: ${ex.name}${setInfo}. ${ex.notes ? 'Attenzione: ' + ex.notes : ''}`;
  }
  speak(msg);
}

function startTimedExercise(ex) {
  const btn = document.getElementById('comp-main-btn');
  btn.textContent = '⏸ IN CORSO…';
  btn.onclick = null;
  let remaining = ex.duration;
  document.getElementById('comp-reps-display').textContent = formatTime(remaining);
  if (COMP.ttsEnabled) speak('Via!');
  const interval = setInterval(() => {
    remaining--;
    document.getElementById('comp-reps-display').textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(interval);
      if (COMP.ttsEnabled) speak('Completato! Ottimo.');
      COMP.exIdx++;
      COMP.setIdx = 0;
      setTimeout(showCompExercise, 700);
    }
  }, 1000);
  COMP.restTimer = interval;
}

function companionAction() {
  const ex = COMP.exercises[COMP.exIdx];
  if (!ex) return;
  if (COMP.ttsEnabled) speak('Ottimo!');
  COMP.setIdx++;
  if (ex.sets && COMP.setIdx < ex.sets) {
    // More sets: show rest
    showCompRest(ex.rest, ex, COMP.setIdx);
  } else {
    // Exercise done
    COMP.setIdx = 0;
    COMP.exIdx++;
    const next = COMP.exercises[COMP.exIdx];
    if (next) {
      if (ex.rest) showCompRest(ex.rest, next, 0, true);
      else showCompExercise();
    } else {
      showCompDone();
    }
  }
}

function companionSkip() {
  COMP.setIdx = 0;
  COMP.exIdx++;
  if (COMP.restTimer) { clearInterval(COMP.restTimer); COMP.restTimer = null; }
  window.speechSynthesis?.cancel();
  showCompExercise();
}

function showCompRest(seconds, nextExOrNull, nextSet, isNextExercise = false) {
  document.getElementById('comp-exercise-view').classList.add('hidden');
  document.getElementById('comp-rest-view').classList.remove('hidden');

  const label = isNextExercise
    ? `Prossimo: ${nextExOrNull?.name ?? 'Fine'}`
    : `Prossima serie: ${COMP.exercises[COMP.exIdx]?.name ?? ''}`;
  document.getElementById('comp-next-exercise-preview').textContent = label;

  const totalSec = seconds;
  const circumference = 2 * Math.PI * 52; // r=52
  let remaining = totalSec;

  const arc = document.getElementById('comp-rest-arc');
  const countdown = document.getElementById('comp-rest-countdown');
  arc.style.strokeDasharray = circumference;
  arc.style.strokeDashoffset = 0;

  if (COMP.ttsEnabled) speak(`Recupero: ${seconds} secondi.`);

  const interval = setInterval(() => {
    remaining--;
    countdown.textContent = remaining;
    const progress = (totalSec - remaining) / totalSec;
    arc.style.strokeDashoffset = progress * circumference;
    if (remaining <= 3 && remaining > 0 && COMP.ttsEnabled) speak(String(remaining));
    if (remaining <= 0) {
      clearInterval(interval);
      COMP.restTimer = null;
      if (COMP.ttsEnabled) speak('Via!');
      if (isNextExercise) {
        COMP.exIdx = COMP.exercises.indexOf(nextExOrNull) >= 0 ? COMP.exercises.indexOf(nextExOrNull) : COMP.exIdx;
        COMP.setIdx = 0;
      }
      showCompExercise();
    }
  }, 1000);
  COMP.restTimer = interval;
  countdown.textContent = remaining;
}

function skipRest() {
  if (COMP.restTimer) { clearInterval(COMP.restTimer); COMP.restTimer = null; }
  window.speechSynthesis?.cancel();
  showCompExercise();
}

function showCompDone() {
  document.getElementById('comp-exercise-view').classList.add('hidden');
  document.getElementById('comp-rest-view').classList.add('hidden');
  document.getElementById('comp-done-view').classList.remove('hidden');
  document.getElementById('comp-progress-bar-fill').style.width = '100%';
  document.getElementById('comp-progress-text').textContent = 'Sessione completata!';
  if (COMP.ttsEnabled) speak('Allenamento completato! Sei stato fantastico! Non dimenticare il defaticamento.');
}

function rateDifficulty(val) {
  const todayStr = today();
  STATE.logs[todayStr] = {
    type: 'strength',
    sessionId: COMP.session?.name ?? '',
    completed: true,
    difficulty: val,
    date: todayStr,
    timestamp: new Date().toISOString(),
  };
  saveState();
  showToast('🎉 Sessione salvata! ' + diffLabel(val));
  setTimeout(() => {
    closeCompanion();
    renderDashboard();
  }, 1200);
}

// TTS
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = COMP.lang || 'it-IT';
  utter.rate = 0.95;
  utter.pitch = 1.0;
  window.speechSynthesis.speak(utter);
}

// ══════════════════════════════════════
//  EXERCISE LIBRARY
// ══════════════════════════════════════

let activeExFilter = 'all';

function renderExerciseLibrary() {
  const categories = [
    { id: 'all',      label: 'Tutti' },
    { id: 'strength', label: 'Forza' },
    { id: 'core',     label: 'Core' },
    { id: 'cardio',   label: 'Cardio' },
    { id: 'mobility', label: 'Mobilità' },
    { id: 'warmup',   label: 'Riscaldamento' },
    { id: 'cooldown', label: 'Defaticamento' },
  ];

  const filterEl = document.getElementById('exercise-filter-tags');
  filterEl.innerHTML = categories.map(c =>
    `<span class="filter-tag ${activeExFilter === c.id ? 'active' : ''}" onclick="setExFilter('${c.id}')">${c.label}</span>`
  ).join('');

  renderExCards(document.getElementById('exercise-search').value);
}

function setExFilter(f) {
  activeExFilter = f;
  renderExerciseLibrary();
}

function filterExercises(query) {
  renderExCards(query);
}

function renderExCards(query = '') {
  const container = document.getElementById('exercise-library');
  container.innerHTML = '';
  const q = query.toLowerCase();
  const exercises = window.EXERCISES_DB ?? [];

  exercises.filter(ex => {
    const matchFilter = activeExFilter === 'all' || ex.category === activeExFilter;
    const matchQuery  = !q || ex.name.toLowerCase().includes(q) || (ex.muscles || []).join(' ').toLowerCase().includes(q);
    return matchFilter && matchQuery;
  }).forEach(ex => {
    const card = document.createElement('div');
    card.className = 'ex-card';
    card.id = `ex-card-${ex.id}`;
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.ytQuery)}`;
    const stepsHTML = (ex.steps || []).map((s, i) =>
      `<div class="ex-step"><span class="ex-step-num">${i+1}.</span><span>${s}</span></div>`
    ).join('');
    const tagsHTML = (ex.muscles || []).map(m => `<span class="ex-tag">${m}</span>`).join('');
    const diffDots = '●'.repeat(ex.difficulty || 1) + '○'.repeat(5 - (ex.difficulty || 1));

    card.innerHTML = `
      <div class="ex-card-header" onclick="toggleExCard('${ex.id}')">
        <div class="ex-card-emoji">${ex.emoji}</div>
        <div class="ex-card-title">
          <div class="ex-card-name">${ex.name}</div>
          <div class="ex-card-sub" style="color:var(--accent)">${diffDots}</div>
          <div class="ex-card-tags">${tagsHTML}</div>
        </div>
        <span class="ex-chevron">▼</span>
      </div>
      <div class="ex-card-body">
        <p class="ex-desc">${ex.desc}</p>
        <div class="ex-steps-title">COME SI ESEGUE</div>
        ${stepsHTML}
        <div class="ex-tips">
          <div class="ex-tips-title">💡 CONSIGLI</div>
          <p>${ex.tips}</p>
        </div>
        <a class="ex-yt-link" href="${ytUrl}" target="_blank" rel="noopener">
          ▶ Guarda il tutorial su YouTube
        </a>
      </div>`;
    container.appendChild(card);
  });
}

function toggleExCard(id) {
  const card = document.getElementById(`ex-card-${id}`);
  card?.classList.toggle('open');
}

// ══════════════════════════════════════
//  RUN PAGE
// ══════════════════════════════════════

function renderRunPage() {
  document.getElementById('run-date').value = today();
  renderRunStats();
  renderRunHistory();
}

function saveRun() {
  const date     = document.getElementById('run-date').value || today();
  const duration = parseFloat(document.getElementById('run-duration').value) || 0;
  const km       = parseFloat(document.getElementById('run-km').value) || 0;
  const notes    = document.getElementById('run-notes').value.trim();
  if (!duration && !km) { showToast('Inserisci almeno durata o distanza'); return; }

  const run = { date, duration, km, notes };
  STATE.runs.push(run);
  STATE.runs.sort((a,b) => b.date.localeCompare(a.date));

  // Mark in logs
  STATE.logs[date] = { type: 'cardio', sessionId: 'run', completed: true, difficulty: null, date, km, duration };
  saveState();
  showToast('🏃 Corsa salvata!');

  // Reset form
  document.getElementById('run-duration').value = '';
  document.getElementById('run-km').value = '';
  document.getElementById('run-notes').value = '';

  renderRunStats();
  renderRunHistory();
}

function renderRunStats() {
  const runs = STATE.runs;
  const totalKm  = runs.reduce((a,r) => a + (r.km || 0), 0);
  const avgKm    = runs.length ? totalKm / runs.length : 0;
  // Average pace (min/km)
  const runsWithBoth = runs.filter(r => r.km && r.duration);
  const avgPace = runsWithBoth.length
    ? runsWithBoth.reduce((a,r) => a + r.duration/r.km, 0) / runsWithBoth.length
    : 0;
  const paceStr = avgPace ? `${Math.floor(avgPace)}:${String(Math.round((avgPace%1)*60)).padStart(2,'0')}/km` : '—';

  document.getElementById('run-stat-count').textContent = runs.length;
  document.getElementById('run-stat-km').textContent    = totalKm.toFixed(1);
  document.getElementById('run-stat-avg-km').textContent= avgKm.toFixed(1);
  document.getElementById('run-stat-avg-pace').textContent = paceStr;
}

function renderRunHistory() {
  const hist = document.getElementById('run-history');
  hist.innerHTML = '';
  if (!STATE.runs.length) { hist.innerHTML = '<p style="color:var(--muted);font-size:14px">Nessuna corsa registrata ancora.</p>'; return; }
  STATE.runs.slice(0, 20).forEach((r, i) => {
    const pace = r.km && r.duration ? `${Math.floor(r.duration/r.km)}:${String(Math.round(((r.duration/r.km)%1)*60)).padStart(2,'0')}/km` : '—';
    const item = document.createElement('div');
    item.className = 'run-item';
    item.innerHTML = `
      <div class="run-item-date">${r.date.slice(5).replace('-','/')}</div>
      <div class="run-item-stats">
        <div class="run-item-main">${r.km ? r.km + ' km' : ''} ${r.duration ? r.duration + ' min' : ''}</div>
        <div class="run-item-sub">Passo ${pace}${r.notes ? ' · ' + r.notes : ''}</div>
      </div>
      <button class="run-item-del" onclick="deleteRun(${i})" title="Elimina">🗑</button>`;
    hist.appendChild(item);
  });
}

function deleteRun(i) {
  if (!confirm('Eliminare questa corsa?')) return;
  STATE.runs.splice(i, 1);
  saveState();
  renderRunHistory();
  renderRunStats();
  showToast('Corsa eliminata');
}

// ══════════════════════════════════════
//  NUTRITION PAGE
// ══════════════════════════════════════

function renderNutritionPage() {
  document.getElementById('goal-protein').value  = STATE.goals.protein;
  document.getElementById('goal-calories').value = STATE.goals.calories;
  renderFoodLog();
  renderNutritionHistory();
  renderProteinSources();
}

function getTodayNutrition() {
  const d = today();
  if (!STATE.nutrition[d]) STATE.nutrition[d] = { entries: [] };
  return STATE.nutrition[d];
}

function addFoodEntry() {
  const name    = document.getElementById('food-name').value.trim();
  const protein = parseFloat(document.getElementById('food-protein').value) || 0;
  const cal     = parseFloat(document.getElementById('food-calories').value) || 0;
  const carbs   = parseFloat(document.getElementById('food-carbs').value) || 0;
  const fat     = parseFloat(document.getElementById('food-fat').value) || 0;
  if (!name && !protein && !cal) { showToast('Inserisci almeno nome e proteine'); return; }

  getTodayNutrition().entries.push({ name, protein, calories: cal, carbs, fat });
  saveState();
  // Clear
  ['food-name','food-protein','food-calories','food-carbs','food-fat'].forEach(id => document.getElementById(id).value = '');
  renderFoodLog();
  showToast('✅ Pasto aggiunto!');
}

function renderFoodLog() {
  const day = getTodayNutrition();
  const entries = day.entries || [];
  const totProt = entries.reduce((a,e) => a + (e.protein||0), 0);
  const totCal  = entries.reduce((a,e) => a + (e.calories||0), 0);

  const protPct = Math.min(100, Math.round((totProt / STATE.goals.protein) * 100));
  const calPct  = Math.min(100, Math.round((totCal  / STATE.goals.calories) * 100));

  document.getElementById('protein-progress-label').textContent = `${Math.round(totProt)} / ${STATE.goals.protein} g`;
  document.getElementById('protein-bar').style.width = `${protPct}%`;
  document.getElementById('cal-progress-label').textContent = `${Math.round(totCal)} / ${STATE.goals.calories} kcal`;
  document.getElementById('cal-bar').style.width = `${calPct}%`;

  const list = document.getElementById('food-log-list');
  if (!entries.length) { list.innerHTML = '<p style="color:var(--muted);font-size:14px;margin-bottom:16px">Nessun pasto registrato oggi.</p>'; return; }
  list.innerHTML = entries.map((e, i) => `
    <div class="food-item">
      <div class="food-item-name">${e.name || 'Alimento'}</div>
      <div class="food-macros">${e.protein ? e.protein + 'g prot' : ''} ${e.calories ? '· ' + e.calories + ' kcal' : ''}</div>
      <button class="food-del" onclick="deleteFoodEntry(${i})" title="Elimina">✕</button>
    </div>`).join('');
}

function deleteFoodEntry(i) {
  getTodayNutrition().entries.splice(i, 1);
  saveState();
  renderFoodLog();
}

function renderNutritionHistory() {
  const hist = document.getElementById('nutrition-history');
  const days = Object.keys(STATE.nutrition).sort().reverse().slice(0, 7);
  if (!days.length) { hist.innerHTML = '<p style="color:var(--muted);font-size:14px">Nessun dato ancora.</p>'; return; }
  hist.innerHTML = days.map(d => {
    const entries = STATE.nutrition[d].entries || [];
    const prot = Math.round(entries.reduce((a,e) => a + (e.protein||0), 0));
    const pct  = Math.min(100, Math.round((prot / STATE.goals.protein) * 100));
    return `<div class="nutrition-history-row">
      <span class="nh-date">${d.slice(5).replace('-','/')}</span>
      <div class="nh-bar-wrap">
        <div class="progress-bar-bg" style="height:6px">
          <div class="progress-bar-fill protein-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <span class="nh-label">${prot}g</span>
    </div>`;
  }).join('');
}

function renderProteinSources() {
  const grid = document.getElementById('protein-sources-grid');
  const sources = window.PROTEIN_SOURCES ?? [];
  grid.innerHTML = sources.map(s => `
    <div class="ps-card">
      <div class="ps-name">${s.name}</div>
      <div class="ps-prot">${s.prot}</div>
      <div class="ps-note">${s.note}</div>
    </div>`).join('');
}

function saveGoals() {
  STATE.goals.protein  = parseInt(document.getElementById('goal-protein').value) || 100;
  STATE.goals.calories = parseInt(document.getElementById('goal-calories').value) || 2300;
  saveState();
  renderFoodLog();
  showToast('🎯 Obiettivi salvati!');
  toggleGoalEditor();
}

function toggleGoalEditor() {
  document.getElementById('goal-editor').classList.toggle('hidden');
}

// ══════════════════════════════════════
//  PROGRESS PAGE
// ══════════════════════════════════════

function renderProgressPage() {
  const allLogs = Object.entries(STATE.logs).sort((a,b) => b[0].localeCompare(a[0]));
  const completed = allLogs.filter(([,l]) => l.completed);
  const streak = calcStreak();
  const bestStreak = calcBestStreak();

  // Count planned sessions
  let planned = 0;
  if (STATE.startDate && STATE.plan) {
    const start = fromISO(STATE.startDate);
    const end   = new Date();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
      const wo = getWorkoutForDate(toISO(d));
      if (wo && wo.type !== 'rest') planned++;
    }
  }
  const completionPct = planned ? Math.round((completed.length / planned) * 100) : 0;

  document.getElementById('prog-total').textContent     = completed.length;
  document.getElementById('prog-streak').textContent    = streak;
  document.getElementById('prog-best-streak').textContent = bestStreak;
  document.getElementById('prog-completion').textContent  = `${completionPct}%`;

  // Log list
  const logEl = document.getElementById('workout-log-list');
  if (!completed.length) { logEl.innerHTML = '<p style="color:var(--muted);font-size:14px">Nessun allenamento completato ancora.</p>'; return; }
  logEl.innerHTML = completed.slice(0, 30).map(([date, l]) => {
    const diff = l.difficulty ? `<span class="log-diff-badge diff-${l.difficulty}">${diffLabel(l.difficulty)}</span>` : '';
    const type = l.type === 'cardio' ? '🏃 Corsa' : (l.sessionId || l.type || 'Allenamento');
    return `<div class="log-item">
      <div class="log-item-date">${date.slice(5).replace('-','/')}</div>
      <div class="log-item-name">${type}</div>
      ${diff}
    </div>`;
  }).join('');
}

function calcBestStreak() {
  let best = 0, cur = 0;
  const dates = Object.keys(STATE.logs).sort();
  for (const d of dates) {
    const log = STATE.logs[d];
    const wo  = getWorkoutForDate(d);
    if (!wo || wo.type === 'rest') { best = Math.max(best, cur); cur = 0; continue; }
    if (log?.completed) cur++;
    else { best = Math.max(best, cur); cur = 0; }
  }
  return Math.max(best, cur);
}

function exportData() {
  const data = {
    export_date: today(),
    period: STATE.plan ? `${STATE.plan.month} ${STATE.plan.year}` : '—',
    sessions_completed: Object.values(STATE.logs).filter(l => l.completed && l.type !== 'rest').length,
    sessions_planned: (() => {
      if (!STATE.startDate || !STATE.plan) return 0;
      let p = 0;
      const start = fromISO(STATE.startDate);
      const end   = new Date();
      for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
        const wo = getWorkoutForDate(toISO(d));
        if (wo && wo.type !== 'rest') p++;
      }
      return p;
    })(),
    streak: calcStreak(),
    best_streak: calcBestStreak(),
    workout_logs: Object.entries(STATE.logs)
      .filter(([,l]) => l.completed)
      .map(([date, l]) => ({ date, type: l.type, sessionId: l.sessionId, difficulty: l.difficulty ?? null })),
    run_logs: STATE.runs.map(r => ({ date: r.date, duration_min: r.duration, km: r.km, notes: r.notes })),
    nutrition_summary: {
      days_logged: Object.keys(STATE.nutrition).length,
      avg_protein_g: (() => {
        const days = Object.values(STATE.nutrition);
        if (!days.length) return 0;
        return Math.round(days.reduce((a, d) => a + (d.entries||[]).reduce((s,e) => s+(e.protein||0), 0), 0) / days.length);
      })(),
    },
    goals: STATE.goals,
  };
  const json = JSON.stringify(data, null, 2);

  // Copy to clipboard
  navigator.clipboard?.writeText(json).then(() => showToast('📋 Copiato negli appunti!')).catch(() => {
    const el = document.getElementById('export-preview');
    el.style.display = 'block';
    el.textContent = json;
    showToast('Copia il testo qui sotto');
  });

  const el = document.getElementById('export-preview');
  el.style.display = 'block';
  el.textContent = json;
}

// ══════════════════════════════════════
//  SETTINGS PAGE
// ══════════════════════════════════════

function renderSettingsPage() {
  document.getElementById('active-plan-name').textContent =
    STATE.plan ? `${STATE.plan.month ?? ''} ${STATE.plan.year ?? ''}` : 'Nessuno';
  document.getElementById('pref-name').value  = STATE.prefs.name  ?? '';
  document.getElementById('pref-tts').checked = STATE.prefs.tts   !== false;
  document.getElementById('pref-lang').value  = STATE.prefs.lang  ?? 'it-IT';
}

function loadPlanFromJSON() {
  const raw = document.getElementById('plan-json-input').value.trim();
  if (!raw) { showToast('Incolla il JSON prima'); return; }
  try {
    const plan = JSON.parse(raw);
    if (!plan.weekSchedule || !plan.sessions) throw new Error('Formato non valido');
    STATE.plan = plan;
    saveState();
    showToast('✅ Scheda caricata: ' + (plan.month ?? '') + ' ' + (plan.year ?? ''));
    renderSettingsPage();
    document.getElementById('plan-json-input').value = '';
  } catch (e) {
    showToast('❌ JSON non valido. Controlla il formato.');
  }
}

function savePrefs() {
  STATE.prefs.name = document.getElementById('pref-name').value.trim();
  STATE.prefs.tts  = document.getElementById('pref-tts').checked;
  STATE.prefs.lang = document.getElementById('pref-lang').value;
  saveState();
  showToast('✅ Preferenze salvate!');
}

function clearAllData() {
  if (!confirm('Sei sicuro? Tutti i dati di allenamento, corse e nutrizione verranno cancellati.')) return;
  localStorage.clear();
  location.reload();
}

// ══════════════════════════════════════
//  BOOT
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderDashboard();

  // Set default start date in calendar input
  if (STATE.startDate) {
    const el = document.getElementById('start-date-input');
    if (el) el.value = STATE.startDate;
  }

  // Set today's date in run form
  const runDate = document.getElementById('run-date');
  if (runDate) runDate.value = today();

  // Apply saved name to greeting
  renderDashboard();
});
