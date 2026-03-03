# 🇳🇵 NepalPulse 2082 (Election Count)

NepalPulse 2082 is a real-time, high-performance web dashboard for tracking the Nepal Federal Elections. Designed for mobile-first user experience and optimized for high traffic, it provides live vote counts, interactive constituency maps, head-to-head candidate matchups, and community features.

## 🌟 Key Features

*   **⚡ Real-time Vote Tracking:** Pulls live data directly from the official Election Commission (`result.election.gov.np`) using a heavily cached, Stale-While-Revalidate (SWR) background syncing architecture.
*   **📱 Mobile-Optimized UI/UX:** Features a sleek, app-like mobile experience with safe-area padding, bottom tab bar navigation, Apple Web App integration, and touch-optimized interactions.
*   **⚔️ Key Races Dashboard:** Pinned head-to-head matchups for major constituencies (e.g., KP Oli vs Balen Shah in Jhapa-5, Aashika Tamang vs Rajendra Prasad Pandey in Dhading-1).
*   **🔍 High-Performance Search:** Fast, case-insensitive text search using PostgreSQL `pg_trgm` GIN indexes to instantly filter 3,400+ candidates across 165 constituencies.
*   **💬 Anonymous Community:** Interactive mock voting and threaded comment sections (integrated via Supabase).

## 🛠 Tech Stack

*   **Frontend:** Next.js (App Router), React 18, Tailwind CSS, Lucide React
*   **Backend:** Next.js API Routes (Node.js)
*   **Database:** Supabase (PostgreSQL with Row Level Security and Realtime Pub/Sub)
*   **Caching Strategy:** In-memory caching + HTTP Stale-While-Revalidate for EC API protection under high load.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   npm or pnpm
*   A Supabase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/asbinthapa99/election-count-.git
    cd election-count-
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    NEXT_PUBLIC_SITE_URL=http://localhost:3000
    ```

4.  **Database Setup:**
    Open your Supabase SQL Editor and run the entire contents of the `/supabase/full_setup.sql` file. This will safely reset the schema, configure RLS, set up performance indexes, and seed the initial 165 constituencies.

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ⚙️ Architecture & Scale Optimization

To ensure the website remains fast and stable during election day traffic spikes without overwhelming the government's origin servers:

*   **API Route (`/api/candidates/ec`):** Acts as a proxy and cache. It hits the EC JSON dumps, caches them in memory, and returns them to the user. If the cache is stale, it serves the stale data immediately while triggering a background fetch to the EC.
*   **Build & Rendering:** Pages are heavily optimized, pre-fetching data securely and avoiding unnecessary React hydration re-renders.
