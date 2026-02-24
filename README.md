# FlockFund II — Premium Poultry Investment & Farm Management

![FlockFund Landing](https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=2070&auto=format&fit=crop)

FlockFund II is a sophisticated, role-based investment platform designed to bridge the gap between urban investors and rural poultry farming. It provides a transparent, secure, and data-driven ecosystem for managing the entire poultry lifecycle—from procurement and daily health tracking to final sales and profit distribution.

## 🚀 Key Features

### 💎 For Investors
- **Live Performance Tracking**: Real-time KPI dashboards showing flock health and estimated ROI.
- **Micro-Investment Tiers**: Start with small units of birds and scale your portfolio.
- **Secure Financials**: Integrated Flutterwave payments for investments and bank payouts for withdrawals.
- **Gamification**: Earn badges and climb the leaderboard based on investment consistency and portfolio performance.

### 🚜 For Farm Staff (Keepers & Managers)
- **Daily Operational Logs**: Digitalized reporting for mortality, feed consumption, and house conditions.
- **Vet Health Insights**: Diagnosis tagging and vaccination trackers to ensure high survival rates.
- **FCR Analytics**: Automated Feed Conversion Ratio insights to optimize growth vs. cost.
- **Secure Fund Requests**: Operational fund requests with transparent Admin approval and Accountant disbursement via automated bank transfers.

### 🛡️ For Administrators & Accountants
- **Global Settings Hub**: Dynamic ROI calculators, market price floor management, and configurable cost breakdowns.
- **Financial Control**: Centralized approval for operational expenses and automated staff payouts via Flutterwave Transfers.
- **Data Monetization**: Anonymized FCR and growth data insights prepared for industry analytics.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Database / Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS Policies)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [GSAP](https://gsap.com/) (ScrollTrigger, Timelines)
- **Visuals**: [Three.js](https://threejs.org/) (3D Interactive Globe & Investment Visuals)
- **Charts**: [Recharts](https://recharts.org/)
- **Payments**: [Flutterwave](https://flutterwave.com/)

## 📂 Project Structure

```bash
├── src/
│   ├── app/                # Next.js App Router (Pages & API)
│   │   ├── admin/          # Administrator Dashboard
│   │   ├── accountant/     # Financial Management Hub
│   │   ├── manager/        # Farm Operations Oversight
│   │   ├── keeper/         # Daily Field Operations
│   │   ├── investor/       # Investment Portfolio
│   │   └── api/            # Payouts, Webhooks, Notifications
│   ├── components/         # Reusable Premium UI Components
│   ├── lib/                # Shared utilities & Supabase clients
│   └── styles/             # Global themes & design tokens
├── supabase/
│   └── migrations/         # SQL schema & Security (RLS) policies
└── .gemini/                # Assistant Knowledge & Task Tracking
```

## ⚙️ Setup & Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Mufti-IBAK/FlockFund.git
   cd FlockFund_II
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_key
   FLUTTERWAVE_SECRET_KEY=your_key
   FLUTTERWAVE_PUBLIC_KEY=your_key
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🔒 Security & Roles
FlockFund II utilizes strict **Row Level Security (RLS)** in PostgreSQL to ensure that:
- **Keepers** only see their assigned flocks.
- **Accountants** can only disburse funds after **Admin** approval.
- **Investors** see only their own financial data and farm activity.

---
Built with ❤️ by [Mufti IBAK](https://github.com/Mufti-IBAK)
