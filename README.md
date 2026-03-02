# 🇳🇵 Nepal Election Pulse

A **production-ready, premium-quality full-stack web application** for live Nepal election tracking, public predictions, and real-time discussion — built with Next.js 15, Supabase, and TypeScript.

![Nepal Election Pulse](https://img.shields.io/badge/Status-Live-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)

---

## ✨ Features

- **📊 Live Election Dashboard** — Real-time verified results with interactive charts, party rankings, and vote share donut chart
- **🗳️ Anonymous Predictions** — Cast one prediction per device, no login needed. Results aggregate live across all users
- **💬 Real-Time Discussion** — Supabase Realtime-powered anonymous forum with official reply badges
- **🛡️ Anti-Abuse Protection** — Server-side rate limiting (15s), duplicate detection, UUID validation, one-vote-per-device
- **🌙 Dark/Light Mode** — Automatic system detection with manual toggle
- **📱 Fully Responsive** — Premium UI across all screen sizes
- **🔒 No Login Required** — Fully anonymous with device-level UUID identity

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Data Fetching** | TanStack Query (React Query) |
| **Charts** | Recharts |
| **Database** | Supabase (PostgreSQL) |
| **Realtime** | Supabase Realtime (postgres_changes) |
| **Icons** | Lucide React |
| **Identity** | Anonymous UUID (localStorage + cookie backup) |

---

## 📁 Project Structure

```
election/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home page (hero + dashboard preview)
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── elections/
│   │   │   ├── page.tsx                # Elections listing
│   │   │   └── [id]/page.tsx           # Election dashboard (charts + table)
│   │   ├── predictions/page.tsx        # Anonymous voting
│   │   ├── discussion/page.tsx         # Live forum with Realtime
│   │   ├── about/page.tsx              # About + data sources
│   │   └── api/
│   │       ├── elections/route.ts      # GET elections
│   │       ├── elections/[id]/route.ts # GET election + results
│   │       ├── parties/route.ts        # GET parties
│   │       ├── predictions/route.ts    # GET/POST predictions
│   │       ├── comments/route.ts       # GET/POST comments
│   │       └── comments/like/route.ts  # POST like toggle
│   ├── components/
│   │   ├── Navbar.tsx                  # Glassmorphic navigation
│   │   ├── Footer.tsx                  # Site footer
│   │   ├── ThemeProvider.tsx           # Dark/light mode
│   │   └── QueryProvider.tsx           # TanStack Query wrapper
│   ├── hooks/
│   │   └── use-data.ts                 # All data fetching hooks
│   └── lib/
│       ├── supabase.ts                 # Supabase client (browser + server)
│       ├── anon-id.ts                  # Anonymous identity system
│       ├── utils.ts                    # Formatting utilities
│       └── sample-data.ts             # Fallback sample data
├── supabase/
│   ├── schema.sql                      # Database schema (7 tables + RLS)
│   └── seed.sql                        # Sample data
├── public/
│   └── favicon.svg                     # Brand icon
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Open your Supabase SQL Editor and run these files in order:

1. **Schema**: Copy and run `supabase/schema.sql`
2. **Seed data**: Copy and run `supabase/seed.sql`

### 3. Configure Environment

The app defaults to the built-in Supabase project. To use your own:

```bash
# Create .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

> **Note:** The app works immediately even without setting up Supabase — it falls back to realistic sample data.

---

## 📡 API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/elections` | GET | List all elections |
| `/api/elections/[id]` | GET | Election details + party results + computed stats |
| `/api/parties` | GET | All political parties |
| `/api/predictions` | GET | Aggregated prediction counts per party |
| `/api/predictions` | POST | Submit anonymous prediction (one per device) |
| `/api/comments` | GET | Paginated comments with replies |
| `/api/comments` | POST | Post comment (rate limited, duplicate checked) |
| `/api/comments/like` | POST | Toggle like/unlike on a comment |

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `elections` | Election metadata (type, status, constituency counts) |
| `parties` | Political party info (name, color, abbreviation) |
| `party_results` | Votes & seats per party per election |
| `predictions` | Anonymous prediction votes |
| `comments` | Discussion messages with threading support |
| `comment_likes` | Like tracking per anonymous user |
| `results_snapshots` | Cached external data |

All tables have **Row Level Security** enabled with public read + anonymous insert policies.

---

## 🔐 Security & Anti-Abuse

- **Anonymous Identity**: UUID generated per device, stored in localStorage + cookie backup
- **One Vote Per Device**: Enforced by database unique constraint (`election_id + anon_id`)
- **Rate Limiting**: Server-side 15-second cooldown between comments
- **Duplicate Detection**: Same content from same user blocked within 5 minutes
- **Input Validation**: UUID format check, content length limits (2–500 chars)
- **RLS Policies**: Row Level Security on all tables

---

## 🎨 Design System

Inspired by Apple dashboards, Stripe analytics, and Bloomberg election coverage:

- **Typography**: Inter font family
- **Colors**: Custom brand blue palette with semantic surface tokens
- **Components**: Glassmorphic nav, elevated cards, smooth progress bars
- **Animations**: Fade-in, slide-up, pulse effects
- **Dark Mode**: System-aware with manual toggle

---

## 📜 License

MIT

---

## 🙏 Credits

- Election data sourced from [Election Commission Nepal](https://election.gov.np)
- Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), [Recharts](https://recharts.org), [Lucide](https://lucide.dev)

---

> **Disclaimer**: This platform aggregates election data from verified sources. Always refer to the Election Commission Nepal for official confirmation.
