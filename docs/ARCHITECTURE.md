# FocusForge AI - System Architecture

## 1. Tech Stack Overview
- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Recharts.
- **Routing**: React Router DOM (v7).
- **Backend/DB**: Mocked client-side currently; target is Firebase (Auth & Firestore) for production.
- **3D Visualization (Target)**: React Three Fiber for character rendering, currently using placeholder/micro-animations in early MVP phases.

## 2. Design System and Token Architecture
FocusForge uses a semantic token system spanning CSS variables for robust Light/Dark mode toggling:
- App-wide themes update dynamically via the `ThemeProvider`.
- Tokens map explicitly to colors, typography, and interactive states (e.g. `var(--accent-primary)`, `var(--bg-secondary)`).

## 3. Components
- **UI Toolkit**: `Button`, `Card`, `Badge` mapped directly to standard SaaS aesthetics but augmented with the FocusForge design language (slight glassy effects, border subtle shading).
- **Layout Manager**: Standard sidebar/header split rendering child views via React Router `Outlet`.

## 4. Core Algorithms (Reference implementation in `utils.ts`)
- **Deadline Risk**: Factor of days remaining vs completion percentage.
  - Less than 3 days, < 50% = High Risk (Red/Attention)
- **AI Coach Rules**: Suggests actions based on streak status, current risk status, and onboarding states.
