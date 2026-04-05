# Production Readiness Design
**Date:** 2026-03-24
**Project:** Bring Coffee? (showersimulator)
**Status:** Ready for Implementation

## Problem

The app at https://bringcoffe.vercel.app/ has several issues blocking a clean production deployment:

1. `REDALERT_API_KEY` is hardcoded in `server.mjs` inside a `console.warn()` message — visible in Vercel function logs and git history (repo is public)
2. CORS is wide open (`cors()` with no config) — relevant for local dev where Express listens on port 4000 separately from the Vite dev server on port 5173
3. Some server functions silently swallow errors and return `[]` — the user sees blank screens with no explanation
4. Debug `console.log` statements in `main.js` log internal data (city names, shelter counts) to the browser console in production

## Solution Overview

Three code changes to `server.mjs` and `main.js`, plus one manual Vercel configuration step.

**Architecture note on CORS:** In production on Vercel, the frontend (Vite static build) and the API (Express serverless function) are both served under `https://bringcoffe.vercel.app`. Browser requests to `/api/*` are same-origin, so CORS headers on the Express layer have no effect in production. The CORS fix below is meaningful only for local development (where Vite runs on `localhost:5173` and Express on `localhost:4000`).

---

## A — Remove API Key From Code (`server.mjs`)

**File:** `server.mjs`, lines 10–17

The real API key is hardcoded inside a `console.warn()` message. Since the repo is public and the key is already in git history, the key is already compromised — the user has acknowledged there is only one key and it cannot currently be rotated. Regardless, it must be removed from source code to stop it from appearing in new Vercel function logs.

**Before:**
```js
if (!REDALERT_API_KEY) {
  console.warn(
    '[server] REDALERT_API_KEY is not set. ... ' +
    'start the server with REDALERT_API_KEY=pr_loOvnUUAGOmFCKmjWiWdotQdeygLLMcneLPIYIMrgAxOdvoUjSAhGmZFuWVtwJGX'
  );
}
```

**After:**
```js
if (!REDALERT_API_KEY) {
  console.warn(
    '[server] REDALERT_API_KEY is not set. Real data will not load. ' +
    'Get a key at https://redalert.orielhaim.com/docs/quick-start and set it in .env or Vercel environment variables.'
  );
}
```

**Manual step (not in code):** Add `REDALERT_API_KEY` to Vercel project → Settings → Environment Variables.

---

## B — Restrict CORS for Local Dev (`server.mjs`)

**File:** `server.mjs`, line 19

CORS is currently `app.use(cors())` which allows all origins. In local development, the Express server runs on port 4000 while the Vite dev server runs on port 5173 — this creates a cross-origin situation. Restrict explicitly to the known origins instead of leaving it open.

In production on Vercel, CORS middleware is irrelevant (same-origin requests), but setting it explicitly is good practice and documents intent.

**Before:**
```js
app.use(cors());
```

**After:**
```js
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:4000'];

app.use(cors({ origin: ALLOWED_ORIGINS }));
```

**`.env.example` update:** Add `ALLOWED_ORIGINS=https://bringcoffe.vercel.app`

---

## C — Proper Error Propagation (`server.mjs`)

**File:** `server.mjs`

`fetchRedAlertCities()` (lines 100–110) is the only fetch helper that catches errors silently and returns `[]`. This means the frontend can't distinguish "no data" from "API is down". Mirror the fix already applied to `fetchRedAlertHistory()` — remove the `.catch()` and let errors bubble up to the endpoint handler's existing `try/catch` which returns HTTP 500.

Note: the `.catch(() => '')` inside `requestRedAlert` itself (line ~76) is an intentional defensive read of HTTP error body text — it is NOT a silent swallow and should not be changed.

**Before (fetchRedAlertCities):**
```js
async function fetchRedAlertCities(limit = 500) {
  const data = await requestRedAlert('/api/stats/cities', { limit }).catch((error) => {
    console.error('[server] RedAlert cities error', error.message);
    return null;
  });
  if (!data) return [];
  const cities = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
  return cities;
}
```

**After:**
```js
async function fetchRedAlertCities(limit = 500) {
  const data = await requestRedAlert('/api/stats/cities', { limit });
  const cities = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
  return cities;
}
```

This is the only fetch helper that needs this change. All other `fetchX()` helpers already propagate errors or were fixed in the previous session.

---

## D — Remove Debug Console Logs (`main.js`)

**File:** `main.js`

Remove exactly 2 debug `console.log` statements that expose internal data in the browser console in production:

| Line | Statement | Reason to remove |
|------|-----------|-----------------|
| ~33 | `console.log('Rendering shelter results:', results?.length)` | Debug artifact |
| ~1183 | `console.log('Fetching coords for:', { fromCity, toCity, cleanFrom, cleanTo })` | Logs user city input |

`console.error` calls in `main.js` are acceptable — they surface real failures without exposing sensitive data.

---

## Files Changed

| File | Changes |
|------|---------|
| `server.mjs` | Remove key from warn msg; restrict CORS; remove silent catch in `fetchRedAlertCities` |
| `main.js` | Remove 2 debug `console.log` statements |
| `.env.example` | Add `ALLOWED_ORIGINS` entry |

## Verification

1. **Vercel env vars:** Add `REDALERT_API_KEY` in Vercel project settings and redeploy
2. **Timeline shows data:** Open https://bringcoffe.vercel.app/ → ציר התרעות shows bars (not empty)
3. **No debug logs:** Open browser devtools → Console → no `Rendering shelter results` or `Fetching coords` messages appear when using the app
4. **No key in Vercel logs:** Check Vercel function logs — the `console.warn` message should not contain the API key string
5. **Error state works:** Temporarily set `REDALERT_API_KEY` to a wrong value in Vercel → timeline should show "אין נתוני התרעות זמינים כרגע" instead of blank
