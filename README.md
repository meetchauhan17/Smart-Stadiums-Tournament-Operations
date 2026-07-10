# 🏟️ StadiumIQ 2026 — GenAI-Powered Smart Stadium Platform

**StadiumIQ 2026** is a premium, real-time AI co-pilot platform designed for the **FIFA World Cup 2026**. Built with React, Vite, Tailwind CSS, Recharts, and Framer Motion, it features a bold, modern **Flat Design** aesthetic and advanced Generative AI capabilities powered by **Cohere** and **Mistral AI**.

---

## 🎯 Problem Statement

StadiumIQ focuses on two understated but critical personas: **Volunteers** who need real-time crowd intelligence to assist 80,000+ attendees, and **Fans** who face navigation, language, and accessibility barriers in an unfamiliar stadium environment.

| Persona | Challenge | StadiumIQ Solution |
|---|---|---|
| **Volunteer (Primary)** | Coordinating 10,000+ volunteers across 10 venues with zero real-time situational awareness | Volunteer Co-Pilot — AI incident command, crowd-aware zone maps, multilingual briefings |
| **Fan (Secondary)** | Navigation, language barriers, and accessibility gaps in an 82,500-capacity venue | Fan Experience Hub — AI wayfinding, 5-language assistant, live crowd-aware routing |

---

## 🌟 Key Features

### 1. Volunteer Co-Pilot
*   **Live KPI Strip:** Monitor occupancy rates, unresolved alerts, volunteer count, response times, and real-time AQI.
*   **Interactive ZoneMap:** SVG-based interactive map displaying zone density levels (nominal, warning, critical) — crowd-aware so volunteers know exactly where to go.
*   **Crowd Flow Heatmap:** Creative Recharts AreaChart showing crowd density per zone over a 24-hour cycle.
*   **Tactical AI Coordinator:** Type incident details and immediately generate complex mitigation protocols (PA announcements, volunteer reassignments) — the heart of the co-pilot.
*   **Real-time Weather & AQI:** Uses free Open-Meteo APIs to stream live conditions to the operations desk, caching intelligently every 10–15 minutes.

### 2. Fan Experience Hub
*   **Crowd-Aware Wayfinding:** Choose from restrooms, merchandise stalls, first-aid posts, or gates, and receive structured walking paths and estimated walking times — routes adapted to live crowd density.
*   **Multilingual AI Assistant (Tone & Context Aware):** Instantly translate user questions in 5 languages (English, Español, Français, Português, العربية) and generate replies with safety alerts, adjusting tone for urgency vs. casual queries.
*   **Venue Switching:** Dropdown in the top navigation instantly switches context across 10 official FIFA 2026 venues, updating timezones, capacities, and live weather.

### 3. Crowd Intelligence
*   **Volunteer Roster Table:** A virtualized list of security, medical, and volunteer personnel displaying status, zones, and average response times.
*   **Crowd-Aware Deployment:** Instantly reassign volunteers to high-density zones based on real-time crowd flow data.
*   **AI Pre-match Briefings:** Generate briefing instructions for crowd management, medical hazards, or evacuations — tailored per venue and capacity.

### 4. Sustainability Dashboard
*   **Real AQI Data:** Pulls live PM2.5, PM10, CO, and NO2 data to accurately assess stadium environmental health.
*   **Composed Energy Chart:** Dual-Axis Recharts comparing energy production (solar) vs grid draw with brush-based zoom sliders.
*   **AI Energy Report:** Generate optimization strategies for HVAC scaling and water reclamation based on live capacity and weather.

---

## 🔌 API Integrations & Architecture

*   **Generative AI Providers:** Dynamically switchable between **Cohere (command-r-08-2024)** and **Mistral AI (open-mistral-7b, mistral-small-latest)** via the settings panel. Uses direct API integrations routed through Vite proxies in development to securely bypass browser CORS restrictions.
*   **10 Official Venues Data:** Hardcoded database of MetLife, SoFi, AT&T, Azteca, etc., including capacity, coordinates, and timezone logic.
*   **Open-Meteo Weather API:** Provides live temperature, wind speed/direction, and humidity without requiring an API key.
*   **Open-Meteo Air Quality API:** Provides current AQI metrics for environmental dashboards.
*   **Sunrise-Sunset.org API:** Calculates precise day length and solar noon for sustainability modeling.

---

## 🛡️ Security Hardening & Robustness
*   **Input Sanitization:** Strips HTML tag elements from all text inputs and enforces strict length caps to prevent XSS.
*   **Session Rate Limiting:** Enforces a maximum of 10 API calls per minute per user session (persisted in `sessionStorage`) to protect API keys.
*   **Timeout & Fallbacks:** Uses `AbortController` to force a 10-second timeout on AI API requests. If a request fails or times out, the app seamlessly serves a realistic, structured mock fallback model.
*   **Graceful Degradation:** Free public APIs are wrapped in `try/catch` logic. If an endpoint fails, the UI falls back to "Data unavailable" without crashing the React tree.

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

### Testing Suite
```bash
# Run Vitest test suite with MSW (Mock Service Worker) for network interception
npm run test

# Run tests with coverage reporting
npm run test:coverage
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
3.  Add your API keys via the in-app settings (stored safely in `localStorage`).

---
*Created for the GenAI FIFA World Cup Hackathon 2026.*
