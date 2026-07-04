# CLIENT HANDOVER DOCUMENTATION (V 1.0)

Welcome to your production-ready Cafe Iroki digital platform! This document outlines exactly how to take ownership of your system.

## 1. Credentials Handover
**Admin Portal Access**
- **URL**: `https://your-production-url.com/admin.html`
- **Initial Admin Email**: `admin@cafeiroki.com` (Example)
- **Initial Password**: `Provided Securely via Password Manager`

*Action Required: Upon first login, please navigate to Settings -> Profile and change the administrative password immediately.*

## 2. Payment Gateway Setup
1. Log in to your Razorpay Dashboard.
2. Toggle from "Test Mode" to "Live Mode".
3. Generate Live API Keys (`Key ID` and `Key Secret`).
4. Update these keys in your Supabase Edge Function Secrets and Vercel Environment Variables.
5. In Razorpay, setup your webhook endpoint to point to: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/verify-payment`

## 3. Operations Management
- **Order Management**: Monitor the Orders dashboard actively. New orders populate in real-time. Make sure to move them from `pending` -> `preparing` -> `completed`.
- **Reservations**: Review and approve incoming reservations daily. Table availability relies on timely status updates.
- **Menu Updates**: Add/Edit menu items through the Admin Menu interface. All image uploads are automatically compressed and hosted on your CDN.

## 4. Maintenance & Support
- Web hosting scales automatically via Vercel.
- Database scaling and backups are managed via Supabase.
- If you experience downtime, check `status.vercel.com` and `status.supabase.com` before escalating to technical support.
