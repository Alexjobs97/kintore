// app.js — FitTrack v2 (Google Sheets sync)
'use strict';

// ══════════════════════════════════════
//  CONFIG — URL Google Sheets hardcoded
// ══════════════════════════════════════
const SHEETS_URL_DEFAULT = 'https://script.google.com/macros/s/AKfycbzUl9koSQTcv_KqSiKKcRrABUAyt1Gg-oBzbSuWf3gvBOET76f9raSaNnaar0u-th7MPg/exec';

// ══════════════════════════════════════
//  STORAGE
// ══════════════════════════════════════

const LS = {
  get: (k, fb=null) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

let STATE = {
  plan: null, startDate: null, logs: {}, runs: [],
  nutrition: {}, goals: { protein:100, calories:2300 },
  prefs: { name:'', tts:true, lang:'it-IT', sheetsUrl:'' },
};

function loadState() {
  STATE.plan      = LS.get('plan') || window.DEFAULT_PLAN || null;
  STATE.startDate = LS.get('startDate');
  STATE.logs      = LS.get('logs', {});
  STATE.runs      = LS.get('runs', []);
  STATE.nutrition = LS.get('nutrition', {});
  STATE.goals     = LS.get('goals', { protein:100, calories:2300 });
  STATE.prefs     = LS.get('prefs', { name:'', tts:true, lang:'it-IT', sheetsUrl:'' });
}

function saveStateLocal() {
  ['plan','startDate','logs','runs','nutrition','goals','prefs'].forEach(k => LS.set(k, STATE[k]));
}

// Salva localmente (istantaneo) + async sync a Sheets
function saveState() { saveStateLocal(); syncToSheets(); }

// ══════════════════════════════════════
//  GOOGLE SHEETS SYNC
// ══════════════════════════════════════

let syncTimeout = null;
let syncStatus  = 'idle';

function getSheetsUrl() { return STATE.prefs?.sheetsUrl?.trim() || SHEETS_URL_DEFAULT; }

async function loadFromSheets() {
  const url = getSheetsUrl();
  if (!url) return false;
  setSyncStatus('syncing');
  try {
    // Timeout di 6 secondi — se Sheets non risponde, si va avanti con i dati locali
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { method:'GET', redirect:'follow', signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? 'Risposta non valida');
    const r = json.data ?? {};
    const localUrl = STATE.prefs.sheetsUrl;
    if (r.plan)      { STATE.plan      = r.plan;      LS.set('plan',      STATE.plan); }
    if (r.startDate) { STATE.startDate = r.startDate; LS.set('startDate', STATE.startDate); }
    if (r.logs)      { STATE.logs      = r.logs;      LS.set('logs',      STATE.logs); }
    if (r.runs)      { STATE.runs      = r.runs;      LS.set('runs',      STATE.runs); }
    if (r.nutrition) { STATE.nutrition = r.nutrition; LS.set('nutrition', STATE.nutrition); }
    if (r.goals)     { STATE.goals     = r.goals;     LS.set('goals',     STATE.goals); }
    if (r.prefs)     { STATE.prefs = { ...r.prefs, sheetsUrl: localUrl }; LS.set('prefs', STATE.prefs); }
    setSyncStatus('ok');
    return true;
  } catch (err) {
    setSyncStatus('error');
    console.warn('[筋トレ] Sheets non raggiungibile, uso dati locali:', err.message);
    return false;
  }
}

function syncToSheets() {
  const url = getSheetsUrl();
  if (!url) return;
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => _doSync(url), 1500);
}

async function _doSync(url) {
  setSyncStatus('syncing');
  const payload = { action:'setAll', data:{ plan:STATE.plan, startDate:STATE.startDate,
    logs:STATE.logs, runs:STATE.runs, nutrition:STATE.nutrition, goals:STATE.goals, prefs:STATE.prefs } };
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    await fetch(url, { method:'POST', mode:'no-cors', redirect:'follow',
      headers:{ 'Content-Type':'text/plain' }, body:JSON.stringify(payload), signal: controller.signal });
    clearTimeout(tid);
    setSyncStatus('ok');
  } catch (err) {
    setSyncStatus('error');
    console.warn('[筋トレ] Errore sync:', err.message);
  }
}

function setSyncStatus(s) {
  syncStatus = s;
  const el = document.getElementById('sync-status');
  if (!el) return;
  const m = { idle:{icon:'☁️',text:'Nessuno sheet',cls:'sync-idle'}, syncing:{icon:'🔄',text:'Sync…',cls:'sync-syncing'},
               ok:{icon:'✅',text:'Sincronizzato',cls:'sync-ok'}, error:{icon:'⚠️',text:'Solo locale',cls:'sync-error'} };
  const v = m[s]||m.idle;
  el.innerHTML = `<span class="${v.cls}">${v.icon} ${v.text}</span>`;
}

async function testSheetsConnection() {
  const url = getSheetsUrl();
  if (!url) { showToast('⚠️ Inserisci prima l\'URL'); return; }
  setSyncStatus('syncing');
  const resultEl = document.getElementById('sheets-test-result');
  resultEl.textContent = 'Test in corso…';
  try {
    const pingUrl = url.includes('?') ? url+'&action=ping' : url+'?action=ping';
    const res  = await fetch(pingUrl, { method:'GET', redirect:'follow' });
    const json = await res.json();
    if (json.ok && json.pong) {
      setSyncStatus('ok');
      resultEl.textContent = '✅ Connessione riuscita! Invio dati…';
      showToast('✅ Google Sheet connesso!');
      await _doSync(url);
      resultEl.textContent = '✅ Connessione OK · dati sincronizzati';
    } else throw new Error(json.error ?? 'Risposta inattesa');
  } catch (err) {
    setSyncStatus('error');
    resultEl.textContent = '❌ ' + err.message;
    showToast('❌ Connessione fallita');
  }
}

// ══════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function toISO(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function fromISO(iso) { const [y,m,d]=iso.split('-').map(Number); return new Date(y,m-1,d); }

function getWeekNumber(dateStr) {
  if (!STATE.startDate) return 1;
  const diff = Math.floor((fromISO(dateStr)-fromISO(STATE.startDate))/86400000);
  return Math.min(4, Math.max(1, Math.floor(diff/7)+1));
}

function getWorkoutForDate(dateStr) {
  if (!STATE.plan||!STATE.startDate) return null;
  if (fromISO(dateStr) < fromISO(STATE.startDate)) return null;
  return STATE.plan.weekSchedule[fromISO(dateStr).getDay()] ?? null;
}

function greet() {
  const h = new Date().getHours();
  return h<12 ? 'Buongiorno' : h<18 ? 'Buon pomeriggio' : 'Buona sera';
}

function diffLabel(v) {
  return {molto_facile:'Molto facile',facile:'Facile',okay:'Okay',difficile:'Difficile',molto_difficile:'Molto difficile'}[v] ?? v ?? '—';
}

function showToast(msg, dur=2600) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show'); t.classList.remove('hidden');
  setTimeout(() => { t.classList.remove('show'); setTimeout(()=>t.classList.add('hidden'),350); }, dur);
}

// ══════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════

function navigate(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`.nav-btn[data-page="${page}"]`)?.classList.add('active');
  ({dashboard:renderDashboard,calendar:renderCalendar,workout:renderWorkoutPage,
    exercises:renderExerciseLibrary,run:renderRunPage,nutrition:renderNutritionPage,
    progress:renderProgressPage,settings:renderSettingsPage})[page]?.();
  window.scrollTo(0,0);
}

// ══════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════

function renderDashboard() {
  const name = STATE.prefs.name ? `, ${STATE.prefs.name}` : '';
  document.getElementById('greeting-sub').textContent  = greet()+'!';
  document.getElementById('greeting-main').textContent = `Ciao${name} 👋`;
  const todayStr=today(), wo=getWorkoutForDate(todayStr), log=STATE.logs[todayStr];
  if (!STATE.plan && !window.DEFAULT_PLAN) {
    document.getElementById('today-workout-name').textContent='Carica la tua scheda';
    document.getElementById('today-workout-meta').textContent='Vai in Impostazioni per iniziare.';
    document.getElementById('today-cta').textContent='⚙️ Impostazioni';
    document.getElementById('today-cta').onclick=()=>navigate('settings');
  } else if (!wo) {
    document.getElementById('today-workout-name').textContent='Riposo 😴';
    document.getElementById('today-workout-meta').textContent='Nessun allenamento previsto oggi.';
    document.getElementById('today-cta').textContent='📊 Vedi progressi';
    document.getElementById('today-cta').onclick=()=>navigate('progress');
  } else {
    document.getElementById('today-workout-name').textContent=wo.label;
    const extra=wo.type==='cardio'?`· Settimana ${getWeekNumber(todayStr)}`:'';
    document.getElementById('today-workout-meta').textContent=(log?.completed?'✅ Completato oggi':'⏳ In programma')+extra;
    document.getElementById('today-cta').textContent=log?.completed?'📊 Vedi progressi':'▶ Inizia';
    document.getElementById('today-cta').onclick=()=>navigate(log?.completed?'progress':'workout');
  }
  try { document.getElementById('streak-count').textContent=calcStreak(); } catch(e){ document.getElementById('streak-count').textContent='0'; }
  renderWeekStrip();
  const allLogs=Object.values(STATE.logs);
  const totalKm=STATE.runs.reduce((a,r)=>a+(r.km||0),0);
  const protDays=Object.values(STATE.nutrition);
  const avgProt=protDays.length?Math.round(protDays.reduce((a,d)=>a+(d.entries||[]).reduce((s,e)=>s+(e.protein||0),0),0)/protDays.length):0;
  document.getElementById('stat-done').textContent=allLogs.filter(l=>l.completed&&l.type!=='cardio').length;
  document.getElementById('stat-km').textContent=totalKm.toFixed(1);
  document.getElementById('stat-prot').textContent=avgProt||'—';
  const lastDiff=allLogs.filter(l=>l.difficulty).slice(-1)[0]?.difficulty;
  document.getElementById('stat-rate').textContent=lastDiff?diffLabel(lastDiff).split(' ')[0]:'—';
  const planNote = STATE.plan?.note ?? window.DEFAULT_PLAN?.note;
  if (planNote) document.getElementById('motivational-quote').textContent = planNote;
}

function renderWeekStrip() {
  const strip=document.getElementById('week-overview'); strip.innerHTML='';
  const labels=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'], now=new Date(), dow=now.getDay();
  for (let i=1;i<=7;i++) {
    const d=new Date(now); d.setDate(now.getDate()-dow+i%7);
    const iso=toISO(d), wo=getWorkoutForDate(iso), log=STATE.logs[iso], isToday=iso===today();
    const cell=document.createElement('div');
    cell.className='week-day-cell'+(isToday?' today':'');
    const status=log?.completed?'✅':(log&&!log.completed&&iso<today()?'😕':'');
    cell.innerHTML=`<div class="wdc-day">${labels[d.getDay()]}</div><div class="wdc-icon">${wo?.emoji??'—'}</div><div class="wdc-status">${status}</div>`;
    cell.onclick=()=>navigate('workout');
    strip.appendChild(cell);
  }
}

function calcStreak() {
  if (!STATE.plan || !STATE.startDate) return 0;
  let streak = 0, safetyLimit = 0;
  const d = new Date();
  while (safetyLimit++ < 365) {
    const iso = toISO(d), wo = getWorkoutForDate(iso), log = STATE.logs[iso];
    if (!wo || wo.type === 'rest') {
      d.setDate(d.getDate() - 1);
      if (streak === 0) continue; else break;
    }
    if (log?.completed) { streak++; d.setDate(d.getDate() - 1); }
    else if (iso === today()) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return streak;
}

// ══════════════════════════════════════
//  CALENDAR
// ══════════════════════════════════════

function renderCalendar() {
  if (!STATE.plan) { document.getElementById('calendar-grid').innerHTML='<p style="color:var(--muted);text-align:center;padding:40px">Carica prima una scheda nelle Impostazioni.</p>'; return; }
  const now=new Date(), year=STATE.plan.year??now.getFullYear();
  const monthMap={'Gennaio':0,'Febbraio':1,'Marzo':2,'Aprile':3,'Maggio':4,'Giugno':5,'Luglio':6,'Agosto':7,'Settembre':8,'Ottobre':9,'Novembre':10,'Dicembre':11};
  const month=monthMap[STATE.plan.month]??now.getMonth();
  document.getElementById('cal-month-title').textContent=`${STATE.plan.month??''} ${year}`;
  if (STATE.startDate) document.getElementById('start-date-input').value=STATE.startDate;
  const grid=document.getElementById('calendar-grid'); grid.innerHTML='';
  ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].forEach(d=>{ const h=document.createElement('div'); h.className='cal-header-cell'; h.textContent=d; grid.appendChild(h); });
  const firstDay=new Date(year,month,1), lastDay=new Date(year,month+1,0);
  const startDow=(firstDay.getDay()+6)%7;
  for (let i=0;i<startDow;i++) { const e=document.createElement('div'); e.className='cal-day empty'; grid.appendChild(e); }
  const todayStr=today();
  for (let day=1;day<=lastDay.getDate();day++) {
    const date=new Date(year,month,day), iso=toISO(date), wo=getWorkoutForDate(iso), log=STATE.logs[iso];
    const isToday=iso===todayStr, isPast=iso<todayStr;
    const cell=document.createElement('div');
    let cls='cal-day'+(isToday?' today':'')+(wo?` ${wo.type}`:'')+
            (isPast&&wo&&wo.type!=='rest'&&!log?.completed?' past-unlogged':'');
    cell.className=cls;
    let mood='';
    if (log?.completed) mood='<div class="cal-day-mood">😊</div>';
    else if (isPast&&wo&&wo.type!=='rest'&&wo.type!=='rest_active'&&!log?.completed) mood='<div class="cal-day-mood">😕</div>';
    cell.innerHTML=`<div class="cal-day-num">${day}</div>${wo?`<div class="cal-day-icon">${wo.emoji}</div>`:''}${mood}`;
    cell.title=wo?.label??'Riposo';
    cell.onclick=()=>{ if(wo) navigate('workout'); };
    grid.appendChild(cell);
  }
}

function applyStartDate() {
  const val=document.getElementById('start-date-input').value;
  if (!val) { showToast('Seleziona una data'); return; }
  STATE.startDate=val; saveState(); renderCalendar(); showToast('✅ Data di inizio impostata!');
}

// ══════════════════════════════════════
//  GCAL EXPORT
// ══════════════════════════════════════

function openGCalExport() { document.getElementById('gcal-modal').classList.remove('hidden'); }
function closeGcalModal(e) { if(!e||e.target===document.getElementById('gcal-modal')) document.getElementById('gcal-modal').classList.add('hidden'); }

function downloadICS() {
  if (!STATE.plan||!STATE.startDate) { showToast('Imposta prima la data di inizio'); return; }
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FitTrack//IT','CALSCALE:GREGORIAN','X-WR-CALNAME:FitTrack'];
  const start=fromISO(STATE.startDate);
  for (let i=0;i<35;i++) {
    const d=new Date(start); d.setDate(start.getDate()+i);
    const iso=toISO(d), wo=getWorkoutForDate(iso);
    if (!wo||wo.type==='rest') continue;
    const dt=iso.replace(/-/g,'');
    lines.push('BEGIN:VEVENT',`UID:ft-${iso}-${wo.sessionId??'x'}@app`,
      `DTSTART;VALUE=DATE:${dt}`,`DTEND;VALUE=DATE:${dt}`,`SUMMARY:${wo.emoji} ${wo.label}`,
      'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY',`DESCRIPTION:Reminder: ${wo.label}!`,'END:VALARM','END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/calendar'}));
  a.download='fittrack.ics'; a.click();
  showToast('📅 File .ics scaricato!');
}

// ══════════════════════════════════════
//  WORKOUT PAGE
// ══════════════════════════════════════

let CURRENT_SESSION=null;

function renderWorkoutPage() {
  const todayStr=today(), wo=getWorkoutForDate(todayStr), log=STATE.logs[todayStr];
  ['workout-detail-container'].forEach(id=>document.getElementById(id)?.classList.remove('hidden'));
  ['no-workout-today','cardio-detail-block','btn-start-companion','btn-mark-run','btn-mark-rest'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));

  if (!STATE.plan||!STATE.startDate) {
    document.getElementById('wi-name').textContent='Carica una scheda';
    document.getElementById('wi-meta').innerHTML='';
    document.getElementById('wi-focus').innerHTML='';
    document.getElementById('workout-exercise-list').innerHTML='<p style="color:var(--muted);font-size:14px">Vai in Impostazioni e carica la scheda mensile.</p>';
    return;
  }
  if (!wo) {
    document.getElementById('workout-detail-container').classList.add('hidden');
    document.getElementById('no-workout-today').classList.remove('hidden');
    return;
  }
  document.getElementById('workout-page-title').textContent=`${wo.emoji} ${wo.label}`;

  if (wo.type==='rest'||wo.type==='rest_active') {
    const badge=document.getElementById('wi-session-badge');
    badge.textContent=wo.emoji; badge.style.background='var(--rest2)';
    document.getElementById('wi-name').textContent=wo.label;
    document.getElementById('wi-meta').innerHTML='';
    document.getElementById('wi-focus').innerHTML='';
    document.getElementById('workout-exercise-list').innerHTML=`
      <div class="card" style="text-align:center;padding:32px">
        <div style="font-size:48px;margin-bottom:12px">${wo.emoji}</div>
        <p style="font-size:16px;font-weight:700;margin-bottom:8px">${wo.label}</p>
        <p style="color:var(--muted);font-size:14px">${wo.type==='rest_active'?'Camminata 30–40 min, stretching o yoga leggero.':'Riposo completo. Il recupero è parte dell\'allenamento.'}</p>
      </div>`;
    document.getElementById('btn-mark-rest').classList.remove('hidden');
    if (log?.completed) document.getElementById('btn-mark-rest').textContent='✅ Già segnato';
    return;
  }
  if (wo.type==='cardio') {
    const badge=document.getElementById('wi-session-badge');
    badge.textContent='🏃'; badge.style.background='var(--cardio)';
    document.getElementById('wi-name').textContent='Sessione di Corsa';
    const week=getWeekNumber(todayStr), ci=STATE.plan.cardioByWeek?.[week]??{};
    document.getElementById('wi-meta').innerHTML=`⏱ ${ci.durationMin??'?'} min &nbsp;·&nbsp; Settimana ${week}`;
    document.getElementById('wi-focus').innerHTML='';
    document.getElementById('workout-exercise-list').innerHTML='';
    document.getElementById('cardio-detail-block').classList.remove('hidden');
    document.getElementById('cardio-week-info').innerHTML=`<p style="font-size:16px;font-weight:700;margin-bottom:8px">${ci.structure??'—'}</p><p style="color:var(--muted);font-size:14px">${ci.notes??''}</p>`;
    document.getElementById('btn-mark-run').classList.remove('hidden');
    CURRENT_SESSION=null; return;
  }
  const session=STATE.plan.sessions?.[wo.sessionId];
  if (!session) return;
  CURRENT_SESSION=session;
  const badge=document.getElementById('wi-session-badge');
  badge.textContent=wo.sessionId; badge.style.background='var(--accent)';
  document.getElementById('wi-name').textContent=session.name;
  document.getElementById('wi-meta').innerHTML=`⏱ ${session.durationLabel} &nbsp;·&nbsp; ${session.exercises?.length??0} esercizi`;
  document.getElementById('wi-focus').innerHTML=(session.focus||[]).map(f=>`<span class="focus-tag">${f}</span>`).join('');
  document.getElementById('btn-start-companion').classList.remove('hidden');
  if (log?.completed) document.getElementById('btn-start-companion').textContent='🔄 Rifai sessione';
  const list=document.getElementById('workout-exercise-list'); list.innerHTML='';
  (session.exercises||[]).forEach((ex,i)=>{
    const row=document.createElement('div'); row.className=`ex-row ${ex.type}`;
    const b_=ex.sets?`${ex.sets}×${ex.reps}`:(ex.isTimer?formatTime(ex.duration):'');
    row.innerHTML=`<div class="ex-row-num">${String(i+1).padStart(2,'0')}</div><div class="ex-row-info"><div class="ex-row-name">${ex.name}</div><div class="ex-row-meta">${(ex.desc??'').substring(0,60)}…</div></div><div class="ex-row-badge">${b_} ${ex.rest?ex.rest+'s rec.':''}</div>`;
    row.onclick=()=>openExerciseDetail(ex.id);
    list.appendChild(row);
  });
}

function handleTodayCTA(){}
function openRunLog(){ navigate('run'); }

function markRestDone() {
  const d=today(); STATE.logs[d]={type:'rest',completed:true,date:d};
  saveState(); showToast('✅ Riposo segnato!'); renderWorkoutPage();
}

function formatTime(sec) { const m=Math.floor(sec/60),s=sec%60; return s?`${m}m${s}s`:`${m} min`; }

function openExerciseDetail(id) {
  navigate('exercises');
  setTimeout(()=>{ const el=document.getElementById(`ex-card-${id}`); if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('open');} }, 200);
}

// ══════════════════════════════════════
//  COMPANION
// ══════════════════════════════════════

let COMP={ session:null,exercises:[],exIdx:0,setIdx:0,restTimer:null,ttsEnabled:true,lang:'it-IT' };

function openCompanion() {
  if (!CURRENT_SESSION) return;
  COMP.session=CURRENT_SESSION; COMP.exercises=CURRENT_SESSION.exercises.filter(e=>e.name);
  COMP.exIdx=0; COMP.setIdx=0; COMP.ttsEnabled=STATE.prefs.tts!==false; COMP.lang=STATE.prefs.lang||'it-IT';
  document.getElementById('companion-overlay').classList.remove('hidden');
  document.body.style.overflow='hidden';
  showCompExercise();
}

function closeCompanion() {
  if(COMP.restTimer){clearInterval(COMP.restTimer);COMP.restTimer=null;}
  window.speechSynthesis?.cancel();
  document.getElementById('companion-overlay').classList.add('hidden');
  document.body.style.overflow='';
}

function showCompExercise() {
  ['comp-exercise-view'].forEach(id=>document.getElementById(id).classList.remove('hidden'));
  ['comp-rest-view','comp-done-view'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  const ex=COMP.exercises[COMP.exIdx];
  if (!ex) { showCompDone(); return; }
  const pct=Math.round((COMP.exIdx/COMP.exercises.length)*100);
  document.getElementById('comp-progress-text').textContent=`Esercizio ${COMP.exIdx+1} di ${COMP.exercises.length}`;
  document.getElementById('comp-progress-bar-fill').style.width=`${pct}%`;
  const phaseMap={warmup:'RISCALDAMENTO',cooldown:'DEFATICAMENTO',core:'CORE',cardio:'CARDIO'};
  document.getElementById('comp-phase-label').textContent=phaseMap[ex.type]??'IN CORSO';
  document.getElementById('comp-exercise-name').textContent=ex.name;
  const dotsEl=document.getElementById('comp-set-indicators'); dotsEl.innerHTML='';
  if (ex.sets) for(let i=0;i<ex.sets;i++){const d=document.createElement('div');d.className='set-dot'+(i<COMP.setIdx?' done':i===COMP.setIdx?' current':'');dotsEl.appendChild(d);}
  const rEl=document.getElementById('comp-reps-display');
  if(ex.isTimer&&ex.duration&&!ex.sets) rEl.textContent=formatTime(ex.duration);
  else if(ex.reps) rEl.textContent=`${ex.reps} rep${ex.sets?` · Serie ${COMP.setIdx+1}/${ex.sets}`:''}`;
  else rEl.textContent='';
  document.getElementById('comp-exercise-desc').textContent=ex.desc??'';
  const notesEl=document.getElementById('comp-notes-block');
  if(ex.notes){notesEl.textContent='💡 '+ex.notes;notesEl.classList.remove('hidden');}else notesEl.classList.add('hidden');
  const btn=document.getElementById('comp-main-btn');
  if(ex.isTimer&&ex.duration&&!ex.sets){btn.textContent='▶ INIZIA TIMER';btn.onclick=()=>startTimedExercise(ex);}
  else{btn.textContent=ex.sets?`✓  HO FINITO IL SET ${COMP.setIdx+1}`:'✓  FATTO';btn.onclick=companionAction;}
  speakExercise(ex);
}

function speakExercise(ex) {
  if(!COMP.ttsEnabled) return;
  let msg='';
  if(ex.type==='warmup') msg=`Riscaldamento. ${ex.desc?.split('.')[0]??''}.`;
  else if(ex.type==='cooldown') msg=`Defaticamento. ${ex.desc?.split('.')[0]??''}.`;
  else msg=`Esercizio: ${ex.name}${ex.sets?`. ${ex.sets} serie da ${ex.reps} ripetizioni`:''}. ${ex.notes?'Attenzione: '+ex.notes:''}`;
  speak(msg);
}

function startTimedExercise(ex) {
  const btn=document.getElementById('comp-main-btn');
  btn.textContent='⏸ IN CORSO…'; btn.onclick=null;
  let rem=ex.duration;
  document.getElementById('comp-reps-display').textContent=formatTime(rem);
  if(COMP.ttsEnabled) speak('Via!');
  const iv=setInterval(()=>{
    rem--; document.getElementById('comp-reps-display').textContent=formatTime(rem);
    if(rem<=0){clearInterval(iv);if(COMP.ttsEnabled)speak('Completato! Ottimo.');COMP.exIdx++;COMP.setIdx=0;setTimeout(showCompExercise,700);}
  },1000); COMP.restTimer=iv;
}

function companionAction() {
  const ex=COMP.exercises[COMP.exIdx]; if(!ex) return;
  if(COMP.ttsEnabled) speak('Ottimo!');
  COMP.setIdx++;
  if(ex.sets&&COMP.setIdx<ex.sets) showCompRest(ex.rest,ex,COMP.setIdx);
  else{COMP.setIdx=0;COMP.exIdx++;const next=COMP.exercises[COMP.exIdx];if(next){if(ex.rest)showCompRest(ex.rest,next,0,true);else showCompExercise();}else showCompDone();}
}

function companionSkip() {
  COMP.setIdx=0;COMP.exIdx++;
  if(COMP.restTimer){clearInterval(COMP.restTimer);COMP.restTimer=null;}
  window.speechSynthesis?.cancel(); showCompExercise();
}

function showCompRest(seconds,nextEx,nextSet,isNextEx=false) {
  ['comp-exercise-view'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  document.getElementById('comp-rest-view').classList.remove('hidden');
  document.getElementById('comp-next-exercise-preview').textContent=isNextEx?`Prossimo: ${nextEx?.name??'Fine'}`:`Prossima serie: ${COMP.exercises[COMP.exIdx]?.name??''}`;
  const circ=2*Math.PI*52; let rem=seconds;
  const arc=document.getElementById('comp-rest-arc'),cd=document.getElementById('comp-rest-countdown');
  arc.style.strokeDasharray=circ; arc.style.strokeDashoffset=0;
  if(COMP.ttsEnabled) speak(`Recupero: ${seconds} secondi.`);
  const iv=setInterval(()=>{
    rem--; cd.textContent=rem; arc.style.strokeDashoffset=((seconds-rem)/seconds)*circ;
    if(rem<=3&&rem>0&&COMP.ttsEnabled) speak(String(rem));
    if(rem<=0){clearInterval(iv);COMP.restTimer=null;if(COMP.ttsEnabled)speak('Via!');
      if(isNextEx){const idx=COMP.exercises.indexOf(nextEx);if(idx>=0)COMP.exIdx=idx;COMP.setIdx=0;}
      showCompExercise();}
  },1000); COMP.restTimer=iv; cd.textContent=rem;
}

function skipRest() {
  if(COMP.restTimer){clearInterval(COMP.restTimer);COMP.restTimer=null;}
  window.speechSynthesis?.cancel(); showCompExercise();
}

function showCompDone() {
  ['comp-exercise-view','comp-rest-view'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  document.getElementById('comp-done-view').classList.remove('hidden');
  document.getElementById('comp-progress-bar-fill').style.width='100%';
  document.getElementById('comp-progress-text').textContent='Sessione completata!';
  if(COMP.ttsEnabled) speak('Allenamento completato! Ottimo lavoro! Non dimenticare il defaticamento.');
}

function rateDifficulty(val) {
  const d=today();
  STATE.logs[d]={type:'strength',sessionId:COMP.session?.name??'',completed:true,difficulty:val,date:d,timestamp:new Date().toISOString()};
  saveState(); showToast('🎉 Sessione salvata! '+diffLabel(val));
  setTimeout(()=>{closeCompanion();renderDashboard();},1200);
}

function speak(text) {
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text); u.lang=COMP.lang||'it-IT'; u.rate=0.95; u.pitch=1.0;
  window.speechSynthesis.speak(u);
}

// ══════════════════════════════════════
//  EXERCISE LIBRARY
// ══════════════════════════════════════

let activeExFilter='all';

function renderExerciseLibrary() {
  const cats=[{id:'all',label:'Tutti'},{id:'strength',label:'Forza'},{id:'core',label:'Core'},
              {id:'cardio',label:'Cardio'},{id:'mobility',label:'Mobilità'},{id:'warmup',label:'Riscaldamento'},{id:'cooldown',label:'Defaticamento'}];
  document.getElementById('exercise-filter-tags').innerHTML=cats.map(c=>`<span class="filter-tag ${activeExFilter===c.id?'active':''}" onclick="setExFilter('${c.id}')">${c.label}</span>`).join('');
  renderExCards(document.getElementById('exercise-search').value);
}

function setExFilter(f){activeExFilter=f;renderExerciseLibrary();}
function filterExercises(q){renderExCards(q);}

function renderExCards(query='') {
  const c=document.getElementById('exercise-library'); c.innerHTML='';
  const q=query.toLowerCase();
  (window.EXERCISES_DB??[]).filter(ex=>(activeExFilter==='all'||ex.category===activeExFilter)&&(!q||ex.name.toLowerCase().includes(q)||(ex.muscles||[]).join(' ').toLowerCase().includes(q))).forEach(ex=>{
    const card=document.createElement('div'); card.className='ex-card'; card.id=`ex-card-${ex.id}`;
    const ytUrl=`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.ytQuery)}`;
    const stepsHTML=(ex.steps||[]).map((s,i)=>`<div class="ex-step"><span class="ex-step-num">${i+1}.</span><span>${s}</span></div>`).join('');
    const tagsHTML=(ex.muscles||[]).map(m=>`<span class="ex-tag">${m}</span>`).join('');
    card.innerHTML=`<div class="ex-card-header" onclick="toggleExCard('${ex.id}')"><div class="ex-card-emoji">${ex.emoji}</div><div class="ex-card-title"><div class="ex-card-name">${ex.name}</div><div class="ex-card-sub" style="color:var(--accent)">${'●'.repeat(ex.difficulty||1)+'○'.repeat(5-(ex.difficulty||1))}</div><div class="ex-card-tags">${tagsHTML}</div></div><span class="ex-chevron">▼</span></div><div class="ex-card-body"><p class="ex-desc">${ex.desc}</p><div class="ex-steps-title">COME SI ESEGUE</div>${stepsHTML}<div class="ex-tips"><div class="ex-tips-title">💡 CONSIGLI</div><p>${ex.tips}</p></div><a class="ex-yt-link" href="${ytUrl}" target="_blank" rel="noopener">▶ Guarda il tutorial su YouTube</a></div>`;
    c.appendChild(card);
  });
}

function toggleExCard(id){document.getElementById(`ex-card-${id}`)?.classList.toggle('open');}

// ══════════════════════════════════════
//  RUN PAGE
// ══════════════════════════════════════

function renderRunPage(){document.getElementById('run-date').value=today();renderRunStats();renderRunHistory();}

function saveRun() {
  const date=document.getElementById('run-date').value||today();
  const duration=parseFloat(document.getElementById('run-duration').value)||0;
  const km=parseFloat(document.getElementById('run-km').value)||0;
  const notes=document.getElementById('run-notes').value.trim();
  if(!duration&&!km){showToast('Inserisci almeno durata o distanza');return;}
  STATE.runs.push({date,duration,km,notes}); STATE.runs.sort((a,b)=>b.date.localeCompare(a.date));
  STATE.logs[date]={type:'cardio',sessionId:'run',completed:true,difficulty:null,date,km,duration};
  saveState(); showToast('🏃 Corsa salvata!');
  ['run-duration','run-km','run-notes'].forEach(id=>document.getElementById(id).value='');
  renderRunStats(); renderRunHistory();
}

function renderRunStats() {
  const runs=STATE.runs, totalKm=runs.reduce((a,r)=>a+(r.km||0),0);
  const avgKm=runs.length?totalKm/runs.length:0;
  const rwb=runs.filter(r=>r.km&&r.duration), avgPace=rwb.length?rwb.reduce((a,r)=>a+r.duration/r.km,0)/rwb.length:0;
  const paceStr=avgPace?`${Math.floor(avgPace)}:${String(Math.round((avgPace%1)*60)).padStart(2,'0')}/km`:'—';
  document.getElementById('run-stat-count').textContent=runs.length;
  document.getElementById('run-stat-km').textContent=totalKm.toFixed(1);
  document.getElementById('run-stat-avg-km').textContent=avgKm.toFixed(1);
  document.getElementById('run-stat-avg-pace').textContent=paceStr;
}

function renderRunHistory() {
  const hist=document.getElementById('run-history'); hist.innerHTML='';
  if(!STATE.runs.length){hist.innerHTML='<p style="color:var(--muted);font-size:14px">Nessuna corsa registrata ancora.</p>';return;}
  STATE.runs.slice(0,20).forEach((r,i)=>{
    const pace=r.km&&r.duration?`${Math.floor(r.duration/r.km)}:${String(Math.round(((r.duration/r.km)%1)*60)).padStart(2,'0')}/km`:'—';
    const item=document.createElement('div'); item.className='run-item';
    item.innerHTML=`<div class="run-item-date">${r.date.slice(5).replace('-','/')}</div><div class="run-item-stats"><div class="run-item-main">${r.km?r.km+' km':''} ${r.duration?r.duration+' min':''}</div><div class="run-item-sub">Passo ${pace}${r.notes?' · '+r.notes:''}</div></div><button class="run-item-del" onclick="deleteRun(${i})">🗑</button>`;
    hist.appendChild(item);
  });
}

function deleteRun(i){if(!confirm('Eliminare?'))return;STATE.runs.splice(i,1);saveState();renderRunHistory();renderRunStats();showToast('Corsa eliminata');}

// ══════════════════════════════════════
//  NUTRITION
// ══════════════════════════════════════

function renderNutritionPage(){
  document.getElementById('goal-protein').value=STATE.goals.protein;
  document.getElementById('goal-calories').value=STATE.goals.calories;
  renderFoodLog();renderNutritionHistory();renderProteinSources();
}

function getTodayNutrition(){const d=today();if(!STATE.nutrition[d])STATE.nutrition[d]={entries:[]};return STATE.nutrition[d];}

function addFoodEntry() {
  const name=document.getElementById('food-name').value.trim();
  const protein=parseFloat(document.getElementById('food-protein').value)||0;
  const cal=parseFloat(document.getElementById('food-calories').value)||0;
  const carbs=parseFloat(document.getElementById('food-carbs').value)||0;
  const fat=parseFloat(document.getElementById('food-fat').value)||0;
  if(!name&&!protein&&!cal){showToast('Inserisci almeno nome e proteine');return;}
  getTodayNutrition().entries.push({name,protein,calories:cal,carbs,fat});
  saveState();['food-name','food-protein','food-calories','food-carbs','food-fat'].forEach(id=>document.getElementById(id).value='');
  renderFoodLog();showToast('✅ Pasto aggiunto!');
}

function renderFoodLog() {
  const entries=getTodayNutrition().entries||[];
  const totProt=entries.reduce((a,e)=>a+(e.protein||0),0), totCal=entries.reduce((a,e)=>a+(e.calories||0),0);
  document.getElementById('protein-progress-label').textContent=`${Math.round(totProt)} / ${STATE.goals.protein} g`;
  document.getElementById('protein-bar').style.width=`${Math.min(100,Math.round((totProt/STATE.goals.protein)*100))}%`;
  document.getElementById('cal-progress-label').textContent=`${Math.round(totCal)} / ${STATE.goals.calories} kcal`;
  document.getElementById('cal-bar').style.width=`${Math.min(100,Math.round((totCal/STATE.goals.calories)*100))}%`;
  document.getElementById('food-log-list').innerHTML=!entries.length?'<p style="color:var(--muted);font-size:14px;margin-bottom:16px">Nessun pasto registrato oggi.</p>':entries.map((e,i)=>`<div class="food-item"><div class="food-item-name">${e.name||'Alimento'}</div><div class="food-macros">${e.protein?e.protein+'g prot':''} ${e.calories?'· '+e.calories+' kcal':''}</div><button class="food-del" onclick="deleteFoodEntry(${i})">✕</button></div>`).join('');
}

function deleteFoodEntry(i){getTodayNutrition().entries.splice(i,1);saveState();renderFoodLog();}

function renderNutritionHistory() {
  const hist=document.getElementById('nutrition-history');
  const days=Object.keys(STATE.nutrition).sort().reverse().slice(0,7);
  if(!days.length){hist.innerHTML='<p style="color:var(--muted);font-size:14px">Nessun dato ancora.</p>';return;}
  hist.innerHTML=days.map(d=>{
    const prot=Math.round((STATE.nutrition[d].entries||[]).reduce((a,e)=>a+(e.protein||0),0));
    return `<div class="nutrition-history-row"><span class="nh-date">${d.slice(5).replace('-','/')}</span><div class="nh-bar-wrap"><div class="progress-bar-bg" style="height:6px"><div class="progress-bar-fill protein-fill" style="width:${Math.min(100,Math.round((prot/STATE.goals.protein)*100))}%"></div></div></div><span class="nh-label">${prot}g</span></div>`;
  }).join('');
}

function renderProteinSources(){document.getElementById('protein-sources-grid').innerHTML=(window.PROTEIN_SOURCES??[]).map(s=>`<div class="ps-card"><div class="ps-name">${s.name}</div><div class="ps-prot">${s.prot}</div><div class="ps-note">${s.note}</div></div>`).join('');}

function saveGoals(){
  STATE.goals.protein=parseInt(document.getElementById('goal-protein').value)||100;
  STATE.goals.calories=parseInt(document.getElementById('goal-calories').value)||2300;
  saveState();renderFoodLog();showToast('🎯 Obiettivi salvati!');toggleGoalEditor();
}
function toggleGoalEditor(){document.getElementById('goal-editor').classList.toggle('hidden');}

// ══════════════════════════════════════
//  PROGRESS
// ══════════════════════════════════════

function renderProgressPage() {
  const allLogs=Object.entries(STATE.logs).sort((a,b)=>b[0].localeCompare(a[0]));
  const completed=allLogs.filter(([,l])=>l.completed);
  let planned=0;
  if(STATE.startDate&&STATE.plan){const start=fromISO(STATE.startDate),end=new Date();for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const wo=getWorkoutForDate(toISO(d));if(wo&&wo.type!=='rest')planned++;}}
  document.getElementById('prog-total').textContent=completed.length;
  document.getElementById('prog-streak').textContent=calcStreak();
  document.getElementById('prog-best-streak').textContent=calcBestStreak();
  document.getElementById('prog-completion').textContent=planned?`${Math.round((completed.length/planned)*100)}%`:'0%';
  const logEl=document.getElementById('workout-log-list');
  if(!completed.length){logEl.innerHTML='<p style="color:var(--muted);font-size:14px">Nessun allenamento completato ancora.</p>';return;}
  logEl.innerHTML=completed.slice(0,30).map(([date,l])=>{
    const diff=l.difficulty?`<span class="log-diff-badge diff-${l.difficulty}">${diffLabel(l.difficulty)}</span>`:'';
    return `<div class="log-item"><div class="log-item-date">${date.slice(5).replace('-','/')}</div><div class="log-item-name">${l.type==='cardio'?'🏃 Corsa':l.sessionId||l.type||'Allenamento'}</div>${diff}</div>`;
  }).join('');
}

function calcBestStreak(){
  if (!STATE.plan || !STATE.startDate) return 0;
  let best=0,cur=0;
  for(const d of Object.keys(STATE.logs).sort()){const log=STATE.logs[d],wo=getWorkoutForDate(d);if(!wo||wo.type==='rest'){best=Math.max(best,cur);cur=0;continue;}if(log?.completed)cur++;else{best=Math.max(best,cur);cur=0;}}
  return Math.max(best,cur);
}

function exportData() {
  const data={
    export_date:today(),period:STATE.plan?`${STATE.plan.month} ${STATE.plan.year}`:'—',
    sessions_completed:Object.values(STATE.logs).filter(l=>l.completed&&l.type!=='rest').length,
    streak:calcStreak(),best_streak:calcBestStreak(),
    workout_logs:Object.entries(STATE.logs).filter(([,l])=>l.completed).map(([date,l])=>({date,type:l.type,sessionId:l.sessionId,difficulty:l.difficulty??null})),
    run_logs:STATE.runs.map(r=>({date:r.date,duration_min:r.duration,km:r.km,notes:r.notes})),
    nutrition_summary:{days_logged:Object.keys(STATE.nutrition).length,avg_protein_g:(()=>{const days=Object.values(STATE.nutrition);if(!days.length)return 0;return Math.round(days.reduce((a,d)=>a+(d.entries||[]).reduce((s,e)=>s+(e.protein||0),0),0)/days.length);})()},
    goals:STATE.goals,
  };
  const json=JSON.stringify(data,null,2);
  navigator.clipboard?.writeText(json).then(()=>showToast('📋 Copiato negli appunti!')).catch(()=>showToast('Copia il testo qui sotto'));
  const el=document.getElementById('export-preview'); el.style.display='block'; el.textContent=json;
}

// ══════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════

function renderSettingsPage() {
  document.getElementById('active-plan-name').textContent=STATE.plan?`${STATE.plan.month??''} ${STATE.plan.year??''}`:'Nessuno';
  document.getElementById('pref-name').value=STATE.prefs.name??'';
  document.getElementById('pref-tts').checked=STATE.prefs.tts!==false;
  document.getElementById('pref-lang').value=STATE.prefs.lang??'it-IT';
  document.getElementById('pref-sheets').value=STATE.prefs.sheetsUrl??'';
  document.getElementById('sheets-test-result').textContent='';
  setSyncStatus(getSheetsUrl()?syncStatus:'idle');
}

function loadPlanFromJSON() {
  const raw=document.getElementById('plan-json-input').value.trim();
  if(!raw){showToast('Incolla il JSON prima');return;}
  try{const plan=JSON.parse(raw);if(!plan.weekSchedule||!plan.sessions)throw new Error();STATE.plan=plan;saveState();showToast('✅ Scheda caricata');renderSettingsPage();document.getElementById('plan-json-input').value='';}
  catch{showToast('❌ JSON non valido');}
}

function savePrefs() {
  STATE.prefs.name=document.getElementById('pref-name').value.trim();
  STATE.prefs.tts=document.getElementById('pref-tts').checked;
  STATE.prefs.lang=document.getElementById('pref-lang').value;
  STATE.prefs.sheetsUrl=document.getElementById('pref-sheets').value.trim();
  saveState();showToast('✅ Preferenze salvate!');
}

function clearAllData(){if(!confirm('Cancellare tutti i dati?'))return;localStorage.clear();location.reload();}

// ══════════════════════════════════════
//  BOOT
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Boot sincrono — la pagina è sempre visibile immediatamente
  try {
    loadState();
  } catch(e) {
    console.error('[筋トレ] loadState error:', e);
  }

  try {
    renderDashboard();
  } catch(e) {
    console.error('[筋トレ] renderDashboard error:', e);
  }

  const runDateEl = document.getElementById('run-date');
  if (runDateEl) runDateEl.value = today();

  // Sync con Sheets in background — non blocca mai il rendering
  setSyncStatus('syncing');
  setTimeout(() => {
    loadFromSheets()
      .then(synced => { if (synced) { try { renderDashboard(); } catch(e){} } })
      .catch(e => { setSyncStatus('error'); console.warn('[筋トレ] boot sync error:', e); });
  }, 300); // piccolo delay per far apparire la UI prima
});
