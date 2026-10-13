# StockLedger 📒
> Invoices. Payments. Stronger Business.

A simple, friendly web app for wholesalers to create invoices, track payments, and manage customer balances — so you get paid on time.

---

## 🚀 Quick Start

### Step 1 – Install dependencies
```bash
npm install
```

### Step 2 – Set up Supabase
1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **SQL Editor** and paste the contents of `supabase/schema.sql` → Run it
3. Go to **Project Settings → API** and copy your URL and anon key
4. Create a `.env.local` file:
```bash
cp .env.local.example .env.local
```
5. Paste your Supabase credentials into `.env.local`

### Step 3 – Run the app
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure
```
src/
├── app/
│   ├── page.tsx              # Login / Signup
│   ├── dashboard/            # Main dashboard
│   ├── invoices/             # Invoice list + create
│   ├── customers/            # Customer list + add
│   ├── payments/             # Payments list + record
│   └── reports/              # Analytics & charts
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── StatCard.tsx          # Colorful stat cards
│   └── StatusBadge.tsx       # Invoice status badges
├── lib/supabase/
│   └── client.ts             # Supabase client
└── types/
    └── index.ts              # TypeScript types
supabase/
└── schema.sql                # Database schema (run this first!)
```

## ✨ Features
- 🔐 **Auth** — Email login/signup via Supabase
- 🧾 **Invoices** — Create, view, filter, mark as paid
- 👥 **Customers** — Add and manage your customers
- 💰 **Payments** — Record payments (Cash, Bank, KPay, Wave)
- 📊 **Reports** — Revenue chart, invoice status pie, business metrics
- 🔔 **Reminders** — Overdue invoice alerts

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database + Auth**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Deployment**: Vercel (free)

## 🌍 Deploy to Vercel (Free)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add your Supabase env variables in Vercel settings
4. Deploy! Your app is live 🚀
