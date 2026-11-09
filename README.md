# Dashboard

A personal dashboard for the phone and a kitchen tablet: **Today**, **Money** (monthly bills checklist and budget), **Calendar** (Google, iCloud and HomeHub), **Health** (the Winter Arc diet tracker, training timer and weight chart), **To-dos**, and a **kitchen board** at `/board`.

- React, Vite and TypeScript, deployed on Vercel.
- Data lives in Upstash Redis (keys start with `pd:`), so the phone and the board stay in sync.
- One password, set in Vercel. Nothing private (password, calendar links, bills) is stored in this repository, which is public.

## Vercel settings

| Variable | What it is |
|---|---|
| `DASHBOARD_PASSWORD` | The sign-in password. Changing it signs every device out. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Set automatically when an Upstash Redis database is connected under **Storage**. It can be the same database as HomeHub. |
| `HOMEHUB_DISPLAY_KEY` | The `k=` value from HomeHub's kitchen-screen link. Brings in family events and bills (read-only). |
| `HOMEHUB_URL` | Optional, defaults to `https://homehub-five-azure.vercel.app`. |

Calendar links (Google "secret address in iCal format", iCloud public calendar links), TfL lines and stops, and the weather location are set in the app under **Settings**.

## Run locally

```bash
npm install
npm run dev    # http://localhost:5173, password "dev", data kept in memory
npm test
```

The Scriptable widget is in `widget/widget.js`. The spring 2026 challenge is kept at `/spring-2026/`.
