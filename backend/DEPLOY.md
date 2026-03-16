# Deploying the API (Railway / Render)

## Before first deploy: create initial migration

From this folder (`backend/`), with `DATABASE_URL` in `.env` pointing at a Postgres DB, run once:

```bash
npx prisma migrate dev --name init
```

Commit the new `prisma/migrations` folder so the host can run `prisma migrate deploy`.

## Env vars on the host

- `DATABASE_URL` – Postgres connection string (Neon, Supabase, etc.)
- `FRONTEND_URL` – Your Vercel app URL (e.g. `https://your-app.vercel.app`) for CORS
- `JWT_SECRET` – Long random string (e.g. `openssl rand -base64 32`)

## Build and start

- **Build:** `npm install && npm run build` (build runs `prisma generate && tsc`)
- **Start:** `npx prisma migrate deploy && npm start`

Then set `NEXT_PUBLIC_API_URL` on Vercel (in the frontend project) to this service URL (no trailing slash) and redeploy the frontend.
