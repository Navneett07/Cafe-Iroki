# BACKUP AND DISASTER RECOVERY STRATEGY

## 1. Database Backups
### Automated Backups
- Supabase automatically performs Point-in-Time Recovery (PITR) backups based on your pricing tier (Pro tier includes 7-day daily backups).
- These backups include the complete PostgreSQL database state and user auth configurations.

### Manual Backups (Logical Backups)
To manually backup the database schema and data, run the following Supabase CLI command locally:
```bash
supabase db dump --data-only -f backup_data.sql
supabase db dump -f backup_schema.sql
```

## 2. Storage Backups
Supabase Storage relies on the underlying AWS S3 architecture. To ensure high availability of media (images, banners), periodic synchronization to an external cold storage bucket (e.g., AWS S3 Glacier or Google Cloud Storage) using the `aws s3 sync` command against the Supabase S3 endpoint is recommended for enterprise clients.

## 3. Disaster Recovery Protocol
In the event of total data corruption or region failure:
1. **Restore DB**: Navigate to the Supabase Dashboard -> Database -> Backups -> Restore to the latest stable timestamp.
2. **Re-deploy Edge Functions**: 
   ```bash
   supabase functions deploy
   ```
3. **Re-seed Critical Assets**: If storage is corrupted, re-upload default menu images stored in the version control repository (`/assets/seed-images`).
4. **Vercel Rollback**: If a frontend deployment caused the outage, revert instantly via the Vercel Dashboard -> Deployments -> Rollback.
