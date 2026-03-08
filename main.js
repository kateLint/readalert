import { io } from 'socket.io-client';
import './style.css';

const CONFIG = {
  SUMMARY_URL: '/api/stats/summary',
  HISTORY_URL: '/api/alerts',
  SHELTER_SEARCH_URL: '/api/shelter/search',
  CITIES_URL: '/api/cities'
};

const COLORS = {
  line: '#22d3ee',
  barGood: 'rgba(45, 212, 191, 0.75)',
  barRisk: 'rgba(251, 113, 133, 0.75)',
  text: '#dce9fb',
  grid: 'rgba(152, 180, 218, 0.24)'
};

const I18N = {
  en: {
    eyebrow: 'Real-time safety assistant',
    title: 'Nap Guard + Shelter Button',
    sub: 'Use RedAlert data to suggest nap windows and instantly find nearby shelters.',
    apiKeyLabel: 'API key (optional for production socket)',
    apiKeyPlaceholder: 'Paste your RedAlert API key',
    connectProd: 'Use Prod Socket',
    napDuration: 'Nap duration',
    napGuard: 'Nap guard',
    startNap: 'Start nap',
    stopNap: 'Stop',
    kpiRisk: 'Current risk score',
    kpiBestNap: 'Best nap start',
    kpiAlerts: 'Alerts last 24h',
    kpiPeak: 'Peak period',
    coachTitle: 'Smart Coach',
    coachSub: 'Useful advice with a funny personality',
    modeFunny: 'Funny',
    modeCalm: 'Calm',
    modeStrict: 'Sergeant',
    quickBestNap: 'Best nap plan',
    quickFindShelter: 'Nearest shelter now',
    quickCopyReport: 'Copy status report',
    readyTitle: 'Ready Check',
    readySub: 'Small actions, big improvement',
    checkWater: 'Water bottle near bed',
    checkPhone: 'Phone charged above 50%',
    checkShoes: 'Shoes and keys near door',
    chartNapTitle: 'Nap safety windows (next 12h)',
    chartNapSub: 'Click a bar to pick a start time',
    chartTimelineTitle: 'Recent alert timeline (last 7 days)',
    chartTimelineSub: 'Interactive zoom and hover',
    shelterTitle: 'Shelter Button',
    shelterSub: 'Nearest shelters from your location',
    findShelter: 'Find nearest shelters',
    wheelchairOnly: 'Wheelchair accessible only',
    feedTitle: 'Live alert feed',
    feedSub: 'Latest events from socket stream',
    feedConnecting: 'Live feed: connecting',
    feedDisconnected: 'Live feed: disconnected',
    feedConnectionError: 'Live feed: connection error',
    feedConnected: 'Live feed: production connected',
    feedNeedsKey: 'Live feed: waiting for API key',
    modeProd: 'production',
    noWindowSelected: 'No window selected yet.',
    selectedWindow: 'Selected: {time} | score {safety}% | risk {risk}%',
    safetyUnit: '{score}% safe',
    prepScore: 'Preparation score: {score}%',
    prepJokeLow: 'Tiny prep beats panic. Start with one checkbox.',
    prepJokeMid: 'Decent start. Keep stacking small wins.',
    prepJokeHigh: 'Solid setup. One more item and you are golden.',
    prepJokeMax: 'Elite status. Your future self says thank you.',
    coachFunnyLow: 'Funny mode: sky is behaving, pillow approved. Best snooze launch: {time}.',
    coachFunnyHigh: 'Funny mode: chaos vibes detected. Keep shoes ready and schedule nap for {time}.',
    coachCalmLow: 'Calm mode: low risk now. You can nap soon, best starts around {time}.',
    coachCalmHigh: 'Calm mode: risk is elevated. Keep essentials nearby and aim for {time}.',
    coachStrictLow: 'Sergeant: acceptable conditions. Execute short nap at {time}.',
    coachStrictHigh: 'Sergeant: no sloppy moves. Prep first, then reassess at {time}.',
    coachOffline: 'Live socket is offline right now.',
    napDone: 'Nap complete. Wake up champion.',
    napStarted: 'Nap guard started for {minutes} minutes.',
    wakeupFunny: 'Rise and shine, hero: {title}',
    wakeupCalm: 'Please wake up calmly: {title}',
    wakeupStrict: 'Wake up now: {title}',
    pasteApiKey: 'Paste API key to connect production socket.',
    geoUnsupported: 'Geolocation is not supported in this browser.',
    shelterGettingLocation: 'Getting your location...',
    shelterPressButton: 'Press the button to search.',
    shelterNoResults: 'No shelters found for this query.',
    shelterFound: 'Found {count} shelters nearby.',
    shelterFailed: 'Failed to search shelters.',
    shelterPermission: 'Location permission denied.',
    openMap: 'Open in map',
    unknownAddress: 'Unknown address',
    unknownType: 'unknown',
    statusCopied: 'Status report copied.',
    statusCopyFailed: 'Could not copy report on this browser.',
    bestNapStarts: 'Best nap starts at {time}.',
    noNapWindows: 'No nap windows yet.',
    couldNotLoadHistory: 'Could not load history from API proxy.',
    couldNotLoadSummary: 'Could not load summary stats from API proxy.'
  },
  he: {
    eyebrow: 'עוזר בטיחות בזמן אמת',
    title: 'Nap Guard + כפתור מקלט',
    sub: 'שימוש בנתוני RedAlert כדי להציע חלונות שינה ולמצוא מיד מקלטים קרובים.',
    apiKeyLabel: 'מפתח API (אופציונלי לסוקט פרודקשן)',
    apiKeyPlaceholder: 'הדביקו כאן מפתח RedAlert',
    connectProd: 'חיבור סוקט פרודקשן',
    napDuration: 'משך שנ"צ',
    napGuard: 'שומר שנ"צ',
    startNap: 'התחל שנ"צ',
    stopNap: 'עצור',
    kpiRisk: 'מדד סיכון נוכחי',
    kpiBestNap: 'זמן שנ"צ מומלץ',
    kpiAlerts: 'התראות ב-24 שעות',
    kpiPeak: 'שעת שיא',
    coachTitle: 'מאמן חכם',
    coachSub: 'המלצות שימושיות עם אופי מצחיק',
    modeFunny: 'מצחיק',
    modeCalm: 'רגוע',
    modeStrict: 'קשוח',
    quickBestNap: 'תוכנית שנ"צ טובה',
    quickFindShelter: 'מקלט קרוב עכשיו',
    quickCopyReport: 'העתקת דוח מצב',
    readyTitle: 'בדיקת מוכנות',
    readySub: 'צעדים קטנים, שיפור גדול',
    checkWater: 'בקבוק מים ליד המיטה',
    checkPhone: 'טלפון מעל 50% סוללה',
    checkShoes: 'נעליים ומפתחות ליד הדלת',
    chartNapTitle: 'חלונות שנ"צ בטוחים (12 שעות הקרובות)',
    chartNapSub: 'לחצו על עמודה כדי לבחור זמן התחלה',
    chartTimelineTitle: 'ציר התראות אחרונות (7 ימים)',
    chartTimelineSub: 'זום והובר אינטראקטיביים',
    shelterTitle: 'כפתור מקלט',
    shelterSub: 'מקלטים קרובים מהמיקום שלך',
    findShelter: 'חיפוש מקלטים קרובים',
    wheelchairOnly: 'נגיש לכיסא גלגלים בלבד',
    feedTitle: 'פיד התראות חי',
    feedSub: 'אירועים אחרונים מהסוקט',
    feedConnecting: 'פיד חי: מתחבר',
    feedDisconnected: 'פיד חי: מנותק',
    feedConnectionError: 'פיד חי: שגיאת חיבור',
    feedConnected: 'פיד חי: מחובר לפרודקשן',
    feedNeedsKey: 'פיד חי: ממתין למפתח API',
    modeProd: 'פרודקשן',
    noWindowSelected: 'עדיין לא נבחר חלון.',
    selectedWindow: 'נבחר: {time} | ציון {safety}% | סיכון {risk}%',
    safetyUnit: '{score}% בטוח',
    prepScore: 'ציון מוכנות: {score}%',
    prepJokeLow: 'הכנה קטנה עדיפה מפאניקה. התחילו בסימון אחד.',
    prepJokeMid: 'התחלה טובה. תמשיכו לצבור נקודות.',
    prepJokeHigh: 'מוכנות יפה. עוד סעיף ואתם מסודרים.',
    prepJokeMax: 'רמת עילית. הגרסה העתידית שלכם מודה לכם.',
    coachFunnyLow: 'מצב מצחיק: השמיים רגועים, הכרית מאושרת. זמן שנ"צ מומלץ: {time}.',
    coachFunnyHigh: 'מצב מצחיק: יש וייבים של בלגן. השאירו נעליים מוכנות ושנ"צ ב-{time}.',
    coachCalmLow: 'מצב רגוע: סיכון נמוך עכשיו. אפשר שנ"צ קצר, עדיף סביב {time}.',
    coachCalmHigh: 'מצב רגוע: הסיכון גבוה יותר. שמרו ציוד לידכם וכוונו ל-{time}.',
    coachStrictLow: 'מצב קשוח: תנאים סבירים. בצעו שנ"צ קצר ב-{time}.',
    coachStrictHigh: 'מצב קשוח: בלי טעויות. קודם מוכנות, ואז בדיקה מחדש ב-{time}.',
    coachOffline: 'הסוקט החי כרגע לא מחובר.',
    napDone: 'השנ"צ הסתיים. לקום אלופה.',
    napStarted: 'שומר שנ"צ הופעל ל-{minutes} דקות.',
    wakeupFunny: 'לקום וקדימה: {title}',
    wakeupCalm: 'נא לקום ברוגע: {title}',
    wakeupStrict: 'לקום עכשיו: {title}',
    pasteApiKey: 'יש להדביק מפתח API כדי להתחבר לפרודקשן.',
    geoUnsupported: 'המכשיר או הדפדפן לא תומך במיקום.',
    shelterGettingLocation: 'מאתר את המיקום שלך...',
    shelterPressButton: 'לחצו על הכפתור כדי להתחיל חיפוש.',
    shelterNoResults: 'לא נמצאו מקלטים לחיפוש הזה.',
    shelterFound: 'נמצאו {count} מקלטים קרובים.',
    shelterFailed: 'החיפוש נכשל.',
    shelterPermission: 'לא ניתנה הרשאת מיקום.',
    openMap: 'פתחו במפה',
    unknownAddress: 'כתובת לא ידועה',
    unknownType: 'לא ידוע',
    statusCopied: 'דוח המצב הועתק.',
    statusCopyFailed: 'לא ניתן להעתיק בדפדפן הזה.',
    bestNapStarts: 'זמן השנ"צ הטוב מתחיל ב-{time}.',
    noNapWindows: 'עדיין אין חלונות שנ"צ.',
    couldNotLoadHistory: 'לא הצלחנו לטעון היסטוריית התראות מהשרת המקומי.',
    couldNotLoadSummary: 'לא הצלחנו לטעון נתוני סיכום מהשרת המקומי.'
  }
};

const state = {
  lang: 'en',
  napDurationMinutes: 15,
  historyDates: [],
  hourlyRisk: new Array(24).fill(1),
  napWindows: [],
  coachMode: 'funny',
  selectedWindowIndex: null,
  napTimerId: null,
  napEndAt: null,
  sheltersFound: 0,
  cityStats: [],
  summarySnapshot: null,
  checklist: {
    water: false,
    phone: false,
    shoes: false
  },
  socket: null,
  liveConnected: false,
  charts: {
    napWindowChart: null,
    timelineChart: null
  }
};

const $ = (selector) => document.querySelector(selector);

const els = {
  langEnBtn: $('#lang-en-btn'),
  langHeBtn: $('#lang-he-btn'),
  livePill: $('#live-pill'),
  apiKeyInput: $('#api-key-input'),
  connectProdBtn: $('#connect-prod-btn'),
  napDurationRow: $('#nap-duration-row'),
  startNapBtn: $('#start-nap-btn'),
  stopNapBtn: $('#stop-nap-btn'),
  napTimer: $('#nap-timer'),
  riskScore: $('#risk-score'),
  bestNapTime: $('#best-nap-time'),
  alerts24h: $('#alerts-24h'),
  peakPeriod: $('#peak-period'),
  coachModeRow: $('#coach-mode-row'),
  coachLine: $('#coach-line'),
  quickBestNap: $('#quick-best-nap'),
  quickFindShelter: $('#quick-find-shelter'),
  quickCopyReport: $('#quick-copy-report'),
  checkWater: $('#check-water'),
  checkPhone: $('#check-phone'),
  checkShoes: $('#check-shoes'),
  prepFill: $('#prep-fill'),
  prepScore: $('#prep-score'),
  prepJoke: $('#prep-joke'),
  routeFrom: $('#route-from'),
  routeTo: $('#route-to'),
  routeMinutes: $('#route-minutes'),
  routeMode: $('#route-mode'),
  cityOptions: $('#city-options'),
  checkRouteBtn: $('#check-route-btn'),
  routeUseBestBtn: $('#route-use-best-btn'),
  routeVerdictCard: $('#route-verdict-card'),
  routeVerdictTitle: $('#route-verdict-title'),
  routeVerdictReason: $('#route-verdict-reason'),
  routeDetails: $('#route-details'),
  pickedWindow: $('#picked-window'),
  findShelterBtn: $('#find-shelter-btn'),
  wheelchairOnly: $('#wheelchair-only'),
  shelterStatus: $('#shelter-status'),
  shelterResults: $('#shelter-results'),
  liveFeedList: $('#live-feed-list'),
  toast: $('#toast')
};

function showToast(text) {
  els.toast.textContent = text;
  els.toast.classList.add('show');
  window.setTimeout(() => els.toast.classList.remove('show'), 3500);
}

function addFeedItem(text, isDanger = false) {
  const li = document.createElement('li');
  li.textContent = text;
  if (isDanger) li.style.borderColor = 'rgba(251, 113, 133, 0.6)';
  els.liveFeedList.prepend(li);
  while (els.liveFeedList.children.length > 20) {
    els.liveFeedList.removeChild(els.liveFeedList.lastElementChild);
  }
}

function parseDate(raw) {
  const candidate = raw?.timestamp ?? raw;
  const d = new Date(candidate);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatHour(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function t(key, vars = {}) {
  const dict = I18N[state.lang] || I18N.en;
  const template = dict[key] || I18N.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, token) => String(vars[token] ?? ''));
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function applyStaticTranslations() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'he' ? 'rtl' : 'ltr';

  setText('txt-eyebrow', t('eyebrow'));
  setText('txt-title', t('title'));
  setText('txt-sub', t('sub'));
  setText('txt-api-key-label', t('apiKeyLabel'));
  setText('txt-nap-duration', t('napDuration'));
  setText('txt-nap-guard', t('napGuard'));
  setText('txt-kpi-risk', t('kpiRisk'));
  setText('txt-kpi-best-nap', t('kpiBestNap'));
  setText('txt-kpi-alerts', t('kpiAlerts'));
  setText('txt-kpi-peak', t('kpiPeak'));
  setText('txt-coach-title', t('coachTitle'));
  setText('txt-coach-sub', t('coachSub'));
  setText('txt-ready-title', t('readyTitle'));
  setText('txt-ready-sub', t('readySub'));
  setText('txt-check-water', t('checkWater'));
  setText('txt-check-phone', t('checkPhone'));
  setText('txt-check-shoes', t('checkShoes'));
  setText('txt-chart-nap-title', t('chartNapTitle'));
  setText('txt-chart-nap-sub', t('chartNapSub'));
  setText('txt-chart-timeline-title', t('chartTimelineTitle'));
  setText('txt-chart-timeline-sub', t('chartTimelineSub'));
  setText('txt-shelter-title', t('shelterTitle'));
  setText('txt-shelter-sub', t('shelterSub'));
  setText('txt-wheelchair-only', t('wheelchairOnly'));
  setText('txt-feed-title', t('feedTitle'));
  setText('txt-feed-sub', t('feedSub'));

  els.apiKeyInput.placeholder = t('apiKeyPlaceholder');
  els.connectProdBtn.textContent = t('connectProd');
  els.startNapBtn.textContent = t('startNap');
  els.stopNapBtn.textContent = t('stopNap');
  els.quickBestNap.textContent = t('quickBestNap');
  els.quickFindShelter.textContent = t('quickFindShelter');
  els.quickCopyReport.textContent = t('quickCopyReport');
  els.findShelterBtn.textContent = t('findShelter');

  const modeButtons = els.coachModeRow.querySelectorAll('button[data-mode]');
  modeButtons.forEach((button) => {
    const mode = button.dataset.mode;
    if (mode === 'funny') button.textContent = t('modeFunny');
    if (mode === 'calm') button.textContent = t('modeCalm');
    if (mode === 'strict') button.textContent = t('modeStrict');
  });

  els.livePill.textContent = t('feedConnecting');
}

function loadLanguage() {
  if (!storageAvailable()) return;
  const saved = window.localStorage.getItem('nap_guard_lang');
  if (saved === 'he' || saved === 'en') {
    state.lang = saved;
  }
}

function saveLanguage() {
  if (!storageAvailable()) return;
  window.localStorage.setItem('nap_guard_lang', state.lang);
}

function syncLanguageButtons() {
  const isEnglish = state.lang === 'en';
  els.langEnBtn.classList.toggle('active', isEnglish);
  els.langEnBtn.classList.toggle('ghost', !isEnglish);
  els.langHeBtn.classList.toggle('active', !isEnglish);
  els.langHeBtn.classList.toggle('ghost', isEnglish);
}

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadChecklist() {
  if (!storageAvailable()) return;
  const raw = window.localStorage.getItem('nap_guard_checklist');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.checklist = {
      water: Boolean(parsed.water),
      phone: Boolean(parsed.phone),
      shoes: Boolean(parsed.shoes)
    };
  } catch (_error) {
    // Ignore malformed local storage payload.
  }
}

function saveChecklist() {
  if (!storageAvailable()) return;
  window.localStorage.setItem('nap_guard_checklist', JSON.stringify(state.checklist));
}

function loadSavedApiKey() {
  if (!storageAvailable()) return;
  const key = window.localStorage.getItem('nap_guard_api_key') || '';
  if (key) {
    els.apiKeyInput.value = key;
  }
}

function saveApiKey() {
  if (!storageAvailable()) return;
  const key = els.apiKeyInput.value.trim();
  if (key) {
    window.localStorage.setItem('nap_guard_api_key', key);
  } else {
    window.localStorage.removeItem('nap_guard_api_key');
  }
}

function updateBackgroundInteractivity() {
  document.addEventListener('pointermove', (event) => {
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    document.documentElement.style.setProperty('--x', `${x}%`);
    document.documentElement.style.setProperty('--y', `${y}%`);
  });
}

async function loadHistory() {
  const response = await fetch(CONFIG.HISTORY_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }
  const data = await response.json();
  state.historyDates = (Array.isArray(data) ? data : [])
    .map(parseDate)
    .filter(Boolean)
    .sort((a, b) => a - b);
}

function buildHourlyRiskFromHistory() {
  const counts = new Array(24).fill(0);
  for (const date of state.historyDates) {
    counts[date.getHours()] += 1;
  }
  const maxCount = Math.max(...counts, 1);
  state.hourlyRisk = counts.map((count) => Math.max(1, Math.round((count / maxCount) * 100)));
}

function computeNapWindows() {
  const now = new Date();
  const windows = [];

  for (let i = 0; i < 12; i += 1) {
    const start = new Date(now.getTime() + i * 60 * 60 * 1000);
    const slotCount = Math.max(1, Math.ceil(state.napDurationMinutes / 60));
    let total = 0;

    for (let slot = 0; slot < slotCount; slot += 1) {
      const h = (start.getHours() + slot) % 24;
      total += state.hourlyRisk[h];
    }

    const avgRisk = Math.round(total / slotCount);
    const safety = Math.max(1, 100 - avgRisk);
    windows.push({ start, avgRisk, safety });
  }

  state.napWindows = windows;
  const best = windows.reduce((acc, entry) => (entry.safety > acc.safety ? entry : acc), windows[0]);
  if (best) {
    els.bestNapTime.textContent = `${formatHour(best.start)} (${t('safetyUnit', { score: best.safety })})`;
  }
}

function currentRiskScore() {
  const hour = new Date().getHours();
  return state.hourlyRisk[hour] ?? 0;
}

function getBestWindow() {
  if (!state.napWindows.length) return null;
  return state.napWindows.reduce((acc, entry, idx) => {
    if (!acc || entry.safety > acc.entry.safety) return { entry, idx };
    return acc;
  }, null);
}

async function loadSummaryStats() {
  const response = await fetch(`${CONFIG.SUMMARY_URL}?include=timeline,peak&timelineGroup=day`);
  if (!response.ok) {
    throw new Error('Failed to fetch summary');
  }
  const summary = await response.json();
  state.summarySnapshot = summary;
  els.alerts24h.textContent = String(summary?.totals?.last24h ?? '--');
  els.peakPeriod.textContent = summary?.peak?.period ?? '--';
  return summary;
}

async function loadCityStats() {
  const response = await fetch(`${CONFIG.CITIES_URL}?limit=500`);
  if (!response.ok) {
    throw new Error('Failed to fetch city stats');
  }
  const data = await response.json();
  state.cityStats = Array.isArray(data) ? data : [];
  els.cityOptions.innerHTML = state.cityStats
    .map((entry) => `<option value="${entry.city}"></option>`)
    .join('');
}

function findCityRisk(cityName) {
  if (!cityName) return null;
  const found = state.cityStats.find((entry) => String(entry.city).trim() === cityName.trim());
  if (!found) return null;

  const max = Math.max(...state.cityStats.map((entry) => Number(entry.count) || 0), 1);
  const risk = Math.round(((Number(found.count) || 0) / max) * 100);
  return { risk, zone: found.cityZone || '--', count: Number(found.count) || 0 };
}

function verdictForScore(score) {
  if (score < 25) {
    return {
      label: 'Send it',
      joke: 'Low drama route. Deliver first, coffee after.',
      level: 'safe'
    };
  }
  if (score < 45) {
    return {
      label: 'Probably fine',
      joke: 'Could go either way. Keep coffee nearby.',
      level: 'safe'
    };
  }
  if (score < 65) {
    return {
      label: 'A bit spicy',
      joke: 'Not impossible. Not elegant.',
      level: 'warn'
    };
  }
  if (score < 82) {
    return {
      label: 'Bring coffee',
      joke: 'High chance this turns into a shelter handoff.',
      level: 'danger'
    };
  }
  return {
    label: 'Shelter date likely',
    joke: 'This is not a dropoff. This is an adventure.',
    level: 'danger'
  };
}

function runRouteCheck() {
  const from = els.routeFrom.value.trim();
  const to = els.routeTo.value.trim();
  const minutes = Math.max(1, Number(els.routeMinutes.value) || 20);
  const mode = els.routeMode.value;

  if (!from || !to) {
    showToast('Enter both origin and destination cities.');
    return;
  }

  const fromRisk = findCityRisk(from);
  const toRisk = findCityRisk(to);
  if (!fromRisk || !toRisk) {
    showToast('City not found in current RedAlert city stats. Try exact city names from suggestions.');
    return;
  }

  const modeFactor = {
    scooter: 1.15,
    bike: 1.1,
    car: 0.95,
    foot: 1.25
  }[mode] || 1;

  const durationFactor = 1 + Math.min(minutes, 120) / 180;
  const recentBoost = Math.min(30, Number(state.summarySnapshot?.totals?.last24h || 0) / 20);
  const base = (fromRisk.risk + toRisk.risk) / 2;
  const routeScore = Math.max(1, Math.min(99, Math.round(base * modeFactor * durationFactor * 0.7 + recentBoost * 0.3)));
  const verdict = verdictForScore(routeScore);

  els.routeVerdictCard.classList.remove('safe', 'warn', 'danger');
  els.routeVerdictCard.classList.add(verdict.level);
  els.routeVerdictTitle.textContent = `${verdict.label} (${routeScore}%)`;
  els.routeVerdictReason.textContent = verdict.joke;

  const lines = [
    `Route: ${from} -> ${to}`,
    `Trip estimate: ${minutes} min by ${mode}`,
    `Origin zone: ${fromRisk.zone} | Destination zone: ${toRisk.zone}`,
    `Recent alerts (24h): ${state.summarySnapshot?.totals?.last24h ?? '--'}`,
    'If alert now: hit "Nearest shelter now" for immediate fallback.'
  ];
  els.routeDetails.innerHTML = lines.map((line) => `<div>${line}</div>`).join('');
}

function createCharts(summaryTimeline = []) {
  Chart.defaults.color = COLORS.text;
  Chart.defaults.borderColor = COLORS.grid;
  Chart.defaults.font.family = "'Space Grotesk', sans-serif";

  const napCtx = $('#napWindowChart').getContext('2d');
  state.charts.napWindowChart = new Chart(napCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: t('chartNapTitle'),
        data: [],
        backgroundColor: []
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return t('safetyUnit', { score: context.raw });
            }
          }
        }
      },
      onClick(_event, elements) {
        if (!elements.length) return;
        state.selectedWindowIndex = elements[0].index;
        renderNapWindowSelection();
      },
      scales: {
        y: {
          min: 0,
          max: 100
        }
      }
    }
  });

  const timelineCtx = $('#timelineChart').getContext('2d');
  state.charts.timelineChart = new Chart(timelineCtx, {
    type: 'line',
    data: {
      labels: summaryTimeline.map((item) => item.period),
      datasets: [{
        label: t('feedTitle'),
        data: summaryTimeline.map((item) => item.count),
        borderColor: COLORS.line,
        backgroundColor: 'rgba(34, 211, 238, 0.18)',
        fill: true,
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { maxRotation: 0 }
        }
      }
    }
  });
}

function updateNapWindowChart() {
  if (!state.charts.napWindowChart) return;
  const labels = state.napWindows.map((entry) => formatHour(entry.start));
  const safetyValues = state.napWindows.map((entry) => entry.safety);
  const colors = state.napWindows.map((entry, idx) => {
    if (idx === state.selectedWindowIndex) return 'rgba(251, 146, 60, 0.9)';
    return entry.safety >= 60 ? COLORS.barGood : COLORS.barRisk;
  });

  state.charts.napWindowChart.data.labels = labels;
  state.charts.napWindowChart.data.datasets[0].data = safetyValues;
  state.charts.napWindowChart.data.datasets[0].backgroundColor = colors;
  state.charts.napWindowChart.update();
}

function refreshChartLanguage() {
  if (state.charts.napWindowChart) {
    state.charts.napWindowChart.data.datasets[0].label = t('chartNapTitle');
    state.charts.napWindowChart.update();
  }
  if (state.charts.timelineChart) {
    state.charts.timelineChart.data.datasets[0].label = t('feedTitle');
    state.charts.timelineChart.update();
  }
}

function renderNapWindowSelection() {
  if (state.selectedWindowIndex == null || !state.napWindows[state.selectedWindowIndex]) {
    els.pickedWindow.textContent = t('noWindowSelected');
    updateNapWindowChart();
    return;
  }
  const chosen = state.napWindows[state.selectedWindowIndex];
  els.pickedWindow.textContent = t('selectedWindow', {
    time: formatHour(chosen.start),
    safety: chosen.safety,
    risk: chosen.avgRisk
  });
  updateNapWindowChart();
}

function renderKpis() {
  els.riskScore.textContent = `${currentRiskScore()}%`;
}

function updateCoachLine() {
  const risk = currentRiskScore();
  const best = getBestWindow();
  const bestText = best ? formatHour(best.entry.start) : '--:--';
  let line = '';

  if (state.coachMode === 'calm') {
    line = risk < 40
      ? t('coachCalmLow', { time: bestText })
      : t('coachCalmHigh', { time: bestText });
  } else if (state.coachMode === 'strict') {
    line = risk < 40
      ? t('coachStrictLow', { time: bestText })
      : t('coachStrictHigh', { time: bestText });
  } else {
    line = risk < 40
      ? t('coachFunnyLow', { time: bestText })
      : t('coachFunnyHigh', { time: bestText });
  }

  if (!state.liveConnected) {
    line += ` ${t('coachOffline')}`;
  }

  els.coachLine.textContent = line;
}

function updatePrepUI() {
  const values = Object.values(state.checklist);
  const checked = values.filter(Boolean).length;
  const percent = Math.round((checked / values.length) * 100);

  els.checkWater.checked = state.checklist.water;
  els.checkPhone.checked = state.checklist.phone;
  els.checkShoes.checked = state.checklist.shoes;
  els.prepFill.style.width = `${percent}%`;
  els.prepScore.textContent = t('prepScore', { score: percent });

  if (percent === 100) {
    els.prepJoke.textContent = t('prepJokeMax');
  } else if (percent >= 67) {
    els.prepJoke.textContent = t('prepJokeHigh');
  } else if (percent >= 34) {
    els.prepJoke.textContent = t('prepJokeMid');
  } else {
    els.prepJoke.textContent = t('prepJokeLow');
  }
}

function beep(times = 2) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const audio = new Ctx();

  for (let i = 0; i < times; i += 1) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 800;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audio.destination);

    const start = audio.currentTime + i * 0.25;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.start(start);
    osc.stop(start + 0.2);
  }
}

function stopNapGuard() {
  if (state.napTimerId) {
    clearInterval(state.napTimerId);
    state.napTimerId = null;
  }
  state.napEndAt = null;
  els.napTimer.textContent = '00:00';
}

function startNapGuard() {
  stopNapGuard();
  const now = Date.now();
  state.napEndAt = now + state.napDurationMinutes * 60 * 1000;

  state.napTimerId = setInterval(() => {
    const remaining = Math.max(0, state.napEndAt - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    els.napTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (remaining === 0) {
      beep(3);
      showToast(t('napDone'));
      stopNapGuard();
    }
  }, 250);

  showToast(t('napStarted', { minutes: state.napDurationMinutes }));
}

function setLivePill(isConnected, text) {
  state.liveConnected = isConnected;
  els.livePill.textContent = text;
  els.livePill.style.borderColor = isConnected ? 'rgba(45, 212, 191, 0.35)' : 'rgba(251, 113, 133, 0.45)';
  els.livePill.style.color = isConnected ? '#b8ffef' : '#ffd4dd';
  updateCoachLine();
}

function handleIncomingAlerts(alertPayload) {
  const alerts = Array.isArray(alertPayload) ? alertPayload : [alertPayload];
  for (const alert of alerts) {
    const title = alert?.title || alert?.type || 'Alert';
    const cities = Array.isArray(alert?.cities) ? alert.cities.join(', ') : '';
    const line = `${new Date().toLocaleTimeString()} | ${title}${cities ? ` | ${cities}` : ''}`;

    addFeedItem(line, true);

    if (state.napTimerId) {
      beep(4);
      if (state.coachMode === 'strict') showToast(t('wakeupStrict', { title }));
      else if (state.coachMode === 'calm') showToast(t('wakeupCalm', { title }));
      else showToast(t('wakeupFunny', { title }));
    }
  }
}

function connectSocket() {
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }

  const socketUrl = 'https://redalert.orielhaim.com';
  const apiKey = els.apiKeyInput.value.trim();

  if (!apiKey) {
    setLivePill(false, t('feedNeedsKey'));
    showToast(t('pasteApiKey'));
    return;
  }

  saveApiKey();

  const options = { auth: { apiKey } };

  const socket = io(socketUrl, options);
  state.socket = socket;

  socket.on('connect', () => {
    setLivePill(true, t('feedConnected'));
    addFeedItem('Socket connected (production)');
  });

  socket.on('disconnect', () => {
    setLivePill(false, t('feedDisconnected'));
    addFeedItem('Socket disconnected');
  });

  socket.on('connect_error', (err) => {
    setLivePill(false, t('feedConnectionError'));
    addFeedItem(`Socket error: ${err.message}`);
  });

  socket.on('alert', handleIncomingAlerts);
  socket.on('missiles', handleIncomingAlerts);
  socket.on('earthQuake', handleIncomingAlerts);
  socket.on('endAlert', (alert) => {
    const title = alert?.title || 'End alert';
    addFeedItem(`${new Date().toLocaleTimeString()} | ${title}`);
  });
}

async function findShelters() {
  if (!navigator.geolocation) {
    showToast(t('geoUnsupported'));
    return;
  }

  els.shelterStatus.textContent = t('shelterGettingLocation');
  els.shelterResults.innerHTML = '';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const params = new URLSearchParams({
          lat: String(latitude),
          lon: String(longitude),
          limit: '6'
        });

        if (els.wheelchairOnly.checked) {
          params.set('wheelchairOnly', 'true');
        }

        const response = await fetch(`${CONFIG.SHELTER_SEARCH_URL}?${params.toString()}`);
        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];

        if (!results.length) {
          els.shelterStatus.textContent = t('shelterNoResults');
          state.sheltersFound = 0;
          updateCoachLine();
          return;
        }

        els.shelterStatus.textContent = t('shelterFound', { count: results.length });
        state.sheltersFound = results.length;
        updateCoachLine();
        els.shelterResults.innerHTML = results.map((item) => {
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.lat},${item.lon}`)}`;
          const meters = Math.round(Number(item.distance_meters || 0));
          const access = item.wheelchair_accessible ? 'wheelchair' : 'no-wheelchair';
          return `
            <article class="shelter-card">
              <strong>${item.city || ''} | ${item.address || t('unknownAddress')}</strong>
              <span class="shelter-meta">${meters}m away | ${item.shelter_type || t('unknownType')} | capacity: ${item.capacity ?? 'N/A'} | ${access}</span>
              <a href="${mapUrl}" target="_blank" rel="noreferrer">${t('openMap')}</a>
            </article>
          `;
        }).join('');
      } catch (_error) {
        els.shelterStatus.textContent = t('shelterFailed');
      }
    },
    () => {
      els.shelterStatus.textContent = t('shelterPermission');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function bindEvents() {
  els.apiKeyInput.addEventListener('change', saveApiKey);

  els.langEnBtn.addEventListener('click', () => {
    state.lang = 'en';
    saveLanguage();
    syncLanguageButtons();
    applyStaticTranslations();
    updateCoachLine();
    updatePrepUI();
    renderNapWindowSelection();
    computeNapWindows();
    refreshChartLanguage();
  });

  els.langHeBtn.addEventListener('click', () => {
    state.lang = 'he';
    saveLanguage();
    syncLanguageButtons();
    applyStaticTranslations();
    updateCoachLine();
    updatePrepUI();
    renderNapWindowSelection();
    computeNapWindows();
    refreshChartLanguage();
  });

  els.napDurationRow.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-min]');
    if (!button) return;

    els.napDurationRow.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.napDurationMinutes = Number(button.dataset.min);

    computeNapWindows();
    renderNapWindowSelection();
    renderKpis();
    updateCoachLine();
  });

  els.coachModeRow.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-mode]');
    if (!button) return;

    state.coachMode = button.dataset.mode;
    els.coachModeRow.querySelectorAll('button').forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('active', isActive);
      item.classList.toggle('ghost', !isActive);
    });
    updateCoachLine();
  });

  const onChecklistChange = () => {
    state.checklist.water = els.checkWater.checked;
    state.checklist.phone = els.checkPhone.checked;
    state.checklist.shoes = els.checkShoes.checked;
    saveChecklist();
    updatePrepUI();
    updateCoachLine();
  };

  els.checkWater.addEventListener('change', onChecklistChange);
  els.checkPhone.addEventListener('change', onChecklistChange);
  els.checkShoes.addEventListener('change', onChecklistChange);

  els.quickBestNap.addEventListener('click', () => {
    const best = getBestWindow();
    if (!best) {
      showToast(t('noNapWindows'));
      return;
    }
    state.selectedWindowIndex = best.idx;
    renderNapWindowSelection();
    if (best.idx === 0) {
      startNapGuard();
    } else {
      showToast(t('bestNapStarts', { time: formatHour(best.entry.start) }));
    }
  });

  els.quickFindShelter.addEventListener('click', findShelters);

  els.quickCopyReport.addEventListener('click', async () => {
    const best = getBestWindow();
    const summary = [
      `Risk: ${currentRiskScore()}%`,
      `Best nap: ${best ? formatHour(best.entry.start) : '--:--'}`,
      `Alerts 24h: ${els.alerts24h.textContent}`,
      `Shelters nearby: ${state.sheltersFound}`
    ].join(' | ');

    try {
      await navigator.clipboard.writeText(summary);
      showToast(t('statusCopied'));
    } catch (_error) {
      showToast(t('statusCopyFailed'));
    }
  });

  els.startNapBtn.addEventListener('click', startNapGuard);
  els.stopNapBtn.addEventListener('click', stopNapGuard);
  els.connectProdBtn.addEventListener('click', () => connectSocket());
  els.findShelterBtn.addEventListener('click', findShelters);
  els.checkRouteBtn.addEventListener('click', runRouteCheck);
  els.routeUseBestBtn.addEventListener('click', () => {
    const best = getBestWindow();
    if (!best) return;
    const suggestedDelay = Math.max(0, Math.round((best.entry.start.getTime() - Date.now()) / 60000));
    showToast(suggestedDelay > 0
      ? `Suggested wait: ${suggestedDelay} minutes before run.`
      : 'Best window is now.');
  });
}

async function init() {
  loadLanguage();
  syncLanguageButtons();
  applyStaticTranslations();
  updateBackgroundInteractivity();
  loadChecklist();
  loadSavedApiKey();
  bindEvents();

  try {
    await loadHistory();
    buildHourlyRiskFromHistory();
  } catch (_error) {
    addFeedItem(t('couldNotLoadHistory'));
  }

  try {
    await loadCityStats();
  } catch (_error) {
    addFeedItem('Could not load city statistics for route checker.');
  }

  let summary = null;
  try {
    summary = await loadSummaryStats();
  } catch (_error) {
    els.alerts24h.textContent = 'N/A';
    els.peakPeriod.textContent = 'N/A';
    addFeedItem(t('couldNotLoadSummary'));
  }

  computeNapWindows();
  createCharts(summary?.timeline || []);
  refreshChartLanguage();
  renderNapWindowSelection();
  renderKpis();
  updatePrepUI();
  updateCoachLine();
  els.shelterStatus.textContent = t('shelterPressButton');
  connectSocket();

  window.setInterval(() => {
    renderKpis();
  }, 20000);
}

init();
