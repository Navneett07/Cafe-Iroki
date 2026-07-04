# Cafe Iroki — Production SaaS Platform

A realtime restaurant platform for Cafe Iroki (Nagpur): a customer web app, a standalone
admin portal, Supabase backend (Postgres + RLS + Realtime + Storage + Edge Functions),
and Razorpay payments.

## Architecture

| Layer | Stack |
|-------|-------|
| Customer web app | React 19 + TypeScript + Vite + Tailwind 4 (root `src/`) |
| Admin portal | React 19 + React Query + Recharts (`apps/admin-app/`) |
| Shared code | `apps/shared/` (types, formatters) |
| Backend | Supabase — Postgres, RLS, Realtime, Storage |
| Serverless | Supabase Edge Functions (`supabase/functions/`): checkout, payments, admin-orders, reservations, invoice |
| Payments | Razorpay (server-verified signatures) |
| Hosting | Vercel (multi-page: `/` customer, `/admin` portal) |

## Local Development

```bash
# Customer app
npm install
cp .env.example .env      # fill in Supabase + Razorpay keys
npm run dev               # http://localhost:5173

# Admin portal
cd apps/admin-app
npm install
npm run dev               # http://localhost:5174
```

## Scripts

| App | Lint | Build |
|-----|------|-------|
| Customer (root) | `npm run lint` (oxlint) | `npm run build` |
| Admin (`apps/admin-app`) | `npm run lint` (tsc) | `npm run build` |

## Environment Variables

See [`.env.example`](./.env.example). Required at build time:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY`.
Optional: `VITE_GA_ID` (analytics), `VITE_SENTRY_DSN` (error logging).

> **Security:** never expose the Supabase Service Role key to any frontend.
> It is used only inside Edge Functions. All client reads/writes go through RLS.

## Production Features (Part 8)

- **PWA** — `public/manifest.json`, service worker (`public/sw.js`), offline fallback (`public/offline.html`), registered in prod via `src/lib/registerServiceWorker.ts`.
- **SEO** — meta, canonical, Open Graph, Twitter Cards, JSON-LD Restaurant schema in `index.html`; `public/robots.txt`, `public/sitemap.xml`.
- **Performance** — vendor code-splitting (`vite.config.ts` manualChunks), immutable asset caching, image `loading="lazy"`, font preconnect.
- **Observability** — Sentry-ready `src/lib/logger.ts`; GA4-ready `src/lib/analytics.ts` (both no-op until env vars set).
- **Security headers** — `vercel.json` (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
- **Env validation** — `validateEnv()` in `src/config/env.ts`, run at boot.
- **CI** — `.github/workflows/ci.yml` builds & lints both apps.

## Deployment

Full steps and pre-flight checks: [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Realtime & DB Setup

Run the migration once in the Supabase SQL Editor:
`supabase/migrations/0001_realtime_production.sql` (publication, notification triggers, RLS).
Schema and seeds: `supabase_schema.sql`, `supabase_seeds.sql`.
