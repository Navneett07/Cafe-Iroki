# GO-LIVE CHECKLIST

## 1. Supabase Production Setup
- [ ] Create a completely new Supabase Project for Production.
- [ ] Run `supabase_schema.sql` to construct the database.
- [ ] Run `supabase_seed.sql` to populate initial categories and tables.
- [ ] Verify `menu-images`, `gallery`, and `banners` buckets are set to **PUBLIC**.
- [ ] Verify `avatars` and `admin-assets` buckets are set to **PRIVATE**.
- [ ] Ensure `admin_users` table is populated with at least one valid administrative email address.
- [ ] Disable "Enable Email Confirmations" in Auth Settings (or setup custom SMTP).
- [ ] Deploy Edge Functions via `supabase functions deploy`.

## 2. Razorpay Production Setup
- [ ] Switch Razorpay Dashboard to **Live Mode**.
- [ ] Generate Live API Keys.
- [ ] Configure Webhooks in Razorpay to point to `https://<PROJECT_REF>.supabase.co/functions/v1/verify-payment`.
- [ ] Add the Webhook Secret and Live API Keys to Supabase Edge Function Secrets.

## 3. Vercel Deployment Configuration
- [ ] Link GitHub Repository to Vercel.
- [ ] Input all Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY`, etc.).
- [ ] Trigger a production build.
- [ ] Assign custom domain (e.g., `cafeiroki.com`).

## 4. Final Verification
- [ ] Register a new test customer account on the live domain.
- [ ] Attempt a ₹1 live checkout (or use Razorpay test mode on production temporarily).
- [ ] Navigate to `/admin.html` and verify administrative access works and routes are protected from customers.
- [ ] Test uploading a new menu image to ensure Storage Policies allow authenticated admin inserts.
