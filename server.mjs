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
    'Get a key at https://redalert.orielhaim.com/docs/quick-start ' +
    'and set it in .env (locally) or Vercel environment variables (production).'
  );
}

app.use(cors());
app.use(express.json());

const CITY_MAP = {
  'תל אביב': { en: 'Tel Aviv', lat: 32.0853, lon: 34.7818 },
  'תל אביב - יפו': { en: 'Tel Aviv', lat: 32.0853, lon: 34.7818 },
  'תל אביב-יפו': { en: 'Tel Aviv', lat: 32.0853, lon: 34.7818 },
  'ירושלים': { en: 'Jerusalem', lat: 31.7683, lon: 35.2137 },
  'חיפה': { en: 'Haifa', lat: 32.7940, lon: 34.9896 },
  'באר שבע': { en: 'Beer Sheva', lat: 31.2530, lon: 34.7915 },
  'אשדוד': { en: 'Ashdod', lat: 31.8044, lon: 34.6553 },
  'אשקלון': { en: 'Ashkelon', lat: 31.6688, lon: 34.5743 },
  'ראשון לציון': { en: 'Rishon LeZion', lat: 31.9730, lon: 34.7925 },
  'פתח תקווה': { en: 'Petah Tikva', lat: 32.0840, lon: 34.8878 },
  'נתניה': { en: 'Netanya', lat: 32.3215, lon: 34.8532 },
  'חולון': { en: 'Holon', lat: 32.0158, lon: 34.7874 },
  'בני ברק': { en: 'Bnei Brak', lat: 32.0833, lon: 34.8333 },
  'רמת גן': { en: 'Ramat Gan', lat: 32.0822, lon: 34.8107 },
  'רחובות': { en: 'Rehovot', lat: 31.8928, lon: 34.8113 },
  'בת ים': { en: 'Bat Yam', lat: 32.0132, lon: 34.7481 },
  'הרצליה': { en: 'Herzliya', lat: 32.1624, lon: 34.8447 },
  'כפר סבא': { en: 'Kfar Saba', lat: 32.1750, lon: 34.9069 },
  'רעננה': { en: 'Ra\'anana', lat: 32.1833, lon: 34.8667 },
  'חדרה': { en: 'Hadera', lat: 32.4340, lon: 34.9197 },
  'מודיעין': { en: 'Modi\'in', lat: 31.9077, lon: 35.0069 },
  'לוד': { en: 'Lod', lat: 31.9458, lon: 34.8967 },
  'רמלה': { en: 'Ramle', lat: 31.9272, lon: 34.8631 },
  'נהריה': { en: 'Nahariya', lat: 33.0061, lon: 35.0931 },
  'עכו': { en: 'Acre', lat: 32.9333, lon: 35.0833 },
  'אילת': { en: 'Eilat', lat: 29.5577, lon: 34.9519 }
};

app.get('/api/city-coords', (req, res) => {
  const { city } = req.query;
  const match = CITY_MAP[city];
  if (match) {
    res.json({ lat: match.lat, lon: match.lon, en: match.en });
  } else {
    res.status(404).json({ error: 'City not found in mapping' });
  }
});

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

async function fetchRedAlertHistory(limit = 100) {
  const data = await requestRedAlert('/api/stats/history', {
    limit,
    sort: 'timestamp',
    order: 'desc'
  });

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
      include: req.query.include === 'totals' ? undefined : req.query.include,
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
    let { lat, lon, city, radiusKm } = req.query;

    // RedAlert API requires lat/lon. If missing but city is there, provide Israel center defaults or city-specific if mapped.
    if (city && (!lat || !lon)) {
      const match = CITY_MAP[city];
      if (match) {
        lat = String(match.lat);
        lon = String(match.lon);
        radiusKm = radiusKm || '20'; // Specific city search, default to 20km
      } else {
        lat = lat || '31.9';
        lon = lon || '34.8';
        radiusKm = radiusKm || '500';
      }
    }

    // Map Hebrew city names to English for better API matching
    if (city && CITY_MAP[city]) {
      city = CITY_MAP[city].en;
    }

    const data = await requestRedAlert('/api/shelter/search', {
      lat,
      lon,
      limit: req.query.limit,
      radiusKm,
      wheelchairOnly: req.query.wheelchairOnly,
      shelterType: req.query.shelterType,
      city
    });
    res.json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[server] /api/shelter/search failed', error.message);
    res.status(500).json({ error: 'Failed to load shelters from RedAlert' });
  }
});

app.get('/api/stats/cities', async (req, res) => {
  try {
    const data = await requestRedAlert('/api/stats/cities', {
      limit: req.query.limit,
      search: req.query.search,
      sort: req.query.sort,
      order: req.query.order,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });
    res.json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[server] /api/stats/cities failed', error.message);
    res.status(500).json({ error: 'Failed to load city stats from RedAlert' });
  }
});

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

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] RedAlert proxy listening on http://localhost:${PORT}`);
  });
}

export default app;

