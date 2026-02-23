# Jesse Westlund Portfolio (Next.js Rebuild)

Modernized portfolio platform for [Jesse Westlund](https://www.linkedin.com/in/jessewestlund/) built with Next.js App Router, TypeScript, MDX content, and serverless contact handling.

## Stack
- Next.js 14 + App Router
- TypeScript
- MDX content pipeline (`content/blog`)
- Framer Motion + GSAP + Lenis + selective React Three Fiber
- Vercel Analytics + Speed Insights
- Contact API route with Zod validation + Resend delivery

## Key Routes
- `/` Home
- `/projects` Project explorer (46 migrated projects)
- `/projects/[slug]` Case-story pages
- `/blog` Blog index (MDX)
- `/blog/[slug]` Blog detail
- `/about` About + timeline
- `/contact` Conversion-focused contact flow
- `/lab` Archived interaction mode references

## Environment Variables
Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local

RESEND_API_KEY=your_resend_api_key
CONTACT_TO=you@yourdomain.com
CONTACT_FROM="Jesse Westlund Portfolio <onboarding@resend.dev>"
```

### Vercel Environment Setup
Set these values in Vercel Project Settings > Environment Variables:

- `RESEND_API_KEY`
- `CONTACT_TO`
- `CONTACT_FROM` (optional)

The build now enforces required contact env vars on Vercel. If `RESEND_API_KEY` or `CONTACT_TO` are missing, deployment fails early.

Optional CLI workflow:

```bash
vercel env add RESEND_API_KEY production
vercel env add CONTACT_TO production
vercel env add CONTACT_FROM production
```

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run check:env
```

## Deployment Preflight

- Runbook: `docs/vercel-preflight-checklist.md`

## Notes
- Legacy `.html` / `.php` URLs are handled through `next.config.mjs` redirects.
- Legacy PHP comment/contact endpoints were removed; contact is now `/api/contact`.
- Interaction governance and third-party library decisions are documented in `docs/interaction-spec.md`.
