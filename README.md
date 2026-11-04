# 🌍 EPA Punjab Social Listening & Environmental Intelligence

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Material UI](https://img.shields.io/badge/Design-Argon%20Dashboard%202%20MUI-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Database](https://img.shields.io/badge/Database-SQLite%20WAL-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Security](https://img.shields.io/badge/Security-RBAC%20%2B%20Turnstile-success)](#-role-based-access-control-rbac)
[![Test Suite](https://img.shields.io/badge/Tests-pytest-brightgreen)](#-testing--audit-suite)

An enterprise-grade social listening, real-time surveillance, and environmental intelligence platform engineered for the **Punjab Environmental Protection Agency (EPA)**. The platform ingests, filters, deduplicates, and analyzes social discourse from **𝕏 (Twitter)** regarding air quality, smog emergencies, agricultural stubble burning, and public health across Pakistani Punjab.

Styled strictly according to the **Argon Dashboard 2 Material UI** design system with responsive typography, glassmorphism gradients, data-dense cards, and interactive trend charts.

---

## 📌 GitHub Repository Details

### Short Description (For GitHub 'About' field)
> Enterprise social listening & air quality intelligence platform for Punjab EPA. Features dual ingestion (Chrome Extension GraphQL & X API v2), smart deduplication, noise filtering, AQI extraction, and RBAC on Argon Dashboard 2 Material UI.

### Recommended GitHub Topics (Tags)
```text
air-quality, social-listening, punjab-epa, smog-detection, aqi-monitor, twitter-scraper, react19, material-ui, argon-dashboard, python, sqlite-wal, rbac, cloudflare-turnstile, sentiment-analysis
```

---

## 🎯 Official Search Query & Filtering Strategy

The system monitors public discourse using high-precision negative filtering rules tailored for the Punjab region:

```text
(AQI OR "air quality" OR pollution OR smog OR "clean air") (Lahore OR Gujranwala OR Faisalabad OR Multan OR Rawalpindi OR Islamabad OR Sialkot OR Punjab OR Pakistan) -Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -from:DelhiPollution -from:ANI -from:EPCCDpunjab -from:EPAPunjab lang:en
```

### Multi-Stage Processing Pipeline:
1. **Cross-Border & Political Noise Exclusions**:
   - Suppresses cross-border Indian pollution discourse, regional blame campaigns, and political hashtags (`-Delhi`, `-NCR`, `-Haryana`, `-Noida`, `-Gurugram`, `-India`, `-CAQM`, `-Faridkot`, `-CM Mann`, `-BJP`, `-AAP Punjab`, `-Diwali`).
   - Filters out non-relevant official handles (`-from:DelhiPollution`, `-from:@ANI`, `-from:@EPCCDpunjab`, `-from:@EPAPunjab`, `@PSCAsafecities`).
   - Rejects non-target scripts (e.g. Gurmukhi characters associated with Indian domestic affairs).
2. **Commercial & Irrelevant Discourse Suppression**:
   - Sports tournaments & cricket schedules (BCCI, PCB, Champions Trophy, cricket weather checks).
   - Maritime shipbreaking (Gadani vessel dismantling and steel salvaging).
   - Fast food reviews, fast food delivery promotions, and ethnic flame wars.
3. **Target Geographic Clustering**:
   - Prioritizes Pakistani Punjab industrial and urban hubs: **Lahore, Gujranwala, Faisalabad, Multan, Rawalpindi, Islamabad, Attock, and Sialkot**.
4. **Intelligent Deduplication & Merge**:
   - Reconciles duplicate post IDs and merges semantic near-duplicates (normalizing text whitespace/casing while consolidating media attachments and peak engagement metrics).
5. **Entity Enrichment & NLP Classification**:
   - **AQI Value Extraction**: Numerical index parsing with standard US EPA risk levels (*Hazardous*, *Very Unhealthy*, *Unhealthy*, *Moderate*, *Good*).
   - **Topic Taxonomy**: Automatic tagging (*Public Health Alert*, *Government Action*, *AQI Measurement*, *Stubble Burning*, *Citizen Outcry*).
   - **Sentiment Scoring**: Rule-based VADER sentiment analysis (*Critical / Alarmed*, *Concerned*, *Neutral*, *Positive*).
   - **Attribution & Evidence**: Preserves high-res author avatars, verified status badges, media links, and direct status URLs on `x.com`.

---

## 🏗️ Architecture & Repository Layout

```text
EPA X Scrapper/
├── .env                              # Active environment configuration (gitignored)
├── .envexample                       # Environment configuration template
├── .env.example                      # Aliased environment template
├── .gitignore                        # Git exclusion rules
├── Query.txt                         # Master EPA search query
├── pipeline.py                       # Standalone CLI Python pipeline engine
├── serve.py                          # Production SPA & REST API Gateway server
├── package.json                      # Workspace root task runner
│
├── scrapper/                         # 𝕏 Chrome Extension & Scraper Engine (Manifest V3)
│   ├── manifest.json                 # Extension configuration
│   ├── background.js                 # Service worker & badge notifications
│   ├── content.js                    # Content script & draggable UI overlay
│   ├── injected.js                   # In-page network interceptor (GraphQL)
│   ├── parser.js                     # Tweet entity parser & cleaner
│   ├── exporter.js                   # Client-side export (CSV, JSON, XLS)
│   ├── overlay.css                   # Scraper UI styling
│   ├── popup.html / popup.js         # Extension action popup
│   ├── icons/                        # EPA branding assets
│   ├── tools/                        # Raw batch extraction utilities
│   └── sample_data/                  # Raw batch exports (Batches 1-5)
│
├── backend/                          # Python Clean Architecture Services
│   ├── database.py                   # SQLite repository (WAL mode, schema, RBAC)
│   ├── service.py                    # Unified business logic & permission checks
│   ├── x_api_client.py               # Official X API v2 client
│   ├── sentiment_engine.py           # NLP & VADER sentiment scoring
│   └── tests/                        # Comprehensive test & audit suites
│       ├── comprehensive_rbac_audit.py
│       ├── test_api_endpoints.py
│       ├── test_e2e_http.py
│       └── test_rbac_init.py
│
├── dashboard/                        # React 19 + MUI + Argon Dashboard 2
│   ├── src/
│   │   ├── components/
│   │   │   ├── DirectSearchCard/     # Direct keyword search & live fetch card
│   │   │   ├── FilterBar/            # Multi-parameter filter controls
│   │   │   ├── IngestModal/          # Drag-and-drop batch ingestion modal
│   │   │   ├── Lightbox/             # Full-resolution image preview lightbox
│   │   │   └── PostCard/             # Interactive post preview with author verification
│   │   ├── views/
│   │   │   ├── DashboardView/        # Executive metrics & smog alerts
│   │   │   ├── PostsView/            # Verified feed & real-time search
│   │   │   ├── AnalyticsView/        # Trends, severity charts & leaderboards
│   │   │   ├── AuditView/            # Deduplication ledger & audit trails
│   │   │   ├── NoiseView/            # Excluded posts pool & rule learner
│   │   │   ├── UsersView/            # User account management & RBAC assignments
│   │   │   ├── RolesView/            # Role definitions & permission matrix
│   │   │   └── SettingsView/         # X API credentials & query version control
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global authentication & permission state
│   │   ├── services/
│   │   │   ├── api.js                # Frontend REST API client
│   │   │   └── pipeline.js           # Client-side deduplication & ingestion
│   │   ├── App.jsx                   # Layout routing & view controller
│   │   └── main.jsx                  # React application entrypoint
│   └── vite.config.js                # Vite build config with /api proxy
│
└── data/
    ├── epa_intelligence.db           # Persistent SQLite WAL database
    ├── raw_scraped_posts.json        # Raw captured posts
    ├── cleaned_epa_posts.json        # Verified clean dataset
    ├── cleaned_epa_posts.csv         # Structured tabular dataset
    └── cleaning_audit.json           # Execution audit ledger
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

### 2. Environment Configuration
Copy the template environment file to create your local `.env`:

```powershell
Copy-Item .env.example .env
```

Edit [`.env`](.env) to configure custom ports, secure operator passwords, X API developer keys, or Cloudflare Turnstile keys. Sensitive credentials inside `.env` are strictly gitignored. Never commit `.env` or credential files to version control.

See [SECURITY.md](SECURITY.md) for detailed security architecture, operational guidelines, and responsible disclosure policy.

### 3. Launching the Production Gateway
Runs the integrated Python server serving both the pre-built SPA frontend and the REST API Gateway:

```powershell
python serve.py
```
- **Web Portal**: [http://localhost:8080/](http://localhost:8080/)
- **REST API Base**: [http://localhost:8080/api/](http://localhost:8080/api/)
- **Database**: Local SQLite 3 WAL file at `data/epa_intelligence.db`

### 4. Running the Frontend in Development Mode
For live-reload frontend development with automatic backend API proxying:

```powershell
cd dashboard
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/). API requests to `/api/*` are automatically forwarded to port `8080`.

### 5. Building the Frontend
To build optimized production assets for the SPA server:

```powershell
cd dashboard
npm run build
```

### 6. Standalone CLI Pipeline Execution
Process raw tweet collections headlessly via the terminal:

```powershell
python pipeline.py --input data/raw_scraped_posts.json --output data/cleaned_epa_posts.json --audit data/cleaning_audit.json
```

---

## 🔐 Role-Based Access Control (RBAC)

The portal enforces enterprise-grade RBAC with **PBKDF2-HMAC-SHA256** password hashing (100,000 iterations + cryptographic salt), 7-day session tokens, and Cloudflare Turnstile bot verification.

### Default System Accounts:

Initial default passwords are set via `.env` (configured before first database seeding) and hashed using PBKDF2-HMAC-SHA256 (100,000 rounds + unique salt). **Change all passwords immediately after initial deployment via the user management interface.**

| Role | Username | Initial Password Source | Clearance & Capabilities |
|---|---|---|---|
| **Super Administrator** | `admin` | Set in `.env` (`DEFAULT_ADMIN_PASSWORD`) | Unrestricted access across all 20 system permissions: User CRUD, Role CRUD, system settings, and live scraping. |
| **Lead Environmental Analyst** | `analyst` | Set in `.env` (`DEFAULT_ANALYST_PASSWORD`) | Dashboard KPIs, verified posts feed, deep analytical charts, deduplication audit, noise pool review, and CSV/JSON export. |
| **Field Auditor & Moderator** | `auditor` | Set in `.env` (`DEFAULT_AUDITOR_PASSWORD`) | Operational feed access, audit trail review, noise pool moderation, manual post restoration/exclusion, and deterministic rule creation. |
| **Public Citizen / Observer** | `viewer` | Set in `.env` (`DEFAULT_VIEWER_PASSWORD`) | Read-only observation of public dashboard cards, verified posts feed, and general analytical trends. |

---

## 📡 REST API Reference

All protected endpoints require a valid Bearer token (`Authorization: Bearer <token>`).

### Authentication & Profiles
| Method | Endpoint | Description | Clearance |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & issue 7-day session token | Public |
| `POST` | `/api/auth/signup` | Registration is closed (HTTP 403) | Public |
| `POST` | `/api/auth/logout` | Revoke active session token | Authenticated |
| `GET` | `/api/auth/me` | Retrieve active profile and granted permissions | Authenticated |

### Environmental Intelligence & Feeds
| Method | Endpoint | Description | Clearance |
|---|---|---|---|
| `GET` | `/api/posts` | Paginated search with filters (city, severity, sentiment, date) | `posts.view` |
| `POST` | `/api/ingest` | Batch ingest external JSON posts through pipeline | `posts.ingest` |
| `POST` | `/api/x/search` | Execute live keyword search against X API v2 | `posts.search_x` |
| `POST` | `/api/x/test-connection` | Verify X API Bearer Token / Consumer Keys | `settings.edit` |
| `GET` | `/api/stats` | Aggregate dashboard KPIs and smog distribution | `dashboard.view` |
| `GET` | `/api/audit` | Retrieve deduplication audit ledger & merge history | `audit.view` |

### Moderation & Rule Learning
| Method | Endpoint | Description | Clearance |
|---|---|---|---|
| `GET` | `/api/noise` | Inspect excluded noise posts pool | `noise.view` |
| `POST` | `/api/noise/exclude` | Exclude a post from verified feed to noise pool | `posts.exclude` |
| `POST` | `/api/noise/restore` | Restore a mistakenly excluded post back to feed | `noise.manage` |
| `GET` | `/api/learned-rules` | View dynamic keyword whitelists & learned rules | `noise.view` |
| `POST` | `/api/learned-rules` | Add, activate, or deactivate learned rules | `noise.manage` |

### Administration & Security
| Method | Endpoint | Description | Clearance |
|---|---|---|---|
| `GET` / `POST` | `/api/users` | List registered accounts or create new user | `users.view` / `users.create` |
| `PUT` / `DELETE` | `/api/users/<id>` | Update profile, reassign roles, or deactivate | `users.edit` / `users.delete` |
| `GET` / `POST` | `/api/roles` | List system roles or define custom role policies | `roles.view` / `roles.create` |
| `PUT` / `DELETE` | `/api/roles/<id>` | Update role permissions or delete custom role | `roles.edit` / `roles.delete` |
| `GET` | `/api/permissions` | Master list of 20 permission definitions | `roles.view` |
| `GET` / `POST` | `/api/settings` | Retrieve or update system & ingestion settings | `settings.view` / `settings.edit` |
| `GET` / `POST` | `/api/queries` | Search query version control & milestone switching | `settings.view` / `settings.edit` |

---

## 🧪 Testing & Audit Suite

The backend includes comprehensive test suites covering database schema initialization, authentication lifecycles, and permission gates.

Run the automated suite from the repository root:

```powershell
python -m pytest tests
```

To run API endpoint unit tests:
```powershell
python -m backend.tests.test_api_endpoints
```

---

## 📈 Processed Dataset Metrics

- **Total Ingested Social Posts**: `252`
- **Verified Air Quality Posts**: `183` (*72.6% precision yield*)
- **Duplicate Records Merged**: `9` (*Engagement metrics and media attachments unified*)
- **Noise Records Suppressed**: `60` (*Indian domestic politics, cricket chatter, shipbreaking, food deals*)
- **Peak Regional AQI Logged**: `606` (*Hazardous category*)
- **Mean Regional AQI**: `361.1` (*Severe public health alert*)

---

## 📄 License & Attribution

Designed and maintained for environmental monitoring and public health protection under the **Punjab Environmental Protection Agency (EPA)**.
All visual components follow the **Creative Tim Argon Dashboard 2 Material UI** design standard.
