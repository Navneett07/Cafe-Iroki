# Deployment Guide & Checklist

## 1. Supabase

- [ ] Create project; copy Project URL + `anon` key.
- [ ] Run `supabase_schema.sql`, then `supabase_seeds.sql`.
- [ ] Run `supabase/migrations/0001_realtime_production.sql` (Realtime publication + notification triggers + RLS).
- [ ] Database → Replication: confirm Realtime is enabled for the published tables.
- [ ] Storage: create buckets `menu-images`, `gallery`, `banners` (public), `avatars`, `admin-assets` (private).
- [ ] Deploy Edge Functions: `supabase functions deploy checkout payments admin-orders reservations invoice`.
- [ ] Set function secrets: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
- [ ] Seed at least one admin: insert into `admin_users` and set `profiles.role = 'admin'`.

## 2. Environment Variables (Vercel + CI secrets)

| Var | Required | Notes |
|-----|----------|-------|
| `VITE_SUPABASE_URL` | ✅ | Public |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Public (RLS-protected) |
| `VITE_RAZORPAY_KEY` | ✅ | Publishable key only |
| `VITE_GA_ID` | ⬜ | GA4 measurement ID |
| `VITE_SENTRY_DSN` | ⬜ | Sentry DSN |

> Never place the Service Role key or Razorpay secret in any `VITE_*` var.

## 3. Vercel

- [ ] Import repo; framework preset **Vite**; build `npm run build`, output `dist`.
- [ ] Add env vars above.
- [ ] `vercel.json` already provides rewrites (`/admin` → admin portal), security headers, and asset caching.
- [ ] Update `public/sitemap.xml`, `robots.txt`, and the `index.html` canonical/OG URLs to the real production domain.

## 4. Pre-flight

- [ ] `npm run lint && npm run build` (root) — passes.
- [ ] `cd apps/admin-app && npm run lint && npm run build` — passes.
- [ ] PWA installs; offline page shows when disconnected.
- [ ] Lighthouse: PWA + SEO + Performance ≥ 90.
- [ ] Realtime verified (order status, notifications) across two sessions.

## 5. Rate Limiting Recommendations

Client env has no server to enforce limits; apply these at the edge/DB layer:

- **Edge Functions** — add per-IP/per-user throttling (e.g. token bucket in `checkout`,
  `payments`, `reservations`) using a Supabase table or Upstash Redis. Reject > N req/min.
- **Supabase** — enable [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
  for sign-in / OTP / password reset.
- **Vercel** — enable WAF / Attack Challenge Mode and Firewall rules for `/admin` and API routes.
- **Razorpay** — rely on webhook signature verification (already implemented) and idempotency keys.
- **Realtime** — cap `eventsPerSecond` on the client and rely on RLS to scope channels.

## 6. Post-deploy Hardening (optional)

- [ ] Add a Content-Security-Policy header (allowlist Supabase, Razorpay, Unsplash, fonts) after testing.
- [ ] Configure Sentry alerts and GA4 conversions.
- [ ] Set up Supabase daily backups + point-in-time recovery.
