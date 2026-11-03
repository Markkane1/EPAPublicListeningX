# EPA Punjab Social Listening

An enterprise-grade social listening and environmental intelligence platform built for the Punjab Environmental Protection Agency (EPA). It ingests, filters, deduplicates, and analyzes social posts from X (Twitter) regarding air quality, smog emergencies, and environmental public discourse across Pakistani Punjab.

Styled strictly with the **Argon Dashboard 2 Material UI** design system (`C:\Users\Asif\Downloads\Compressed\argon-dashboard-material-ui-v1.0.0`), using authentic typography, color palettes, gradients, cards, and charts.

---

## 🎯 Official Search Query & Criteria
```text
(AQI OR "air quality" OR pollution OR smog or "clean air") 
(Lahore or gujranwala OR Pakistan OR Punjab) 
-Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -india -india's 
-from:DelhiPollution -from:@ANI -from:@EPCCDpunjab -from:@EPAPunjab lang:en
```

### Filtering & Cleaning Rules Enforced:
1. **Strict Negative Query Exclusions**:
   - Indian domestic pollution discourse & political blame campaigns (`-Delhi`, `-NCR`, `-Haryana`, `-Noida`, `-Gurugram`, `-India`, `-CAQM`, `-Faridkot`, `-CM Mann`, `-BJP`, `-AAP Punjab`, `-Diwali`).
   - Query-excluded accounts: `-from:DelhiPollution`, `-from:@ANI`, `-from:@EPCCDpunjab`, `-from:@EPAPunjab`, `@PSCAsafecities`.
   - Gurmukhi script filter (associated with Indian Punjab domestic affairs).
2. **Noise & Off-Topic Removal**:
   - Cricket sports tournaments & match schedules (BCCI, PCB, Champions Trophy).
   - Maritime shipbreaking (Gadani ship breaking, beached vessel steel salvaging).
   - Fast food reviews, pizza deals, flame wars, ethnic trolling.
3. **Target Geographic & Topic Verification**:
   - Focus on Pakistani Punjab: Lahore, Gujranwala, Faisalabad, Multan, Attock, Rawalpindi, Islamabad, Sialkot.
   - Core air quality keywords: AQI, smog, clean air, PM2.5, respiratory distress, anti-smog squad, stubble burning.
4. **Deduplication Engine**:
   - Exact ID duplicate suppression.
   - Semantic near-duplicate merging (normalizes text, merges media attachments and highest engagement metrics into the primary record).
5. **Full Enrichment**:
   - AQI Value Extraction (`aqi_value`)
   - US EPA Severity Classification (`Hazardous`, `Very Unhealthy`, `Unhealthy`, `Moderate`, `Good`)
   - City Extraction (`city_detected`)
   - Topic Categorization (`Public Health Alert`, `Government Action`, `AQI Measurement`, `Stubble Burning`, `Citizen Outcry`)
   - Sentiment Analysis (`Critical / Alarmed`, `Positive`, `Concerned`, `Neutral`)
   - Full Post Previews & direct clickable links (`postUrl`) to original X.com posts.

---

## 🏗️ Architecture & Tech Stack

```text
EPA X Scrapper/
├── scrapper/                      # 𝕏 Chrome Extension & Scraper Engine
│   ├── manifest.json              # Extension Manifest V3 configuration
│   ├── background.js              # Background service worker & badge counter
│   ├── content.js                 # Content script & draggable floating panel
│   ├── injected.js                # In-page network interceptor (GraphQL)
│   ├── parser.js                  # GraphQL & DOM entity parser
│   ├── exporter.js                # Universal exporter (CSV, JSON, Excel .xls)
│   ├── overlay.css                # Scraper floating UI & preview table styles
│   ├── popup.html / popup.js      # Toolbar popup interface
│   ├── icons/                     # Official extension branding icons
│   ├── Query.txt                  # Official EPA target search query
│   ├── tools/                     # Extraction & raw analysis scripts
│   ├── sample_data/               # Raw exported scrape batches (batch 1-5)
│   └── README.md                  # Extension installation and usage guide
├── backend/                       # Python Clean Architecture Services
│   ├── database.py                # SQLite repository (WAL mode, posts, settings, audit)
│   ├── x_api_client.py            # X (Twitter) API v2 client (/2/tweets/search/recent)
│   └── service.py                 # Unified orchestration service
├── dashboard/                     # React + MUI + Argon Dashboard 2
│   ├── src/
│   │   ├── components/
│   │   │   ├── DirectSearchCard/  # Live X API direct keyword search & fetch widget
│   │   │   ├── PostCard/          # Full X.com post preview with clickable link
│   │   │   ├── FilterBar/         # Multifaceted search & filter controls
│   │   │   ├── Lightbox/          # Full-res image attachment viewer
│   │   │   └── IngestModal/       # Drag-and-drop live JSON ingestion modal
│   │   ├── views/
│   │   │   ├── DashboardView/     # Executive overview & smog emergency alerts
│   │   │   ├── PostsView/         # Direct search, live fetch & posts feed
│   │   │   ├── AnalyticsView/     # Deep charts & viral leaderboard
│   │   │   ├── AuditView/         # Full pipeline audit ledger
│   │   │   └── SettingsView/      # X API credentials, mode toggle & SQLite DB status
│   │   ├── services/
│   │   │   ├── api.js             # Client REST service (/api/*)
│   │   │   └── pipeline.js        # Client-side ingestion & deduplication engine
│   │   ├── data/                  # Seed datasets
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js             # Vite config with /api proxy to Python backend
├── data/
│   ├── epa_intelligence.db        # Production SQLite 3 database (WAL mode)
│   ├── raw_scraped_posts.json     # 252 raw scraped posts
│   ├── cleaned_epa_posts.json     # 183 verified clean posts
│   ├── cleaned_epa_posts.csv      # Exported CSV dataset
│   └── cleaning_audit.json        # Pipeline audit trail
├── pipeline.py                    # Standalone CLI Python pipeline
├── serve.py                       # Production SPA server & REST API Gateway
└── Query.txt                      # Original user query reference
```

---

## 🚀 Running the Application

### 1. Production Server Launcher (SPA + REST API Gateway)
```powershell
python serve.py
```
- Serves the compiled Argon Dashboard 2 at **`http://localhost:8080/`**.
- Serves REST API endpoints at **`http://localhost:8080/api/`**:
  - `GET /api/settings` & `POST /api/settings` (Switch between File Ingestion and Live X API; manage credentials)
  - `GET /api/queries` & `POST /api/queries` (Manage multiple query versions, activate milestones, view evolution ledger)
  - `POST /api/queries/activate`, `update`, `delete` (Version control operations for search constraints)
  - `POST /api/x/test-connection` (Verify X API Bearer Token / API keys)
  - `POST /api/x/search` (Direct Keyword Search: calls X API v2, enriches, deduplicates, and saves into SQLite)
  - `GET /api/posts` (Query stored posts with multifaceted filters from SQLite)
  - `POST /api/ingest` (File batch ingestion into SQLite)
  - `GET /api/stats` & `GET /api/audit` (Database summary KPIs & audit ledger)
- Stores persistent records in **`data/epa_intelligence.db`** (SQLite WAL mode).

### 2. Role-Based Access Control (RBAC) & Authentication
The portal enforces end-to-end RBAC with cryptographic PBKDF2-HMAC-SHA256 password hashing and Cloudflare Turnstile bot protection:

| Account Role | Username | Default Password | Clearance & Permissions |
|---|---|---|---|
| **Super Administrator** | `admin` | `EPAadmin2026!` | Full unmetered access to all 20 system permissions, User CRUDs, Role CRUDs, settings, and live scraping. |
| **Lead Environmental Analyst** | `analyst` | `EPAanalyst2026!` | Access to Dashboard Overview, Verified Posts Feed, Deep Analytics, Deduplication Audit, Noise Pool, and CSV/JSON Export. |
| **Field Auditor & Moderator** | `auditor` | `EPAauditor2026!` | Operational access to view feeds, review audit logs, moderate noise pool, exclude/restore posts, and manage deterministic filter rules. |
| **Public Citizen / Observer** | `viewer` | `EPAviewer2026!` | Read-only observation of public dashboard summaries, verified posts feed, and general analytical charts. |

#### RBAC API Endpoints:
- `POST /api/auth/login` — Login with Cloudflare Turnstile token validation and 7-day session token issuance.
- `POST /api/auth/signup` — Public registration with Cloudflare Turnstile, defaulting to `viewer` role.
- `POST /api/auth/logout` — Invalidate session token.
- `GET /api/auth/me` — Retrieve active profile, assigned role, and granted permission codes.
- `GET /api/users` & `POST /api/users` — Paginated user registry search, filtering, and creation.
- `PUT /api/users/<id>` & `DELETE /api/users/<id>` — Edit user details, assign roles, toggle active status, and delete accounts.
- `GET /api/roles` & `POST /api/roles` — Role policy registry and custom role creation.
- `PUT /api/roles/<id>` & `DELETE /api/roles/<id>` — Modify role display names, descriptions, and assign module permissions.
- `GET /api/permissions` — Master list of 20 system permissions grouped by module.

### 3. Frontend Development Mode (Live reload with API Proxy)
```powershell
cd "d:\web temps\EPA X Scrapper\dashboard"
npm run dev
```
Open **`http://localhost:5173`** in your browser. All `/api/*` calls are proxied automatically to `http://localhost:8080`.

### 3. Production Build
```powershell
cd "d:\web temps\EPA X Scrapper\dashboard"
npm run build
```

### 4. Running Python CLI Pipeline
```powershell
python pipeline.py --input data/raw_scraped_posts.json --output data/cleaned_epa_posts.json --audit data/cleaning_audit.json
```

---

## 📊 Summary of Processed Data
- **Total Scraped Posts Ingested**: `252`
- **Verified Clean Posts**: `183` (72.6% precision yield)
- **Duplicates Merged**: `9` (Media & engagement metrics consolidated)
- **Noise Excluded**: `60` (Delhi/India domestic pollution, off-topic cricket, Gadani ships, etc.)
- **Peak AQI Recorded**: `606` (Hazardous emergency in Lahore)
- **Average AQI**: `361.1` (Severe regional hazard)
- **Top Districts**: Lahore (127), Gujranwala (7), Faisalabad (3), Multan (2), Attock (1)
