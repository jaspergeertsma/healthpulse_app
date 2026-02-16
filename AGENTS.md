# 🤖 AGENTS.md — Instructions for AI Assistants

This document contains critical information and instructions for AI agents (like Antigravity) working on the **HealthPulse** codebase. Following these guidelines ensures consistency, quality, and alignment with the project's vision.

---

## 🎯 Global Context
HealthPulse is a **premium health dashboard**. Aesthetics and user experience are as important as the underlying logic. Every UI change should feel "high-end" (smooth transitions, glassmorphism, consistent spacing, and vibrant yet professional color palettes).

### Tech Stack Refresher
- **Framework**: React 19 (Functional components, Hooks).
- **Styling**: Tailwind CSS 4 (Use modern utilities, avoid custom CSS unless necessary).
- **Data**: Supabase (JS client for DB and Auth).
- **Charts**: Recharts.
- **Icons**: Lucide React.

---

## 📂 Project Structure
- `src/components/Dashboard.jsx`: The core of the app. It uses a custom widget system.
- `src/components/ui.jsx`: Contains reusable, atomic UI components (Card, Button, Badge). **Check here first before creating new UI elements.**
- `src/components/charts.jsx`: Standardized chart wrappers.
- `src/lib/supabase.js`: Supabase client initialization.
- `supabase/migrations/`: SQL schema definitions. ALWAYS refer to these for data types and relationships.

---

## 🛠️ Development Guidelines

### 1. UI & Styling
- **Premium Feel**: Use subtle shadows (`shadow-sm`, `shadow-md`), rounded corners (`rounded-xl`, `rounded-2xl`), and consistent padding.
- **Dynamic Design**: Add hover states and transitions to interactive elements.
- **Tailwind 4**: Leverage the latest features of Tailwind 4.

### 2. State & Data
- Use Supabase hooks and the `supabase` client for data fetching.
- Ensure all queries are filtered by `user_id` (enforced by RLS, but better to be explicit in JS for clarity).
- When adding new metrics, update the corresponding SQL migration file in `supabase/migrations/`.

### 3. Dashboard Widgets
- The dashboard is a grid. Widgets should support multiple width configurations (`1/4`, `2/4`, `3/4`, `4/4`).
- Layouts are persisted in the database; ensure any changes to widget structures are reflected in the persistence logic.

---

## 🔄 Workflow & Ethics
- **Trunk-Based Light**: Develop on `feature/` branches, merge to `dev`, and finally to `main`.
- **No Placeholders**: Never use placeholder text or images. Generate real-looking data or use the `generate_image` tool for visual assets.
- **Self-Correction**: If you encounter a bug or a linting error, fix it immediately before proceeding with the main task.
- **Knowledge Items**: Before starting a major refactor or feature, check for existing KIs in `<appDataDir>/knowledge` to avoid redundant work.

---

## 📝 Commit Conventions
Follow Conventional Commits:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature

---

**Remember**: You are a senior partner in this project. Proactively suggest improvements if you see a way to make the app faster, prettier, or more secure.
