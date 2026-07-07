# 🏟️ StadiumIQ 2026 — GenAI-Powered Smart Stadium Platform

**StadiumIQ 2026** is a premium, real-time command, logistics, and spectator assistance platform designed for the **FIFA World Cup 2026**. Built with React, Vite, Tailwind CSS, Recharts, and Framer Motion, it features advanced Generative AI capabilities powered by Anthropic's Claude API, wrapped in a security-hardened, offline-capable, and accessible Progressive Web App (PWA).

---

## 🌟 Key Features

### 1. Operations Control Room
*   **Live KPI Strip:** Monitor occupancy rates, unresolved alerts, staff count, response times, and fan satisfaction in real-time.
*   **Interactive ZoneMap:** SVG-based interactive map displaying zone density levels (nominal, busy, critical) with arrow-key keyboard navigation and aria-pressed attributes.
*   **Crowd Flow Heatmap:** Creative Recharts ScatterChart showing crowd density per zone over a 24-hour cycle.
*   **Gate Throughput:** BarChart demonstrating gate-by-gate throughput with red warning cells exceeding 85% capacity.
*   **Tactical AI Coordinator:** Type incident details and immediately generate complex mitigation protocols (PA announcements, steward reassignments, estimated resolution times).
*   **Match Day Mode:** A high-urgency toggle that accelerates simulation speed, displays a kickoff countdown, and highlights alerts with pulsing red borders.

### 2. Fan Experience Hub
*   **Wayfinding Navigation:** Choose from restrooms, merchandise stalls, first-aid posts, or gates, and receive structured walking paths and estimated walking times.
*   **Multilingual AI Assistant:** Instantly translate user questions in 5 languages (English, Español, Français, Português, العربية) and generate replies with safety alerts.
*   **RTL Arabic Layout:** Fully mirrored layout with logical properties (`padding-inline-start`) and RTL document direction.

### 3. Staff Command Center
*   **Staff Roster Table:** A virtualized list of security, medical, and volunteer personnel displaying status, zones, and average response times.
*   **Shift Reassignment:** Instantly change staff shift status or assign new zones.
*   **AI pre-match briefings:** Generate briefing instructions for crowd management, medical hazards, or evacuations.

### 4. Sustainability Dashboard
*   **Circular Progress Gauges:** Animated SVG progress gauges mapping solar energy coverage, water recycling rates, waste diversion, and carbon offsets.
*   **Dual-Axis Energy Chart:** Recharts ComposedChart comparing energy production (solar) vs grid draw with brush-based zoom sliders.
*   **AI Energy Tips:** Real-time HVAC zone suggestions based on weather conditions.

---

## ⚡ Real-Time Simulation Hook (`useLiveData`)
A central simulation loop handles realistic stadium data updates using memoized state transitions:
1.  **Crowd Density:** Fluctuates every 15s (accelerated to 3s in Match Day Mode), spiking near gates during peak entry. Clamps between 20% and 100%.
2.  **Alert Generation:** Generates new alerts every 45-90s with specific severity probabilities (60% info, 30% warning, 10% critical) and schedules random auto-resolution timers.
3.  **Staff Status:** Simulates staff shifting onto breaks, keeping overall break rosters below 15%.
4.  **Sustainability Metrics:** Solar generation follows daylight curves, while energy and water usage scale dynamically.

---

## 🛡️ Security Hardening & Robustness
*   **Input Sanitization:** Strips HTML tag elements from all text inputs and enforces strict length caps (500 chars for chat, 200 for nav).
*   **Session Rate Limiting:** Enforces a maximum of 10 Claude API calls per minute per user session (persisted in `sessionStorage`).
*   **Timeout & Fallbacks:** Uses `AbortController` to force a 10-second timeout on Anthropic API requests. If a request fails or times out, the app seamlessly serves a realistic, structured fallback model.
*   **XSS Protection:** Automatically escapes output strings to prevent rendering-based script injections.
*   **Content Security Policy:** Configured via meta tags in `index.html` to block unauthorized sources.

---

## 🚀 Accessibility (a11y) & UX Polish
*   **Keyboard Accessibility:** Custom focus trap hook (`useFocusTrap.js`) handles modal interactions. Pressing `?` toggles the keyboard shortcut list overlay.
*   **Screen Reader Tables:** Visually hidden (`sr-only`) data tables represent all Recharts visual charts, ensuring screen reader parity.
*   **Page Transitions:** Implemented slide-in-from-right transitions on navigate using `AnimatePresence` and `framer-motion`.
*   **Global Toasts:** Global toast provider pushes status updates for AI completions, resolved alerts, and staff state changes in the top-right corner.

---

## 🧪 Comprehensive Testing Suite
StadiumIQ includes a robust test suite of **75 unit/integration tests** using **Vitest**, **React Testing Library**, and **Mock Service Worker (MSW)**.

*   `aiClient.test.js` — Verifies sanitization, XSS escaping, rate limiting, and 10s fetch timeouts.
*   `StadiumContext.test.jsx` — Tests state updates, clamping logic, and venue switching.
*   `ZoneMap.test.jsx` — Verifies rendering, click handlers, and arrow-key focus traversal.
*   `Operations.test.jsx` — Tests AI strategy calculations, unresolved counters, and chart console switching.
*   `useLiveData.test.jsx` — Confirms interval cleanup on unmount, density boundary clamping, and structure.

---

## 🛠️ Local Development & Scripts

### Prerequisites
*   Node.js (v18+)
*   npm (v9+)

### Installation
```bash
# Clone the repository and install dependencies
git clone <repo-url>
cd smart-stadiums-operations
npm install
```

### Dev Server
```bash
# Start the local development server (with HMR)
npm run dev
```

### Running Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Generate code coverage report
npm run test:coverage
```

### Production Build
```bash
# Compile and optimize the application
npm run build
```

---

## 📦 Progressive Web App (PWA)
StadiumIQ 2026 is fully installable as a standalone app.
*   **Service Worker (`sw.js`):** Intercepts requests and implements a Cache-First strategy for assets and Stale-While-Revalidate for APIs.
*   **Manifest (`manifest.json`):** Defines startup URLs, branding, icons, and theme color `#00D4FF`.

---

## 🌐 Deployment
This application is fully optimized for **Vercel** deployment:
1.  Configure the build command: `npm run build`
2.  Configure the output directory: `dist`
3.  Inject the Anthropic Claude API Key if desired as environment variables, or enter it directly via the app settings.

---
*Created for the GenAI FIFA World Cup Hackathon 2026.*
