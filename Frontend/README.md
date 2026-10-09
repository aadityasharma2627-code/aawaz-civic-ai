# Awaaz — AI that hears Chandigarh

Civic complaint frontend for Chandigarh. Citizens report problems by **voice (Hindi/Punjabi/English), text or photo**; the backend classifies, prioritizes, routes and the citizen tracks resolution. Built with **React + Vite**, **React Router**, **IndexedDB offline queue** and the **browser Speech Recognition API**. PWA-ready.

> Frontend only. All classification, priority scoring, department routing and duplicate detection live in the backend. This app never hardcodes AI results.

---

## 1. Folder structure

```
awaaz-frontend/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── public/
│   ├── manifest.webmanifest     # PWA manifest
│   └── sw.js                    # Service worker (prod only, caches app shell)
└── src/
    ├── main.jsx                 # Entry; registers SW in production
    ├── App.jsx                  # Router + offline sync listener bootstrap
    ├── api/
    │   ├── client.js            # Centralized fetch wrapper (ApiError, BASE_URL from env)
    │   ├── complaints.js        # createComplaint / getComplaint / getComplaints / updateComplaintStatus
    │   └── dashboard.js         # getDashboardStats / getDashboardHotspots
    ├── data/
    │   ├── sectors.js           # Chandigarh sectors (extend here)
    │   └── labels.js            # Category/priority/status display mappings
    ├── hooks/
    │   ├── useOnline.js         # navigator.onLine tracking
    │   ├── useSpeechRecognition.js
    │   ├── usePendingCount.js   # Live count of device-stored complaints
    │   └── usePendingComplaints.js
    ├── layouts/
    │   ├── MainLayout.jsx       # Citizen chrome (header, offline banner, pending badge)
    │   └── AdminLayout.jsx
    ├── services/offline/
    │   ├── db.js                # IndexedDB promise wrapper ('pendingComplaints' store)
    │   ├── queue.js             # save/get/remove pending + change events
    │   └── sync.js              # Ordered flush to server; auto-runs on 'online'
    ├── routes/AppRoutes.jsx
    ├── components/
    │   ├── OfflineBanner.jsx    ├── PendingSyncBadge.jsx
    │   ├── PriorityBadge.jsx    ├── StatusBadge.jsx
    │   ├── StatusTimeline.jsx   ├── ComplaintDetails.jsx
    │   ├── FilterBar.jsx        └── Loading.jsx
    ├── pages/
    │   ├── HomePage.jsx
    │   ├── ReportPage.jsx           # Text + voice + photo + sector + location + submit
    │   ├── ReportSuccessPage.jsx    # AI analysis result, duplicate notice, timeline
    │   ├── TrackPage.jsx            # ID lookup + device-stored queue view
    │   ├── NotFoundPage.jsx
    │   └── admin/
    │       ├── AdminDashboardPage.jsx  # Stats + sector hotspots
    │       └── AdminQueuePage.jsx      # Filterable table + status updates
    ├── utils/
    │   ├── friendlyError.js     # Technical errors → citizen-friendly messages
    │   └── format.js
    └── styles/global.css
```

## 2. Installation

```bash
npm install
cp .env.example .env     # then edit .env
```

## 3. Run

```bash
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build locally
```

## 4. Environment variables

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend base URL. **No trailing slash. Never hardcode production URLs.** | `http://localhost:3000` |

## 5. API integration details

All calls are centralized in `src/api/`. The backend base URL comes only from `VITE_API_BASE_URL`.

| Endpoint | Used by |
|---|---|
| `POST /api/complaints` | `createComplaint(payload)` — ReportPage |
| `GET /api/complaints` | `getComplaints(filters)` — Admin queue |
| `GET /api/complaints/:id` | `getComplaint(id)` — Track page |
| `PATCH /api/complaints/:id/status` | `updateComplaintStatus(id, status)` — Admin queue |
| `GET /api/dashboard/stats` | Admin dashboard |
| `GET /api/dashboard/hotspots` | Admin dashboard |

**POST body** (photo is a base64 data-URL string or `null`):

```json
{ "text": "Sector 22 mein road par bada gadda hai", "language": "hi", "sector": "Sector 22", "latitude": null, "longitude": null, "photo": null }
```

**Expected response** — the frontend reads `result.complaint` plus `result.duplicate`:

```json
{ "success": true, "duplicate": false, "complaint": { "id": "AWZ-0001", "category": "pothole", "description": "...", "language": "hi", "sector": "Sector 22", "priority": "HIGH", "priority_score": 87, "department": "MC Roads", "status": "REPORTED", "report_count": 1 } }
```

The frontend defensively maps alternative key spellings (`total`/`total_complaints`, `count`/`open`, `data.complaint` vs bare object, `created_at`/`createdAt`) so minor contract drift doesn't break the UI — but the contract above is the target.

## 6. IndexedDB / offline architecture

- `services/offline/db.js` — promise wrapper over IndexedDB (`awaaz-offline` DB, `pendingComplaints` store, keyed by `localId`).
- `services/offline/queue.js` — `savePendingComplaint`, `getPendingComplaints`, `removePendingComplaint`, live count via a `window` event (`awaaz:pending-changed`).
- `services/offline/sync.js` — on network failure (`ApiError` with `status === 0`) the report page saves the payload locally and shows **"You're offline. Your complaint has been saved on this device."** with the pending count. `startSyncListener()` (booted in `App.jsx`) flushes the queue in submission order when `online` fires; synced items are deleted locally; a failure stops the pass so nothing is skipped. The header badge and Track page show pending count and a manual "Send now / sync" action.

**Saved locally ≠ submitted.** The UI always distinguishes the two states; nothing is ever faked as a server success.

## 7. Routes

| Route | Page |
|---|---|
| `/` | Landing (hero + Report → Understand → Route → Resolve) |
| `/report` | Complaint form (text / voice / photo / sector / language / optional geolocation) |
| `/report/success` | AI analysis result + status timeline (requires router state) |
| `/track` | Track by ID + device-stored queue |
| `/admin` | Dashboard stats + sector hotspots |
| `/admin/queue` | Filterable complaint queue with status updates |
| `*` | 404 |

## 8. Components created

`OfflineBanner`, `PendingSyncBadge`, `PriorityBadge`, `StatusBadge`, `StatusTimeline`, `ComplaintDetails`, `FilterBar`, `Loading` + layouts `MainLayout`, `AdminLayout`.

## 9. Features completed

- Full citizen flow: Home → Report → (voice/text/photo) → Sector → Submit → AI analysis → Complaint ID → Track
- Voice input via Speech Recognition (hi-IN primary) with unsupported-browser and permission-denied fallbacks
- Photo upload with preview, remove, 5 MB guard; optional browser geolocation (never mandatory)
- Duplicate-report notice with merged report count
- Status timeline (Reported → Assigned → Resolved) with timestamps when the backend supplies history
- Admin dashboard: totals, open, high-priority, merged; sector hotspot bars
- Admin queue: filters (department/priority/status/category/sector), optimistic status updates via PATCH
- Offline-first queue: IndexedDB save, pending count, auto-sync on reconnect, manual sync, zero silent loss
- Centralized API client with env-based base URL; friendly, non-technical error messages everywhere
- Accessibility: keyboard-navigable, focus states, aria labels, large touch targets, contrast-checked dark theme, reduced-motion support, Devanagari/Gurmukhi font stack
- PWA-ready: manifest + production-only service worker

## 10. Still requiring backend

- Real AI classification, priority scoring and department routing (POST /api/complaints)
- Duplicate detection and report merging
- Complaint persistence and status history (`status_history` array in GET responses)
- Dashboard stats and hotspot aggregation endpoints
- Photo storage (frontend currently sends a base64 data URL)

## 11. Connecting the Z AI backend

1. Backend serves the endpoints in section 5 (Express example below).
2. Set `VITE_API_BASE_URL` in `.env` to the backend origin (e.g. `http://localhost:3000`). Restart `npm run dev` after changing env vars — Vite only reads them at startup.
3. CORS: allow the Vite origin (`http://localhost:5173`) in development, e.g. `app.use(cors({ origin: ['http://localhost:5173'] }))`.
4. Inside `POST /api/complaints`, call the Z AI model for classification/priority, then persist and return the shape in section 5. The frontend needs no changes — it only sends `{ text, language, sector, latitude, longitude, photo }` and renders whatever the backend returns.

```js
// Express sketch (backend developer owns this)
app.post('/api/complaints', async (req, res) => {
  const { text, language, sector, latitude, longitude, photo } = req.body
  // 1. Z AI: classify + score priority + route department + detect duplicates
  // 2. Insert or merge complaint in DB
  // 3. Respond with { success, duplicate, complaint }
})
```
