# Deploy to Vercel

Set Vercel's **Root Directory** to `primary-site` for the GitHub repository, then deploy the `main` branch.

After changing the root directory, trigger a fresh deployment from `main`; Vercel only applies the new setting to deployments created afterward.

Create a Neon Postgres database (or use another Postgres provider) and run `vercel-schema.sql` in its SQL console. In Vercel project settings, add these private Production and Preview environment variables:

- `DATABASE_URL`: the Postgres connection string.
- `ADMIN_PASSWORD`: a new long password for the `/admin` dashboard.
- `AUTH_SECRET`: a random secret at least 32 characters long.

After adding variables, redeploy. To preserve the private guest backup, run this locally once with `DATABASE_URL` set:

```powershell
node scripts/import-guests.mjs
```

The guest backup is deliberately not committed to GitHub. Vercel uses `vercel.json` and the `vercel-build` script automatically.
