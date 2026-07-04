# SECURITY AUDIT REPORT

## Authentication & Identity
- **Supabase Auth**: JWT-based stateless authentication is enforced across the application.
- **Role-Based Access Control (RBAC)**: Admin routes strictly check against the `admin_users` table securely on the backend before authorizing view/edit actions. Frontend roles are never trusted.

## Data Security (Row Level Security)
- All tables (`orders`, `profiles`, `reviews`, `reservations`) have explicit RLS policies enabled.
- Customers can only read and write their own rows (`auth.uid() = user_id`).
- Administrative overrides are handled purely via Supabase Service Key executed inside secure Edge Functions, never exposed to the client.

## Financial Security
- **Payment Verification**: Razorpay Webhook signatures are verified server-side via Edge Functions. The frontend payload is explicitly ignored for status changes.
- **Idempotency**: Webhook processing is idempotent to prevent double-charging or duplicate order fulfillment on network retries.
- **Coupon Validation**: Edge functions recalculate all discounts and cart totals server-side prior to order creation.

## Network & Headers
- `vercel.json` applies strict `X-Content-Type-Options: nosniff` and `Strict-Transport-Security`.
- `X-Frame-Options` is set to `SAMEORIGIN` to prevent clickjacking.
- Permissions-Policy restricts access to sensitive hardware interfaces.

## Secrets Management
- No secret keys are included in the frontend build. Only the `VITE_SUPABASE_ANON_KEY` is exposed.
- All high-privilege operations run in Deno Edge Functions using `SUPABASE_SERVICE_ROLE_KEY`.
