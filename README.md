# 🐔 FlockFund II | Mudarabah Financial Ecosystem (2026 Edition)

FlockFund II is a decentralized, Shariah-compliant livestock investment and farm management platform. Built on the **Mudarabah Al-Muqayyad** (Restricted Partnership) model, it bridges the gap between urban investors and rural poultry farming through real-time data transparency, automated financial settlement, and decentralized farm operations.

## 🚀 Key Features

### ⚖️ Mudarabah Settlement Engine
*   **Proportional Payouts**: Automated calculation of Investor ROI based on bird ownership percentage.
*   **70/30 Profit Split**: Dynamically configurable Profit Sharing Ratio (PSR) stored in secure 2026 Data Governance tables.
*   **Mortality-Indexed Protection**: Intelligent loss management system that calculates biological risk and protects the Mudarabah agreement boundaries.

### 💳 Automated Financial Disbursements
*   **Flutterwave Integration**: Direct, verified bank transfers for investor payouts and staff salaries.
*   **Two-Stage Verification**: Secure accountant reconciliation workflow (Draft -> Verified -> Disbursed) to ensure 100% financial accountability.
*   **Audit Trail**: Immutable 2026 Compliance logging for all financial gateway events via `logAuditEvent`.

### 🐄 Premium Farm Operations
*   **Multi-Role Dashboards**: Specialized UIs for Admins, Accountants, Managers, Sales Managers, and Keepers.
*   **Time-Aware UX**: Intelligent `Greeting` system with time-of-day logic and personalized biometric-linked profiles.
*   **Real-Time Sync**: Postgres-level change listeners for instant synchronization across all organizational roles.

## 🛠️ Technology Stack
*   **Framework**: Next.js 15.x (App Router)
*   **Database**: Supabase (PostgreSQL with Realtime)
*   **Styling**: Premium Vanilla CSS + Tailwind (Design Tokens)
*   **Animations**: GSAP 3.x (Smooth Transitions)
*   **Payments**: Flutterwave v3 Transfer API
*   **Governance**: 2026 Data Protection Standard (Log Auditing & RBAC)

## ✨ Recent Finalization Upgrades
*   **Live Sync Alpha**: Real-time transaction monitoring for accountants.
*   **Intelligent Scrolling**: `scrollbar-hide` utility for premium, overflow-proof sidebars.
*   **Enhanced Admin UI**: Grouped operational controls for Salaries and Mortality Profit Indices.
*   **Type-Safe Build**: 100% resolution of development environment and production build path issues.

## 📦 Getting Started

### 1. Environment Configuration
Create a `.env.local` file with the following keys:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FLUTTERWAVE_SECRET_KEY=...
NEXT_PUBLIC_SITE_URL=...
```

### 2. Installation
```bash
npm install
```

### 3. Development
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
```

## 📜 Organizational Structure
*   **Admin**: Total system oversight, PSR settings, and flock initialization.
*   **Accountant**: Financial reconciliation, ledger audits, and payout verification.
*   **Manager**: Farm report oversight, incident management, and vet coordination.
*   **Sales Manager**: Inventory sales, revenue reporting, and market price tracking.
*   **Keeper**: Daily biological tasks, task verification, and emergency alerts.

---
*Built with ❤️ by the FlockFund Engineering Team*
