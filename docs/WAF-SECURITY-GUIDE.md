# Cloudflare WAF & Edge Security Architecture

## 1. Overview
The Elsewedy University of Technology (SUT) Portal implements a multi-tier defense-in-depth security model:
- **Edge Layer:** Cloudflare WAF, OWASP Core Ruleset, Bot Management, and Geo-blocking.
- **Application Layer:** Express Token Bucket Rate Limiting, HTTP Security Headers, and Global Exception Handling.
- **Data Layer:** 100% Parameterized queries, Strict TLS/SSL, Connection Pooling Timeouts, and Row-Level Security (RLS) IDOR defense.

## 2. Cloudflare WAF & OWASP Core Ruleset
Import configuration from `cloudflare-waf-rules.json`:
- **Anomaly Scoring:** Set paranoia level to 2 with anomaly threshold 40.
- **Rules Activated:**
  - `942100`: SQLi Detection on query strings and JSON payloads.
  - `941100`: XSS filtering against stored and reflected cross-site scripts.
  - `930100`: Local File Inclusion (LFI) & Path Traversal blocker.
  - `932100`: Remote Code Execution (RCE) blocker.

## 3. Rate Limiting Specifications
- **Authentication Endpoints (`/api/auth/*`):** 15 requests / 60 seconds (anti-credential stuffing).
- **Deep Health Probes (`/api/health/*`):** 30 requests / 60 seconds.
- **Public API Endpoints (`/api/*`):** 60 requests / 60 seconds.
- **Standard Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## 4. HTTP Security Headers
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; object-src 'none'; frame-ancestors 'self' https: *;`

## 5. Automated Health Telemetry
- Lightweight health check: `GET /health` (Public, 200 OK)
- Deep backend health check: `GET /api/health/deep` (Requires Bearer token or `X-Admin-Key`)
  - Tests Primary PostgreSQL / Supabase with `SELECT 1;`
  - Tests Read Replica lag and query status
  - Tests ORM connection pool capacity and idle timeouts
  - Tests Redis cache latency
  - Tests Background job queue workers
  - Tests S3 / Cloud Storage read latency
  - Tests 3rd-party auth APIs
