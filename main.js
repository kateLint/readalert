import { io } from 'socket.io-client';
import './style.css';

const CONFIG = {
  SUMMARY_URL: '/api/stats/summary',
  HISTORY_URL: '/api/alerts',
  SHELTER_SEARCH_URL: '/api/shelter/search'
};

const COLORS = {
  line: '#22d3ee',
  barGood: 'rgba(45, 212, 191, 0.75)',
  barRisk: 'rgba(251, 113, 133, 0.75)',
  text: '#dce9fb',
  grid: 'rgba(152, 180, 218, 0.24)'
};

const state = {
  napDurationMinutes: 15,
  historyDates: [],
  hourlyRisk: new Array(24).fill(1),
  napWindows: [],
  selectedWindowIndex: null,
  napTimerId: null,
  napEndAt: null,
  socket: null,
  liveConnected: false,
  charts: {
    napWindowChart: null,
    timelineChart: null
  }
};

const $ = (selector) => document.querySelector(selector);

const els = {
  livePill: $('#live-pill'),
  apiKeyInput: $('#api-key-input'),
  connectProdBtn: $('#connect-prod-btn'),
  connectTestBtn: $('#connect-test-btn'),
  napDurationRow: $('#nap-duration-row'),
  startNapBtn: $('#start-nap-btn'),
  stopNapBtn: $('#stop-nap-btn'),
  napTimer: $('#nap-timer'),
  riskScore: $('#risk-score'),
  bestNapTime: $('#best-nap-time'),
  alerts24h: $('#alerts-24h'),
  peakPeriod: $('#peak-period'),
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
    els.bestNapTime.textContent = `${formatHour(best.start)} (${best.safety}% safe)`;
  }
}

function currentRiskScore() {
  const hour = new Date().getHours();
  return state.hourlyRisk[hour] ?? 0;
}

async function loadSummaryStats() {
  const response = await fetch(`${CONFIG.SUMMARY_URL}?include=timeline,peak&timelineGroup=day`);
  if (!response.ok) {
    throw new Error('Failed to fetch summary');
  }
  const summary = await response.json();
  els.alerts24h.textContent = String(summary?.totals?.last24h ?? '--');
  els.peakPeriod.textContent = summary?.peak?.period ?? 'N/A';
  return summary;
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
        label: 'Safety score',
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
              return `${context.raw}% safe`;
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
        label: 'Alert count',
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

function renderNapWindowSelection() {
  if (state.selectedWindowIndex == null || !state.napWindows[state.selectedWindowIndex]) {
    els.pickedWindow.textContent = 'No window selected yet.';
    updateNapWindowChart();
    return;
  }
  const chosen = state.napWindows[state.selectedWindowIndex];
  els.pickedWindow.textContent = `Selected: ${formatHour(chosen.start)} | score ${chosen.safety}% | risk ${chosen.avgRisk}%`;
  updateNapWindowChart();
}

function renderKpis() {
  els.riskScore.textContent = `${currentRiskScore()}%`;
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
      showToast('Nap complete. Wake up champion.');
      stopNapGuard();
    }
  }, 250);

  showToast(`Nap guard started for ${state.napDurationMinutes} minutes.`);
}

function setLivePill(isConnected, text) {
  state.liveConnected = isConnected;
  els.livePill.textContent = text;
  els.livePill.style.borderColor = isConnected ? 'rgba(45, 212, 191, 0.35)' : 'rgba(251, 113, 133, 0.45)';
  els.livePill.style.color = isConnected ? '#b8ffef' : '#ffd4dd';
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
      showToast(`Wake up: ${title}`);
    }
  }
}

function connectSocket(mode) {
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }

  const isProd = mode === 'prod';
  const socketUrl = isProd ? 'https://redalert.orielhaim.com' : 'https://redalert.orielhaim.com/test';
  const apiKey = els.apiKeyInput.value.trim();

  if (isProd && !apiKey) {
    showToast('Paste API key to connect production socket.');
    return;
  }

  const options = isProd ? { auth: { apiKey } } : {};

  const socket = io(socketUrl, options);
  state.socket = socket;

  socket.on('connect', () => {
    setLivePill(true, `Live feed: ${isProd ? 'production' : 'test server'} connected`);
    addFeedItem(`Socket connected (${isProd ? 'production' : 'test'})`);
  });

  socket.on('disconnect', () => {
    setLivePill(false, 'Live feed: disconnected');
    addFeedItem('Socket disconnected');
  });

  socket.on('connect_error', (err) => {
    setLivePill(false, 'Live feed: connection error');
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
    showToast('Geolocation is not supported in this browser.');
    return;
  }

  els.shelterStatus.textContent = 'Getting your location...';
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
          els.shelterStatus.textContent = 'No shelters found for this query.';
          return;
        }

        els.shelterStatus.textContent = `Found ${results.length} shelters nearby.`;
        els.shelterResults.innerHTML = results.map((item) => {
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.lat},${item.lon}`)}`;
          const meters = Math.round(Number(item.distance_meters || 0));
          const access = item.wheelchair_accessible ? 'wheelchair' : 'no-wheelchair';
          return `
            <article class="shelter-card">
              <strong>${item.city || ''} | ${item.address || 'Unknown address'}</strong>
              <span class="shelter-meta">${meters}m away | ${item.shelter_type || 'unknown'} | capacity: ${item.capacity ?? 'N/A'} | ${access}</span>
              <a href="${mapUrl}" target="_blank" rel="noreferrer">Open in map</a>
            </article>
          `;
        }).join('');
      } catch (_error) {
        els.shelterStatus.textContent = 'Failed to search shelters.';
      }
    },
    () => {
      els.shelterStatus.textContent = 'Location permission denied.';
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function bindEvents() {
  els.napDurationRow.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-min]');
    if (!button) return;

    els.napDurationRow.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.napDurationMinutes = Number(button.dataset.min);

    computeNapWindows();
    renderNapWindowSelection();
    renderKpis();
  });

  els.startNapBtn.addEventListener('click', startNapGuard);
  els.stopNapBtn.addEventListener('click', stopNapGuard);
  els.connectProdBtn.addEventListener('click', () => connectSocket('prod'));
  els.connectTestBtn.addEventListener('click', () => connectSocket('test'));
  els.findShelterBtn.addEventListener('click', findShelters);
}

async function init() {
  updateBackgroundInteractivity();
  bindEvents();

  try {
    await loadHistory();
    buildHourlyRiskFromHistory();
  } catch (_error) {
    addFeedItem('Could not load history from API proxy.');
  }

  let summary = null;
  try {
    summary = await loadSummaryStats();
  } catch (_error) {
    els.alerts24h.textContent = 'N/A';
    els.peakPeriod.textContent = 'N/A';
    addFeedItem('Could not load summary stats from API proxy.');
  }

  computeNapWindows();
  createCharts(summary?.timeline || []);
  renderNapWindowSelection();
  renderKpis();
  connectSocket('test');

  window.setInterval(() => {
    renderKpis();
  }, 20000);
}

init();
