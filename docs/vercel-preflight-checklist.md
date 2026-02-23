# Vercel Preflight Checklist

Last updated: 2026-02-23
Target: `www.jessewestlund.com`
Framework: Next.js (App Router)

## 1) Required Environment Variables

Set in Vercel Project Settings -> Environment Variables:

- `RESEND_API_KEY` (required)
- `CONTACT_TO` (required)
- `CONTACT_FROM` (optional, defaults to `Jesse Westlund Portfolio <onboarding@resend.dev>`)

Verification commands:

```bash
npm run check:env
# Expected: fails if required vars are missing

STRICT_ENV=1 RESEND_API_KEY=dummy CONTACT_TO=hello@example.com node scripts/ensure-contact-env.mjs
# Expected: passes
```

## 2) Build and Runtime Settings

- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: default Next.js (`.next`)
- Node Version: 20+ recommended (project validated on modern Node runtime)

Local validation:

```bash
npm run lint
npm run typecheck
npm run build
```

Expected status: all pass.

## 3) Domain and Redirect Readiness

Legacy redirect checks:

- `/index.html` -> `/`
- `/page-portfolio.html` -> `/projects`
- `/page-blog.html` -> `/blog`
- `/page-contact.html` -> `/contact`

Quick check:

```bash
curl -I https://www.jessewestlund.com/page-contact.html
```

Expected: `308` or `301` redirect to `/contact`.

## 4) Contact API Preflight

Endpoint: `POST /api/contact`

- Schema validation should return `400 validation_error` for invalid payload.
- If env vars missing, API should return `503 service_unavailable`.
- On valid payload with env configured, API should send via Resend and return `200 { ok: true, requestId }`.

## 5) Motion/UX QA Preflight

Automated sweep script:

```bash
node qa-artifacts/qa-sweep.mjs
```

Artifacts:

- `qa-artifacts/qa-sweep-results.json`
- `qa-artifacts/screenshots/*`

Pass criteria:

- `totalConsoleErrors = 0`
- `totalPageErrors = 0`
- `totalFailedRequests = 0`
- `totalBadResponses = 0`

## 6) Post-Deploy Smoke Tests

After deploy, verify:

1. Home hero interactions, project filter behavior, and featured case progress bar.
2. Blog detail page shows visible H1 title + excerpt.
3. Contact submission flow (success + error states).
4. Resume downloads (`PDF`, `DOCX`) work from footer and hero.
5. Canonical/OG metadata render correctly on home, projects, and blog detail.
