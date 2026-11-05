# EPA Punjab Social Listening

Operator dashboard for reviewing public conversation about air quality in Punjab.

## Run locally

1. Copy `.env.example` to `.env` and fill in the values for this machine. Do not commit `.env` or any credential file.
2. Install dependencies:

```powershell
pip install -r requirements.txt
npm install
```

3. Start the API, then the dashboard:

```powershell
python serve.py
npm run dev
```

Open the address printed by `npm run dev`. That dashboard talks to the API for you. Sign-in passwords are created on the server and are not stored in git. Change them after the first sign-in.

See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## Tests

From the repository root:

```powershell
python -m pytest tests
```

Tests are grouped by what they cover:

- `tests/unit` — single modules
- `tests/integration` — database and service flows
- `tests/e2e` — request lifecycles
- `tests/stress` — concurrency and limits
- `tests/whitebox` — boundary and hardening checks

## Layout

- `serve.py` — API gateway
- `pipeline.py` — batch processing
- `backend/` — data access and services
- `dashboard/` — operator UI
- `portal/` — public page
- `scrapper/` — browser extension
- `tests/` — automated tests

`dashboard/public/` holds the icons the dashboard serves. `portal/` holds the icons for the public page. The extension keeps its own icons in `scrapper/icons/`.
