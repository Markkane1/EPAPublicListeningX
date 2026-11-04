# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x (current) | ✅ Yes |

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please do not open a public GitHub issue.**

Report it responsibly via one of these channels:

- **Email:** `security@epa.punjab.gov.pk` (or the repository maintainer's contact)
- **Subject line:** `[SECURITY] EPA X Scrapper - <brief description>`

Please include:
1. Description of the vulnerability and its potential impact
2. Steps to reproduce the issue
3. Any proof-of-concept code or screenshots
4. Your suggested fix (optional but appreciated)

We aim to acknowledge all security reports within **48 hours** and provide a resolution timeline within **7 business days**.

---

## Security Best Practices for Operators

### Credential Management
- Never commit `.env` to version control. It is listed in `.gitignore`.
- Do not use a published or placeholder password. On first seed, and when an existing hash still matches a retired published password, the server writes a generated password to `data/bootstrap-credentials.txt` and deletes that account's sessions. Change it from the admin UI after you sign in.
- A password change revokes that account's other sessions.
- Use strong, unique passwords for each role account (minimum 8 characters, mix of upper/lower/digits/symbols).
- Rotate the `X_BEARER_TOKEN` and `X_API_SECRET` periodically.
- Use real Cloudflare Turnstile keys. The always-pass test secret and the tokens `DEMO_BYPASS`, `TEST_BYPASS`, and `XXXX.DUMMY.TOKEN.XXXX` do not authenticate. A Turnstile network or parse failure does not authenticate.

### Deployment
- By default, the server binds to `127.0.0.1` (loopback only). **Do not expose directly to the public internet.**
- Place behind a reverse proxy (nginx, Caddy, Cloudflare Tunnel) with TLS termination.
- Set `CORS_ORIGIN` to your actual frontend origin in production.
- Restrict firewall rules to allow only necessary inbound traffic.

### Database
- The SQLite database file (`data/epa_intelligence.db`) may contain user data and API keys stored as settings. **Back it up and restrict filesystem permissions.**
- Database files and the `data/` directory are listed in `.gitignore` and must never be committed.

### Dependencies
- Regularly audit Python and Node.js dependencies: `pip list --outdated`, `npm audit`.
- Install `certifi` to ensure proper SSL certificate verification: `pip install certifi`.

---

## Security Architecture

### Authentication
- All sensitive API endpoints require a valid Bearer token in the `Authorization` header.
- Tokens are 64-character cryptographically secure hex strings (`secrets.token_hex(32)`).
- Sessions expire after 7 days and are invalidated on logout.
- Tokens in URL query parameters are rejected.

### Password Hashing
- PBKDF2-HMAC-SHA256 with 100,000 iterations and a unique 16-byte random salt per user.
- Timing-safe comparison via `hmac.compare_digest`.

### Rate Limiting
- `POST /api/auth/login` and `POST /api/turnstile/verify` are limited to **30 requests per 60 seconds** per connection peer (`RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_WINDOW`). `X-Forwarded-For` is ignored unless the peer address is listed in `TRUSTED_PROXIES`.

### Input Validation
- Username: 3–64 alphanumeric characters (lowercase, digits, `_`, `-`, `.`)
- Email: standard format, max 254 characters
- Password: 8–1024 characters
- Request body: capped at **16 MB** (`Content-Length` above the cap is rejected with HTTP 413 before the body is read)

### HTTP Security Headers
Every response includes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` includes `frame-ancestors 'none'` so an HTML document cannot be framed. `script-src` keeps `'unsafe-inline'` so the built dashboard still runs.
- `Permissions-Policy` (disables geolocation, camera, microphone)

### RBAC
- 4 built-in roles with 20 granular permissions
- A role named super_admin skips the permission list at the gateway. Creating that role, or granting permissions the caller does not hold, is rejected for every other caller.
- System roles cannot be deleted

---

## Security Changelog

| Date | Change |
|------|--------|
| 2026-11-04 | Added rate limiting to auth endpoints |
| 2026-11-04 | Replaced wildcard CORS with explicit origin allowlist |
| 2026-11-04 | Added HTTP security headers (CSP, X-Frame-Options, etc.) |
| 2026-11-04 | Fixed incomplete `get_bearer_token_from_credentials` |
| 2026-11-04 | Removed the unverified TLS retry on X API calls |
| 2026-11-04 | Protected all API endpoints with RBAC permission checks |
| 2026-11-04 | Stripped raw API secrets from `/api/settings` response |
| 2026-11-04 | Added request body size cap (16 MB) |
| 2026-11-04 | Increased password minimum length from 6 to 8 characters |
| 2026-11-04 | Sanitized internal errors — no stack traces exposed to callers |
| 2026-11-04 | Added avatar URL allowlist to prevent SSRF via avatar fields |
| 2026-11-04 | Added username regex validation |
| 2026-11-04 | Fixed server binding to use configured HOST, not `""` |
| 2026-11-04 | Added failed login attempt logging |
| 2026-11-04 | Removed DB file path from `/api/stats` response |
| 2026-11-04 | Removed `.env` default passwords; replaced with CHANGE_ME placeholders |
| 2026-11-04 | Added `data/`, `*.db`, `scratch/` to `.gitignore` |
| 2026-11-04 | Retired published seed passwords, closed Turnstile bypass and fail-open, stopped unverified TLS retry, framed-denied HTML, bounded post reads, and untracked the live database and scraped corpus |
