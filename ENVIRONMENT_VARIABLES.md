# Environment Variables Guide

## Vercel (Frontend)
Set the following environment variables in your Vercel Project Settings for the Production environment:

- `VITE_SUPABASE_URL`: The API URL of your production Supabase instance.
- `VITE_SUPABASE_ANON_KEY`: The publishable `anon` key of your production Supabase instance.
- `VITE_RAZORPAY_KEY`: Your live Razorpay `Key ID`.
- `VITE_ENABLE_ANALYTICS`: Set to `true` to enable analytics reporting.
- `VITE_GA_ID`: Your Google Analytics 4 Measurement ID.
- `VITE_SENTRY_DSN`: Your Sentry DSN for error logging.

## Supabase (Edge Functions)
Set the following secrets in your Supabase Dashboard (Settings -> Edge Functions -> Secrets):

- `RAZORPAY_KEY_SECRET`: Your live Razorpay `Key Secret` (used for webhook signature verification and API calls).
- `RAZORPAY_WEBHOOK_SECRET`: The secret string you configure in the Razorpay Webhook settings to verify incoming payloads.
