# Atmosphere — Real-Time Weather Explorer
### PROJECT ASSIGNMENT 02 | B.Tech Computer Science & Engineering
**Developer:** Sameera Bhanu  
**Institution:** Shri Vishnu Engineering College for Women (SVECW), Bhimavaram  
**Duration:** 7 Days | **Level:** Beginner  
**Live Demo:** [https://sksameera321.github.io/weather-application/](https://sksameera321.github.io/weather-application/)  
**GitHub Repository:** [https://github.com/sksameera321/weather-application](https://github.com/sksameera321/weather-application)

---

## 1. Project Overview & Objective

**Atmosphere** is a production-grade, Apple Weather-inspired real-time meteorological explorer built entirely with semantic **HTML5**, modern **CSS3** (Flexbox & Grid), and **Vanilla JavaScript** (ES6+ Modules).

The core objective of this project is to develop a deep, practical mastery of asynchronous JavaScript, external REST API communication, JSON payload parsing, defensive error handling, and responsive state-driven UI updates without relying on heavy frameworks such as React, Next.js, Bootstrap, or Tailwind CSS.

All weather data displayed—current temperature, apparent feel, wind velocity and compass heading, humidity, dew point, atmospheric pressure, UV index, sunrise/sunset solar arcs, 24-hour hourly progressions, and 7-day extended forecasts—is dynamically queried from the live **Open-Meteo REST API**. No hardcoded or simulated static values are presented as live data.

---

## 2. Design Philosophy & User Experience

Designed with Apple Weather-inspired visual clarity and minimal elegance:
- **Atmospheric Dynamic Themes:** The interface background adapts dynamically to the current meteorological conditions and time of day (Clear Day, Clear Night, Cloudy Day/Night, Rain, Snow, Fog, Thunderstorm).
- **Apple Weather Temperature Spectrum:** The 7-day forecast renders Apple Weather's iconic horizontal range bars, calibrating each day's temperature range relative to the entire week's extremes, accompanied by an active indicator dot for the current live temperature on today's row.
- **Translucent Frosted Glass Architecture:** High-contrast frosted glass cards (`backdrop-filter: blur(24px) saturate(170%)`) with crisp border highlights, subtle inner glows, and tactile button states.
- **Precision Meteorological Bento Grid:** Six focused parameter cards providing actionable meteorological insights: UV Index with risk advice, Wind with a 360-degree rotating compass needle, Sun Schedule with a parabolic solar daylight arc, Humidity with dew point calculation, Visibility with atmospheric clarity indices, and Pressure with an atmospheric barometer gauge.
- **Zero Heavy Dependencies:** Crafted with 100% pure vanilla web standards.

---

## 3. Architecture & File Structure

The project follows a clean separation of concerns using native ES6 JavaScript modules:

```
weather-application/
├── index.html              # Semantic HTML5 layout and accessibility markup
├── css/
│   └── style.css           # Apple Weather design system, themes, and bento grid
├── js/
│   ├── app.js              # Application orchestrator, event delegation, and DOM rendering
│   ├── api.js              # Open-Meteo REST API client & resilient proxy fallback pipeline
│   ├── weather.js          # WMO code dictionary, custom vector SVGs, and metric conversions
│   ├── forecast.js         # Hourly 24h timeline and 7-day spectrum calculations
│   └── storage.js          # LocalStorage persistence for units, recents, and favorites
├── assets/                 # Brand assets and SVG iconography
├── server.js               # Zero-dependency local Node.js development server
├── .gitignore              # Ignored files and local environment caches
├── .nojekyll               # Disables Jekyll processing on GitHub Pages
└── README.md               # Technical documentation and development report
```

---

## 4. Open-Meteo REST API Integration

The application integrates Open-Meteo's open-access meteorological endpoints requiring zero private keys:

### A. Geocoding API (City Search & Autosuggest)
- **Endpoint:** `https://geocoding-api.open-meteo.com/v1/search`
- **Parameters:**
  - `name`: Target city name string (e.g., `London`, `Tokyo`, `Bhimavaram`)
  - `count`: Maximum candidate results (`6`)
  - `language`: `en`
  - `format`: `json`
- **Output:** Returns geographic coordinate pairs (`latitude`, `longitude`), country codes, administrative regions, and local timezone identifiers.

### B. Forecast API (Current & Extended Meteorological Data)
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Parameters Configured:**
  - `latitude`, `longitude`: Target station coordinates.
  - `current`: `temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,visibility,uv_index`
  - `hourly`: `temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,surface_pressure,visibility,wind_speed_10m,is_day`
  - `daily`: `weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max`
  - `timezone`: `auto` (resolves timestamps to the target city's official geographical timezone).

### C. WMO Weather Interpretation Codes
Atmosphere maps World Meteorological Organization (WMO) codes (0–99) to human-readable condition descriptions, atmospheric theme classes, and daylight-aware custom vector SVGs:

| Code Range | Meteorological Condition | Theme Applied | Day / Night Vector Icon |
| :--- | :--- | :--- | :--- |
| **0** | Clear Sky | `theme-clear-day` / `theme-clear-night` | Sun / Radiant Moon |
| **1 – 3** | Mainly Clear to Overcast | `theme-cloudy-day` / `theme-cloudy-night` | Sun behind cloud / Layered clouds |
| **45, 48** | Fog & Depositing Rime Fog | `theme-foggy` | Cloud with horizontal mist lines |
| **51 – 55** | Light to Dense Drizzle | `theme-rainy` | Cloud with dashed precipitation |
| **61 – 65** | Slight to Heavy Rain | `theme-rainy` | Cloud with angled rain strokes |
| **71 – 77** | Snow Fall & Snow Grains | `theme-snowy` | Cloud with hexagonal crystal flakes |
| **80 – 82** | Violent Rain Showers | `theme-rainy` | Dark cloud with dense precipitation |
| **95 – 99** | Thunderstorm with/without Hail | `theme-thunderstorm` | Charcoal storm cloud with golden lightning bolt |

---

## 5. Technical Highlights & Engineering Solutions

### 1. Resilient Dual-Stage Proxy Architecture (Solving Heterogeneous Network Timeouts)
- **Problem:** Certain institutional Wi-Fi networks (including collegiate campus filters) and select ISPs throttle or block direct TLS connections (`Port 443`) to European Hetzner server pools (`157.90.x.x`), causing `fetch()` calls to `api.open-meteo.com` to trigger `ConnectTimeoutError`.
- **Solution:** In `js/api.js`, a resilient `fetchWithFallback()` pipeline was implemented. It first attempts a direct low-latency connection with an `AbortController` 3.5-second timeout. If the direct request times out or is network-blocked, it automatically failovers to a Cloudflare edge proxy (`api.allorigins.win/raw?url=...`). This guarantees 100% data delivery regardless of the user's ISP routing restrictions.

### 2. Apple Weather Spectrum Normalization Algorithm
- **Problem:** Rendering daily high and low temperatures across a 7-day forecast in a way that visually illustrates the week's comparative thermal trends.
- **Solution:** In `js/forecast.js`, the global minimum ($\text{Min}_{\text{week}}$) and maximum ($\text{Max}_{\text{week}}$) are extracted across the 7-day array. Each day's range bar position and span are computed via:
  $$\text{BarLeft}\% = \left(\frac{\text{Min}_{\text{day}} - \text{Min}_{\text{week}}}{\text{Max}_{\text{week}} - \text{Min}_{\text{week}}}\right) \times 100$$
  $$\text{BarWidth}\% = \left(\frac{\text{Max}_{\text{day}} - \text{Min}_{\text{day}}}{\text{Max}_{\text{week}} - \text{Min}_{\text{week}}}\right) \times 100$$
  For "Today", an additional luminous indicator dot is positioned at:
  $$\text{CurrentDot}\% = \left(\frac{T_{\text{current}} - \text{Min}_{\text{week}}}{\text{Max}_{\text{week}} - \text{Min}_{\text{week}}}\right) \times 100$$

### 3. Asynchronous Debounced Search with In-Flight Request Cancellation
- **Problem:** Typing rapidly in the search input could trigger multiple redundant network requests, causing race conditions where an older query overwrites a newer one.
- **Solution:** Implemented a 260ms debounce timer combined with an active `AbortController`. When a new keystroke occurs, any pending in-flight request is cancelled via `activeSearchAbort.abort()`, preserving bandwidth and eliminating race conditions.

---

## 6. Seven-Day Development Plan

| Day | Focus Area | Key Deliverables |
| :--- | :--- | :--- |
| **Day 1** | Requirement Analysis & API Architecture | Researched Open-Meteo endpoints, designed data contracts, created UI wireframes. |
| **Day 2** | Semantic Structure & Base Layout | Built accessible HTML5 shell, header, hero card, hourly track, and bento grid containers. |
| **Day 3** | CSS Architecture & Apple Styling | Authored custom glassmorphic styling, dynamic weather themes, and responsive CSS Grid rules. |
| **Day 4** | API Integration & Resilient Fetching | Implemented `api.js` with Geocoding, Forecast, and automatic proxy failover architecture. |
| **Day 5** | Hourly Slider & 7-Day Spectrum | Developed `forecast.js`, horizontal hourly scroll track, and Apple range bar spectrum formulas. |
| **Day 6** | Bento Details & LocalStorage | Built UV meter, wind compass, solar daylight arc, unit toggle, recents, and favorites persistence. |
| **Day 7** | Quality Assurance & Deployment | Tested edge cases, verified mobile responsiveness, wrote technical README, deployed to GitHub Pages. |

---

## 7. Local Setup & Testing

To run the application locally without external dependencies:

```bash
# 1. Clone the repository
git clone https://github.com/sksameera321/weather-application.git

# 2. Navigate to the project directory
cd weather-application

# 3. Start the zero-dependency Node.js static server
node server.js

# 4. Open in your browser
# Visit http://localhost:3005/
```

Alternatively, open `index.html` directly in any modern browser supporting ES6 modules or using VS Code Live Server.

---

## 8. Verification & Live Deployment Checklist

- [x] Real-time live data queried exclusively from Open-Meteo REST API.
- [x] Dynamic city search with keyboard accessibility and live geocoding suggestions.
- [x] Complete meteorological details: Humidity, Wind Speed, Direction Compass, Pressure, Visibility, UV Index, and Sun Schedule.
- [x] 24-hour horizontally scrollable hourly progression.
- [x] 7-day daily forecast featuring Apple Weather temperature range spectrum bars.
- [x] Instant Celsius ($^\circ\text{C}$) / Fahrenheit ($^\circ\text{F}$) unit conversion with LocalStorage state persistence.
- [x] Favorite cities pinned drawer and recent searches chip navigation.
- [x] Geolocation GPS "Locate Me" support.
- [x] Resilient offline detection and graceful error recovery states.
- [x] Fully responsive across Mobile (<480px), Tablet (768px), and Desktop (>1024px).
