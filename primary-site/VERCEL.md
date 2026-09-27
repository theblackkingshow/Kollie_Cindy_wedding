# Deploy to Vercel

Set Vercel's **Root Directory** to `primary-site` for the GitHub repository, then deploy the `main` branch.

After changing the root directory, trigger a fresh deployment from `main`; Vercel only applies the new setting to deployments created afterward.

Create a Neon Postgres database (or use another Postgres provider) and run `drizzle/0001_reservations.sql` in its SQL console. The complete schema is also in `vercel-schema.sql`. The old `guests` table is no longer used and is left untouched. In Vercel project settings, add these private environment variables:

- `DATABASE_URL`: the Postgres connection string.
- `ADMIN_PASSWORD`: a new long password for the `/admin` dashboard.
- `AUTH_SECRET`: a random secret at least 32 characters long.
- `RESEND_API_KEY`: API key for the Resend account used to send reservation emails.
- `EMAIL_FROM`: a verified sender, such as `Cindy & Dorbor <wedding@example.com>`.
- `CRON_SECRET`: a random secret used to authorize the scheduled seat-email endpoint.

The Vercel cron runs daily at 01:00 UTC (09:00 in Perth) and does nothing before 23 January 2027. From that date onward, it sends seat emails only to approved reservations with an assigned seat number, and retries failed deliveries. Vercel sends the `CRON_SECRET` as a bearer token. Admin email retry actions are available in the dashboard.

After adding variables, redeploy. Vercel uses `vercel.json` and the `vercel-build` script automatically.
