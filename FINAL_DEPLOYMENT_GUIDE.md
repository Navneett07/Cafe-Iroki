# FINAL DEPLOYMENT GUIDE (V1.0)

## 1. Hosting Environment (Vercel)
The application is structured as a Vite Single Page Application (SPA) with a multi-page setup for Customer and Admin separation.
1. Connect GitHub repository to Vercel.
2. Framework Preset: `Vite`
3. Root Directory: `./` (or `apps/admin-app` if deploying separately).
4. Build Command: `npm run build`
5. Output Directory: `dist`

## 2. Environment Variables
Add the following to Vercel Environment Variables:
- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Publishable Key.
- `VITE_RAZORPAY_KEY_ID`: Your Razorpay Live/Test Key.
- `VITE_SENTRY_DSN` (Optional): For error tracking.
- `VITE_GA_MEASUREMENT_ID` (Optional): For Google Analytics.

## 3. Database Deployment
1. Go to Supabase SQL Editor.
2. Run `supabase_schema.sql` to initialize the database schema, RLS policies, and trigger functions.
3. Run `supabase_seed.sql` to populate initial menu items and categories.
4. Verify Supabase Storage buckets exist: `menu-images`, `gallery`, `avatars`, `banners`, `admin-assets`.

## 4. Edge Functions
Deploy Edge Functions via Supabase CLI:
```bash
supabase functions deploy create-order
supabase functions deploy verify-payment
```
Ensure Supabase project secrets (`RAZORPAY_KEY_SECRET`) are configured in the Supabase Dashboard.

## 5. Post-Deployment Verification
- Test customer checkout flow using a dummy card.
- Navigate to `/admin.html` (or separate admin domain) and log in with the admin credentials.
- Test image uploads in the Admin Media manager.
