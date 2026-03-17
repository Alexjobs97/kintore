// app.js — 筋トレ v3 (bug-fixed, safe boot)
'use strict';

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzUl9koSQTcv_KqSiKKcRrABUAyt1Gg-oBzbSuWf3gvBOET76f9raSaNnaar0u-th7MPg/exec';

// ══════════════════════════════════════
//  STORAGE
// ══════════════════════════════════════
const LS = {
  get(k, fb = null) {
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; }
    catch { return fb; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

let STATE = {
  plan: null, startDate: null, logs: {}, runs: [],
  nutrition: {}, goals: { protein: 100, calories: 2300 },
  prefs: { name: '', tts: true, lang: 'it-IT' },
};

function loadState() {
  // Piano: prima localStorage, poi DEFAULT_PLAN da plan.js, altrimenti null
  const savedPlan = LS.get('plan');
  STATE.plan = (savedPlan && savedPlan.weekSchedule) ? savedPlan
             : (window.DEFAULT_PLAN ?? null);

  STATE.startDate = LS.get('startDate', null);
  STATE.logs      = LS.get('logs', {});
  STATE.runs      = LS.get('runs', []);
  STATE.nutrition = LS.get('nutrition', {});
  STATE.goals     = LS.get('goals', { protein: 100, calories: 2300 });
  STATE.prefs     = LS.get('prefs', { name: '', tts: true, lang: 'it-IT' });
}

function saveState() {
  LS.set('plan',      STATE.plan);
  LS.set('startDate', STATE.startDate);
  LS.set('logs',      STATE.logs);
  LS.set('runs',      STATE.runs);
  LS.set('nutrition', STATE.nutrition);
  LS.set('goals',     STATE.goals);
  LS.set('prefs',     STATE.prefs);
  scheduleSheetsSync();
}

// ══════════════════════════════════════
//  GOOGLE SHEETS SYNC
// ══════════════════════════════════════
let _syncTimer = null;

function scheduleSheetsSync() {
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(pushToSheets, 2000);
}

function pushToSheets() {
  const payload = JSON.stringify({
    action: 'setAll',
    data: {
      plan: STATE.plan, startDate: STATE.startDate,
      logs: STATE.logs, runs: STATE.runs,
      nutrition: STATE.nutrition, goals: STATE.goals, prefs: STATE.prefs,
    }
  });
  // fire-and-forget, no-cors, never blocks UI
  fetch(SHEETS_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: payload,
  })
  .then(() => setSyncBadge('ok'))
  .catch(() => setSyncBadge('error'));
}

async function pullFromSheets() {
  setSyncBadge('syncing');
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 7000);
    const res  = await fetch(SHEETS_URL + '?ts=' + Date.now(),
                             { method: 'GET', redirect: 'follow', signal: ctrl.signal });
    clearTimeout(tid);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? 'not ok');
    const r = json.data ?? {};
    const localPrefs = STATE.prefs;
    if (r.plan      && r.plan.weekSchedule) { STATE.plan      = r.plan;      LS.set('plan',      STATE.plan); }
    if (r.startDate) { STATE.startDate = r.startDate; LS.set('startDate', STATE.startDate); }
    if (r.logs)      { STATE.logs      = r.logs;      LS.set('logs',      STATE.logs); }
    if (r.runs)      { STATE.runs      = r.runs;      LS.set('runs',      STATE.runs); }
    if (r.nutrition) { STATE.nutrition = r.nutrition; LS.set('nutrition', STATE.nutrition); }
    if (r.goals)     { STATE.goals     = r.goals;     LS.set('goals',     STATE.goals); }
    if (r.prefs)     { STATE.prefs     = { ...r.prefs, ...localPrefs }; LS.set('prefs', STATE.prefs); }
    setSyncBadge('ok');
    return true;
  } catch (e) {
    setSyncBadge('error');
    return false;
  }
}

function setSyncBadge(s) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const m = {
    idle:    '☁️',
    syncing: '🔄',
    ok:      '✅',
    error:   '⚠️',
  };
  el.textContent = m[s] ?? '';
  el.title = { idle:'Nessuno sheet', syncing:'Sincronizzando…', ok:'Sincronizzato con Google Sheet', error:'Solo dati locali' }[s] ?? '';
}

async function testSheetsConnection() {
  const resultEl = document.getElementById('sheets-test-result');
  resultEl.textContent = '🔄 Test in corso…';
  setSyncBadge('syncing');
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 7000);
    const res  = await fetch(SHEETS_URL + '?action=ping&ts=' + Date.now(),
                             { method: 'GET', redirect: 'follow', signal: ctrl.signal });
    const json = await res.json();
    if (json.ok && json.pong) {
      resultEl.textContent = '✅ Connessione OK!';
      setSyncBadge('ok');
      showToast('✅ Google Sheet connesso!');
      pushToSheets();
    } else throw new Error(json.error ?? 'Risposta inattesa');
  } catch (e) {
    resultEl.textContent = '❌ ' + e.message;
    setSyncBadge('error');
    showToast('❌ Connessione fallita');
  }
}

// ══════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════
function today() {
  const d = new Date();
  return d.getFullYear() + '-' +
         String(d.getMonth() + 1).padStart(2, '0') + '-' +
         String(d.getDate()).padStart(2, '0');
}

function toISO(d) {
  return d.getFullYear() + '-' +
         String(d.getMonth() + 1).padStart(2, '0') + '-' +
         String(d.getDate()).padStart(2, '0');
}

function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getWeekNumber(dateStr) {
  if (!STATE.startDate) return 1;
  const diff = Math.floor((fromISO(dateStr) - fromISO(STATE.startDate)) / 86400000);
  return Math.min(4, Math.max(1, Math.floor(diff / 7) + 1));
}

function getWorkoutForDate(dateStr) {
  if (!STATE.plan || !STATE.startDate) return null;
  if (fromISO(dateStr) < fromISO(STATE.startDate)) return null;
  const dow = fromISO(dateStr).getDay();
  return STATE.plan.weekSchedule[dow] ?? null;
}

function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buona sera';
}

const DIFF_LABELS = {
  molto_facile: 'Molto facile', facile: 'Facile', okay: 'Okay',
  difficile: 'Difficile', molto_difficile: 'Molto difficile',
};
function diffLabel(v) { return DIFF_LABELS[v] ?? (v || '—'); }

function showToast(msg, dur = 2600) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'), 350); }, dur);
}

// ══════════════════════════════════════
//  STREAK  ← era qui l'infinite loop
// ══════════════════════════════════════
function calcStreak() {
  // Guard: senza piano o data di inizio non ha senso calcolare
  if (!STATE.plan || !STATE.startDate) return 0;
  let streak = 0;
  const d = new Date();
  // Max 365 iterazioni — impossibile loopare all'infinito
  for (let i = 0; i < 365; i++) {
    const iso = toISO(d);
    // Non andare prima della data di inizio
    if (iso < STATE.startDate) break;
    const wo  = getWorkoutForDate(iso);
    const log = STATE.logs[iso];
    // Giorni di riposo: salta senza rompere la streak
    if (!wo || wo.type === 'rest') { d.setDate(d.getDate() - 1); continue; }
    // Oggi non ancora fatto: salta
    if (iso === today() && !log?.completed) { d.setDate(d.getDate() - 1); continue; }
    // Completato: streak++
    if (log?.completed) { streak++; d.setDate(d.getDate() - 1); }
    else break; // giorno passato non completato: streak interrotta
  }
  return streak;
}

function calcBestStreak() {
  if (!STATE.plan || !STATE.startDate) return 0;
  let best = 0, cur = 0;
  const dates = Object.keys(STATE.logs).sort();
  for (const d of dates) {
    const log = STATE.logs[d], wo = getWorkoutForDate(d);
    if (!wo || wo.type === 'rest') continue;
    if (log?.completed) { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return best;
}

// ══════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelector('.nav-btn[data-page="' + page + '"]')?.classList.add('active');
  const fn = { dashboard: renderDashboard, calendar: renderCalendar,
               workout: renderWorkoutPage, exercises: renderExerciseLibrary,
               run: renderRunPage, nutrition: renderNutritionPage,
               progress: renderProgressPage, settings: renderSettingsPage };
  try { fn[page]?.(); } catch(e) { console.error('render error:', page, e); }
  window.scrollTo(0, 0);
}

// ══════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════
function renderDashboard() {
  const name = STATE.prefs.name ? ', ' + STATE.prefs.name : '';
  document.getElementById('greeting-sub').textContent  = greet() + '!';
  document.getElementById('greeting-main').textContent = 'Ciao' + name + ' 👋';

  const todayStr = today();
  const wo  = getWorkoutForDate(todayStr);
  const log = STATE.logs[todayStr];

  const nameEl = document.getElementById('today-workout-name');
  const metaEl = document.getElementById('today-workout-meta');
  const ctaEl  = document.getElementById('today-cta');

  if (!STATE.plan || !STATE.startDate) {
    nameEl.textContent = 'Configura il programma';
    metaEl.textContent = 'Vai in Impostazioni per impostare la data di inizio.';
    ctaEl.textContent  = '⚙️ Impostazioni';
    ctaEl.onclick      = () => navigate('settings');
  } else if (!wo) {
    nameEl.textContent = 'Riposo 😴';
    metaEl.textContent = 'Nessun allenamento previsto oggi.';
    ctaEl.textContent  = '📊 Progressi';
    ctaEl.onclick      = () => navigate('progress');
  } else {
    nameEl.textContent = wo.label;
    const wk = wo.type === 'cardio' ? ' · Settimana ' + getWeekNumber(todayStr) : '';
    metaEl.textContent = (log?.completed ? '✅ Completato oggi' : '⏳ In programma') + wk;
    ctaEl.textContent  = log?.completed ? '📊 Progressi' : '▶ Inizia';
    ctaEl.onclick      = () => navigate(log?.completed ? 'progress' : 'workout');
  }

  document.getElementById('streak-count').textContent = calcStreak();

  renderWeekStrip();

  const allLogs  = Object.values(STATE.logs);
  const totalKm  = STATE.runs.reduce((a, r) => a + (r.km || 0), 0);
  const protDays = Object.values(STATE.nutrition);
  const avgProt  = protDays.length
    ? Math.round(protDays.reduce((a, d) => a + (d.entries || []).reduce((s, e) => s + (e.protein || 0), 0), 0) / protDays.length)
    : 0;
  const lastDiff = allLogs.filter(l => l.difficulty).slice(-1)[0]?.difficulty;

  document.getElementById('stat-done').textContent = allLogs.filter(l => l.completed && l.type !== 'cardio').length;
  document.getElementById('stat-km').textContent   = totalKm.toFixed(1);
  document.getElementById('stat-prot').textContent = avgProt || '—';
  document.getElementById('stat-rate').textContent = lastDiff ? diffLabel(lastDiff).split(' ')[0] : '—';

  const quote = STATE.plan?.note ?? 'Benvenuto in 筋トレ! Imposta la data di inizio dal Calendario per cominciare.';
  document.getElementById('motivational-quote').textContent = quote;
}

function renderWeekStrip() {
  const strip = document.getElementById('week-overview');
  strip.innerHTML = '';
  const labels = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  const now = new Date(), dow = now.getDay();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - dow + i % 7);
    const iso    = toISO(d);
    const wo     = getWorkoutForDate(iso);
    const log    = STATE.logs[iso];
    const isToday = iso === today();
    const cell   = document.createElement('div');
    cell.className = 'week-day-cell' + (isToday ? ' today' : '');
    const status = log?.completed ? '✅' : (log && iso < today() ? '😕' : '');
    cell.innerHTML = '<div class="wdc-day">' + labels[d.getDay()] + '</div>' +
                     '<div class="wdc-icon">' + (wo?.emoji ?? '—') + '</div>' +
                     '<div class="wdc-status">' + status + '</div>';
    cell.onclick = () => navigateToWorkoutDate(iso);
    strip.appendChild(cell);
  }
}

// ══════════════════════════════════════
//  CALENDAR
// ══════════════════════════════════════
// ══════════════════════════════════════
//  CALENDAR — navigable, unlimited history
// ══════════════════════════════════════

// Tracks the currently displayed month/year
let CAL_VIEW = { year: new Date().getFullYear(), month: new Date().getMonth() };

function renderCalendar() {
  // On first open, jump to the plan's month (or current month)
  if (!CAL_VIEW._initialized) {
    const MONTHS = { 'Gennaio':0,'Febbraio':1,'Marzo':2,'Aprile':3,'Maggio':4,'Giugno':5,
                     'Luglio':6,'Agosto':7,'Settembre':8,'Ottobre':9,'Novembre':10,'Dicembre':11 };
    const now = new Date();
    CAL_VIEW.year  = STATE.plan?.year  ?? now.getFullYear();
    CAL_VIEW.month = STATE.plan?.month in MONTHS ? MONTHS[STATE.plan.month] : now.getMonth();
    CAL_VIEW._initialized = true;
  }
  _renderCalMonth(CAL_VIEW.year, CAL_VIEW.month);
}

function calPrev() {
  CAL_VIEW.month--;
  if (CAL_VIEW.month < 0) { CAL_VIEW.month = 11; CAL_VIEW.year--; }
  _renderCalMonth(CAL_VIEW.year, CAL_VIEW.month);
}

function calNext() {
  CAL_VIEW.month++;
  if (CAL_VIEW.month > 11) { CAL_VIEW.month = 0; CAL_VIEW.year++; }
  _renderCalMonth(CAL_VIEW.year, CAL_VIEW.month);
}

function calGoToday() {
  const now = new Date();
  CAL_VIEW.year = now.getFullYear(); CAL_VIEW.month = now.getMonth();
  _renderCalMonth(CAL_VIEW.year, CAL_VIEW.month);
}

function _renderCalMonth(year, month) {
  const grid = document.getElementById('calendar-grid');
  const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                       'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth();

  document.getElementById('cal-month-title').textContent = MONTH_NAMES[month] + ' ' + year;

  // Show/hide "Oggi" button
  const todayBtn = document.getElementById('cal-today-btn');
  if (todayBtn) todayBtn.style.opacity = isCurrent ? '0.4' : '1';

  if (STATE.startDate) document.getElementById('start-date-input').value = STATE.startDate;

  grid.innerHTML = '';
  ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].forEach(d => {
    const h = document.createElement('div'); h.className = 'cal-header-cell'; h.textContent = d; grid.appendChild(h);
  });

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  for (let i = 0; i < startDow; i++) {
    const e = document.createElement('div'); e.className = 'cal-day empty'; grid.appendChild(e);
  }

  const todayStr = today();
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date    = new Date(year, month, day);
    const iso     = toISO(date);
    const wo      = getWorkoutForDate(iso);
    const log     = STATE.logs[iso];
    const isToday = iso === todayStr;
    const isPast  = iso < todayStr;
    const isFuture = iso > todayStr;

    const cell = document.createElement('div');
    let cls = 'cal-day';
    if (isToday)  cls += ' today';
    if (wo)       cls += ' ' + wo.type;
    if (isPast && wo && wo.type !== 'rest' && wo.type !== 'rest_active' && !log?.completed) cls += ' past-unlogged';
    cell.className = cls;

    let mood = '';
    if (log?.completed) mood = '<div class="cal-day-mood">😊</div>';
    else if (isPast && wo && wo.type !== 'rest' && wo.type !== 'rest_active') mood = '<div class="cal-day-mood">😕</div>';

    // Future days without plan: slightly dimmed
    if (isFuture && !wo && STATE.startDate) cell.style.opacity = '0.35';

    cell.innerHTML = '<div class="cal-day-num">' + day + '</div>' +
                     (wo ? '<div class="cal-day-icon">' + wo.emoji + '</div>' : '') + mood;
    cell.title = wo?.label ?? (isFuture ? '—' : '');
    if (wo) cell.onclick = () => navigateToWorkoutDate(iso);
    grid.appendChild(cell);
  }
}

function applyStartDate() {
  const val = document.getElementById('start-date-input').value;
  if (!val) { showToast('Seleziona una data'); return; }
  STATE.startDate = val;
  // Jump calendar view to the start month
  const d = fromISO(val);
  CAL_VIEW.year = d.getFullYear(); CAL_VIEW.month = d.getMonth();
  saveState();
  renderCalendar();
  showToast('✅ Data di inizio impostata!');
}

// ══════════════════════════════════════
//  GCAL EXPORT — full plan duration
// ══════════════════════════════════════
function openGCalExport()  { document.getElementById('gcal-modal').classList.remove('hidden'); }
function closeGcalModal(e) {
  if (!e || e.target === document.getElementById('gcal-modal'))
    document.getElementById('gcal-modal').classList.add('hidden');
}

function downloadICS() {
  if (!STATE.plan || !STATE.startDate) { showToast('Imposta prima la data di inizio dal Calendario'); return; }
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//筋トレ//IT','CALSCALE:GREGORIAN',
                 'X-WR-CALNAME:筋トレ','X-WR-CALDESC:Piano allenamento mensile'];

  // Export the full plan: 35 days (5 weeks) — covers any 4-week plan regardless of start day
  // This always includes the last days of the month that spill into the next
  const start = fromISO(STATE.startDate);
  let eventCount = 0;
  for (let i = 0; i < 35; i++) {
    const d   = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = toISO(d);
    const wo  = getWorkoutForDate(iso);
    if (!wo || wo.type === 'rest') continue;
    const dt = iso.replace(/-/g,'');
    lines.push(
      'BEGIN:VEVENT',
      'UID:kintore-' + iso + '@筋トレ',
      'DTSTART;VALUE=DATE:' + dt,
      'DTEND;VALUE=DATE:' + dt,
      'SUMMARY:' + wo.emoji + ' ' + wo.label,
      'DESCRIPTION:筋トレ – ' + wo.label + (wo.sessionId ? ' (Sessione ' + wo.sessionId + ')' : ''),
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Tra 30 minuti: ' + wo.label,
      'END:VALARM',
      'END:VEVENT'
    );
    eventCount++;
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kintore-allenamenti.ics';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('📅 Esportati ' + eventCount + ' allenamenti su Google Cal!');
  closeGcalModal();
}

// ══════════════════════════════════════
//  WORKOUT PAGE
// ══════════════════════════════════════
let CURRENT_SESSION = null;
let WORKOUT_DATE = null;      // null = today, otherwise "YYYY-MM-DD"
let WORKOUT_OVERRIDE = null;  // manual session override (e.g. do session A on a cardio day)

function renderWorkoutPage() {
  const dateStr = WORKOUT_DATE ?? today();
  const isToday = dateStr === today();
  const wo      = WORKOUT_OVERRIDE ?? getWorkoutForDate(dateStr);
  const log     = STATE.logs[dateStr];

  // Update title to reflect selected date
  const dateLabel = isToday ? 'di oggi' : formatDateLabel(dateStr);
  document.getElementById('workout-page-title').textContent = 'Allenamento ' + dateLabel;

  // Init date picker with selected date
  const dpInput = document.getElementById('workout-date-select');
  if (dpInput && !dpInput.value) dpInput.value = dateStr;

  // Reset visibility
  document.getElementById('workout-detail-container').classList.remove('hidden');
  document.getElementById('no-workout-today').classList.add('hidden');
  document.getElementById('cardio-detail-block').classList.add('hidden');
  ['btn-start-companion','btn-mark-run','btn-mark-rest'].forEach(id => document.getElementById(id).classList.add('hidden'));

  // Populate session picker whenever picker is open
  populateSessionPicker(dateStr);

  if (!STATE.plan || !STATE.startDate) {
    document.getElementById('wi-name').textContent = 'Imposta la data di inizio';
    document.getElementById('wi-meta').innerHTML   = '';
    document.getElementById('wi-focus').innerHTML  = '';
    document.getElementById('workout-exercise-list').innerHTML = '<p style="color:var(--muted);font-size:14px">Vai nel Calendario e imposta la data di inizio del programma.</p>';
    return;
  }
  if (!wo) {
    document.getElementById('workout-detail-container').classList.add('hidden');
    document.getElementById('no-workout-today').classList.remove('hidden');
    return;
  }

  if (wo.type === 'rest' || wo.type === 'rest_active') {
    const badge = document.getElementById('wi-session-badge');
    badge.textContent = wo.emoji; badge.style.background = 'var(--rest2)';
    document.getElementById('wi-name').textContent = wo.label;
    document.getElementById('wi-meta').innerHTML = '';
    document.getElementById('wi-focus').innerHTML = '';
    const desc = wo.type === 'rest_active'
      ? 'Camminata 30–40 min, stretching o yoga leggero.'
      : 'Riposo completo. Il recupero è parte essenziale dell\'allenamento.';
    document.getElementById('workout-exercise-list').innerHTML =
      '<div class="card" style="text-align:center;padding:32px"><div style="font-size:48px;margin-bottom:12px">'+wo.emoji+'</div>' +
      '<p style="font-size:16px;font-weight:700;margin-bottom:8px">'+wo.label+'</p>' +
      '<p style="color:var(--muted);font-size:14px">'+desc+'</p></div>';
    const btn = document.getElementById('btn-mark-rest');
    btn.classList.remove('hidden');
    btn.textContent = log?.completed ? '✅ Già segnato' : '✅ Segna come fatto';
    return;
  }

  if (wo.type === 'cardio') {
    const badge = document.getElementById('wi-session-badge');
    badge.textContent = '🏃'; badge.style.background = 'var(--cardio)';
    document.getElementById('wi-name').textContent = 'Sessione di Corsa';
    const week = getWeekNumber(dateStr);
    const ci   = STATE.plan.cardioByWeek?.[week] ?? {};
    document.getElementById('wi-meta').innerHTML = '⏱ ' + (ci.durationMin ?? '?') + ' min &nbsp;·&nbsp; Settimana ' + week;
    document.getElementById('wi-focus').innerHTML = '';
    document.getElementById('workout-exercise-list').innerHTML = '';
    document.getElementById('cardio-detail-block').classList.remove('hidden');
    document.getElementById('cardio-week-info').innerHTML =
      '<p style="font-size:16px;font-weight:700;margin-bottom:8px">'+(ci.structure??'—')+'</p>' +
      '<p style="color:var(--muted);font-size:14px">'+(ci.notes??'')+'</p>';
    document.getElementById('btn-mark-run').classList.remove('hidden');
    CURRENT_SESSION = null;
    return;
  }

  // Strength session
  const session = STATE.plan.sessions?.[wo.sessionId];
  if (!session) return;
  CURRENT_SESSION = session;

  const badge = document.getElementById('wi-session-badge');
  badge.textContent = wo.sessionId; badge.style.background = 'var(--accent)';
  document.getElementById('wi-name').textContent  = session.name;
  document.getElementById('wi-meta').innerHTML    = '⏱ '+session.durationLabel+' &nbsp;·&nbsp; '+(session.exercises?.length??0)+' esercizi';
  document.getElementById('wi-focus').innerHTML   = (session.focus||[]).map(f => '<span class="focus-tag">'+f+'</span>').join('');

  const btn = document.getElementById('btn-start-companion');
  btn.classList.remove('hidden');
  btn.textContent = log?.completed ? '🔄 Rifai sessione' : '▶ Avvia sessione guidata';

  const list = document.getElementById('workout-exercise-list');
  list.innerHTML = '';
  (session.exercises || []).forEach((ex, i) => {
    const row = document.createElement('div');
    row.className = 'ex-row ' + ex.type;
    const badge_ = ex.sets ? ex.sets+'×'+ex.reps : (ex.isTimer ? formatTime(ex.duration) : '');
    row.innerHTML =
      '<div class="ex-row-num">'+String(i+1).padStart(2,'0')+'</div>' +
      '<div class="ex-row-info"><div class="ex-row-name">'+ex.name+'</div>' +
      '<div class="ex-row-meta">'+(ex.desc||'').substring(0,60)+'…</div></div>' +
      '<div class="ex-row-badge">'+badge_+(ex.rest?' '+ex.rest+'s':'')+'</div>';
    row.onclick = () => openExerciseDetail(ex.id);
    list.appendChild(row);
  });
}

// ── Flexible scheduling helpers ──────────────────────────

function formatDateLabel(iso) {
  const d = fromISO(iso), t = today();
  if (iso === t) return 'di oggi';
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  if (iso === toISO(yesterday)) return 'di ieri';
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  if (iso === toISO(tomorrow)) return 'di domani';
  const days = ['dom','lun','mar','mer','gio','ven','sab'];
  const months = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  return 'del ' + d.getDate() + ' ' + months[d.getMonth()];
}

function toggleWorkoutDatePicker() {
  const picker = document.getElementById('workout-date-picker');
  const isHidden = picker.classList.contains('hidden');
  picker.classList.toggle('hidden', !isHidden);
  if (isHidden) {
    const dp = document.getElementById('workout-date-select');
    dp.value = WORKOUT_DATE ?? today();
    populateSessionPicker(dp.value);
  }
}

function populateSessionPicker(dateStr) {
  const el = document.getElementById('workout-session-picker');
  if (!el || !STATE.plan) return;
  el.innerHTML = '';
  // Show all available sessions as quick-pick chips
  const sessions = STATE.plan.sessions ?? {};
  const currentOverride = WORKOUT_OVERRIDE;

  // Add "Programmato" chip (what the plan says for that day)
  const planned = getWorkoutForDate(dateStr);
  if (planned) {
    const chip = document.createElement('button');
    const isActive = !currentOverride;
    chip.className = 'session-chip' + (isActive ? ' active' : '');
    chip.textContent = planned.emoji + ' ' + planned.label + ' (piano)';
    chip.onclick = () => { WORKOUT_OVERRIDE = null; renderWorkoutPage(); updateChips(); };
    el.appendChild(chip);
  }

  // Add chips for each strength session
  Object.entries(sessions).forEach(([sid, sess]) => {
    const chip = document.createElement('button');
    const thisWo = { type:'strength', sessionId: sid, label: sess.name, emoji:'💪' };
    const isActive = currentOverride?.sessionId === sid;
    chip.className = 'session-chip' + (isActive ? ' active' : '');
    chip.textContent = '💪 ' + sess.name;
    chip.onclick = () => { WORKOUT_OVERRIDE = thisWo; renderWorkoutPage(); updateChips(); };
    el.appendChild(chip);
  });

  // Corsa chip
  const runChip = document.createElement('button');
  const isRunActive = currentOverride?.type === 'cardio';
  runChip.className = 'session-chip' + (isRunActive ? ' active' : '');
  runChip.textContent = '🏃 Corsa';
  runChip.onclick = () => {
    WORKOUT_OVERRIDE = { type:'cardio', sessionId:'run', label:'Corsa', emoji:'🏃' };
    renderWorkoutPage(); updateChips();
  };
  el.appendChild(runChip);
}

function updateChips() {
  // Re-render chips to reflect new active state
  const dp = document.getElementById('workout-date-select');
  populateSessionPicker(dp?.value ?? (WORKOUT_DATE ?? today()));
}

function onWorkoutDateChange() {
  WORKOUT_OVERRIDE = null; // reset session override when date changes
}

function applyWorkoutDate() {
  const val = document.getElementById('workout-date-select').value;
  if (!val) return;
  WORKOUT_DATE = val;
  document.getElementById('workout-date-picker').classList.add('hidden');
  renderWorkoutPage();
}

function resetToToday() {
  WORKOUT_DATE = null;
  WORKOUT_OVERRIDE = null;
  document.getElementById('workout-date-select').value = today();
  document.getElementById('workout-date-picker').classList.add('hidden');
  renderWorkoutPage();
}

// navigateToWorkoutDate — called from calendar day click
function navigateToWorkoutDate(iso) {
  WORKOUT_DATE = iso;
  WORKOUT_OVERRIDE = null;
  navigate('workout');
}

function openRunLog()  { navigate('run'); }
function markRestDone() {
  const d = WORKOUT_DATE ?? today();
  STATE.logs[d] = { type:'rest', completed:true, date:d };
  saveState(); showToast('✅ Riposo segnato!'); renderWorkoutPage();
}
function formatTime(sec) { const m=Math.floor(sec/60),s=sec%60; return s?m+'m'+s+'s':m+' min'; }
function openExerciseDetail(id) {
  navigate('exercises');
  setTimeout(() => {
    const el = document.getElementById('ex-card-'+id);
    if (el) { el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('open'); }
  }, 200);
}

// ══════════════════════════════════════
//  COMPANION
// ══════════════════════════════════════
let COMP = { session:null, exercises:[], exIdx:0, setIdx:0, restTimer:null, ttsEnabled:true, lang:'it-IT' };

function openCompanion() {
  if (!CURRENT_SESSION) return;
  COMP.session    = CURRENT_SESSION;
  COMP.exercises  = CURRENT_SESSION.exercises.filter(e => e.name);
  COMP.exIdx      = 0; COMP.setIdx = 0;
  COMP.ttsEnabled = STATE.prefs.tts !== false;
  COMP.lang       = STATE.prefs.lang || 'it-IT';
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

  const pct = Math.round((COMP.exIdx / COMP.exercises.length) * 100);
  document.getElementById('comp-progress-text').textContent = 'Esercizio '+(COMP.exIdx+1)+' di '+COMP.exercises.length;
  document.getElementById('comp-progress-bar-fill').style.width = pct+'%';

  const phaseMap = { warmup:'RISCALDAMENTO', cooldown:'DEFATICAMENTO', core:'CORE', cardio:'CARDIO' };
  document.getElementById('comp-phase-label').textContent  = phaseMap[ex.type] ?? 'IN CORSO';
  document.getElementById('comp-exercise-name').textContent = ex.name;

  const dotsEl = document.getElementById('comp-set-indicators');
  dotsEl.innerHTML = '';
  if (ex.sets) {
    for (let i = 0; i < ex.sets; i++) {
      const dot = document.createElement('div');
      dot.className = 'set-dot' + (i < COMP.setIdx ? ' done' : i === COMP.setIdx ? ' current' : '');
      dotsEl.appendChild(dot);
    }
  }

  const rEl = document.getElementById('comp-reps-display');
  const exDur = getExDuration(ex);
  if (ex.isTimer && exDur) {
    rEl.textContent = formatTime(exDur) + (ex.sets ? ' · Serie '+(COMP.setIdx+1)+'/'+ex.sets : '');
  } else if (ex.reps) {
    rEl.textContent = ex.reps + (ex.sets ? ' · Serie '+(COMP.setIdx+1)+'/'+ex.sets : '');
  } else rEl.textContent = '';

  document.getElementById('comp-exercise-desc').textContent = ex.desc ?? '';
  const notesEl = document.getElementById('comp-notes-block');
  if (ex.notes) { notesEl.textContent = '💡 '+ex.notes; notesEl.classList.remove('hidden'); }
  else notesEl.classList.add('hidden');

  const btn = document.getElementById('comp-main-btn');
  const dur = getExDuration(ex);
  if (ex.isTimer && dur) {
    btn.textContent = '▶ INIZIA TIMER' + (ex.sets ? ' — SET '+(COMP.setIdx+1)+'/'+ex.sets : '');
    btn.onclick = () => startTimedExercise(ex, dur);
  } else {
    btn.textContent = ex.sets ? '✓  HO FINITO IL SET '+(COMP.setIdx+1) : '✓  FATTO';
    btn.onclick = companionAction;
  }
  speakExercise(ex);
}

function speakExercise(ex) {
  if (!COMP.ttsEnabled) return;
  let msg = '';
  if      (ex.type === 'warmup')   msg = 'Riscaldamento. ' + (ex.desc?.split('.')[0] ?? '');
  else if (ex.type === 'cooldown') msg = 'Defaticamento. ' + (ex.desc?.split('.')[0] ?? '');
  else msg = 'Esercizio: ' + ex.name + (ex.sets ? '. '+ex.sets+' serie da '+ex.reps+' ripetizioni' : '') +
             (ex.notes ? '. Attenzione: '+ex.notes : '');
  speak(msg);
}

function startTimedExercise(ex, dur) {
  const btn = document.getElementById('comp-main-btn');
  const setLabel = ex.sets ? ' (set '+(COMP.setIdx+1)+'/'+ex.sets+')' : '';
  btn.textContent = '⏸' + setLabel; btn.onclick = null;
  let rem = dur ?? getExDuration(ex);
  document.getElementById('comp-reps-display').textContent = formatTime(rem);
  if (COMP.ttsEnabled) speak('Via' + (ex.sets ? ', set '+(COMP.setIdx+1) : '') + '!');
  COMP.restTimer = setInterval(() => {
    rem--;
    document.getElementById('comp-reps-display').textContent = formatTime(rem);
    // Countdown callout in the last 5 seconds
    if (rem > 0 && rem <= 5 && COMP.ttsEnabled) speak(String(rem));
    if (rem <= 0) {
      clearInterval(COMP.restTimer); COMP.restTimer = null;
      if (COMP.ttsEnabled) speak('Ottimo!');
      // If this exercise has sets, treat like companionAction
      if (ex.sets) {
        COMP.setIdx++;
        if (COMP.setIdx < ex.sets) {
          // More sets remaining → rest then next set
          showCompRest(ex.rest || 45, false);
        } else {
          // All sets done → move to next exercise
          COMP.setIdx = 0; COMP.exIdx++;
          if (COMP.exIdx < COMP.exercises.length) {
            if (ex.rest) showCompRest(ex.rest, true);
            else showCompExercise();
          } else showCompDone();
        }
      } else {
        // Single-duration (warmup/cooldown) — just move on
        COMP.exIdx++; COMP.setIdx = 0; setTimeout(showCompExercise, 500);
      }
    }
  }, 1000);
}

function companionAction() {
  const ex = COMP.exercises[COMP.exIdx]; if (!ex) return;
  if (COMP.ttsEnabled) speak('Ottimo!');
  COMP.setIdx++;
  if (ex.sets && COMP.setIdx < ex.sets) {
    showCompRest(ex.rest, false);
  } else {
    COMP.setIdx = 0; COMP.exIdx++;
    if (COMP.exIdx < COMP.exercises.length) {
      if (ex.rest) showCompRest(ex.rest, true);
      else showCompExercise();
    } else showCompDone();
  }
}

function companionSkip() {
  COMP.setIdx = 0; COMP.exIdx++;
  if (COMP.restTimer) { clearInterval(COMP.restTimer); COMP.restTimer = null; }
  window.speechSynthesis?.cancel(); showCompExercise();
}

function showCompRest(seconds, isNextExercise) {
  document.getElementById('comp-exercise-view').classList.add('hidden');
  document.getElementById('comp-rest-view').classList.remove('hidden');
  const nextEx = COMP.exercises[COMP.exIdx];
  document.getElementById('comp-next-exercise-preview').textContent =
    isNextExercise ? 'Prossimo: '+(nextEx?.name??'Fine') : 'Prossima serie: '+(nextEx?.name??'');
  const circ = 2 * Math.PI * 52; let rem = seconds;
  const arc = document.getElementById('comp-rest-arc'), cd = document.getElementById('comp-rest-countdown');
  arc.style.strokeDasharray = circ; arc.style.strokeDashoffset = 0;
  cd.textContent = rem;
  if (COMP.ttsEnabled) speak('Recupero: '+seconds+' secondi.');
  COMP.restTimer = setInterval(() => {
    rem--; cd.textContent = rem;
    arc.style.strokeDashoffset = ((seconds - rem) / seconds) * circ;
    if (rem <= 3 && rem > 0 && COMP.ttsEnabled) speak(String(rem));
    if (rem <= 0) {
      clearInterval(COMP.restTimer); COMP.restTimer = null;
      if (COMP.ttsEnabled) speak('Via!'); showCompExercise();
    }
  }, 1000);
}

function skipRest() {
  if (COMP.restTimer) { clearInterval(COMP.restTimer); COMP.restTimer = null; }
  window.speechSynthesis?.cancel(); showCompExercise();
}

function showCompDone() {
  document.getElementById('comp-exercise-view').classList.add('hidden');
  document.getElementById('comp-rest-view').classList.add('hidden');
  document.getElementById('comp-done-view').classList.remove('hidden');
  document.getElementById('comp-progress-bar-fill').style.width = '100%';
  document.getElementById('comp-progress-text').textContent = 'Sessione completata!';
  if (COMP.ttsEnabled) speak('Allenamento completato! Ottimo lavoro! Non dimenticare il defaticamento.');
}

// Track selected difficulty before saving
let _selectedDifficulty = null;

function selectDifficulty(val) {
  _selectedDifficulty = val;
  // Highlight the selected button
  document.querySelectorAll('.diff-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.val === val);
  });
  // Reveal notes textarea + save button
  document.getElementById('comp-notes-section').classList.remove('hidden');
  // Smooth scroll to show notes field on mobile
  setTimeout(() => {
    document.getElementById('comp-notes-section').scrollIntoView({ behavior:'smooth', block:'nearest' });
  }, 100);
}

function saveWorkoutAndClose() {
  if (!_selectedDifficulty) { showToast('Seleziona prima una difficoltà 👆'); return; }
  const notes = (document.getElementById('comp-workout-notes').value || '').trim();
  const dateStr = WORKOUT_DATE ?? today();
  STATE.logs[dateStr] = {
    type:       'strength',
    sessionId:  COMP.session?.name ?? '',
    completed:  true,
    difficulty: _selectedDifficulty,
    notes:      notes,
    date:       dateStr,
    timestamp:  new Date().toISOString(),
  };
  saveState();
  showToast('🎉 Sessione salvata! ' + diffLabel(_selectedDifficulty));
  _selectedDifficulty = null;
  document.getElementById('comp-workout-notes').value = '';
  document.getElementById('comp-notes-section').classList.add('hidden');
  setTimeout(() => { closeCompanion(); renderDashboard(); }, 900);
}

// Legacy alias (keeps backward compat if anything calls rateDifficulty directly)
function rateDifficulty(val) { selectDifficulty(val); }

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = COMP.lang || 'it-IT'; u.rate = 0.95; u.pitch = 1.0;
  window.speechSynthesis.speak(u);
}

// ══════════════════════════════════════
//  EXERCISE LIBRARY
// ══════════════════════════════════════
let activeExFilter = 'all';

function renderExerciseLibrary() {
  const cats = [
    {id:'all',label:'Tutti'},{id:'strength',label:'Forza'},{id:'core',label:'Core'},
    {id:'cardio',label:'Cardio'},{id:'mobility',label:'Mobilità'},
    {id:'warmup',label:'Riscaldamento'},{id:'cooldown',label:'Defaticamento'},
  ];
  document.getElementById('exercise-filter-tags').innerHTML = cats.map(c =>
    '<span class="filter-tag '+(activeExFilter===c.id?'active':'')+'" onclick="setExFilter(\''+c.id+'\')">'+c.label+'</span>'
  ).join('');
  renderExCards(document.getElementById('exercise-search').value);
}

function setExFilter(f) { activeExFilter = f; renderExerciseLibrary(); }
function filterExercises(q) { renderExCards(q); }

function renderExCards(query) {
  const c = document.getElementById('exercise-library'); c.innerHTML = '';
  const q = (query || '').toLowerCase();
  (window.EXERCISES_DB || [])
    .filter(ex => (activeExFilter === 'all' || ex.category === activeExFilter) &&
                  (!q || ex.name.toLowerCase().includes(q) || (ex.muscles||[]).join(' ').toLowerCase().includes(q)))
    .forEach(ex => {
      const card = document.createElement('div');
      card.className = 'ex-card'; card.id = 'ex-card-'+ex.id;
      const ytUrl = 'https://www.youtube.com/results?search_query='+encodeURIComponent(ex.ytQuery);
      const stepsHTML = (ex.steps||[]).map((s,i) =>
        '<div class="ex-step"><span class="ex-step-num">'+(i+1)+'.</span><span>'+s+'</span></div>').join('');
      const tagsHTML = (ex.muscles||[]).map(m => '<span class="ex-tag">'+m+'</span>').join('');
      const dots = '●'.repeat(ex.difficulty||1) + '○'.repeat(5-(ex.difficulty||1));
      card.innerHTML =
        '<div class="ex-card-header" onclick="toggleExCard(\''+ex.id+'\')">'+
          '<div class="ex-card-emoji">'+ex.emoji+'</div>'+
          '<div class="ex-card-title">'+
            '<div class="ex-card-name">'+ex.name+'</div>'+
            '<div class="ex-card-sub" style="color:var(--accent)">'+dots+'</div>'+
            '<div class="ex-card-tags">'+tagsHTML+'</div>'+
          '</div><span class="ex-chevron">▼</span></div>'+
        '<div class="ex-card-body">'+
          '<p class="ex-desc">'+ex.desc+'</p>'+
          '<div class="ex-steps-title">COME SI ESEGUE</div>'+stepsHTML+
          '<div class="ex-tips"><div class="ex-tips-title">💡 CONSIGLI</div><p>'+ex.tips+'</p></div>'+
          '<a class="ex-yt-link" href="'+ytUrl+'" target="_blank" rel="noopener">▶ Guarda il tutorial su YouTube</a>'+
        '</div>';
      c.appendChild(card);
    });
}

function toggleExCard(id) { document.getElementById('ex-card-'+id)?.classList.toggle('open'); }

// ══════════════════════════════════════
//  RUN PAGE
// ══════════════════════════════════════
function renderRunPage() {
  document.getElementById('run-date').value = today();
  renderRunStats(); renderRunHistory();
}

function saveRun() {
  const date     = document.getElementById('run-date').value || today();
  const duration = parseFloat(document.getElementById('run-duration').value) || 0;
  const km       = parseFloat(document.getElementById('run-km').value) || 0;
  const notes    = document.getElementById('run-notes').value.trim();
  if (!duration && !km) { showToast('Inserisci almeno durata o distanza'); return; }
  STATE.runs.push({ date, duration, km, notes });
  STATE.runs.sort((a, b) => b.date.localeCompare(a.date));
  STATE.logs[date] = { type:'cardio', sessionId:'run', completed:true, date, km, duration };
  saveState(); showToast('🏃 Corsa salvata!');
  ['run-duration','run-km','run-notes'].forEach(id => document.getElementById(id).value = '');
  renderRunStats(); renderRunHistory();
}

function renderRunStats() {
  const runs = STATE.runs;
  const totalKm = runs.reduce((a, r) => a + (r.km||0), 0);
  const avgKm   = runs.length ? totalKm / runs.length : 0;
  const rwb     = runs.filter(r => r.km && r.duration);
  const avgPace = rwb.length ? rwb.reduce((a, r) => a + r.duration/r.km, 0) / rwb.length : 0;
  const pStr    = avgPace ? Math.floor(avgPace)+':'+String(Math.round((avgPace%1)*60)).padStart(2,'0')+'/km' : '—';
  document.getElementById('run-stat-count').textContent    = runs.length;
  document.getElementById('run-stat-km').textContent       = totalKm.toFixed(1);
  document.getElementById('run-stat-avg-km').textContent   = avgKm.toFixed(1);
  document.getElementById('run-stat-avg-pace').textContent = pStr;
}

function renderRunHistory() {
  const hist = document.getElementById('run-history'); hist.innerHTML = '';
  if (!STATE.runs.length) { hist.innerHTML = '<p style="color:var(--muted);font-size:14px">Nessuna corsa ancora.</p>'; return; }
  STATE.runs.slice(0, 20).forEach((r, i) => {
    const pace = r.km&&r.duration ? Math.floor(r.duration/r.km)+':'+String(Math.round(((r.duration/r.km)%1)*60)).padStart(2,'0')+'/km' : '—';
    const item = document.createElement('div'); item.className = 'run-item';
    item.innerHTML =
      '<div class="run-item-date">'+r.date.slice(5).replace('-','/')+'</div>'+
      '<div class="run-item-stats">'+
        '<div class="run-item-main">'+(r.km?r.km+' km':'')+' '+(r.duration?r.duration+' min':'')+'</div>'+
        '<div class="run-item-sub">Passo '+pace+(r.notes?' · '+r.notes:'')+'</div>'+
      '</div>'+
      '<button class="run-item-del" onclick="deleteRun('+i+')">🗑</button>';
    hist.appendChild(item);
  });
}

function deleteRun(i) {
  if (!confirm('Eliminare?')) return;
  STATE.runs.splice(i, 1); saveState(); renderRunHistory(); renderRunStats(); showToast('Corsa eliminata');
}

// ══════════════════════════════════════
//  NUTRITION
// ══════════════════════════════════════
function renderNutritionPage() {
  document.getElementById('goal-protein').value  = STATE.goals.protein;
  document.getElementById('goal-calories').value = STATE.goals.calories;
  renderFoodLog(); renderNutritionHistory(); renderProteinSources();
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
  getTodayNutrition().entries.push({ name, protein, calories:cal, carbs, fat });
  saveState();
  ['food-name','food-protein','food-calories','food-carbs','food-fat'].forEach(id => document.getElementById(id).value = '');
  renderFoodLog(); showToast('✅ Pasto aggiunto!');
}

function renderFoodLog() {
  const entries  = getTodayNutrition().entries || [];
  const totProt  = entries.reduce((a, e) => a + (e.protein||0), 0);
  const totCal   = entries.reduce((a, e) => a + (e.calories||0), 0);
  const protPct  = Math.min(100, Math.round((totProt / STATE.goals.protein) * 100));
  const calPct   = Math.min(100, Math.round((totCal  / STATE.goals.calories) * 100));
  document.getElementById('protein-progress-label').textContent = Math.round(totProt)+' / '+STATE.goals.protein+' g';
  document.getElementById('protein-bar').style.width = protPct+'%';
  document.getElementById('cal-progress-label').textContent = Math.round(totCal)+' / '+STATE.goals.calories+' kcal';
  document.getElementById('cal-bar').style.width = calPct+'%';
  document.getElementById('food-log-list').innerHTML = !entries.length
    ? '<p style="color:var(--muted);font-size:14px;margin-bottom:16px">Nessun pasto registrato oggi.</p>'
    : entries.map((e, i) =>
        '<div class="food-item"><div class="food-item-name">'+(e.name||'Alimento')+'</div>'+
        '<div class="food-macros">'+(e.protein?e.protein+'g prot':'')+' '+(e.calories?'· '+e.calories+' kcal':'')+'</div>'+
        '<button class="food-del" onclick="deleteFoodEntry('+i+')">✕</button></div>'
      ).join('');
}

function deleteFoodEntry(i) {
  getTodayNutrition().entries.splice(i, 1); saveState(); renderFoodLog();
}

function renderNutritionHistory() {
  const hist = document.getElementById('nutrition-history');
  const days = Object.keys(STATE.nutrition).sort().reverse().slice(0, 7);
  if (!days.length) { hist.innerHTML = '<p style="color:var(--muted);font-size:14px">Nessun dato ancora.</p>'; return; }
  hist.innerHTML = days.map(d => {
    const prot = Math.round((STATE.nutrition[d].entries||[]).reduce((a, e) => a+(e.protein||0), 0));
    const pct  = Math.min(100, Math.round((prot / STATE.goals.protein) * 100));
    return '<div class="nutrition-history-row"><span class="nh-date">'+d.slice(5).replace('-','/')+'</span>'+
      '<div class="nh-bar-wrap"><div class="progress-bar-bg" style="height:6px"><div class="progress-bar-fill protein-fill" style="width:'+pct+'%"></div></div></div>'+
      '<span class="nh-label">'+prot+'g</span></div>';
  }).join('');
}

function renderProteinSources() {
  document.getElementById('protein-sources-grid').innerHTML = (window.PROTEIN_SOURCES||[])
    .map(s => '<div class="ps-card"><div class="ps-name">'+s.name+'</div><div class="ps-prot">'+s.prot+'</div><div class="ps-note">'+s.note+'</div></div>')
    .join('');
}

function saveGoals() {
  STATE.goals.protein  = parseInt(document.getElementById('goal-protein').value)  || 100;
  STATE.goals.calories = parseInt(document.getElementById('goal-calories').value) || 2300;
  saveState(); renderFoodLog(); showToast('🎯 Obiettivi salvati!'); toggleGoalEditor();
}
function toggleGoalEditor() { document.getElementById('goal-editor').classList.toggle('hidden'); }

// ══════════════════════════════════════
//  PROGRESS
// ══════════════════════════════════════
function renderProgressPage() {
  const allEntries = Object.entries(STATE.logs).sort((a, b) => b[0].localeCompare(a[0]));
  const completed  = allEntries.filter(([, l]) => l.completed);
  let planned = 0;
  if (STATE.startDate && STATE.plan) {
    const start = fromISO(STATE.startDate), end = new Date();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
      const wo = getWorkoutForDate(toISO(d));
      if (wo && wo.type !== 'rest') planned++;
    }
  }
  const pct = planned ? Math.round((completed.length / planned) * 100) : 0;
  document.getElementById('prog-total').textContent      = completed.length;
  document.getElementById('prog-streak').textContent     = calcStreak();
  document.getElementById('prog-best-streak').textContent = calcBestStreak();
  document.getElementById('prog-completion').textContent  = pct+'%';

  const logEl = document.getElementById('workout-log-list');
  if (!completed.length) { logEl.innerHTML = '<p style="color:var(--muted);font-size:14px">Nessun allenamento completato ancora.</p>'; return; }
  logEl.innerHTML = completed.slice(0, 30).map(([date, l]) => {
    const diff = l.difficulty ? '<span class="log-diff-badge diff-'+l.difficulty+'">'+diffLabel(l.difficulty)+'</span>' : '';
    const type = l.type === 'cardio' ? '🏃 Corsa' : (l.sessionId || l.type || 'Allenamento');
    return '<div class="log-item"><div class="log-item-date">'+date.slice(5).replace('-','/')+'</div>'+
           '<div class="log-item-name">'+type+'</div>'+diff+'</div>';
  }).join('');
}

function exportData() {
  const data = {
    export_date: today(),
    period: STATE.plan ? STATE.plan.month+' '+STATE.plan.year : '—',
    sessions_completed: Object.values(STATE.logs).filter(l => l.completed && l.type !== 'rest').length,
    streak: calcStreak(), best_streak: calcBestStreak(),
    workout_logs: Object.entries(STATE.logs).filter(([,l]) => l.completed)
      .map(([date,l]) => ({ date, type:l.type, sessionId:l.sessionId, difficulty:l.difficulty??null })),
    run_logs: STATE.runs.map(r => ({ date:r.date, duration_min:r.duration, km:r.km, notes:r.notes })),
    nutrition_summary: {
      days_logged: Object.keys(STATE.nutrition).length,
      avg_protein_g: (() => {
        const days = Object.values(STATE.nutrition);
        if (!days.length) return 0;
        return Math.round(days.reduce((a,d) => a+(d.entries||[]).reduce((s,e)=>s+(e.protein||0),0),0)/days.length);
      })(),
    },
    goals: STATE.goals,
  };
  const json = JSON.stringify(data, null, 2);
  navigator.clipboard?.writeText(json).then(() => showToast('📋 Copiato!')).catch(() => {});
  const el = document.getElementById('export-preview');
  el.style.display = 'block'; el.textContent = json;
}

// ══════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════
function renderSettingsPage() {
  document.getElementById('active-plan-name').textContent =
    STATE.plan ? (STATE.plan.month??'')+' '+(STATE.plan.year??'') : 'Nessuno';
  document.getElementById('pref-name').value   = STATE.prefs.name  ?? '';
  document.getElementById('pref-tts').checked  = STATE.prefs.tts   !== false;
  document.getElementById('pref-lang').value   = STATE.prefs.lang  ?? 'it-IT';
  document.getElementById('pref-sheets').value = SHEETS_URL;
  const resEl = document.getElementById('sheets-test-result');
  if (resEl) resEl.textContent = '';
}

function loadPlanFromJSON() {
  const raw = document.getElementById('plan-json-input').value.trim();
  if (!raw) { showToast('Incolla il JSON prima'); return; }
  try {
    const plan = JSON.parse(raw);
    if (!plan.weekSchedule || !plan.sessions) throw new Error('Formato non valido');
    STATE.plan = plan;
    saveState();
    showToast('✅ Scheda caricata: '+(plan.month??'')+' '+(plan.year??''));
    renderSettingsPage();
    document.getElementById('plan-json-input').value = '';
  } catch { showToast('❌ JSON non valido'); }
}

function savePrefs() {
  STATE.prefs.name = document.getElementById('pref-name').value.trim();
  STATE.prefs.tts  = document.getElementById('pref-tts').checked;
  STATE.prefs.lang = document.getElementById('pref-lang').value;
  saveState(); showToast('✅ Preferenze salvate!');
}

function clearAllData() {
  if (!confirm('Cancellare tutti i dati?')) return;
  localStorage.clear(); location.reload();
}

// ══════════════════════════════════════
//  BOOT — completamente sincrono
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // 1. Carica stato (sincrono, istantaneo)
  try { loadState(); } catch(e) { console.error('loadState:', e); }

  // 2. Render dashboard (sincrono)
  try { renderDashboard(); } catch(e) { console.error('renderDashboard:', e); }

  // 3. Inizializza campi
  const runDateEl = document.getElementById('run-date');
  if (runDateEl) runDateEl.value = today();

  setSyncBadge('idle');

  // 4. Sync Sheets in background, dopo 1 secondo, mai blocca la UI
  setTimeout(() => {
    pullFromSheets()
      .then(ok => { if (ok) { try { renderDashboard(); } catch(e){} } })
      .catch(() => {});
  }, 1000);
});
