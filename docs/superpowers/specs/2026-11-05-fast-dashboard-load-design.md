# Fast Dashboard Load

## Intent

The EPA Punjab dashboard must open in a few seconds and stay fast as the verified-posts table grows. Today every login downloads the whole archive into React before the first screen can render. That wait already exceeds 30 seconds at ~2,000 posts and will grow with ingest.

Operators still need correct full-archive totals, charts, filters, and a paginated feed. They do not need every post in the browser on first paint.

## Why now

Production waterfall on `epasocialx.duckdns.org` (2026-11-05):

- JS bundle 1.35 MB uncompressed, 50.8s
- `GET /api/posts?limit=2000` 1.36 MB uncompressed, 36.4s
- noise 250 rows, 8.3s
- audit 250 rows, 4.7s

`App.jsx` `initSync` waits on `getAllStoredPosts()` (pages of 2,000), excluded noise, and audit before the dashboard can use data. KPIs, charts, feed filters, and the navbar AQI badge are all computed from that in-memory array. The Posts page already shows 12 cards; the API still returns the full table first.

## Goals

- First authenticated dashboard paint does not wait on the full `posts` table.
- Dashboard KPIs, analytics charts, and filter dropdowns stay accurate for the whole archive (or the operator-selected date/time scope).
- The Posts feed, DB search, noise, and audit load a page at a time.
- Transfer size for a dashboard visit stays roughly constant as the archive grows from thousands to tens of thousands of posts.
- Origin gzip shrinks JSON (and static assets when the client accepts gzip) on the Cloudflare hop.

## Non-goals

- Replacing MUI, Argon layout, or Chart.js.
- Changing ingest, scraping, sentiment engines, or RBAC.
- Infinite scroll.
- A public CDN or HTTP cache invalidation scheme.
- Downloading the full archive in the background after first paint.

## Anti-goals

- Showing a partial count as if it were the full archive.
- Calling `getAllStoredPosts()` (or any 2,000-row loop) on login, settings reload, or route change.
- Returning unbounded `GET /api/posts` lists. The existing `POST_LIST_MAX_LIMIT` cap stays.

## Constraints

- Stack stays Python `serve.py` + SQLite WAL + React 19 Vite dashboard.
- `database.get_all_posts(...)` keeps returning a Python list. HTTP JSON for `/api/posts` changes (see below).
- Existing permissions: `dashboard.view`, `posts.view`, `analytics.view`, `noise.view`, `audit.view`.
- Posts feed first fetch is the latest **100** matching posts (`POST_LIST_DEFAULT_LIMIT`). The grid still shows 12 cards per page and requests the next 100 when the operator pages past that window. Dashboard highlight cards are the 12 highest-engagement posts inside that latest-100 window. Analytics viral table uses 10. DB search uses 50.
- Time-of-day buckets match the current UI: morning 06–12, afternoon 12–18, evening 18–24, night 00–06. Interpret those hours in Asia/Karachi (UTC+5). This is a builder call: the app is Punjab EPA, not browser-local.
- List payloads omit `authorBanner`, `authorDescription`, and `authorFollowing`. PostCard and charts do not use them. Ingest/pipeline code may still write them to SQLite.

## Approaches

1. **Fast first screen, server totals (chosen).** Each view fetches a page plus `/api/stats`. Load stays bounded as the table grows. Filter/sort that today run in the browser move to SQL.
2. **Slim the full download.** Gzip and drop unused fields. 2,000 posts get faster; 50,000 posts still block first paint.
3. **Background hydrate.** Paint 12 posts, then keep paging the rest into memory. First paint is fast; RAM and later visits still grow with the table.

Option 1 is the only approach that stays fast at archive scale. The operator chose it.

## How it works

### App shell

`dashboard/src/App.jsx` stops loading posts, noise, and audit on mount.

On login it loads only:

- `GET /api/settings` for `dataSource`
- `GET /api/stats` for navbar peak-AQI alert and any shell counts

Views own their data. Restoring or excluding a post updates that view locally and, if the operator is on Dashboard, the next stats fetch. Settings “reload from DB” refetches stats (and the active view’s page), not the whole table.

Route views load with `React.lazy` / `Suspense` so login does not parse Analytics, Noise, Users, and Roles up front.

### `GET /api/stats`

Keep current KPIs and extend them so Dashboard and Analytics do not scan posts:

Already present: `totalPosts`, `peakAqi`, `avgAqi`, `duplicatesMerged`, `noiseRemoved`, `activeNoiseCount`, `restoredPostsCount`, `learnedRulesCount`, `cityCounts`, `categoryCounts`.

Add:

- `severityCounts` — map of `severity_code` → count
- `sentimentCounts` — map of `sentiment` label → count
- `dateCounts` — list of `{ date: "YYYY-MM-DD", count }` for distinct UTC calendar dates present in `created_at`, newest first, capped at 180 days
- `peakAqiCity` — city of the post that holds `peakAqi` (navbar copy). If several posts share the peak, the newest one wins.

Optional query params, same meaning as posts filters: `date`, `timeOfDay`. Dashboard date/time chips use these.

**Builder call — scoped vs unscoped stats fields.** A single scoped `dateCounts` would empty the date dropdown after the first chip click. Split the payload:

Always unscoped (ignore `date` / `timeOfDay`):

- `archiveTotalPosts` — full `COUNT(*)` on `posts`
- `dateCounts`
- pipeline counters: `duplicatesMerged`, `noiseRemoved`, `activeNoiseCount`, `restoredPostsCount`, `learnedRulesCount`
- `auditStatusCounts` — `{ "KEPT": n, "DUPLICATE_MERGED": n, "REMOVED": n }` for Audit tabs

Scoped when `date` / `timeOfDay` are set, otherwise full archive:

- `totalPosts`, `peakAqi`, `avgAqi`, `peakAqiCity`, `cityCounts`, `categoryCounts`, `severityCounts`, `sentimentCounts`

Analytics calls stats with no date filter. Dashboard pipeline cards stay all-time, matching today’s UI (they count audit/noise rows, not `posts.created_at`).

Do not embed post bodies in stats.

### `GET /api/posts`

Response envelope (breaking for the HTTP client; `get_all_posts` in Python stays a list):

```json
{
  "items": [ { "...list post..." } ],
  "total": 1840,
  "limit": 12,
  "offset": 0
}
```

Query params already supported: `search`, `city`, `severity`, `category`, `sortBy`, `order`, `limit`, `offset`.

Add:

- `date=YYYY-MM-DD` — `created_at` on that UTC calendar date
- `timeOfDay=morning|afternoon|evening|night` — Asia/Karachi hour buckets above
- `media=media|text` — `has_media` 1 or 0
- `verified=1` — `author_verified` true (Search “People” tab)

Default `limit` remains `POST_LIST_DEFAULT_LIMIT` (100) when omitted. UI always sends an explicit limit. Max stays `POST_LIST_MAX_LIMIT` (2500).

`total` is `COUNT(*)` with the same WHERE clause as `items`.

Add `count_posts(...)` in `backend/database.py` sharing the filter SQL with `get_all_posts` so the two cannot drift.

### List post shape

`row_to_post_dict` used by the public list drops `authorBanner`, `authorDescription`, `authorFollowing`. Dedup/ingest internals that need those columns keep reading SQLite directly. Builder may add `row_to_list_post_dict` rather than silently shrinking the ingest mapper.

### Who fetches what

| Screen | Requests |
|---|---|
| Dashboard | `GET /api/stats?date&timeOfDay`, `GET /api/posts?sortBy=newest&limit=100` with the same date/time; cards show the 12 highest-engagement rows in that window |
| Posts feed | `GET /api/stats` (cities/categories/dates for FilterBar), `GET /api/posts` with the **full-archive** active filters, `limit=100`, `offset` aligned to the current 12-card page window |
| Analytics | `GET /api/stats` (severity/city/category/sentiment), `GET /api/posts?sortBy=engagement&limit=10` for the viral table |
| Search, DB mode | `GET /api/posts?search=` with tab mapping below, `limit=50`, `offset` for further pages |
| Search, live X | `POST /api/x/search` without `allPosts` (see ingest/search responses) |
| Noise | fetch on that route only; envelope `{ items, total, limit, offset }`; tab/search/status/offset on the server; page size 12 |
| Audit | fetch on that route only; envelope `{ items, total, limit, offset }`; `status` and `search` query params; tab counts from `stats.auditStatusCounts`; page size 20 |

FilterBar “X of Y” uses filtered posts `total` as X and `stats.archiveTotalPosts` as Y.

Changing page or filters refetches. Debounce search input at 300ms. Builder owns the exact React state; do not keep a global `posts` array in `App.jsx`.

**Builder call — Search DB tabs.** Each tab is a new request, not a client filter of 50 rows:

- Top → `sortBy=engagement`
- Latest → `sortBy=newest`
- People → `verified=1`
- Media → `media=media`

`total` is the match count for that tab. “Found N” uses it.

**Builder call — ingest and live search responses.** `POST /api/ingest` and `POST /api/x/search` stop returning `cleanPosts` / `allPosts`. Keep `newlyAddedPosts` / `newPosts` (this batch only), this-batch `noisePosts` and `auditLog`, and `stats`. After success the active view refetches its page and stats. Replace-mode ingest refetches; it does not swap in a full table dump.

Server-side `get_posts_for_dedup()` during ingest stays (merge still needs the archive in the pipeline). That path is ingest latency, not dashboard first paint.

**Builder call — IngestModal preview.** Preview runs `processRawPosts(file, [])` (file-local duplicates only). Remove the `currentPosts` prop. Confirm copy states that matches against the live archive are applied on confirm. The server merge remains the source of truth. No preview endpoint that loads the table.

### Origin gzip

`send_json` compresses with stdlib `gzip` when `Accept-Encoding` includes `gzip`, sets `Content-Encoding: gzip`, and writes the compressed bytes. Same for static files served from `dashboard/dist` when the file is JS/CSS/HTML/JSON/SVG and larger than 1 KB.

### Indexes

Reuse existing `idx_posts_created_desc` and filter indexes. If the date/time WHERE clause cannot use them, add one index. Do not add indexes speculatively.

## What the operator sees

After login, Dashboard appears with KPI cards, city breakdown, and 12 highest-engagement posts. Date and time chips still work; they refetch stats and the 12 cards. Posts feed page 2 hits the API. Analytics charts match SQL `GROUP BY`, not a truncated client sample.

A dashboard visit transfers one small stats JSON plus at most 100 latest posts, not 1.3 MB of archive. City, date, and search filters on the Posts page always query SQLite for the full matching set; the 100-row window is only the page buffer.

## Out of scope for this change, follow-up if still slow

- Further MUI tree-shaking or replacing Nucleo icon CSS.
- HTTP caching of `/api/stats`.
- Virtualized grids.

## Tests the builder must pin

- `GET /api/posts?limit=12` returns the envelope, `len(items)==12` when the table has more, and `total` equals the full matching count.
- Filtered `total` matches `COUNT` for city/date/media/`verified`.
- `GET /api/stats` includes the new breakdowns; with `date=` scoped `totalPosts` matches posts `total` for that date, and `archiveTotalPosts` / `dateCounts` stay full-archive.
- `POST /api/ingest` and `POST /api/x/search` bodies have no `cleanPosts` / `allPosts` keys (or they are empty lists).
- `GET /api/audit` and `GET /api/noise` return envelopes; tab counts do not equal `len(items)` when the table is larger than the page.
- Dashboard/App source no longer contains `getAllStoredPosts`.
- Gzip: a client that sends `Accept-Encoding: gzip` receives compressed JSON with the correct header; a client that does not still gets raw JSON.
- Existing ingest, RBAC, and `get_all_posts` Python-list tests keep passing.

## Left to the builder

- Exact React hooks and loading/error placeholders (keep the existing Alert pattern).
- Whether filter SQL is a shared helper or duplicated COUNT/SELECT with a test that they stay aligned.
- How `React.lazy` is wired in `App.jsx`.
- Gzip minimum size and whether to skip already-compressed images.
- Whether audit `status` is one query param or the existing list plus `search`.
