# Personal Finance Tracker

A full-stack app to track income, expenses, and budgets. Built with Next.js (frontend) and Express + PostgreSQL (backend).

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
- **Deploy**: Vercel (frontend), Railway (backend)

## Setup

### 1. Database

Create a PostgreSQL database (local or e.g. Railway/Neon). Note the connection URL.

### 2. Backend (server)

Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` to your PostgreSQL connection string (and optionally `JWT_SECRET` for production).

```bash
cd server
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL to your Postgres URL (e.g. postgresql://user:password@localhost:5432/finance_tracker)
npx prisma generate
npx prisma db push
npm run dev
```

API runs at `http://localhost:4000`.

### 3. Frontend

From project root:

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev
```

App runs at `http://localhost:3000`.

### 4. Production

- Set `NEXT_PUBLIC_API_URL` to your backend URL (e.g. Railway).
- Backend: set `FRONTEND_URL` for CORS (e.g. your Vercel URL).
- Run `npx prisma db push` or migrations on the production DB.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start Next.js dev server |
| `npm run build`| Build Next.js for production |
| `npm run server` | Start Express API (from root: `cd server && npm run dev`) |

## Default categories

On first run, the server seeds default categories:

- **Expense**: Food, Shopping, Travel, Bills, Health, Other  
- **Income**: Salary, Business, Freelance, Gift, Other  

Users can add custom categories via the Categories screen (API supports it).
