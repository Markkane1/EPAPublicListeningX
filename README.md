# EPA Punjab Social Listening & Environmental Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Database](https://img.shields.io/badge/Database-SQLite_WAL-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

An enterprise-grade environmental intelligence system engineered for the **Punjab Environmental Protection Agency (EPA)**. The platform monitors, filters, curates, and analyzes public social discourse concerning air quality, smog emergencies, stubble burning, and public health advisories across Punjab, Pakistan.

---

## Highlights

- **Dual-Mode Ingestion Pipeline**: Ingest data via high-fidelity direct browser network interception (`Scrapper/` Chrome extension) or live official X (Twitter) API v2 endpoints.
- **Zero-Dependency Python Backend**: The server and data services run entirely on the Python Standard Library (`http.server`, `sqlite3`, `hashlib`, `hmac`), ensuring high performance, zero dependency bloat, and minimal attack surface.
- **High-Performance SQLite WAL**: Relational data store configured with Write-Ahead Logging (`WAL`), composite indexing, sub-millisecond query execution, and atomic transaction guarantees.
- **Deterministic Non-AI Rule Learning Engine**: Replace fragile, costly black-box LLMs with 100% explainable, deterministic active learning and diagnostic inversion to eliminate noise while preserving regional environmental signals.
- **Multilingual Regional NLP**: Comprehensive support for English, standard Urdu script (`اردو`), and Roman Urdu dialect patterns, including automatic AQI metric extraction (15–999) and US EPA severity classification.
- **Enterprise RBAC & Security**: Role-based access control spanning 4 operational tiers, 20 granular permissions, PBKDF2-HMAC-SHA256 password hashing (100,000 rounds), Cloudflare Turnstile bot verification, hardened Content Security Policy (CSP), and sliding-window rate limiting.
- **Dual Presentation Interfaces**:
  - **Operator Console (`dashboard/`)**: Modern React 19 + MUI + Chart.js dashboard for environmental analysts, auditors, and administrators.
  - **Citizen Intelligence Portal (`portal/`)**: Lightweight, zero-dependency standalone public dashboard.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  React 19 + MUI Dashboard (dashboard/)   │ Standalone Portal (portal/) │
└────────────────────────────────────────────────────────────────────────┘
                                     │ (REST API & Bearer Auth)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          API & GATEWAY LAYER                           │
│  serve.py (Threaded HTTP, Multi-Origin CORS, CSP, Turnstile, Limiter)  │
└────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVICE & DOMAIN LAYER                          │
│  backend/service.py (Business Logic, RBAC Clearance, Settings Masking) │
│  pipeline.py (Deterministic Regex Engine, AQI Parsing, Deduplication)  │
│  backend/sentiment_engine.py (Multilingual Regional Sentiment Tuning)  │
│  backend/classifier.py (Heuristic Rule Synthesis & Induction Engine)  │
└────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
┌─────────────────────────────────────┐ ┌────────────────────────────────┐
│             DATA LAYER              │ │        EXTERNAL ADAPTERS       │
│  backend/database.py (SQLite WAL)   │ │  backend/x_api_client.py       │
│  data/epa_intelligence.db           │ │  Scrapper/ (Chrome Extension)  │
└─────────────────────────────────────┘ └────────────────────────────────┘
```

---

## Directory Layout

```text
.
├── backend/                  # Core services, persistence, and intelligence engines
│   ├── classifier.py         # Heuristic active learning and rule induction
│   ├── database.py           # SQLite WAL persistence, indexing, and RBAC schemas
│   ├── sentiment_engine.py   # English & Roman Urdu sentiment classification
│   ├── service.py            # API request orchestrator and business logic
│   ├── taxonomy.py           # Environmental incident categorization
│   └── x_api_client.py       # Official X (Twitter) API v2 client adapter
├── dashboard/                # Operator administration console (React 19 + MUI + Vite)
│   ├── src/                  # Views: Dashboard, Analytics, Posts, Noise, Users, Roles, Audit
│   └── vite.config.js        # Development server and proxy configuration
├── portal/                   # Lightweight public-facing citizen intelligence portal
├── Scrapper/                 # Manifest V3 browser extension for local data harvesting
├── data/                     # Local SQLite database and bootstrap credentials
├── docs/                     # Architectural specifications and rule engine guides
├── tests/                    # Automated testing suites (unit, integration, e2e, stress)
├── pipeline.py               # Batch data cleansing, filtering, and metric enrichment
├── serve.py                  # API gateway, static asset server, and security controller
├── requirements.txt          # Python test runner prerequisites
└── package.json              # Monorepo scripts for dashboard lifecycle
```

---

## Quick Start

### 1. Prerequisites

- **Python**: Version 3.11 or higher
- **Node.js**: Version 18.x or higher (with npm)
- **Modern Browser**: Chromium-based browser (Chrome, Edge, Brave) for the extension

---

### 2. Environment Setup

Copy the template configuration file to `.env`:

```powershell
Copy-Item .env.example .env
```

*(On Linux / macOS: `cp .env.example .env`)*

Open `.env` and configure your settings:
- `PORT` and `HOST` (defaults to `8080` and `127.0.0.1`).
- Default RBAC passwords (leave blank to let the server auto-generate secure passwords into `data/bootstrap-credentials.txt`).
- X (Twitter) Developer API credentials (optional; system falls back to scraped file ingestion when absent).
- Cloudflare Turnstile keys (optional for local development).

---

### 3. Install Dependencies

Install the Python testing harness and frontend dashboard dependencies:

```powershell
pip install -r requirements.txt
npm install --prefix dashboard
```

*(Or from repository root: `npm install`)*

---

### 4. Run the Application

#### Option A: Development Mode (Vite Hot-Reload)

Start the Python API Gateway in one terminal:

```powershell
python serve.py
```

In a second terminal, launch the Vite development server:

```powershell
npm run dev
```

- **Operator Dashboard**: `http://localhost:5173`
- **Backend API Gateway**: `http://127.0.0.1:8080`
- **Public Portal**: `http://127.0.0.1:8080/portal/`

#### Option B: Standalone Production Mode

Build the dashboard assets and serve everything directly through `serve.py`:

```powershell
npm run build
python serve.py
```

Navigate to `http://127.0.0.1:8080` in your browser.

---

## Role-Based Access Control (RBAC)

When launched with a fresh database, the server auto-seeds 4 built-in roles across 20 distinct system permissions:

| Role | Access Level & Scope |
| :--- | :--- |
| **Super Administrator** | Full root administrative access across all views, security settings, user management, and system logs. |
| **Lead Environmental Analyst** | Real-time analytics, AQI alerts, incident feeds, and report generation (CSV / JSON exports). |
| **Field Auditor & Moderator** | Noise inspection, diagnostic rule learning, content moderation, and immutable audit logs. |
| **Public Observer** | Read-only citizen overview access with sensitive operational controls hidden. |

> [!NOTE]
> Initial credentials are printed to `data/bootstrap-credentials.txt` on first boot if passwords are left empty in `.env`. Credentials can be changed anytime from the Settings console.

---

## Data Collection & Browser Extension

The platform includes a dedicated Manifest V3 browser extension located in `Scrapper/`:

1. Open your browser and navigate to `chrome://extensions` (or `brave://extensions` / `edge://extensions`).
2. Toggle **Developer mode** on (top-right corner).
3. Click **Load unpacked** and select the `Scrapper/` directory.
4. Pin the **EPA Punjab Social Listening** extension to your toolbar.
5. Search or browse relevant environmental tags on X.com; the extension intercepts network GraphQL responses with full engagement metrics and generates clean CSV, JSON, or Excel exports.
6. Ingest exported files directly via the Operator Dashboard or Public Portal (`/api/ingest`).

---

## Testing & Quality Assurance

The codebase features comprehensive test coverage organized by scope:

```powershell
# Run the complete test suite
python -m pytest tests

# Run specific testing tiers
python -m pytest tests/unit          # Single modules and algorithmic logic
python -m pytest tests/integration   # Database workflows and API service contracts
python -m pytest tests/e2e           # End-to-end request and ingestion lifecycles
python -m pytest tests/stress        # High-concurrency load and rate limiter boundaries
python -m pytest tests/whitebox      # Security boundary, CSP, and hardening checks
```

---

## Documentation

For deep technical dives, refer to the documentation in `docs/`:

- [Architecture & Operations Guide](docs/ARCHITECTURE_AND_OPERATIONS.md): Clean Architecture layer contracts, schema specifications, and deployment hardening.
- [Noise Curation & Learning Engine](docs/NOISE_CURATION_AND_LEARNING_ENGINE.md): Technical breakdown of deterministic active rule induction and diagnostic inversion.
- [Security Policy](SECURITY.md): Vulnerability disclosure procedures and security hardening guidelines.

---

## License & Governance

Developed for the **Punjab Environmental Protection Agency (EPA)**. All rights reserved.

## License & Governance

Developed for the **Punjab Environmental Protection Agency (EPA)**. All rights reserved.