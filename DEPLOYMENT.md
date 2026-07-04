# Vercel Deployment Configuration

This project is a monorepo setup but is deployed as a Multi-Page Application (MPA) using a single Vercel project with optimized path routing. Alternatively, you can deploy the Admin portal as a completely separate project for enhanced security.

## Approach 1: Single Project (Recommended for Ease)
- **Framework Preset**: Vite
- **Root Directory**: `./` (Root directory of the repo)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Routing**: Handled by `vercel.json` (rewrites `/admin*` to `/admin.html` and everything else to `/index.html`).

## Approach 2: Separate Projects (Recommended for Enterprise)

### Customer App
- **Root Directory**: `./`
- **Build Command**: `vite build --app customer` (Requires modifying `vite.config.ts` to output only the customer entry point).
- **Output Directory**: `dist`

### Admin App
- **Root Directory**: `apps/admin-app`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Edge Functions Deployment
1. Install Supabase CLI.
2. Authenticate: `supabase login`
3. Link Project: `supabase link --project-ref your-project-ref`
4. Deploy Functions: 
   ```bash
   supabase functions deploy create-order
   supabase functions deploy verify-payment
   ```
