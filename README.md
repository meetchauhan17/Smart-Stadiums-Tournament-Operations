# 🏟️ StadiumIQ 2026 — GenAI-Powered Smart Stadium Platform

**StadiumIQ 2026** is a premium, real-time command, logistics, and spectator assistance platform designed for the **FIFA World Cup 2026**. Built with React, Vite, Tailwind CSS, Recharts, and Framer Motion, it features a bold, modern **Flat Design** aesthetic and advanced Generative AI capabilities powered by Anthropic's Claude API.

---

## 🌟 Key Features

### 1. Operations Control Room
*   **Live KPI Strip:** Monitor occupancy rates, unresolved alerts, staff count, response times, and real-time AQI.
*   **Interactive ZoneMap:** SVG-based interactive map displaying zone density levels (nominal, warning, critical).
*   **Crowd Flow Heatmap:** Creative Recharts AreaChart showing crowd density per zone over a 24-hour cycle.
*   **Tactical AI Coordinator:** Type incident details and immediately generate complex mitigation protocols (PA announcements, steward reassignments).
*   **Real-time Weather & AQI:** Uses free Open-Meteo APIs to stream live conditions to the operations desk, caching intelligently every 10-15 minutes.

### 2. Fan Experience Hub
*   **Wayfinding Navigation:** Choose from restrooms, merchandise stalls, first-aid posts, or gates, and receive structured walking paths and estimated walking times.
*   **Multilingual AI Assistant:** Instantly translate user questions in 5 languages (English, Español, Français, Português, العربية) and generate replies with safety alerts.
*   **Venue Switching:** Dropdown in the top navigation instantly switches context across 10 official FIFA 2026 venues, updating timezones, capacities, and live weather.

### 3. Staff Command Center
*   **Staff Roster Table:** A virtualized list of security, medical, and volunteer personnel displaying status, zones, and average response times.
*   **Shift Reassignment:** Instantly change staff shift status or assign new zones.
*   **AI Pre-match Briefings:** Generate briefing instructions for crowd management, medical hazards, or evacuations.

### 4. Sustainability Dashboard
*   **Real AQI Data:** Pulls live PM2.5, PM10, CO, and NO2 data to accurately assess stadium environmental health.
*   **Composed Energy Chart:** Dual-Axis Recharts comparing energy production (solar) vs grid draw with brush-based zoom sliders.
*   **AI Energy Report:** Generate optimization strategies for HVAC scaling and water reclamation based on live capacity and weather.

---

## 🔌 Free Real API Integrations

*   **10 Official Venues Data:** Hardcoded database of MetLife, SoFi, AT&T, Azteca, etc., including capacity, coordinates, and timezone logic.
*   **Open-Meteo Weather API:** Provides live temperature, wind speed/direction, and humidity without requiring an API key.
*   **Open-Meteo Air Quality API:** Provides current AQI metrics for environmental dashboards.
*   **Sunrise-Sunset.org API:** Calculates precise day length and solar noon for sustainability modeling.

---

## 🛡️ Security Hardening & Robustness
*   **Input Sanitization:** Strips HTML tag elements from all text inputs and enforces strict length caps.
*   **Session Rate Limiting:** Enforces a maximum of 10 Claude API calls per minute per user session (persisted in `sessionStorage`).
*   **Timeout & Fallbacks:** Uses `AbortController` to force a 10-second timeout on Anthropic API requests. If a request fails or times out, the app seamlessly serves a realistic, structured fallback model.
*   **Graceful Degradation:** Free public APIs are wrapped in `try/catch` logic. If an endpoint fails, the UI falls back to "Data unavailable" without crashing the react tree.

---

## 🚀 Accessibility (a11y) & UX Polish
*   **Keyboard Accessibility:** Pressing `?` toggles the global flat design keyboard shortcut overlay. Pressing `O`, `F`, `S`, or `G` navigates directly to the core hubs.
*   **Screen Reader Tables:** Visually hidden (`sr-only`) data tables represent all Recharts visual charts, ensuring screen reader parity.
*   **Page Transitions:** Implemented slide-in-from-right transitions on navigate using `AnimatePresence` and `framer-motion`.
*   **Global Toasts:** Global toast provider pushes flat design notifications to the bottom right for AI completions, resolved alerts, and stadium switches.

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

### Production Build
```bash
# Compile and optimize the application
npm run build
```

---

## 🌐 Deployment
This application is fully optimized for **Vercel** deployment:
1.  Configure the build command: `npm run build`
2.  Configure the output directory: `dist`
3.  Inject the Anthropic Claude API Key if desired as environment variables, or enter it directly via the app settings.

---
*Created for the GenAI FIFA World Cup Hackathon 2026.*
