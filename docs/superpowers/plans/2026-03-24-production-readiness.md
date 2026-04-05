# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove a hardcoded API key from source, restrict CORS to known origins, fix silent error swallowing in `fetchRedAlertCities`, and remove 2 debug `console.log` statements from the frontend.

**Architecture:** All changes are in `server.mjs` (Node/Express serverless function) and `main.js` (vanilla JS frontend). No new files, no new dependencies. The app is deployed on Vercel; in production the frontend and API are same-origin, so CORS changes only affect local dev. The `.env.example` gets one new entry to document the new env var.

**Tech Stack:** Node.js ESM, Express 4, Vite 7, Vercel serverless

---

## File Map

| File | What changes |
|------|-------------|
| `server.mjs` | Task 1: remove API key from warn; Task 2: add CORS restriction; Task 3: fix `fetchRedAlertCities` |
| `main.js` | Task 4: remove 2 debug `console.log` calls |
| `.env.example` | Task 2: add `ALLOWED_ORIGINS` entry |

---

## Task 1 — Remove API Key from `console.warn`

**Files:**
- Modify: `server.mjs:10–17`

The literal API key `pr_loOvnUUAGOmFCKmjWiWdotQdeygLLMcneLPIYIMrgAxOdvoUjSAhGmZFuWVtwJGX` appears on line 15 inside a `console.warn` message. Replace the entire block with a generic message.

- [ ] **Step 1: Edit `server.mjs` lines 10–17**

Replace:
```js
if (!REDALERT_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[server] REDALERT_API_KEY is not set. Real data will not load. ' +
    'Get an API key from https://redalert.orielhaim.com/docs/quick-start and ' +
    'start the server with REDALERT_API_KEY=pr_loOvnUUAGOmFCKmjWiWdotQdeygLLMcneLPIYIMrgAxOdvoUjSAhGmZFuWVtwJGX'
  );
}
```

With:
```js
if (!REDALERT_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[server] REDALERT_API_KEY is not set. Real data will not load. ' +
    'Get a key at https://redalert.orielhaim.com/docs/quick-start ' +
    'and set it in .env (locally) or Vercel environment variables (production).'
  );
}
```

- [ ] **Step 2: Verify the key string is gone**

Run:
```bash
grep -r "pr_loOvnUU" .
```
Expected: no output (zero matches)

- [ ] **Step 3: Commit**

```bash
git add server.mjs
git commit -m "security: remove hardcoded API key from console.warn message"
```

---

## Task 2 — Restrict CORS + Document `ALLOWED_ORIGINS`

**Files:**
- Modify: `server.mjs:19`
- Modify: `.env.example`

CORS is currently `app.use(cors())` — allows all origins. Restrict to a configurable list via `ALLOWED_ORIGINS` env var, defaulting to the two localhost ports used in local dev.

- [ ] **Step 1: Edit `server.mjs` line 19**

Replace:
```js
app.use(cors());
```

With (insert before `app.use(cors())`):
```js
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:4000'];

app.use(cors({ origin: ALLOWED_ORIGINS }));
```

- [ ] **Step 2: Add `ALLOWED_ORIGINS` to `.env.example`**

Current `.env.example`:
```
# Copy this file to .env and set your personal key.
REDALERT_API_KEY=
PORT=4000
```

Add line:
```
# Comma-separated allowed CORS origins. Defaults to localhost dev ports.
ALLOWED_ORIGINS=https://bringcoffe.vercel.app
```

- [ ] **Step 3: Verify server starts without errors**

```bash
node --env-file=.env server.mjs &
sleep 1
curl -s http://localhost:4000/api/alerts | head -c 100
kill %1
```
Expected: JSON output (array or error), not a crash

- [ ] **Step 4: Commit**

```bash
git add server.mjs .env.example
git commit -m "config: restrict CORS to ALLOWED_ORIGINS env var, document in .env.example"
```

---

## Task 3 — Fix Silent Error Swallow in `fetchRedAlertCities`

**Files:**
- Modify: `server.mjs:94–105`

`fetchRedAlertCities` wraps `requestRedAlert` in `.catch(() => null)` + `if (!data) return []` — silently returns an empty array on any API failure. Remove the catch so errors propagate to the endpoint handler's existing `try/catch` that returns HTTP 500.

Current code at lines 94–105:
```js
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
```

- [ ] **Step 1: Edit `server.mjs` to remove `.catch` and null guard**

Replace the entire function body with:
```js
async function fetchRedAlertCities(limit = 500) {
  const data = await requestRedAlert('/api/stats/cities', { limit });
  const cities = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
  return cities;
}
```

- [ ] **Step 2: Confirm the endpoint handler has a try/catch**

Find the `/api/cities` endpoint in `server.mjs`. It should already look like:
```js
app.get('/api/cities', async (req, res) => {
  try {
    ...
    const cities = await fetchRedAlertCities(limit);
    res.json(cities);
  } catch (err) {
    console.error('[server] /api/cities failed', err);
    res.status(500).json({ error: 'Failed to load cities' });
  }
});
```
If the `catch` block is missing, add it. It should already be there.

- [ ] **Step 3: Commit**

```bash
git add server.mjs
git commit -m "fix: propagate fetchRedAlertCities errors to endpoint handler instead of swallowing"
```

---

## Task 4 — Remove Debug `console.log` from `main.js`

**Files:**
- Modify: `main.js:33`
- Modify: `main.js:1183`

Two `console.log` calls log internal data to the browser console in production.

- [ ] **Step 1: Remove log at line 33**

Current line 33:
```js
  console.log('Rendering shelter results:', results?.length);
```

Delete this line entirely. The function `renderShelterResults` continues to work correctly without it.

- [ ] **Step 2: Remove log at line 1183**

Current line 1183:
```js
    console.log('Fetching coords for:', { fromCity, toCity, cleanFrom, cleanTo });
```

Delete this line entirely.

- [ ] **Step 3: Verify no remaining debug logs**

```bash
grep -n "console\.log" main.js
```
Expected: no output. (`console\.log` does not match `console.error` or `console.warn` — only literal `console.log` calls will appear.)

- [ ] **Step 4: Commit**

```bash
git add main.js
git commit -m "cleanup: remove debug console.log statements from production frontend code"
```

---

## Task 5 — Manual: Configure Vercel Environment Variables

This task cannot be scripted — it requires Vercel dashboard access.

- [ ] **Step 1: Add `REDALERT_API_KEY` in Vercel**

1. Go to https://vercel.com → your project → **Settings** → **Environment Variables**
2. Add: `REDALERT_API_KEY` = `<value from your local .env>`
3. Set scope: **Production** (and optionally Preview)
4. Save

- [ ] **Step 2: Add `ALLOWED_ORIGINS` in Vercel**

Add: `ALLOWED_ORIGINS` = `https://bringcoffe.vercel.app`
Set scope: **Production**

- [ ] **Step 3: Redeploy**

Either push a commit (tasks 1–4 above) or manually trigger a redeploy from the Vercel dashboard.

- [ ] **Step 4: Verify timeline shows data**

Open https://bringcoffe.vercel.app/ → ציר התרעות should show bars with alert data, not an empty chart.

- [ ] **Step 5: Verify no key in logs**

In Vercel dashboard → **Functions** → check recent invocation logs. The `console.warn` message (if it appears) should contain no API key value.

---

## Verification Summary

| Check | How | Expected |
|-------|-----|----------|
| No API key in source | `grep -r "pr_loOvnUU" .` | No output |
| No debug logs in frontend | `grep -n "console\.log" main.js` | No output |
| CORS restricted | Check `server.mjs` line ~19 | `cors({ origin: ALLOWED_ORIGINS })` |
| Error propagation fixed | Check `fetchRedAlertCities` | No `.catch()`, no `if (!data) return []` |
| Timeline works in prod | Open app in browser | ציר התרעות shows data |
| Vercel logs clean | Vercel dashboard → Functions | No key string in logs |
