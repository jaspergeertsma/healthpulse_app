# 🩺 HealthPulse — Personal Health Tracker

**HealthPulse** is a premium, data-driven health dashboard designed for individuals who want deep insights into their wellness journey. It replaces fragmented tracking tools with a unified experience, integrating seamlessly with **Garmin Connect** to provide a holistic view of your body composition, habits, and progress.

![HealthPulse Dashboard](https://raw.githubusercontent.com/jaspergeertsma/healthpulse_app/main/public/preview.png) *(Placeholder for actual screenshot)*

---

## ✨ Features

- 📊 **Customizable Dashboard**: A dynamic grid system with resizable widgets (1/4 to 4/4 width) that lets you prioritize the metrics you care about most.
- 🔄 **Garmin Connect Integration**: Automated sync of weight, BMI, body fat percentage, muscle mass, and more directly from your Garmin Index scale.
- 🧘 **Daily Habit Tracking**: Simple, powerful tracking for Intermittent Fasting (IF) and Sleep targets.
- 📈 **Advanced Visualizations**: Beautiful, interactive charts powered by Recharts to visualize long-term trends and short-term fluctuations.
- 👤 **Progressive Tracking**: Set goals for weight and body composition and track your progress with insightful badges and metrics.
- 🔒 **Secure & Private**: Powered by Supabase, ensuring your sensitive health data is protected with Row Level Security (RLS).

---

## 🚀 Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend / Database**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Edge Functions)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Source**: Garmin Connect API (via Edge Functions)

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Supabase account
- A Garmin Connect account

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jaspergeertsma/healthpulse_app.git
   cd healthpulse_app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture & Sync

### Database Schema
The database is hosted on Supabase and includes the following core tables:
- `weight_entries`: Stores body composition data.
- `user_profile`: User settings, height, and health goals.
- `daily_habits`: Tracks whether daily IF and Sleep targets were met.
- `sync_log`: History of Garmin data synchronization attempts.

### Garmin Sync Engine
Data is fetched from Garmin Connect via a **Supabase Edge Function**. This function handles:
1. Authentication with Garmin servers.
2. Fetching recent body composition metrics.
3. Mapping and storing data into the `weight_entries` table.

*Note: Garmin credentials should be stored as Edge Function Secrets, not in the client-side `.env` file.*

---

## 🛣️ Development Workflow

This project follows a **Trunk-Based Light** branching model:

- `main`: The stable production branch. Only updated via PRs from `dev`.
- `dev`: The integration branch where all features are merged first.
- `feature/your-feature`: Short-lived branches for specific developments, branched from `dev`.

### Commits
Please use descriptive commit messages. We recommend the [Conventional Commits](https://www.conventionalcommits.org/) format.

---

## 📄 License

This project is licensed under the ISC License.

---

*Built with ❤️ for a healthier lifestyle.*
