# PRODUCTION CHECKLIST

## Environment Variables
- [ ] VITE_SUPABASE_URL set and verified
- [ ] VITE_SUPABASE_ANON_KEY set and verified
- [ ] VITE_RAZORPAY_KEY_ID updated to Production Key
- [ ] Edge Function secrets (RAZORPAY_KEY_SECRET) injected into Supabase.

## Database & Storage
- [ ] RLS Policies enabled on all tables
- [ ] Production Database Seeded
- [ ] Storage Buckets set to appropriate privacy (avatars: private, menu-images: public)
- [ ] Storage file size limits configured in Supabase.

## Security & Networking
- [ ] CORS policies restrict API requests to the production domain.
- [ ] Content Security Policy (CSP) headers applied via `vercel.json`.
- [ ] JWT expiration thresholds reviewed.
- [ ] Rate limits configured in Supabase.

## Quality & Monitoring
- [ ] Production Build passes with zero errors (`npm run build`).
- [ ] Error reporting (Sentry) configured.
- [ ] Web Analytics (Google Analytics/Vercel Analytics) integrated.
- [ ] Lighthouse scores >= 95.

## Handover
- [ ] Admin credentials securely transferred to the client.
- [ ] Initial menu items populated.
