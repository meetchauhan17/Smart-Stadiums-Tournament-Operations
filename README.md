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

## 🌟 Key Features & Hubs

### 1. Volunteer Co-Pilot & Operations Desk
*   **Live KPI Strip:** Monitor occupancy rates, unresolved alerts, volunteer count, response times, and real-time Air Quality Index (AQI).
*   **Interactive ZoneMap (`<ZoneMap />`):** SVG-based interactive map displaying zone density levels (nominal, warning, critical) — crowd-aware so volunteers know exactly where to go.
*   **Crowd Flow Heatmap:** Custom Recharts AreaChart showing historical and predictive crowd density per zone over a 24-hour cycle.
*   **Tactical AI Coordinator:** Type incident details and immediately generate complex mitigation protocols (PA announcements, volunteer reassignments) using Cohere or Mistral models.
*   **Real-time Weather & AQI:** Uses free Open-Meteo APIs to stream live conditions to the operations desk, caching intelligently every 10–15 minutes to preserve network bandwidth.

### 2. Fan Experience Hub
*   **Crowd-Aware Wayfinding:** Choose from restrooms, merchandise stalls, first-aid posts, or gates, and receive structured walking paths and estimated walking times — routes dynamically adapt to live crowd density data.
*   **Multilingual AI Assistant (Tone & Context Aware):** Instantly translate user questions in 5 languages (English, Español, Français, Português, العربية) and generate replies with safety alerts, adjusting tone for urgency vs. casual queries. Supports RTL (Right-to-Left) rendering for Arabic.
*   **Global Venue Switching:** Dropdown in the top navigation instantly switches context across 10 official FIFA 2026 venues, instantly recalculating timezones, max capacities, and fetching local live weather.

### 3. Crowd Intelligence & Staffing
*   **Volunteer Roster Table:** A virtualized, accessible list of security, medical, and volunteer personnel displaying status, active zones, and average response times.
*   **Crowd-Aware Deployment:** Instantly reassign volunteers to high-density zones based on real-time crowd flow simulations.
*   **AI Pre-match Briefings:** Generate briefing instructions for crowd management, medical hazards, or evacuations — tailored per venue layout and current expected capacity.

### 4. Sustainability Dashboard
*   **Real AQI Data:** Pulls live PM2.5, PM10, CO, and NO2 data to accurately assess stadium environmental health against WHO standards.
*   **Composed Energy Chart:** Dual-Axis Recharts comparing energy production (solar generation) vs grid draw with brush-based zoom sliders for micro-analysis.
*   **AI Energy Report:** Generate actionable optimization strategies for HVAC scaling and water reclamation based on live capacity and weather forecasts.

---

## 🏗️ Architecture & Folder Structure

The project follows a standard Vite/React layout, heavily reliant on standard React Context for state management and an abstracted AI transport layer.

```text
src/
├── components/          # Reusable UI components (Navbar, ZoneMap, SettingsModal)
├── context/             # Global State Management (StadiumContext)
├── hooks/               # Custom React hooks (useAI, useLiveData)
├── pages/               # Primary application routes (Operations, Fan, Staff, Sustainability)
├── test/                # Test utilities, MSW configuration, and setup scripts
├── utils/               # AI helper logic, API wrappers, validation logic
├── App.jsx              # Main router configuration
├── i18n.js              # Localization (i18next) setup
└── index.css            # Tailwind directives and core CSS variables
```

---

## 🔌 AI Integrations & API Architecture

*   **Generative AI Providers:** Dynamically switchable between **Cohere (`command-r-08-2024`)** and **Mistral AI (`open-mistral-7b`, `mistral-small-latest`)** via the global settings panel. 
*   **Vite Proxies for CORS Bypass:** In local development, AI `fetch()` requests are seamlessly routed through Vite proxies (`/cohere-api` and `/mistral-api`) to securely bypass strict browser CORS policies without requiring a custom backend.
*   **10 Official Venues Data:** Hardcoded database of MetLife, SoFi, AT&T, Azteca, etc., including capacity, coordinates, and timezone logic.
*   **Open-Meteo Weather API:** Provides live temperature, wind speed/direction, and humidity without requiring an API key.
*   **Open-Meteo Air Quality API:** Provides current AQI metrics for environmental dashboards.
*   **Sunrise-Sunset.org API:** Calculates precise day length and solar noon for sustainability modeling.

---

## 🛡️ Security Hardening & Robustness
*   **Input Sanitization:** Custom `sanitizeInput` utilities strip HTML tag elements from all text inputs and enforce strict length caps to prevent Cross-Site Scripting (XSS).
*   **Session Rate Limiting:** Enforces a maximum of 10 AI API calls per minute per user session (persisted securely in `sessionStorage`) to protect your API keys from abuse.
*   **Timeout & Fallbacks:** Uses `AbortController` to force a strict 10-second timeout on all AI API requests. If a request fails or times out, the app seamlessly serves a realistic, structured mock fallback model.
*   **Graceful Degradation:** Free public APIs (weather, sunset) are wrapped in robust `try/catch` logic. If an endpoint rate-limits or fails, the UI falls back to "Data unavailable" without crashing the React tree.

---

## 🚀 Accessibility (a11y) & UX Polish
*   **Keyboard Accessibility:** Pressing `?` toggles the global flat design keyboard shortcut overlay. Pressing `O`, `F`, `S`, or `G` navigates directly to the core application hubs.
*   **Screen Reader Parity:** Visually hidden (`sr-only`) data tables are actively mapped to all visual Recharts, ensuring complete screen reader parity for visually impaired users.
*   **Page Transitions:** Implemented slide-in-from-right transitions on navigation routing using `AnimatePresence` and `framer-motion`.
*   **Global Toasts:** A global toast provider pushes flat design notifications to the bottom right for AI completions, resolved incidents, and stadium context switches.

---

## 🛠️ Local Development & Scripts

### Prerequisites
*   Node.js (v18+)
*   npm (v9+)

### Installation
```bash
# Clone the repository and install dependencies
git clone https://github.com/meetchauhan17/Smart-Stadiums-Tournament-Operations.git
cd smart-stadiums-operations
npm install
```

### Starting the Dev Server
```bash
# Start the local development server (with HMR and Vite CORS proxies)
npm run dev
```

### Testing Suite
We use **Vitest** for unit and component testing, alongside **MSW (Mock Service Worker)** to intercept network requests to Cohere and Mistral AI, ensuring tests are fast and deterministic.

```bash
# Run the Vitest test suite with MSW network interception
npm run test

# Run tests with real-time watch mode
npm run test:watch

# Run tests with comprehensive coverage reporting
npm run test:coverage
```

### Production Build
```bash
# Compile and optimize the application into the /dist directory
npm run build
```

---

## 🌐 Deployment
This application is fully optimized for **Vercel** or **Netlify** deployments:
1.  Configure the build command: `npm run build`
2.  Configure the output directory: `dist`
3.  Add your AI API keys via the in-app settings modal (keys are stored safely in your browser's `localStorage`). No server-side `.env` variables are strictly required since this is a client-heavy architecture.

---
*Created for the GenAI FIFA World Cup Hackathon 2026.*
