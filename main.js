import './style.css';

const API = {
  cities: '/api/cities',
  cityStats: '/api/cities',
  summary: '/api/stats/summary'
};

const DIRECT_API_BASE = 'http://localhost:4000';

const FALLBACK_CITIES = [
  { city: 'Tel Aviv', region: 'Center', pressure: 36, shelterEtaMin: 3, recentAlertsMinAgo: 40 },
  { city: 'Ramat Gan', region: 'Center', pressure: 34, shelterEtaMin: 3, recentAlertsMinAgo: 45 },
  { city: 'Holon', region: 'Center', pressure: 33, shelterEtaMin: 4, recentAlertsMinAgo: 52 },
  { city: 'Petah Tikva', region: 'Center', pressure: 31, shelterEtaMin: 4, recentAlertsMinAgo: 56 },
  { city: 'Jerusalem', region: 'Jerusalem', pressure: 28, shelterEtaMin: 5, recentAlertsMinAgo: 70 },
  { city: 'Haifa', region: 'North', pressure: 22, shelterEtaMin: 6, recentAlertsMinAgo: 92 },
  { city: 'Ashdod', region: 'South', pressure: 49, shelterEtaMin: 3, recentAlertsMinAgo: 25 },
  { city: 'Ashkelon', region: 'South', pressure: 58, shelterEtaMin: 2, recentAlertsMinAgo: 18 },
  { city: 'Beer Sheva', region: 'South', pressure: 41, shelterEtaMin: 4, recentAlertsMinAgo: 37 },
  { city: 'Netanya', region: 'Sharon', pressure: 27, shelterEtaMin: 5, recentAlertsMinAgo: 80 },
  { city: 'Herzliya', region: 'Sharon', pressure: 24, shelterEtaMin: 4, recentAlertsMinAgo: 98 },
  { city: 'Rehovot', region: 'Center', pressure: 30, shelterEtaMin: 4, recentAlertsMinAgo: 68 },
  { city: 'Bat Yam', region: 'Center', pressure: 39, shelterEtaMin: 3, recentAlertsMinAgo: 35 },
  { city: 'Bnei Brak', region: 'Center', pressure: 37, shelterEtaMin: 3, recentAlertsMinAgo: 42 },
  { city: 'Lod', region: 'Center', pressure: 44, shelterEtaMin: 3, recentAlertsMinAgo: 31 },
  { city: 'Modiin', region: 'Center', pressure: 25, shelterEtaMin: 5, recentAlertsMinAgo: 89 }
];

/** Shelter Search Logic **/
/** Shelter Search Logic **/
function renderShelterResults(results) {
  console.log('Rendering shelter results:', results?.length);
  const resultsDiv = document.getElementById('shelter-results');
  if (!resultsDiv) return;

  if (!results || results.length === 0) {
    resultsDiv.innerHTML = `<p class="subtle">${t('shelterNone')}</p>`;
    return;
  }

  resultsDiv.innerHTML = results.map(s => `
    <div class="shelter-item">
      <div class="shelter-item-header">
        <span class="shelter-address">${s.address || s.building_name || 'אדרס לא ידוע'}</span>
        <span class="shelter-dist">${s.distance_km ? s.distance_km.toFixed(2) + ' km' : (s.distance_meters || 0) + ' m'}</span>
      </div>
      <div class="shelter-details">${s.city} ${s.building_name ? ' - ' + s.building_name : ''}</div>
      <div class="shelter-tags">
        ${s.is_official ? `<span class="tag official">${t('shelterOfficial')}</span>` : ''}
        ${s.wheelchair_accessible ? `<span class="tag access">${t('shelterAccessible')}</span>` : ''}
        <span class="tag">${s.shelter_type_he || s.shelter_type}</span>
      </div>
    </div>
  `).join('');
}

async function performShelterSearch(params) {
  const resultsDiv = document.getElementById('shelter-results');
  if (!resultsDiv) return;

  resultsDiv.innerHTML = `<p class="subtle">${t('shelterLoading')}</p>`;

  const query = new URLSearchParams(params).toString();
  try {
    const data = await fetchJsonWithFallback(`/api/shelter/search?${query}`);
    const results = Array.isArray(data) ? data : (data && data.results) ? data.results : [];
    renderShelterResults(results);
  } catch (err) {
    console.error('Shelter search failed', err);
    if (typeof renderShelterResults === 'function') {
      renderShelterResults([]);
    }
  }
}

const VERDICTS = [
  {
    key: 'send',
    min: 0,
    max: 24,
    icon: '>>',
    stateClass: 'state-safe'
  },
  {
    key: 'fine',
    min: 25,
    max: 44,
    icon: '~',
    stateClass: 'state-safe'
  },
  {
    key: 'spicy',
    min: 45,
    max: 64,
    icon: '!',
    stateClass: 'state-caution'
  },
  {
    key: 'coffee',
    min: 65,
    max: 81,
    icon: 'C',
    stateClass: 'state-risk'
  },
  {
    key: 'shelter',
    min: 82,
    max: 100,
    icon: '#',
    stateClass: 'state-alert'
  }
];

const state = {
  lang: 'he',
  from: '',
  to: '',
  durationMin: 25,
  mode: 'foot',
  allCities: [],
  liveDataReady: false,
  lastResult: null,
  globalRecent24h: 18,
  timelineBuckets: new Array(24).fill(0),
  timelineSelectedIndex: 23,
  timelineRangeHours: 24,
  map: null,
  mapMarkers: []
};

let toastTimerId = null;

const els = {
  langEn: document.querySelector('#lang-en'),
  langHe: document.querySelector('#lang-he'),
  fromInput: document.querySelector('#from-city'),
  toInput: document.querySelector('#to-city'),
  fromSuggestions: document.querySelector('#from-suggestions'),
  toSuggestions: document.querySelector('#to-suggestions'),
  durationTabs: document.querySelector('#duration-tabs'),
  modeButtons: document.querySelector('#mode-buttons'),
  goBtn: document.querySelector('#go-btn'),
  verdictCard: document.querySelector('#verdict-card'),
  statusPill: document.querySelector('#status-pill'),
  verdictIcon: document.querySelector('#verdict-icon'),
  verdictTitle: document.querySelector('#verdict-title'),
  verdictSubtitle: document.querySelector('#verdict-subtitle'),
  punchline: document.querySelector('#punchline'),
  routeScore: document.querySelector('#route-score'),
  stressMeter: document.querySelector('#stress-meter'),
  routeMeta: document.querySelector('#route-meta'),
  originPressure: document.querySelector('#origin-pressure'),
  recentWindow: document.querySelector('#recent-window'),
  shelterSpeed: document.querySelector('#shelter-speed'),
  verdictMap: document.querySelector('#verdict-map'),
  shareBtn: document.querySelector('#share-btn'),
  saveBtn: document.querySelector('#save-btn'),
  shareVerdict: document.querySelector('#share-verdict'),
  shareRoute: document.querySelector('#share-route'),
  sharePunchline: document.querySelector('#share-punchline'),
  toast: document.querySelector('#toast'),
  timelineZoom: document.querySelector('#timeline-zoom'),
  coffeeIndicator: document.querySelector('#coffee-indicator')
};

const I18N = {
  en: {
    appName: 'Bring Coffee?',
    heroLabel: 'Live Departure Check',
    heroDesc: 'Type origin and destination, then get one clear answer: go now or wait.',
    purposeLine: 'Goal: decide in seconds if leaving now is smart.',
    feature1: '1. Choose origin and destination',
    feature2: '2. Choose duration and travel mode',
    feature3: '3. Get a clear decision',
    feature4: '',
    routeTitle: 'Should I leave now?',
    routeSubtitle: 'Simple input, clear decision.',
    fromLabel: 'From city',
    toLabel: 'To city',
    durationLabel: 'Trip duration',
    modeLabel: 'Travel mode',
    modeFoot: 'Foot',
    modeBike: 'Bike',
    modeScooter: 'Scooter',
    modeCar: 'Car',
    goBtn: 'Should I go?',
    contextTitle: 'Quick context',
    originPressureLabel: 'Max city pressure',
    recentWindowLabel: 'Recent alert window',
    shelterSpeedLabel: 'Shelter reach speed',
    routeScoreLabel: 'Route score',
    stressMeterLabel: 'Stress meter',
    shareBtn: 'Share',
    saveBtn: 'Save',
    originShelterTitle: 'Pickup side shelter',
    destinationShelterTitle: 'Dropoff side shelter',
    timelineTitle: 'Alert Timeline',
    timelineSubtitle: 'Last 24 hours, by hour',
    timelineTotalFmt: 'Total: {count}',
    timelinePeakFmt: 'Peak hour: {hour}',
    timelineNowFmt: 'Now: {count}',
    timelineNowAtFmt: 'Now: {time}',
    timelineDetailFmt: '{hour} • {count} alerts',
    shareSmall: 'Bring Coffee?',
    fromPlaceholder: 'Tel Aviv',
    toPlaceholder: 'Ramat Gan',
    verdictPending: 'Verdict pending',
    initialVerdictTitle: 'Pick route details and press the button',
    initialVerdictSubtitle: 'Answer first. Logic second.',
    initialPunchline: 'No bunker networking expected. Yet.',
    initialMeta: 'Route metadata appears here.',
    initialShelter: 'Nearest shelter details will appear after verdict.',
    initialShareRoute: 'Tel Aviv -> Ramat Gan • 20m by scooter',
    initialShareVerdict: 'Probably fine',
    initialSharePunchline: 'Coffee is optional, confidence is not.',
    liveDataRequired: 'Live data is required. Start the API server and verify your API key.',
    liveDataLoaded: 'Live data connected successfully.',
    liveNoSummary: 'Live data connected (summary stats are temporarily unavailable).',
    runCheckFirstShare: 'Run a route check first, then share it.',
    runCheckFirstSave: 'Run a route check first, then save.',
    shareCopied: 'Share text copied to clipboard.',
    shareCopyFail: 'Could not copy share text on this browser.',
    saved: 'Route saved locally.',
    missingCities: 'Pick both origin and destination cities first.',
    unknownCities: 'Use a city from autocomplete so the score can be trusted.',
    routeMetaFmt: '{from} -> {to} | {duration}m by {mode} | city-level model',
    recentAgoFmt: '{minutes}m ago',
    shelterAvgFmt: '{minutes}m avg',
    shelterLineFmt: '{side}: nearest shelter around {eta}m away by foot. {rate}. Last local spike ~{minutes}m ago.',
    sidePickup: 'Pickup',
    sideDropoff: 'Dropoff',
    lowLocal: 'Low local disruption',
    moderateLocal: 'Moderate local disruption',
    highLocal: 'High local disruption',
    verdicts: {
      send: {
        label: 'Send it',
        subtitle: 'Low pressure and low disruption likelihood.',
        punchlines: ['No bunker networking expected.', 'Coffee is optional, confidence is not.']
      },
      fine: {
        label: 'Probably fine',
        subtitle: 'Generally acceptable with mild caution.',
        punchlines: ['Feels like a normal errand with backup plans.', 'Slight uncertainty, still commuter-coded.']
      },
      spicy: {
        label: 'A bit spicy',
        subtitle: 'Moderate uncertainty. Could get inconvenient.',
        punchlines: ['This one could develop a plot.', 'Not doomed, just dramatic.']
      },
      coffee: {
        label: 'Bring coffee',
        subtitle: 'Elevated interruption risk. Mentally prepare.',
        punchlines: ['Less quick errand, more character-building episode.', 'Bring coffee and lower expectations.']
      },
      shelter: {
        label: 'Shelter vibes',
        subtitle: 'High route pressure. Reconsider timing.',
        punchlines: ['This trip has shared-shelter small-talk energy.', 'You are not late. You are strategic.']
      }
    },
    shelterSearchTitle: 'Nearby Shelters',
    shelterSearchPlaceholder: 'Search by city...',
    searchBtn: 'Search',
    nearMeBtn: 'Near Me',
    shelterEmptyMsg: 'Search for a city or use your location to find shelters.',
    shelterLoading: 'Searching for shelters...',
    shelterNone: 'No shelters found in this area.',
    shelterOfficial: 'Official',
    shelterAccessible: 'Accessible',
    leaderboardTitle: 'Top Targeted Cities (24h)',
    leaderboardCount: '{count} alerts',
    routeStatsTitle: 'City Alert Stats',
    thCity: 'City',
    th24h: '24h',
    thWar: 'War Total',
    statsError: 'Failed to load statistics',
    statsNoData: 'No data available'
  },
  he: {
    appName: 'להביא קפה?',
    heroLabel: 'בדיקת יציאה בזמן אמת',
    heroDesc: 'מזינים מוצא ויעד ומקבלים תשובה אחת ברורה: לצאת עכשיו או לחכות.',
    purposeLine: 'מטרה: להבין תוך שניות אם כדאי לצאת עכשיו.',
    feature1: '1. בוחרים מוצא ויעד',
    feature2: '2. בוחרים זמן ואמצעי',
    feature3: '3. מקבלים החלטה ברורה',
    feature4: '',
    routeTitle: 'כדאי לצאת עכשיו?',
    routeSubtitle: 'כמה שדות, תשובה ברורה.',
    fromLabel: 'מעיר',
    toLabel: 'אל עיר',
    durationLabel: 'סוג נסיעה',
    durShort: 'קצרה',
    durStandard: 'רגילה',
    durLong: 'ארוכה',
    modeLabel: 'אמצעי נסיעה',
    modeFoot: 'רגלי',
    modeBike: 'אופניים',
    modeScooter: 'קורקינט',
    modeCar: 'רכב',
    goBtn: 'לצאת?',
    contextTitle: 'הקשר מהיר',
    originPressureLabel: 'לחץ עיר מירבי',
    recentWindowLabel: 'חלון התרעה אחרון',
    shelterSpeedLabel: 'מהירות הגעה למקלט',
    routeScoreLabel: 'ציון מסלול',
    stressMeterLabel: 'מד לחץ',
    shareBtn: 'שיתוף',
    saveBtn: 'שמירה',
    originShelterTitle: 'מקלט בצד היציאה',
    destinationShelterTitle: 'מקלט בצד היעד',
    timelineTitle: 'ציר התרעות',
    timelineSubtitle: 'התפתחות לפי שעה',
    timelineTotalFmt: 'סה״כ: {count}',
    timelinePeakFmt: 'שעת שיא: {hour}',
    timelineNowFmt: 'עכשיו: {count}',
    timelineNowAtFmt: 'עכשיו: {time}',
    timelineDetailFmt: '{hour} • {count} התרעות',
    shareSmall: 'להביא קפה?',
    fromPlaceholder: 'תל אביב',
    toPlaceholder: 'רמת גן',
    verdictPending: 'ממתין לפסק',
    initialVerdictTitle: 'בחרו מסלול ולחצו על הכפתור',
    initialVerdictSubtitle: 'תשובה קודם, הסבר אחר כך.',
    initialPunchline: 'כרגע לא צפוי מינגלינג במקלט.',
    initialMeta: 'פרטי המסלול יופיעו כאן.',
    initialShelter: 'פרטי מקלט קרוב יופיעו אחרי חישוב.',
    initialShareRoute: 'תל אביב -> רמת גן • 20 דק׳ בקורקינט',
    initialShareVerdict: 'כנראה סבבה',
    initialSharePunchline: 'קפה אופציונלי, ביטחון לא.',
    liveDataRequired: 'נדרש מידע חי. הפעילו את שרת ה-API ובדקו את מפתח ה-API.',
    liveDataLoaded: 'התחברות למידע חי הצליחה.',
    liveNoSummary: 'מידע חי זמין (נתוני סיכום זמנית לא זמינים).',
    runCheckFirstShare: 'קודם הריצו בדיקת מסלול ואז שתפו.',
    runCheckFirstSave: 'קודם הריצו בדיקת מסלול ואז שמרו.',
    shareCopied: 'טקסט השיתוף הועתק ללוח.',
    shareCopyFail: 'לא ניתן להעתיק בדפדפן הזה.',
    saved: 'המסלול נשמר מקומית.',
    missingCities: 'בחרו גם מוצא וגם יעד.',
    unknownCities: 'בחרו עיר מתוך ההשלמה כדי לקבל ציון אמין.',
    routeMetaFmt: '{from} -> {to} | {mode} | מודל ברמת עיר',
    recentAgoFmt: 'לפני {minutes} דק׳',
    shelterAvgFmt: 'ממוצע {minutes} דק׳',
    shelterLineFmt: '{side}: מקלט קרוב במרחק כ-{eta} דק׳. {rate}. התרעה אחרונה לפני כ-{minutes} דק׳.',
    sidePickup: 'יציאה',
    sideDropoff: 'יעד',
    lowLocal: 'שיבוש מקומי נמוך',
    moderateLocal: 'שיבוש מקומי בינוני',
    highLocal: 'שיבוש מקומי גבוה',
    highLocal: 'שיבוש מקומי גבוה',
    shelterSearchTitle: 'חיפוש מקלטים קרובים',
    shelterSearchPlaceholder: 'חפש לפי עיר...',
    searchBtn: 'חפש',
    nearMeBtn: 'קרוב אליי',
    shelterEmptyMsg: 'חפש עיר או השתמש במיקום שלך כדי למצוא מקלטים בסביבה.',
    shelterLoading: 'מחפש מקלטים...',
    shelterNone: 'לא נמצאו מקלטים באזור זה.',
    shelterOfficial: 'רשמי',
    shelterAccessible: 'נגיש',
    leaderboardTitle: 'הערים המטווחות ביותר (24 שעות)',
    routeStatsTitle: 'נתוני התרעות לעיר',
    thCity: 'עיר',
    th24h: '24 שעות',
    thWar: 'מלחמה',
    statsError: 'כישלון בטעינת סטטיסטיקה',
    statsNoData: 'אין נתונים זמינים',
    leaderboardCount: '{count} התרעות',
    loading: 'טוען...',
    verdicts: {
      send: {
        label: 'יאללה צאו',
        subtitle: 'לחץ נמוך וסיכוי נמוך לשיבוש.',
        punchlines: ['לא צפוי נטוורקינג במקלט.', 'קפה אופציונלי, ביטחון לא.']
      },
      fine: {
        label: 'כנראה סבבה',
        subtitle: 'בסך הכל תקין, עם מעט זהירות.',
        punchlines: ['מרגיש כמו סידור רגיל עם תוכנית גיבוי.', 'יש קצת אי ודאות, אבל לגמרי עירוני.']
      },
      spicy: {
        label: 'קצת פיקנטי',
        subtitle: 'אי ודאות בינונית. עלול להיות לא נוח.',
        punchlines: ['למסלול הזה יש פוטנציאל לעלילה.', 'לא אבוד, פשוט דרמטי.']
      },
      coffee: {
        label: 'תביאו קפה',
        subtitle: 'סיכון גבוה יותר לשיבוש. תתכוננו מנטלית.',
        punchlines: ['פחות שליחות מהירה, יותר פרק מתפתח.', 'קחו קפה והנמיכו ציפיות.']
      },
      shelter: {
        label: 'וייבים של מקלט',
        subtitle: 'לחץ מסלול גבוה. עדיף לשקול תזמון מחדש.',
        punchlines: ['לנסיעה הזו יש אנרגיה של שיחת מסדרון במקלט.', 'אתם לא מאחרים, אתם אסטרטגיים.']
      }
    }
  }
};

function t(key, params = {}) {
  const template = I18N[state.lang][key] ?? I18N.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`));
}

function formatTpl(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, token) => String(vars[token] ?? ''));
}

function getVerdictCopy(verdictKey) {
  return I18N[state.lang].verdicts[verdictKey] || I18N.en.verdicts[verdictKey];
}

function getSelectedModeLabel() {
  const modeMap = {
    foot: t('modeFoot'),
    bike: t('modeBike'),
    scooter: t('modeScooter'),
    car: t('modeCar')
  };
  return modeMap[state.mode] || state.mode;
}

function applyLanguageUI() {
  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'he' ? 'rtl' : 'ltr';

  els.langEn.classList.toggle('active', state.lang === 'en');
  els.langHe.classList.toggle('active', state.lang === 'he');

  set('app-name', t('appName'));
  set('hero-label', t('heroLabel'));
  set('hero-desc', t('heroDesc'));
  set('purpose-line', t('purposeLine'));
  set('feature-1', t('feature1'));
  set('feature-2', t('feature2'));
  set('feature-3', t('feature3'));
  set('feature-4', t('feature4'));
  set('route-title', t('routeTitle'));
  set('route-subtitle', t('routeSubtitle'));
  set('from-label', t('fromLabel'));
  set('to-label', t('toLabel'));
  set('duration-label', t('durationLabel'));
  set('mode-label', t('modeLabel'));
  set('mode-foot', t('modeFoot'));
  set('mode-bike', t('modeBike'));
  set('mode-scooter', t('modeScooter'));
  set('mode-car', t('modeCar'));
  set('go-btn', t('goBtn'));
  set('context-title', t('contextTitle'));
  set('origin-pressure-label', t('originPressureLabel'));
  set('recent-window-label', t('recentWindowLabel'));
  set('shelter-speed-label', t('shelterSpeedLabel'));
  set('route-score-label', t('routeScoreLabel'));
  set('stress-meter-label', t('stressMeterLabel'));
  set('share-btn', t('shareBtn'));
  set('save-btn', t('saveBtn'));
  set('origin-shelter-title', t('originShelterTitle'));
  set('destination-shelter-title', t('destinationShelterTitle'));
  set('timeline-title', t('timelineTitle'));
  set('timeline-subtitle', t('timelineSubtitle'));
  set('share-small', t('shareSmall'));

  // Keep Hebrew hint text on startup; language can still be switched later.
  els.fromInput.placeholder = state.lang === 'he' ? I18N.he.fromPlaceholder : t('fromPlaceholder');
  els.toInput.placeholder = state.lang === 'he' ? I18N.he.toPlaceholder : t('toPlaceholder');

  if (!state.lastResult) {
    set('status-pill', t('verdictPending'));
    set('verdict-title', t('initialVerdictTitle'));
    set('verdict-subtitle', t('initialVerdictSubtitle'));
    set('punchline', t('initialPunchline'));
    set('route-meta', t('initialMeta'));
    set('origin-shelter', t('initialShelter'));
    set('destination-shelter', t('initialShelter'));
    set('share-verdict', t('initialShareVerdict'));
    set('share-route', t('initialShareRoute'));
    set('share-punchline', t('initialSharePunchline'));
  }
  set('dur-short', t('durShort'));
  set('dur-standard', t('durStandard'));
  set('dur-long', t('durLong'));

  set('timeline-title', t('timelineTitle'));
  set('shelter-search-title', t('shelterSearchTitle'));
  const sInput = document.getElementById('shelter-city-input');
  if (sInput) sInput.placeholder = t('shelterSearchPlaceholder');
  set('search-shelter-btn', t('searchBtn'));
  set('shelter-empty-msg', t('shelterEmptyMsg'));

  set('leaderboard-title', t('leaderboardTitle'));
  set('route-stats-title', t('routeStatsTitle'));
  set('th-city', t('thCity'));
  set('th-24h', t('th24h'));
  set('th-war', t('thWar'));

  renderHourlyAlertTimeline(state.timelineBuckets);
  fetchStatsLeaderboard();
}

function renderHourlyAlertTimeline(source = []) {
  const chart = document.getElementById('alerts-chart');
  const summary = document.getElementById('timeline-summary');
  const detail = document.getElementById('timeline-detail');
  if (!chart) return;

  const nowTs = Date.now();
  const rangeMs = state.timelineRangeHours * 3600000;
  const intervalMs = rangeMs / 24;

  let buckets = new Array(24).fill(0);
  if (source.length === 24 && source.every(v => typeof v === 'number')) {
    buckets = [...source];
  } else {
    const entries = Array.isArray(source) ? source : [];
    for (const item of entries) {
      const ts = item?.timestamp || item?.time || item?.createdAt || item;
      const date = new Date(ts);
      if (Number.isNaN(date.getTime())) continue;

      const msAgo = nowTs - date.getTime();
      if (msAgo < 0 || msAgo > rangeMs) continue;

      const bucketIdx = Math.floor(msAgo / intervalMs);
      const bucket = Math.max(0, Math.min(23, 23 - bucketIdx));
      buckets[bucket] += 1;
    }
  }
  state.timelineBuckets = buckets;

  const max = Math.max(1, ...buckets);
  const total = buckets.reduce((sum, n) => sum + n, 0);

  const peak = buckets.reduce((acc, val, idx) => (val > acc.val ? { val, idx } : acc), { val: -1, idx: 0 });
  const nowObj = new Date();
  const nowHour = nowObj.getHours();
  const nowMinute = nowObj.getMinutes();

  const bucketHourAt = (idx) => {
    const msOffset = (23 - idx) * (state.timelineRangeHours * 3600000 / 24);
    const date = new Date(Date.now() - msOffset);
    return date.getHours();
  };
  const fmtHour = (h) => `${String(h).padStart(2, '0')}:00`;
  const fmtTimeShort = (idx) => {
    const msOffset = (23 - idx) * intervalMs;
    const date = new Date(nowTs - msOffset);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  const nowTimeLabel = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });

  const w = 960;
  const h = 180;
  const padX = 24;
  const padTop = 14;
  const padBottom = 18;
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;
  const stepX = innerW / 23;

  const points = buckets.map((count, idx) => {
    const x = padX + (idx * stepX);
    const y = padTop + innerH - ((count / max) * innerH);
    return { x, y, idx, count, hour: bucketHourAt(idx) };
  });

  const severityByRatio = (ratio) => {
    if (ratio < 0.25) return 'sev-low';
    if (ratio < 0.5) return 'sev-medium';
    if (ratio < 0.75) return 'sev-high';
    return 'sev-critical';
  };

  const linePath = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const areaPath = `M ${points[0].x.toFixed(2)} ${padTop + innerH} L ${points
    .map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' L ')} L ${points[points.length - 1].x.toFixed(2)} ${padTop + innerH} Z`;

  const nowX = points[23].x;

  const axisLabels = [0, 6, 12, 18, 23].map((idx) => {
    // If range is large (>= 12h), show clean hours. If small, show precise time.
    if (state.timelineRangeHours >= 12) {
      return fmtHour(bucketHourAt(idx));
    }
    return fmtTimeShort(idx);
  });

  if (summary) {
    summary.innerHTML = `
      <span class="timeline-chip">${formatTpl(t('timelineTotalFmt'), { count: total })}</span>
      <span class="timeline-chip">${formatTpl(t('timelinePeakFmt'), { hour: fmtHour(bucketHourAt(peak.idx)) })}</span>
      <span class="timeline-chip">${formatTpl(t('timelineNowFmt'), { count: buckets[23] })}</span>
      <span class="timeline-chip">${formatTpl(t('timelineNowAtFmt'), { time: nowTimeLabel })}</span>
    `;
  }

  chart.innerHTML = `
    <svg class="alerts-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <g class="alerts-grid">
        <line x1="${padX}" y1="${padTop}" x2="${w - padX}" y2="${padTop}" />
        <line x1="${padX}" y1="${padTop + innerH / 2}" x2="${w - padX}" y2="${padTop + innerH / 2}" />
        <line x1="${padX}" y1="${padTop + innerH}" x2="${w - padX}" y2="${padTop + innerH}" />
      </g>
      <path class="alerts-area" d="${areaPath}" />
      <polyline class="alerts-line" points="${linePath}" />
      ${points.slice(0, -1).map((p, idx) => {
        const next = points[idx + 1];
        const avgRatio = ((p.count + next.count) / 2) / max;
        const sev = severityByRatio(avgRatio);
        return `<line class="alerts-segment ${sev}" x1="${p.x.toFixed(2)}" y1="${p.y.toFixed(2)}" x2="${next.x.toFixed(2)}" y2="${next.y.toFixed(2)}" />`;
      }).join('')}
      <line class="alerts-now-line" x1="${nowX}" y1="${padTop}" x2="${nowX}" y2="${padTop + innerH}" />
      <text x="${nowX}" y="${padTop - 6}" class="alerts-now-label" text-anchor="middle" style="fill: #D99583; font-size: 10px; font-weight: 800;">NOW</text>
      ${points.map((p) => {
        const sev = severityByRatio(p.count / max);
        const isActive = p.idx === state.timelineSelectedIndex;
        return `<circle class="alerts-point ${sev} ${isActive ? 'active' : ''}" data-idx="${p.idx}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${isActive ? 5.5 : 4.2}" />`;
      }).join('')}
    </svg>
    <div class="alerts-axis">
      ${axisLabels.map((label) => `<span>${label}</span>`).join('')}
    </div>
  `;

  const selectedIdx = Math.max(0, Math.min(23, state.timelineSelectedIndex));
  const selectedTime = fmtTimeShort(selectedIdx);
  const selectedPoint = points[selectedIdx];
  const tooltipText = formatTpl(t('timelineDetailFmt'), {
    hour: selectedTime,
    count: buckets[selectedIdx]
  });
  if (detail) {
    detail.textContent = tooltipText;
  }

  const tooltip = document.createElement('div');
  tooltip.className = 'timeline-tooltip';
  tooltip.textContent = tooltipText;
  tooltip.style.left = `${(selectedPoint.x / w) * 100}%`;
  tooltip.style.top = `${(selectedPoint.y / h) * 100}%`;
  chart.appendChild(tooltip);

  chart.querySelectorAll('.alerts-point').forEach((point) => {
    point.addEventListener('click', () => {
      state.timelineSelectedIndex = Number(point.getAttribute('data-idx'));
      renderHourlyAlertTimeline(state.timelineBuckets);
    });
  });

  // Mouse wheel zoom
  chart.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY;
    const ranges = [6, 12, 24];
    let curIdx = ranges.indexOf(state.timelineRangeHours);
    if (delta > 0 && curIdx < ranges.length - 1) curIdx++;
    if (delta < 0 && curIdx > 0) curIdx--;
    const newRange = ranges[curIdx];
    if (newRange !== state.timelineRangeHours) {
      state.timelineRangeHours = newRange;
      const zoomContainer = document.querySelector('#timeline-zoom');
      if (zoomContainer) {
        zoomContainer.querySelectorAll('.zoom-btn').forEach(b => {
          b.classList.toggle('active', Number(b.dataset.hours) === newRange);
        });
      }
      hydrateTimeline();
    }
  };
}

async function fetchJsonWithFallback(path) {
  const targets = [path, `${DIRECT_API_BASE}${path}`];
  let lastError = null;

  for (const target of targets) {
    try {
      const response = await fetch(target);
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} at ${target}`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to fetch live API data');
}

async function hydrateTimeline() {
  try {
    const data = await fetchJsonWithFallback('/api/alerts?limit=1500');
    renderHourlyAlertTimeline(Array.isArray(data) ? data : []);
  } catch (err) {
    renderHourlyAlertTimeline([]);
  }
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  if (toastTimerId) {
    window.clearTimeout(toastTimerId);
  }
  toastTimerId = window.setTimeout(() => {
    els.toast.classList.remove('show');
    toastTimerId = null;
  }, 2600);
}

function pulseButton(button) {
  button.classList.remove('pulse');
  // Force reflow so repeated clicks retrigger the animation.
  // eslint-disable-next-line no-unused-expressions
  button.offsetHeight;
  button.classList.add('pulse');
  window.setTimeout(() => button.classList.remove('pulse'), 320);
}

function animateVerdictCard() {
  els.verdictCard.classList.remove('is-refreshing');
  // Force reflow to replay animation when verdict changes quickly.
  // eslint-disable-next-line no-unused-expressions
  els.verdictCard.offsetHeight;
  els.verdictCard.classList.add('is-refreshing');
  window.setTimeout(() => els.verdictCard.classList.remove('is-refreshing'), 420);
}

function normalizeCity(item) {
  // item.count is total historical alerts. Scale it drastically down so safe cities aren't 95/100
  const historicalFactor = item.count ? Math.min(60, Number(item.count) * 0.05) : 10;
  const finalPressure = item.pressure !== undefined ? Number(item.pressure) : Math.max(4, Math.min(95, historicalFactor));
  
  return {
    city: String(item.city || item.name || '').trim(),
    region: String(item.region || item.cityZone || item.zone || 'Unknown').trim(),
    pressure: Math.round(finalPressure),
    shelterEtaMin: Math.max(2, Math.min(12, Number(item.shelterEtaMin || 4))),
    recentAlertsMinAgo: Math.max(4, Math.min(200, Number(item.recentAlertsMinAgo || 45)))
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pickVerdict(score) {
  return VERDICTS.find((item) => score >= item.min && score <= item.max) || VERDICTS[1];
}

function pickPunchline(verdict, score) {
  const copy = getVerdictCopy(verdict.key);
  const idx = score % copy.punchlines.length;
  return copy.punchlines[idx];
}

function modeRiskFactor(mode) {
  const factors = {
    foot: 1.12,
    bike: 1.08,
    scooter: 1,
    car: 0.92
  };
  return factors[mode] || 1;
}

function findCityByName(city) {
  return state.allCities.find((item) => item.city.toLowerCase() === city.toLowerCase());
}

function buildShelterLine(cityObj, sideLabel) {
  const eta = cityObj.shelterEtaMin;
  const localRate = cityObj.pressure >= 65
    ? t('highLocal')
    : cityObj.pressure >= 40
      ? t('moderateLocal')
      : t('lowLocal');
  return formatTpl(t('shelterLineFmt'), {
    side: sideLabel,
    eta,
    rate: localRate,
    minutes: cityObj.recentAlertsMinAgo
  });
}

function renderResult(result) {
  const { verdict, score, fromCity, toCity, fromObj, toObj, punchline, recentWindowMin } = result;
  const copy = getVerdictCopy(verdict.key);

  animateVerdictCard();

  els.verdictCard.classList.remove('state-neutral', 'state-safe', 'state-caution', 'state-risk', 'state-alert');
  els.verdictCard.classList.add(verdict.stateClass);
  els.statusPill.textContent = copy.label;
  els.verdictIcon.textContent = verdict.icon;
  els.verdictTitle.textContent = copy.label;
  els.verdictSubtitle.textContent = copy.subtitle;
  els.punchline.textContent = punchline;
  els.routeScore.textContent = `${score}/100`;
  els.stressMeter.style.width = `${score}%`;

  els.routeMeta.textContent = formatTpl(t('routeMetaFmt'), {
    from: fromCity,
    to: toCity,
    duration: state.durationMin,
    mode: getSelectedModeLabel()
  });

  const maxRoutePressure = Math.max(fromObj.pressure, toObj.pressure);
  els.originPressure.textContent = `${maxRoutePressure}/100`;
  els.recentWindow.textContent = formatTpl(t('recentAgoFmt'), { minutes: recentWindowMin });
  els.shelterSpeed.textContent = formatTpl(t('shelterAvgFmt'), {
    minutes: Math.round((fromObj.shelterEtaMin + toObj.shelterEtaMin) / 2)
  });

  els.shareVerdict.textContent = copy.label;
  els.shareRoute.textContent = `${fromCity} -> ${toCity} - ${state.durationMin}m by ${getSelectedModeLabel()}`;
  els.sharePunchline.textContent = punchline;

  updateVerdictMap(fromCity, toCity);
  updateCoffeeIndicator(score);
}

function updateCoffeeIndicator(score) {
  if (!els.coffeeIndicator) return;
  
  // 5 cups for very dangerous (score >= 80)
  // 1 cup for safe (score < 20)
  let count = 1;
  if (score >= 80) count = 5;
  else if (score >= 60) count = 4;
  else if (score >= 40) count = 3;
  else if (score >= 20) count = 2;

  const cupEmoji = '☕';
  els.coffeeIndicator.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.className = 'coffee-cup';
    span.textContent = cupEmoji;
    span.style.animationDelay = `${i * 0.1}s`;
    els.coffeeIndicator.appendChild(span);
  }
}

function calculateRoute() {
  if (!state.liveDataReady || state.allCities.length < 8) {
    toast(t('liveDataRequired'));
    return null;
  }

  const fromCity = state.from.trim();
  const toCity = state.to.trim();

  if (!fromCity || !toCity) {
    toast(t('missingCities'));
    return null;
  }

  const fromObj = findCityByName(fromCity);
  const toObj = findCityByName(toCity);

  if (!fromObj || !toObj) {
    toast(t('unknownCities'));
    return null;
  }

  const routeBase = (fromObj.pressure * 0.25) + (toObj.pressure * 0.15);
  const durationRisk = clamp((state.durationMin / 60) * 22, 2, 24);
  const modeRisk = modeRiskFactor(state.mode);
  const recentBoost = clamp((state.globalRecent24h / 40) * 14, 0, 14);
  const shelterBuffer = clamp((7 - ((fromObj.shelterEtaMin + toObj.shelterEtaMin) / 2)) * 2, -8, 6);

  const score = clamp(Math.round((routeBase + durationRisk + recentBoost - shelterBuffer) * modeRisk), 1, 99);
  const verdict = pickVerdict(score);
  const recentWindowMin = Math.min(fromObj.recentAlertsMinAgo, toObj.recentAlertsMinAgo);
  const punchline = pickPunchline(verdict, score);

  return {
    verdict,
    score,
    fromCity,
    toCity,
    fromObj,
    toObj,
    recentWindowMin,
    punchline,
    timestamp: new Date().toISOString()
  };
}

function suggestionsFor(query) {
  const term = query.trim().toLowerCase();
  const base = state.allCities;
  if (!term) {
    return base.slice(0, 8);
  }
  return base
    .filter((item) => item.city.toLowerCase().includes(term) || item.region.toLowerCase().includes(term))
    .slice(0, 8);
}

function renderSuggestions(target, items, which) {
  if (!items.length) {
    target.classList.remove('open');
    target.innerHTML = '';
    return;
  }

  target.innerHTML = items
    .map((item) => `<button type="button" class="suggestion" data-which="${which}" data-city="${item.city}">${item.city} • ${item.region}</button>`)
    .join('');
  target.classList.add('open');
}

function setupAutocomplete(input, panel, which) {
  input.addEventListener('focus', () => {
    renderSuggestions(panel, suggestionsFor(input.value), which);
  });

  input.addEventListener('input', () => {
    const value = input.value;
    if (which === 'from') state.from = value;
    if (which === 'to') state.to = value;
    renderSuggestions(panel, suggestionsFor(value), which);
  });

  panel.addEventListener('click', (event) => {
    const option = event.target.closest('.suggestion');
    if (!option) return;

    const selectedCity = option.dataset.city || '';
    input.value = selectedCity;
    if (which === 'from') state.from = selectedCity;
    if (which === 'to') state.to = selectedCity;
    panel.classList.remove('open');
    panel.innerHTML = '';
  });

  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      panel.classList.remove('open');
      panel.innerHTML = '';
    }, 120);
  });
}


/** Statistics Logic **/
async function displayRouteStats(origin, destination) {
  const section = document.getElementById('route-stats-section');
  const body = document.getElementById('route-stats-body');
  if (!section || !body) return;

  section.style.display = 'block';
  body.innerHTML = `<tr><td colspan="3">${t('loading')}</td></tr>`;

  const [originStats, destStats] = await Promise.all([
    fetchCityAlertStats(origin),
    fetchCityAlertStats(destination)
  ]);

  body.innerHTML = [originStats, destStats].map(s => `
    <tr>
      <td style="text-align: right; padding: 8px;">${s.city}</td>
      <td style="text-align: right; padding: 8px;">${s.last24h}</td>
      <td style="text-align: right; padding: 8px;">${s.total}</td>
    </tr>
  `).join('');
}

async function fetchCityAlertStats(cityName) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const warStart = '2023-10-07T00:00:00Z';

  try {
    const [stats24h, statsWar] = await Promise.all([
      fetchJsonWithFallback(`/api/stats/cities?limit=1&search=${encodeURIComponent(cityName)}&startDate=${yesterday}`),
      fetchJsonWithFallback(`/api/stats/cities?limit=1&search=${encodeURIComponent(cityName)}&startDate=${warStart}`)
    ]);

    const findExact = (data) => data?.data?.find(c => c.city === cityName) || data?.data?.[0];
    const match24h = findExact(stats24h);
    const matchWar = findExact(statsWar);

    // Update footer timestamp
    const footerTimeEl = document.getElementById('last-updated-footer');
    if (footerTimeEl) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('he-IL', { hour12: false });
      footerTimeEl.textContent = `עודכן לאחרונה: ${timeStr}`;
    }

    return {
      city: cityName,
      last24h: match24h ? match24h.count : 0,
      total: matchWar ? matchWar.count : 0
    };
  } catch (err) {
    console.error(`Failed to fetch stats for ${cityName}`, err);
    return { city: cityName, last24h: '?', total: '?' };
  }
}

async function fetchStatsLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  try {
    const data = await fetchJsonWithFallback(`/api/stats/cities?limit=5&sort=count&order=desc&startDate=${yesterday}`);
    if (data && data.data) {
      container.innerHTML = data.data.map(c => `
        <div class="leaderboard-row">
          <span class="leaderboard-city">${c.city}</span>
          <span class="leaderboard-count">${t('leaderboardCount', { count: c.count })}</span>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<p class="subtle">${t('statsNoData')}</p>`;
    }
  } catch (err) {
    console.error('Leaderboard fetch failed', err);
    container.innerHTML = `<p class="subtle">${t('statsError')}</p>`;
  }
}

function bindControls() {
  setupAutocomplete(els.fromInput, els.fromSuggestions, 'from');
  setupAutocomplete(els.toInput, els.toSuggestions, 'to');

  // Duration removal: removed event listener for durationTabs.


  if (els.timelineZoom) {
    els.timelineZoom.addEventListener('click', (event) => {
      const btn = event.target.closest('.zoom-btn');
      if (!btn) return;
      els.timelineZoom.querySelectorAll('.zoom-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.timelineRangeHours = Number(btn.dataset.hours || 24);
      hydrateTimeline(); // Re-fetch or re-render
    });
  }

  els.modeButtons.addEventListener('click', (event) => {
    const btn = event.target.closest('.mode');
    if (!btn) return;
    els.modeButtons.querySelectorAll('.mode').forEach((modeBtn) => modeBtn.classList.remove('active'));
    btn.classList.add('active');
    state.mode = btn.dataset.mode || 'foot';
  });

  els.goBtn.addEventListener('click', () => {
    pulseButton(els.goBtn);
    const result = calculateRoute();
    if (!result) return;
    state.lastResult = result;
    renderResult(result);
    displayRouteStats(state.from, state.to);
  });

  els.shareBtn.addEventListener('click', async () => {
    pulseButton(els.shareBtn);
    if (!state.lastResult) {
      toast(t('runCheckFirstShare'));
      return;
    }

    const shareVerdictLabel = getVerdictCopy(state.lastResult.verdict.key).label;
    const payload = `${shareVerdictLabel} | ${state.lastResult.fromCity} -> ${state.lastResult.toCity} | ${state.durationMin}m by ${getSelectedModeLabel()}. ${state.lastResult.punchline}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bring Coffee?',
          text: payload
        });
        return;
      } catch (_err) {
        // Fall back to clipboard if dialog was dismissed.
      }
    }

    try {
      await navigator.clipboard.writeText(payload);
      toast(t('shareCopied'));
    } catch (_err) {
      toast(t('shareCopyFail'));
    }
  });

  els.saveBtn.addEventListener('click', () => {
    pulseButton(els.saveBtn);
    if (!state.lastResult) {
      toast(t('runCheckFirstSave'));
      return;
    }

    const key = 'bring_coffee_saved_routes';
    const existing = JSON.parse(window.localStorage.getItem(key) || '[]');
    existing.unshift(state.lastResult);
    window.localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
    toast(t('saved'));
  });

  els.langEn.addEventListener('click', () => {
    if (state.lang === 'en') return;
    state.lang = 'en';
    window.localStorage.setItem('bring_coffee_lang', 'en');
    applyLanguageUI();
    if (state.lastResult) renderResult(state.lastResult);
  });

  els.langHe.addEventListener('click', () => {
    if (state.lang === 'he') return;
    state.lang = 'he';
    window.localStorage.setItem('bring_coffee_lang', 'he');
    applyLanguageUI();
    if (state.lastResult) renderResult(state.lastResult);
  });

  document.getElementById('search-shelter-btn')?.addEventListener('click', () => {
    const city = document.getElementById('shelter-city-input')?.value;
    if (city) performShelterSearch({ city });
  });

  document.getElementById('near-me-btn')?.addEventListener('click', () => {
    if (navigator.geolocation) {
      document.getElementById('shelter-results').innerHTML = `<p class="subtle">${t('shelterLoading')}</p>`;
      navigator.geolocation.getCurrentPosition(
        (pos) => performShelterSearch({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => { alert('Geolocation failed'); renderShelterResults([]); }
      );
    }
  });
}

/** Verdict Map Logic **/
function initVerdictMap() {
  if (state.map || !els.verdictMap) return;

  state.map = L.map('verdict-map', {
    zoomControl: false,
    attributionControl: false
  }).setView([31.5, 34.8], 7);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(state.map);
}

async function updateVerdictMap(fromCity, toCity) {
  if (!state.map) initVerdictMap();
  
  els.verdictMap.classList.add('active');

  // Clear markers
  state.mapMarkers.forEach(m => state.map.removeLayer(m));
  state.mapMarkers = [];

  try {
    const cleanFrom = fromCity.split(' - ')[0].split(' • ')[0].trim();
    const cleanTo = toCity.split(' - ')[0].split(' • ')[0].trim();
    console.log('Fetching coords for:', { fromCity, toCity, cleanFrom, cleanTo });

    const [fromCoords, toCoords] = await Promise.all([
      fetchJsonWithFallback(`/api/city-coords?city=${encodeURIComponent(cleanFrom)}`),
      fetchJsonWithFallback(`/api/city-coords?city=${encodeURIComponent(cleanTo)}`)
    ]);

    if (!fromCoords.lat || !toCoords.lat) return;

    const start = [fromCoords.lat, fromCoords.lon];
    const end = [toCoords.lat, toCoords.lon];

    // Markers for start/end
    const startMarker = L.circleMarker(start, {
      radius: 8,
      fillColor: '#5C4A42',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    }).addTo(state.map).bindPopup(fromCity);

    const endMarker = L.circleMarker(end, {
      radius: 8,
      fillColor: '#8C5A35',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    }).addTo(state.map).bindPopup(toCity);

    state.mapMarkers.push(startMarker, endMarker);

    // Dashed line
    const line = L.polyline([start, end], {
      color: '#A87C63',
      weight: 3,
      opacity: 0.6,
      dashArray: '8, 8'
    }).addTo(state.map);
    state.mapMarkers.push(line);

    // Fit map to markers perfectly by giving the DOM time to render the map container
    setTimeout(() => {
      state.map.invalidateSize();
      state.map.fitBounds(L.latLngBounds([start, end]), { padding: [50, 50] });
    }, 100);

    // Fetch shelters
    const mid1 = [
      start[0] + (end[0] - start[0]) * 0.33,
      start[1] + (end[1] - start[1]) * 0.33
    ];
    const mid2 = [
      start[0] + (end[0] - start[0]) * 0.66,
      start[1] + (end[1] - start[1]) * 0.66
    ];

    const shelterRequests = [
      fetchJsonWithFallback(`/api/shelter/search?lat=${start[0]}&lon=${start[1]}&radiusKm=5`),
      fetchJsonWithFallback(`/api/shelter/search?lat=${end[0]}&lon=${end[1]}&radiusKm=5`),
      fetchJsonWithFallback(`/api/shelter/search?lat=${mid1[0]}&lon=${mid1[1]}&radiusKm=8`),
      fetchJsonWithFallback(`/api/shelter/search?lat=${mid2[0]}&lon=${mid2[1]}&radiusKm=8`)
    ];

    const shelterSets = await Promise.all(shelterRequests);
    
    shelterSets.forEach(set => {
      const shelters = Array.isArray(set) ? set : (set && set.results) ? set.results : [];
      shelters.slice(0, 5).forEach(s => {
        const isKnownAddress = s.address && !String(s.address).toLowerCase().includes('unknown');
        const validAddress = isKnownAddress ? s.address : null;
        const displayName = s.building_name || validAddress || s.city || 'מקלט ציבורי';

        const sm = L.circleMarker([s.lat, s.lon], {
          radius: 4,
          fillColor: '#22c55e',
          color: '#fff',
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.6
        }).addTo(state.map).bindPopup(displayName);
        state.mapMarkers.push(sm);
      });
    });

    state.map.fitBounds(line.getBounds(), { padding: [30, 30] });
    
    // Fix leaflet grey tile issue on dynamic display
    setTimeout(() => state.map.invalidateSize(), 400);

  } catch (err) {
    console.warn('Map update failed', err);
  }
}

async function hydrateCities() {
  try {
    const [citiesResult, statsResult, summaryResult] = await Promise.allSettled([
      fetchJsonWithFallback(API.cities),
      fetchJsonWithFallback(API.cityStats),
      fetchJsonWithFallback(`${API.summary}?include=totals`)
    ]);

    const citiesPayload = citiesResult.status === 'fulfilled' ? citiesResult.value : [];
    const statsPayload = statsResult.status === 'fulfilled' ? statsResult.value : [];
    const summaryPayload = summaryResult.status === 'fulfilled' ? summaryResult.value : null;

    const statMap = new Map();
    if (Array.isArray(statsPayload)) {
      for (const row of statsPayload) {
        statMap.set(String(row.city || '').toLowerCase(), row);
      }
    }

    const merged = (Array.isArray(citiesPayload) ? citiesPayload : [])
      .map((city) => {
        const hit = statMap.get(String(city.city || '').toLowerCase()) || {};
        return normalizeCity({ ...city, ...hit });
      })
      .filter((item) => item.city.length > 0);

    if (summaryPayload?.totals?.last24h) {
      state.globalRecent24h = Number(summaryPayload.totals.last24h);
    }

    if (merged.length >= 8) {
      state.allCities = merged;
      state.liveDataReady = true;
      if (summaryResult.status !== 'fulfilled') {
        // Summary is optional; do not block live mode when city data is available.
        toast(t('liveNoSummary'));
      }
      return;
    }

    state.liveDataReady = false;
    state.allCities = [];
  } catch (_err) {
    state.liveDataReady = false;
    state.allCities = [];
  }
}

function bootstrapDefaults() {
  state.from = '';
  state.to = '';
  els.fromInput.value = state.from;
  els.toInput.value = state.to;
}

async function init() {
  // Always start in Hebrew regardless of last session.
  state.lang = 'he';

  applyLanguageUI();
  bootstrapDefaults();
  bindControls();
  initVerdictMap();
  await hydrateCities();
  await hydrateTimeline();
}

init();

/** Coffee Run Mini-Game **/
let gameCtx, gameAnimId;
let player = { x: 276, width: 48, height: 48, speed: 6, dx: 0 };
let items = []; 
let gameScore = 0;
let isGameOver = false;

function initMiniGame() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  gameCtx = canvas.getContext('2d');
  
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) startBtn.addEventListener('click', startGame);

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') player.dx = -player.speed;
    if (e.key === 'ArrowRight') player.dx = player.speed;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') player.dx = 0;
  });

  // Touch/Mouse controls for mobile
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    player.dx = x < canvas.width / 2 ? -player.speed : player.speed;
  });
  canvas.addEventListener('pointerup', () => player.dx = 0);
  
  // Draw initial frame
  gameCtx.font = '48px Arial';
  gameCtx.fillText('🏃', player.x, 290);
}

function startGame() {
  document.getElementById('game-overlay').style.display = 'none';
  document.getElementById('game-score-display').style.display = 'block';
  
  player.x = 276;
  player.dx = 0;
  items = [];
  gameScore = 0;
  isGameOver = false;
  updateScoreDisplay();
  
  if (gameAnimId) cancelAnimationFrame(gameAnimId);
  gameLoop();
}

function updateScoreDisplay() {
  const scoreEl = document.getElementById('game-score-display');
  if (scoreEl) scoreEl.textContent = `Score: ${gameScore}`;
}

function gameLoop() {
  if (isGameOver) return;
  updateGame();
  drawGame();
  gameAnimId = requestAnimationFrame(gameLoop);
}

function updateGame() {
  player.x += player.dx || 0;
  if (player.x < 0) player.x = 0;
  if (player.x > 600 - player.width) player.x = 600 - player.width;

  // Spawn items
  if (Math.random() < 0.035) {
    items.push({
      x: Math.random() * (600 - 48),
      y: -50, // start slightly higher due to larger emoji
      type: Math.random() < 0.75 ? 'coffee' : 'missile',
      speed: 3 + Math.random() * 2 + (gameScore * 0.008) // much slower progressive difficulty
    });
  }

  // Move & detect collisions
  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    item.y += item.speed;

    // Hitbox is slightly smaller than the 48px visual
    if (
      item.x < player.x + player.width - 10 &&
      item.x + 38 > player.x + 10 &&
      item.y < 280 + player.height - 10 &&
      item.y + 38 > 280 + 10
    ) {
      if (item.type === 'coffee') {
        gameScore += 10;
        updateScoreDisplay();
        items.splice(i, 1);
      } else {
        gameOver();
        return;
      }
    } else if (item.y > 350) {
      items.splice(i, 1);
    }
  }
}

function drawGame() {
  gameCtx.clearRect(0, 0, 600, 300);
  gameCtx.font = '48px Arial';
  gameCtx.fillText('🏃', player.x, 290);

  items.forEach(item => {
    gameCtx.fillText(item.type === 'coffee' ? '☕' : '🚀', item.x, item.y + 40);
  });
}

function gameOver() {
  isGameOver = true;
  document.getElementById('game-overlay').style.display = 'flex';
  document.getElementById('game-overlay').style.background = 'rgba(15, 23, 42, 0.85)';
  document.getElementById('start-game-btn').style.display = 'block';
  document.getElementById('start-game-btn').textContent = 'Play Again';
  document.getElementById('game-desc').innerHTML = `Game Over! Caught a missile 💥<br>Final Score: ${gameScore}`;
  document.getElementById('game-desc').style.display = 'block';
  document.getElementById('game-title').style.display = 'block';
  document.getElementById('game-score-display').style.display = 'none';
}

// Call initMiniGame on load
document.addEventListener('DOMContentLoaded', () => {
  initMiniGame();
});
