import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

const REDALERT_BASE = 'https://redalert.orielhaim.com';
const REDALERT_API_KEY = process.env.REDALERT_API_KEY;

if (!REDALERT_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[server] REDALERT_API_KEY is not set. Real data will not load. ' +
    'Get an API key from https://redalert.orielhaim.com/docs/quick-start and ' +
    'start the server with REDALERT_API_KEY=your-key-here.'
  );
}

app.use(cors());

function withAuthHeaders() {
  return REDALERT_API_KEY
    ? { Authorization: `Bearer ${REDALERT_API_KEY}` }
    : {};
}

async function requestRedAlert(pathname, query = {}) {
  const url = new URL(pathname, REDALERT_BASE);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  const res = await fetch(url, { headers: withAuthHeaders() });
  if (!res.ok) {
    const message = await res.text().catch(() => '');
    throw new Error(`RedAlert ${pathname} failed (${res.status}): ${message}`);
  }
  return res.json();
}

async function fetchRedAlertHistory(limit = 500) {
  const data = await requestRedAlert('/api/stats/history', {
    limit,
    sort: 'timestamp',
    order: 'asc'
  }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[server] RedAlert history error', error.message);
    return null;
  });

  if (!data) return [];

  // According to RedAlert docs, this should be either an array of alerts or { data: [...] }.
  const alerts = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
  return alerts;
}

async function fetchRedAlertCities(limit = 500) {
  const data = await requestRedAlert('/api/stats/cities', { limit }).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[server] RedAlert cities error', error.message);
    return null;
  });

  if (!data) return [];

  const cities = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
  return cities;
}

// Simplified history endpoint for the frontend:
// Returns only timestamps so the frontend can build hourly risk from real data.
app.get('/api/alerts', async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 500;
    const alerts = await fetchRedAlertHistory(limit);

    const normalized = alerts
      .map((a) => {
        const ts = a.timestamp || a.time || a.createdAt || a.updatedAt;
        return ts ? { timestamp: ts } : null;
      })
      .filter(Boolean);

    res.json(normalized);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] /api/alerts failed', err);
    res.status(500).json({ error: 'Failed to load alerts from RedAlert' });
  }
});

// Ticker endpoint – builds short, real sentences from the latest alerts.
app.get('/api/ticker', async (req, res) => {
  try {
    const alerts = await fetchRedAlertHistory(50);

    const items = alerts.map((a) => {
      const ts = a.timestamp || a.time || a.createdAt || a.updatedAt;
      const date = ts ? new Date(ts) : null;
      const timeStr = date && !Number.isNaN(date.getTime())
        ? date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })
        : '--:--';

      const type = a.type || a.category || 'alert';
      const title = a.title || '';
      const cities = Array.isArray(a.cities) ? a.cities.join(', ') : (a.cityName || a.city || '');
      const desc = title || cities || '';

      return `[${timeStr}] ${type} ${desc}`.trim();
    }).filter(Boolean);

    res.json(items);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] /api/ticker failed', err);
    res.status(500).json({ error: 'Failed to load ticker data from RedAlert' });
  }
});

app.get('/api/stats/summary', async (req, res) => {
  try {
    const data = await requestRedAlert('/api/stats/summary', {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      include: req.query.include,
      topLimit: req.query.topLimit,
      timelineGroup: req.query.timelineGroup
    });
    res.json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[server] /api/stats/summary failed', error.message);
    res.status(500).json({ error: 'Failed to load summary stats from RedAlert' });
  }
});

app.get('/api/shelter/search', async (req, res) => {
  try {
    const data = await requestRedAlert('/api/shelter/search', {
      lat: req.query.lat,
      lon: req.query.lon,
      limit: req.query.limit,
      radiusKm: req.query.radiusKm,
      wheelchairOnly: req.query.wheelchairOnly,
      shelterType: req.query.shelterType,
      city: req.query.city
    });
    res.json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[server] /api/shelter/search failed', error.message);
    res.status(500).json({ error: 'Failed to load shelters from RedAlert' });
  }
});

// Cities stats proxy – exposes real RedAlert city statistics so the frontend
// can later do per-location risk, maps, etc.
app.get('/api/cities', async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 500;
    const cities = await fetchRedAlertCities(limit);
    res.json(cities);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] /api/cities failed', err);
    res.status(500).json({ error: 'Failed to load cities stats from RedAlert' });
  }
});

app.get('/', (_req, res) => {
  res.json({ ok: true, source: 'RedAlert proxy', docs: 'https://redalert.orielhaim.com/docs/api-reference' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] RedAlert proxy listening on http://localhost:${PORT}`);
});

