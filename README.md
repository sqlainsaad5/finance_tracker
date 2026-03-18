# Personal Finance Tracker

A full-stack app to track income, expenses, and budgets. Built with Next.js (frontend) and Express + PostgreSQL (backend).

## Project structure

```
finance-tracker/
├── frontend/          # Next.js app (Vercel)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── ...
├── backend/           # Express API (Railway / Render)
│   ├── routes/
│   ├── prisma/
│   ├── package.json
│   └── ...
├── package.json       # Root scripts (dev:frontend, dev:backend, etc.)
└── README.md
```

## Features

- **User account**: Sign up, Login, Logout, Profile edit, Forgot password
- **Dashboard**: Total balance, Income/Expense summary, Recent 5 transactions
- **Add transaction**: Income/Expense, amount, category, date, payment method, note
- **Transactions list**: Search, filter by type/category/date, pagination, grouped by date
- **Transaction details**: View, Edit, Delete
- **Reports**: Monthly summary, expense by category, bar & pie charts
- **Categories**: View expense & income categories (defaults seeded)
- **Budget**: Set monthly budget per expense category
- **Settings**: Profile (name, email, password), Currency (₹ / $ / €), Theme (light/dark), Logout, Delete account

## Tech stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Deploy**: Vercel (frontend), Railway / Render (backend)

## Setup

**Environment:** One env file per app. **Frontend:** create `frontend/.env` or `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4000` (see Frontend step). **Backend:** copy `backend/.env.example` to `backend/.env`.

### 1. Database

Create a PostgreSQL database (local or e.g. Neon). Note the connection URL.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL to your Postgres URL
npx prisma generate
npx prisma migrate dev --name init   # or db push
npm run dev
```

API runs at `http://localhost:4000`.

### 3. Frontend

```bash
cd frontend
npm install
# Create .env or .env.local with: NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

App runs at `http://localhost:3000`.

### 4. From root (convenience)

```bash
npm run dev:frontend   # or npm run dev (same)
npm run dev:backend    # in another terminal
```

## Scripts (root)

| Command | Description |
|---------|-------------|
| `npm run dev` / `npm run dev:frontend` | Start Next.js dev server |
| `npm run dev:backend` | Start Express API |
| `npm run build` / `npm run build:frontend` | Build Next.js for production |
| `npm run build:backend` | Build backend (Prisma + tsc) |
| `npm run start:frontend` | Run Next.js production server |
| `npm run start:backend` | Run Express production server |

## Production

- **Vercel (frontend)**: Set Root Directory to `frontend`. Add `NEXT_PUBLIC_API_URL` = your backend URL (no trailing slash). Optional: `BACKEND_URL` for Next.js rewrites when proxying `/api` to the backend.
- **Backend** (Vercel/Railway/Render): Set Root Directory to `backend`. Set `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL` = your frontend URL (e.g. `https://your-app.vercel.app`) or comma-separated for multiple origins. See `backend/DEPLOY.md`.

**This project’s Vercel deployment:** Frontend [finance-tracker-adkb.vercel.app](https://finance-tracker-adkb.vercel.app), Backend [finance-tracker-jet-nu.vercel.app](https://finance-tracker-jet-nu.vercel.app). The app is wired to use these by default; optional env overrides: frontend `NEXT_PUBLIC_API_URL=https://finance-tracker-jet-nu.vercel.app`, backend `FRONTEND_URL=https://finance-tracker-adkb.vercel.app`.

## Default categories

On first run, the backend seeds default categories:

- **Expense**: Food, Shopping, Travel, Bills, Health, Other
- **Income**: Salary, Business, Freelance, Gift, Other

Users can add custom categories via the Categories screen.
