# EPA Punjab Social Listening Platform — Architecture, Operations & Verification Guide
========================================================================================

## 1. System Overview

The **EPA Punjab Social Listening Platform** is an enterprise-grade environmental intelligence system designed specifically for the Punjab Environmental Protection Agency (EPA). It monitors, ingests, curates, and analyzes public social media discourse regarding air quality, smog emergencies, stubble burning, and public health advisories across Punjab, Pakistan.

The platform provides dual ingestion modes:
1. **Scraped File Ingestion**: Ingests JSON batches extracted directly by the included high-fidelity Chrome Extension (`scrapper/`).
2. **Live X API v2 Ingestion**: Executes real-time live queries against the official X (Twitter) API v2 (`/2/tweets/search/recent`) using an active query constraint engine with simulated mock fallback during development.

---

## 2. Clean Architecture Overview

The system strictly follows Clean Architecture principles with complete decoupling between presentation, business rules, persistence, and external adapters:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  React 19 + Vite Dashboard (dashboard/src/)  │  Standalone Portal (portal/)  │
└────────────────────────────────────────────────────────────────────────┘
                                     │ (REST API & Auth Sessions)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          API / GATEWAY LAYER                           │
│  serve.py (Threaded HTTP Server, Security Headers, CORS, Turnstile)    │
└────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVICE & DOMAIN LAYER                          │
│  backend/service.py (Orchestrator, Auth, RBAC, Business Logic)         │
│  pipeline.py (Deterministic Filtering, AQI Extraction, Enrichment)     │
│  backend/sentiment_engine.py (VADER + Roman Urdu + RoBERTa)           │
└────────────────────────────────────────────────────────────────────────┘
                                     │
                   ┌─────────────────┴─────────────────┐
                   ▼                                   ▼
┌─────────────────────────────────────┐ ┌────────────────────────────────┐
│             DATA LAYER              │ │        EXTERNAL ADAPTERS       │
│  backend/database.py (SQLite WAL)   │ │  backend/x_api_client.py       │
│  data/epa_intelligence.db (Active)  │ │  scrapper/ (Chrome Extension)  │
└─────────────────────────────────────┘ └────────────────────────────────┘
```

---

## 3. Core Modules & Responsibilities

### 3.1. API & Gateway Layer (`serve.py`)
- **Multi-Origin CORS**: Seamlessly supports local production builds (`http://localhost:8080`, `http://127.0.0.1:8080`), Vite development server (`http://localhost:5173`, `http://127.0.0.1:5173`), and production domains via `CORS_ORIGIN`.
- **Hardened CSP**: Content Security Policy configured with `media-src 'self' https: data: blob:;` and `font-src 'self' https: data:;` to eliminate Opaque Response Blocking when rendering embedded video mp4s and webfonts.
- **Request Body Protection**: `MAX_REQUEST_BODY_BYTES = 16 MB` accommodates rich batch imports without DoS vulnerability.
- **Rate Limiting**: Sliding-window rate limiter on `/api/auth/*` endpoints (30 requests/minute per IP).
- **Session Authentication**: Bearer token authentication validated against `auth_sessions` table with sliding expiration.

### 3.2. Data Persistence Layer (`backend/database.py`)
- **Engine**: SQLite 3 in Write-Ahead Logging (`WAL`) mode with `NORMAL` synchronous mode and 5000ms busy timeouts for high concurrent throughput.
- **Composite Indexing**:
  - `idx_posts_created_desc`, `idx_posts_city_created`, `idx_posts_severity_created`, `idx_posts_category_created`, `idx_posts_engagement`.
  - `idx_noise_status_created`, `idx_noise_status_category`, `idx_noise_status_likes`.
- **Security & Integrity**:
  - Passwords hashed using PBKDF2-HMAC-SHA256 with 100,000 iterations and per-user cryptographic salt.
  - Role-based permissions enforced through relational `roles`, `permissions`, and `role_permissions` tables.
  - Safe avatar URL validator preventing SSRF attacks.

### 3.3. Processing Pipeline (`pipeline.py`)
- **High-Throughput Pre-Compiled Regex Engine**:
  - Pre-compiled patterns (`COMPILED_OFF_TOPIC`, `COMPILED_INDIAN`, `COMPILED_AQ`, `COMPILED_GEO`, `GURMUKHI_REGEX`) reduce per-post processing time to under 0.1ms.
- **Exclusion Filters**:
  1. Exact ID Deduplication against both current batch and existing database posts.
  2. Query Negative Author Constraints (`-from:@handle`).
  3. Gurmukhi Script Exclusion (`[\u0a00-\u0a7f]`).
  4. Off-Topic Content Exclusion (Cricket, ship scrapping, fast food, ethnic flame wars).
  5. Indian Domestic Politics Exclusion (Delhi CAQM, Haryana, Noida, Gurugram).
  6. Positive Air Quality Relevance Requirement (English, Roman Urdu, Urdu script).
  7. Positive Geographic Relevance Requirement (Lahore, Gujranwala, Faisalabad, Multan, Punjab).
  8. Semantic Deduplication with metric merging (consolidates identical reposts while retaining highest engagement counts).
- **US EPA Metric Enrichment**:
  - Extracts numerical AQI metrics (`15 <= AQI <= 999`).
  - Classifies severity: Good, Moderate, Sensitive, Unhealthy, Very Unhealthy, Hazardous.
  - Detects target Punjab district and environmental incident category.
  - Analyzes sentiment (Critical, Concerned, Informative/Neutral, Positive/Solution).

---

## 4. Verification & Automated Test Suites

Automated tests live under `tests/` and are collected by pytest. They use temporary databases. Do not point them at the live database.

| Folder | Scope |
| :--- | :--- |
| `tests/unit/` | Single modules |
| `tests/integration/` | Database and service flows |
| `tests/e2e/` | Request lifecycles |
| `tests/stress/` | Concurrency and limits |
| `tests/whitebox/` | Boundary and hardening checks |

```bash
python -m pytest tests
```

---

## 5. Operations & Development Commands

### 5.1. Starting the Application
```bash
# Start backend server (serves REST API and production SPA build)
python serve.py

# Run Vite development server with hot-reload (optional)
npm run dev
```

### 5.2. Building the Frontend
```bash
npm run build
```

### 5.3. Default Role Credentials
There is no published password. Set `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ANALYST_PASSWORD`, `DEFAULT_AUDITOR_PASSWORD`, and `DEFAULT_VIEWER_PASSWORD` in `.env` before the first seed. Each value must be unique and at least 8 characters. Placeholder values and any previously published password are rejected. When a seed password is missing or rejected, the server generates one and appends it to `data/bootstrap-credentials.txt` on the server host. That file is gitignored. An existing database whose hash still matches a retired published password is rehashed the same way on startup, and that account's sessions are deleted.

| Role | Username | Password source | Clearance Level |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin` | `.env` or the bootstrap file | Full administrative clearance across all 20 permissions |
| **Environmental Analyst** | `analyst` | `.env` or the bootstrap file | Intelligence feeds, analytics, deduplication, noise review, export |
| **Data Operator / Auditor** | `auditor` | `.env` or the bootstrap file | Operational access to noise review, post exclusion/restoration |
| **Read-Only Viewer** | `viewer` | `.env` or the bootstrap file | Read-only dashboards and analytical summaries |
