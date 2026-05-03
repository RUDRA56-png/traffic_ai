# Traffic AI Project — Setup Guide

## Backend (Spring Boot)
1. Make sure MySQL is running with a database called `traffic_db`
2. Update `src/main/resources/application.properties` with your MySQL credentials
3. Run: `./mvnw spring-boot:run`
   - Backend starts on http://localhost:8080

## Frontend (React + Vite)
1. cd traffic-ai-frontend/frontend
2. npm install
3. npm run dev
   - Frontend starts on http://localhost:5173
   - API calls are proxied to http://localhost:8080 automatically

## What was fixed

### TrafficMap.jsx (Frontend)
- **Route drawing**: Fixed GeoJSON rendering — route now correctly draws on map
- **Bounds check**: Added `bounds.isValid()` check before fitBounds to prevent crashes
- **Autocomplete**: Fixed separate debounce timers for From/To inputs so they don't interfere
- **Dropdown close**: Changed onClick→onMouseDown so blur doesn't close dropdown before selection
- **Error handling**: All API calls wrapped in try/catch, errors shown in loading overlay
- **trafficPoints effect**: No longer clears markers on every update, preventing flicker
- **External routeData prop**: Correctly syncs form inputs when routeData prop changes
- **Spinner CSS**: @keyframes injected inline so it works without external CSS

### TrafficService.java (Backend)
- **Dual field population**: `location` + `road` both populated; `level` + `trafficLevel` both populated
  — frontend uses different field names in different places, this fixes null values
- **Route fallback**: Route prediction now tries `end` location if `start` has no data
- **noDataResponse**: Returns proper message instead of empty object

### TrafficResponse.java (Backend)
- Added `location` field (alias for `road`)
- Added `trafficLevel` field (alias for `level`)
- Frontend components use inconsistent field names; now both work

### SecurityConfig.java (Backend)
- Added proper CORS configuration bean (replaces per-controller @CrossOrigin)
- Allows localhost:5173, 5174, 3000 in development

### vite.config.js (Frontend)
- Added `/api` proxy to http://localhost:8080
- Eliminates CORS issues in development

### api.js (Frontend)
- Changed BASE_URL to use relative path + Vite proxy
- Falls back to VITE_API_URL env var for production deployments
