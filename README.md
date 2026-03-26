<p align="center">
  <img src="https://img.shields.io/badge/OrganicFlow-Social%20Media%20Growth%20Platform-blueviolet?style=for-the-badge&logo=rocket" alt="OrganicFlow" />
</p>

<h1 align="center">🚀 OrganicFlow</h1>

<p align="center">
  <strong>An open-source SaaS platform for organic social media content scheduling, analytics, and growth management.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-Styling-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## 📖 About

**OrganicFlow** is a full-stack SaaS platform designed for social media managers, content creators, and digital marketing agencies. It provides tools for scheduling content delivery, managing engagement analytics, and automating organic growth strategies across multiple platforms — including Instagram, TikTok, YouTube, Twitter/X, and Facebook.

The platform follows a **subscription-based model** where users can subscribe to plans, manage their wallet balance, and use the built-in scheduling engine to plan and automate their social media content delivery in a natural, time-distributed pattern.

### 🎯 Use Case

OrganicFlow helps social media professionals:
- **Schedule content engagement** across multiple platforms from a single dashboard
- **Analyze growth patterns** with real-time charts and analytics
- **Manage budgets** with a built-in wallet and transaction system
- **Automate workflows** using AI-powered scheduling algorithms that distribute engagement over time in natural, organic patterns
- **Track orders** with detailed delivery timelines and status updates

> **Note**: OrganicFlow is a **content management and scheduling platform**. It integrates with third-party social media service APIs to help users manage and schedule their marketing campaigns. All services operate within the Terms of Service of the respective platforms.

---

## ✨ Features

### 🏠 User Dashboard
- **Multi-platform support** — Instagram, TikTok, YouTube, Twitter/X, Facebook
- **Engagement analytics** — Real-time growth charts with AI-generated organic delivery patterns
- **Drawable growth curves** — Interactive chart editor to customize delivery timing
- **Delivery timeline preview** — Visual schedule showing planned delivery in hourly breakdowns

### 💰 Wallet & Payments
- **Built-in wallet system** — Deposit, track balance, and manage spending
- **USDT BEP20 support** — Cryptocurrency deposits verified on-chain via BSC RPC
- **Manual deposit verification** — Admin-reviewed deposits with proof of payment
- **Transaction history** — Full audit log of all deposits, orders, and refunds

### 📦 Order Management
- **Organic engagement orders** — Schedule engagement delivery with natural timing patterns
- **Per-type customization** — Individual settings for each engagement type (views, likes, comments, etc.)
- **AI Smart Ratios** — Automatically calculates engagement ratios based on platform best practices
- **Order tracking** — Real-time status updates from pending → processing → completed

### 🔐 Admin Panel
- **Service management** — Configure services, pricing, and provider integrations
- **User management** — View and manage user accounts, subscriptions, and balances
- **Bundle configuration** — Create engagement bundles with platform-specific engagement types
- **Order oversight** — Monitor all orders, approve deposits, and handle refunds
- **Global settings** — Markup configuration, subscription plans, and platform settings

### 🔒 Authentication & Security
- **Supabase Auth** — Secure email/password authentication with email verification
- **Row Level Security (RLS)** — PostgreSQL-level access control on all tables
- **JWT verification** — Edge Functions authenticate all API calls via JWT claims
- **Race condition protection** — Wallet operations use atomic updates to prevent double-spending
- **Subscription gating** — Users must have active subscriptions to place orders

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, TypeScript 5, Vite | UI framework and build tooling |
| **Styling** | Tailwind CSS, Shadcn/UI, Radix UI | Design system and components |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) | Database, authentication, serverless API |
| **State Management** | TanStack React Query | Server state caching and synchronization |
| **Charts** | Recharts | Data visualization and analytics |
| **Payments** | USDT BEP20 (BSC), Razorpay (optional) | Payment processing |
| **Deployment** | Vercel | Frontend hosting with edge CDN |
| **Version Control** | Git, GitHub | Source code management |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 8+
- **Supabase** project ([create one here](https://supabase.com))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/whopautopilot/whopautopilot.git
   cd whopautopilot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

### Database Setup

Apply the Supabase migrations to set up your database schema:

```bash
npx supabase db push
```

Or apply migrations manually from the `supabase/migrations/` directory.

---

## 🏗 Architecture

```
whopautopilot/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── engagement/   # Engagement order components
│   │   ├── layout/       # Dashboard layout and navigation
│   │   ├── subscription/ # Subscription management
│   │   └── ui/           # Shadcn/UI base components
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase client configuration
│   ├── lib/              # Utilities (engagement types, curve scheduling, etc.)
│   └── pages/            # Route-level page components
│       └── admin/        # Admin panel pages
├── supabase/
│   ├── functions/        # Edge Functions (serverless API)
│   │   ├── process-engagement-order/   # Order processing engine
│   │   ├── verify-usdt-deposit/        # On-chain payment verification
│   │   └── ...
│   └── migrations/       # Database schema migrations
├── public/               # Static assets
└── package.json
```

### Key Architectural Decisions

- **Edge Functions** handle sensitive operations (payments, order processing) server-side
- **Row Level Security** is enforced at the database level — frontend cannot bypass access controls
- **Organic scheduling engine** generates unique, randomized delivery patterns per order
- **Platform-specific timing** — each social platform has configured engagement sequences and delays to simulate natural interaction patterns

---

## 📦 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to [Vercel](https://vercel.com)
2. Set environment variables in Vercel dashboard
3. Deploy — Vercel auto-detects the Vite configuration

### Edge Functions (Supabase)

Deploy individual Edge Functions:

```bash
export SUPABASE_ACCESS_TOKEN=your_token
npx supabase functions deploy process-engagement-order --project-ref your_project_id
npx supabase functions deploy verify-usdt-deposit --project-ref your_project_id --no-verify-jwt
```

### Production Build

```bash
npm run build
```

Output will be in the `dist/` directory, ready for static hosting.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- How to submit bug reports and feature requests
- Code style and development workflow
- Pull request process

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🔒 Security

If you discover a security vulnerability, please see our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

---

## 📬 Contact

- **Issues**: [GitHub Issues](https://github.com/whopautopilot/whopautopilot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/whopautopilot/whopautopilot/discussions)

---

<p align="center">
  Built with ❤️ using React, Supabase, and TypeScript
</p>
