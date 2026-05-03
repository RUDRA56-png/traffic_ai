# 🚦 TrafficAI — Intelligent Traffic Prediction System

A modern, responsive React frontend for the Traffic AI Prediction System with JWT authentication, role-based access, Google Maps integration, and real-time traffic analytics.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Running Spring Boot backend at `http://localhost:8080`

### Installation

```bash
# 1. Enter project folder
cd traffic-ai-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

---

## 🗺️ Google Maps Setup

To enable the map features, add your Google Maps API key:

1. Open `src/components/TrafficMap.jsx`
2. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key:
   ```js
   const GOOGLE_MAPS_API_KEY = 'AIzaSy...'
   ```
3. Enable these APIs in Google Cloud Console:
   - Maps JavaScript API
   - Geocoding API
   - Directions API

> **Without a key**, the app still works — map panels show a placeholder with location/route info displayed as text.

---

## 📁 Project Structure

```
traffic-ai-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   ├── Toast.jsx           # Toast notification system
│   │   ├── TrafficMap.jsx      # Google Maps integration
│   │   ├── TrafficResult.jsx   # Result display cards
│   │   ├── TrafficDataTable.jsx# Data table component
│   │   └── OverviewStats.jsx   # Stats grid
│   ├── hooks/
│   │   └── useAuth.jsx         # Auth context + JWT parsing
│   ├── pages/
│   │   ├── LoginPage.jsx       # Login page
│   │   ├── RegisterPage.jsx    # Registration page
│   │   ├── UserDashboard.jsx   # User dashboard
│   │   └── AdminDashboard.jsx  # Admin dashboard
│   ├── utils/
│   │   └── api.js              # Axios instance + API methods
│   ├── styles.css              # Global design system
│   ├── App.jsx                 # Router + auth guards
│   └── main.jsx                # Entry point
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔐 Authentication

- JWT token stored in `localStorage`
- Token auto-attached to all API requests via Axios interceptor
- 401/403 responses auto-redirect to login
- Role parsed from JWT payload (`role` or `roles[0]` field)
- Supports `ADMIN` and `USER` roles

### Demo Credentials
| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | admin123  |
| User  | user     | user123   |

---

## 🎨 Features

### User Dashboard
- **Overview** — Stats cards, quick predict, quick route, traffic map
- **Predict Traffic** — AI prediction with congestion level, speed, alerts
- **Route Planner** — Start/end route with traffic analysis
- **Live Map** — Google Maps with colored traffic markers
- **Traffic Data** — Full data table with all entries

### Admin Dashboard
- Everything in User Dashboard, plus:
- **Add Traffic Data** — Submit location, vehicle count, avg speed
- Admin indicator badge in topbar
- Quick-add form on overview

---

## 🗺️ Map Features

| Level | Feature |
|-------|---------|
| 1 | Map centered on India, marker on searched location |
| 2 | Route drawn between start and end points |
| 3 | Colored markers: 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW + traffic layer |

---

## 🎨 Design System

- **Font**: Syne (headings) + DM Sans (body)
- **Theme**: Dark blue cyberpunk — deep navy background, cyan/green accents
- **Cards**: Glassmorphism with border glow
- **Animations**: Fade-in, slide-up, spinner, toast slide-in
- **Responsive**: Sidebar collapses to hamburger menu on mobile

---

## 🔧 Backend API

Base URL: `http://localhost:8080`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register user |
| POST | `/api/auth/login` | None | Login → JWT |
| POST | `/api/auth/logout` | Bearer | Logout |
| GET | `/api/traffic/all` | Bearer | All traffic data |
| GET | `/api/traffic/predict/{location}` | Bearer | AI prediction |
| POST | `/api/traffic/route` | Bearer | Route analysis |
| POST | `/api/traffic/add` | Bearer (Admin) | Add traffic data |

---

## 📦 Build for Production

```bash
npm run build
# Output in /dist folder
```

---

## 🛠️ Tech Stack

- **React 18** — UI framework
- **React Router v6** — Client-side routing
- **Axios** — HTTP client with interceptors
- **Vite** — Build tool
- **Google Maps JS API** — Maps, geocoding, directions
- **Font Awesome 6** — Icons
- **CSS Custom Properties** — Design tokens
