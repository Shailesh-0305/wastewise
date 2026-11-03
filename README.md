# 🌿 WasteWise – Coimbatore Smart Municipal Waste Management Platform

> **University Full Stack Development Final Assessment Project**  
> Problem: Inefficient waste collection, lack of household segregation, and non-optimized fleet routes cause severe environmental contamination and excessive municipal carbon emissions.  
> Purpose: Empower residents of Coimbatore, Tamil Nadu to schedule doorstep waste pickups, categorize recyclable materials across 7 standard streams, explore recycling centres, track collections with genuine telemetry, and assist municipal fleet supervisors with Traveling Salesperson (TSP) collection route optimization and database-driven waste analytics.

🚀 **Live Hosted App**: **[https://shailesh-0305.github.io/wastewise/](https://shailesh-0305.github.io/wastewise/)**  
📂 **GitHub Repository**: **[https://github.com/Shailesh-0305/wastewise](https://github.com/Shailesh-0305/wastewise)**

---

## 📍 Coimbatore-First Municipal Platform

WasteWise is tailored specifically for residents and municipal waste-collection operations in **Coimbatore, Tamil Nadu, India**:
- **City & State**: Coimbatore, Tamil Nadu, India (`+91` country code, 6-digit PIN codes).
- **Time Zone**: Indian Standard Time (IST, UTC+5:30).
- **Default Map Coordinates**: Latitude `11.0055`, Longitude `76.9661` (approx. Gandhipuram / Town Hall city centre). Initial zoom level: `12–13`.
- **Central Municipal Depot**: Coimbatore Municipal Corporation Central Operations, Town Hall, Big Bazaar Street (`11.0018, 76.9628`).
- **Integrated Waste Facility**: Vellalore Integrated Solid Waste Management Facility, Podanur (`10.9634, 77.0125`).
- **Indian Address Format**: Door/flat number, street name, locality/area (e.g. *RS Puram, Gandhipuram, Peelamedu, Saibaba Colony*), ward (optional), PIN code, city (*Coimbatore*), and state (*Tamil Nadu*).
- **Explicit Geolocation**: The map defaults to Coimbatore and does not guess or fake user position. A dedicated **"Use My Location"** button prompts for browser permission explicitly; if denied, it cleanly remains focused on Coimbatore without fabricated route lines or markers.

---

## 🎨 Visual Design Direction: Clean, Minimal, Light, Nature-Inspired

WasteWise features a clean, nature-inspired light design system:
- **Primary Forest Green**: `#166534` (Primary actions, brand highlights)
- **Secondary Green**: `#15803D` (Icons, active states, progress indicators)
- **Soft Leaf Green**: `#86EFAC` (Accents, badges, borders)
- **Pale Green Sections**: `#EAF6EA` (Hero containers, banners, highlights)
- **Very Light Mint**: `#F0F8F0` (Card accents, pills, neutral highlights)
- **Main Background**: `#F8FAF8` (Spacious, clean, light-themed canvas)
- **Card Background**: `#FFFFFF` (Restrained rounded cards with soft shadows)
- **Primary Text**: `#24352B` (High-contrast, readable typography)
- **Secondary Text**: `#718078` (Subtle captions and metadata)

### Nature-Inspired Background Elements & Subtle Animations
- **Forest Silhouettes**: Light-opacity botanical tree SVGs blending softly into pale green sections.
- **Floating Leaf Motifs**: Subtle organic floating leaf accents that respect `prefers-reduced-motion`.
- **Gentle Swaying Effects**: Lightweight CSS keyframe animations for natural immersion.

---

## ♻️ Supported Waste Categories

The platform consistently enforces 7 core waste streams across React components, Express controllers, and MongoDB schemas:
1. **Plastic** (PETE 1, HDPE 2, PVC 3, LDPE 4, PP 5, PS 6, Other 7)
2. **Organic** (Kitchen scraps, food waste, garden trimmings)
3. **Electronic** (Consumer electronics, circuit boards, batteries)
4. **Medical** (Expired pharmaceuticals, safe sharps containers, bio-PPE)
5. **Recyclable** (Clean cardboard, mixed paper, dry recyclables)
6. **Metal** (Tin cans, aluminum beverage containers, scrap metal)
7. **Glass** (Bottles, food jars, cullet)

---

## ⚙️ Architecture & Features

### 1. Citizen Portal
- **User Authentication**: Secure JWT-based registration and login with bcrypt password hashing and privilege escalation prevention.
- **Curbside Pickup Requests**: Booking modal with 7 waste categories, quantity, unit (`bags`, `kg`, `items`), preferred pickup date/time slot (IST), and explicit GPS coordinate capture.
- **Live Status Tracking**: Honest 6-stage lifecycle tracking (*Reported ➔ Confirmed ➔ Assigned ➔ In Progress ➔ Collected ➔ Recycled*). If unassigned, displays *"Awaiting Driver Assignment"*; if driver is assigned but has not started GPS streaming, displays *"Live location not available"* without faking moving vehicles or fabricated route lines.
- **Eco-Points & Recycling Profile**: Points awarded for verified recycling and status tracking.
- **Waste Catalog & Resin Guide**: Official plastic resin identification codes (1 to 7), segregation rules (*Clean, Crush, Pack*), and prep tips across all 7 streams.

### 2. Interactive Recycling Centres Directory
- **Leaflet Map Integration**: Light-themed interactive map centred on Coimbatore (`11.0055, 76.9661`) with custom pins for municipal depots and drop-off stations.
- **Turn-by-Turn Navigation**: One-click directions integration with Google Maps.
- **Material Filtering**: Instant filter by waste category with operating hours, phone contact, and location details.
- **Empty-State Messaging**: When no centers are returned from the database, displays an informative empty state explaining that no registered drop-off centres are currently available in Coimbatore.

### 3. Collection Schedule Calendar
- **Interactive Monthly Grid**: Dynamic calendar opening on the current month with day-by-day scheduling.
- **Timetable Inspection**: Scheduled rounds for Coimbatore municipal wards (Peelamedu, RS Puram, Gandhipuram) with driver details and curbside collection guidelines.

### 4. Municipal Operations & Fleet Dispatch (Admin)
- **Database-Driven Analytics**: KPI cards showing total reports, pending pickups, completed pickups, and total collected mass in kg.
- **Illustrative Environmental Estimates**: Indicative carbon calculations (*CO₂ diverted, tree-equivalent preserved, kWh saved*) based on collected waste mass.
- **Chart.js Visualizations**: Category distribution Doughnut chart and collection trend Bar chart.
- **TSP Route Optimization**: Nearest-Neighbor Traveling Salesperson algorithm calculating the shortest multi-stop path from Coimbatore Central Operations Depot through all active pickup waypoints to the Vellalore Integrated Facility, with distance reduction metrics.
- **Full CRUD Management**: View, filter by category/status, search by tracking ID or citizen name, edit records in-place, update lifecycle status, or delete entries.

---

## 🚛 Live Collection Tracking: Current Implementation vs Future Architecture

### Currently Implemented Tracking UI (Honest Status Workflow)
- **Genuine Status Workflow**: Pickup requests strictly progress through verified lifecycle stages (*Reported ➔ Confirmed ➔ Assigned ➔ In Progress ➔ Collected ➔ Recycled*).
- **Awaiting Driver Assignment**: When a report is logged but no driver has been dispatched, the interface explicitly displays *"Awaiting Driver Assignment"*.
- **Live Location Not Available**: When a driver is assigned but has not started an active collection round or enabled live telemetry streaming, the UI transparently displays *"Live location not available"*.
- **No Simulated Telemetry**: The application never fabricates moving vehicles, artificial driver locations, or simulated route lines.
- **Genuine Pickup Location Pinning**: The map displays the resident's pickup destination pin only when genuine coordinates were explicitly attached during request submission; manual address-based pickups are marked with an address badge without claiming exact coordinates.

---

## 🛰️ Future Backend Live Collection-Worker Tracking Architecture (Planned Phase)

For production and real-world deployment across Coimbatore Municipal Corporation, the following 10-point architectural specification governs future genuine, secure live tracking of waste-collection workers:

### 1. Worker Authentication & Role Gate
- Collection workers authenticate through the standard `/api/auth/login` endpoint using their driver credentials.
- The JWT payload encodes `{ id, role: 'driver', driverIdCode, vehiclePlate }`.
- Route guards enforce driver-only access to driver telemetry actions.

### 2. Driver Companion Dashboard
- The driver view fetches assigned pickup requests for the active shift via `GET /api/driver/assigned-reports`.
- Each stop displays the resident's pickup address, landmark, contact phone, waste category, and GPS coordinates.
- A prominent toggle button allows the driver to **"Start Collection Round"** and **"End Collection Round"**.

### 3. Continuous Geolocation Telemetry
- Upon clicking "Start Collection Round", the browser or driver client invokes `navigator.geolocation.watchPosition`:
  ```javascript
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      sendTelemetry({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp)
      });
    },
    (error) => handleGpsError(error),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );
  ```

### 4. Protected Telemetry Ingestion Endpoint
- **HTTP Path**: `POST /api/driver/location`  
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: application/json`  
- **Payload Schema**:
  ```json
  {
    "driverId": "654c123...",
    "reportId": "654d456...",
    "coordinates": { "lat": 11.0086, "lng": 76.9497 },
    "speedKmh": 28.4,
    "headingDeg": 142.0,
    "accuracyMeters": 6.5,
    "timestamp": "2026-11-03T16:30:00.000Z"
  }
  ```
- **Alternative High-Throughput Ingestion**: WebSocket / Socket.io channel emitting `driver:telemetry:update` with TLS encryption.

### 5. Backend Validation & Caching Strategy
- The backend verifies:
  1. Token authenticity and driver role.
  2. The driver is actively assigned to the specified `reportId`.
  3. Plausibility checks (speed < 120 km/h, valid Coimbatore bounding box: `lat: 10.85–11.15`, `lng: 76.85–77.15`).
- Latest coordinates are cached in **Redis** with a 60-second TTL:
  `SET driver:pos:<driverId> "{lat, lng, speed, timestamp}" EX 60`
- The `WasteReport` document in MongoDB is updated with `$set: { "assignedDriver.currentLocation": coordinates, "assignedDriver.lastLocationUpdate": timestamp, "assignedDriver.isLiveStreaming": true }`.

### 6. Citizen Frontend Consumption
- Citizens with an active pickup in `Assigned` or `In Progress` status receive updates either by:
  - Polling `GET /api/reports/:id/live-telemetry` every 10–12 seconds.
  - Subscribing to Server-Sent Events (SSE) `/api/reports/:id/stream` or WebSocket room `report:<trackingId>`.
- The UI transitions from *"Live location not available"* to rendering the genuine vehicle marker and recalculating ETA dynamically.

### 7. Realistic ETA Calculation with Routing Engines
- Straight-line Euclidean/Haversine calculations are replaced with an open-source road network engine (e.g. **OSRM** or **OpenRouteService**):
  `GET http://router.project-osrm.org/route/v1/driving/{driverLng},{driverLat};{citizenLng},{citizenLat}?overview=false`
- Accounts for one-way roads, flyovers, and local traffic speeds in Coimbatore to return accurate travel duration in minutes.

### 8. Security & Resident Privacy Controls
- **Round-Active Scoping**: Telemetry is broadcast **only** while the driver's collection round status is `In Progress`.
- **Tenant Isolation**: Residents can only query coordinates for the specific driver assigned to their active `reportId`.
- **Immediate Transmission Cessation**: Clicking "End Round" cancels `watchPosition` and clears the Redis cache.
- **Telemetry Purging**: Once a pickup reaches `Collected` or `Recycled`, coordinate histories are purged from memory, retaining only the pickup completion timestamp for audit logs.

### 9. Stale Signal & Timeout Detection
- If no GPS update is received from the driver device for **> 120 seconds** (due to poor cellular reception or underpass transit):
  - The citizen UI marks the signal as degraded:  
    `"Signal lost – last updated 2 minutes ago"`
  - Map marker dims with a warning badge, preventing residents from relying on outdated coordinates.

### 10. Mobile Background Limitation Analysis & Production Solution
- **The Mobile Limitation**: Modern mobile operating systems (iOS Safari and Android Chrome) throttle or freeze background JavaScript execution within 15–30 seconds when the screen locks or when the driver switches to a navigation app (like Google Maps).
- **The Production Solution**:
  1. **Progressive Web App (PWA)**: Using the **W3C Wake Lock API** (`navigator.wakeLock.request('screen')`) to keep the driver screen awake while mounted on the vehicle dashboard.
  2. **Production Driver Companion App**: In full deployment, a lightweight **React Native** or **Flutter** mobile companion app utilizing native background location services (`react-native-background-geolocation` with Android Foreground Service notification and iOS Significant Change / Location Background Mode) ensures continuous GPS transmission even when backgrounded or locked.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Leaflet, React-Leaflet, Chart.js, React-ChartJS-2, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js REST API, JSON Web Tokens (JWT), Bcrypt.js, CORS, Dotenv |
| **Database** | MongoDB with Mongoose (Local `mongod` or MongoDB Atlas) |
| **Security** | Role-based authorization, strict JWT validation, public registration privilege control |

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- MongoDB (Local `mongod` service or MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/Shailesh-0305/wastewise.git
cd wastewise
```

### 2. Install All Dependencies
```bash
npm run install-all
```
*(Installs root concurrently runner, server packages, and client packages).*

### 3. Configure Environment Variables
Create a `.env` file in the `server` directory (matching `server/.env.example`):
```bash
cp server/.env.example server/.env
```

`server/.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=replace_with_a_long_random_secret
```

### 4. Seed the Database (Optional)
Populate MongoDB with demo users, reports, recycling stations, and schedules:
```bash
npm run seed
```

### 5. Run the Application
Run both backend API (Port 5000) and frontend client (Vite) concurrently:
```bash
npm run dev
```

Or run them individually:
```bash
# Start backend server
npm run dev:server

# Start frontend client in another terminal
npm run dev:client
```

- **Frontend Client**: `http://localhost:5173/wastewise/`
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` – Register a new citizen account (enforced role: `citizen`).
- `POST /api/auth/login` – Authenticate with email and password, returns JWT token.
- `GET /api/auth/me` – Retrieve authenticated profile (Bearer token required).

### Waste Reports CRUD (`/api/reports`)
- `POST /api/reports` – Create a new pickup request (with GPS coordinates, category, quantity).
- `GET /api/reports` – Query all reports with optional `?category=&status=&search=`.
- `GET /api/reports/:id` – Fetch single report details and timeline.
- `PUT /api/reports/:id` – Full edit of report details (category, quantity, address, notes).
- `PATCH /api/reports/:id/status` – Update pickup status (*Reported, Confirmed, Assigned, In Progress, Collected, Recycled, Cancelled*).
- `PATCH /api/reports/:id/assign` – Assign courier and vehicle to report.
- `DELETE /api/reports/:id` – Delete report record (Admin only).

### Recycling Centres (`/api/centers`)
- `GET /api/centers` – Retrieve all recycling centers with optional `?material=&search=`.
- `GET /api/centers/:id` – Fetch center by ID.
- `POST /api/centers` – Register new recycling station (Admin only).

### Collection Schedules (`/api/schedules`)
- `GET /api/schedules` – Retrieve scheduled pickup routes and timetables.
- `POST /api/schedules` – Schedule municipal collection round (Admin only).

### Analytics & Optimization (`/api/analytics`, `/api/routes`)
- `GET /api/analytics/overview` – Database-driven statistics, category distribution, monthly trends, and illustrative environmental impact estimates.
- `GET /api/routes/collection-route` – Traveling Salesperson (TSP) route calculation with Depot, waypoints, and drop-off facility.

---

## 🧪 Testing & Verification

Run frontend linting:
```bash
npm run lint --prefix client
```

Build production client:
```bash
npm run build --prefix client
```

---

## 📄 License
This project is licensed under the MIT License. Developed for University Full Stack Development Assessment.
