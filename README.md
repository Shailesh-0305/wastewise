# 🌿 WasteWise – Smart Municipal Waste Management Platform

> **University Full Stack Development Final Assessment Project**  
> Problem: Inefficient waste collection, lack of household segregation, and non-optimized fleet routes cause severe environmental contamination and excessive municipal carbon emissions.  
> Purpose: Empower citizens to schedule curbside waste pickups, categorize recyclable materials across 7 standard streams, explore recycling centres, track collections in real time, and assist municipal fleet supervisors with Traveling Salesperson (TSP) collection route optimization and database-driven waste analytics.

🚀 **Live Hosted App**: **[https://shailesh-0305.github.io/wastewise/](https://shailesh-0305.github.io/wastewise/)**  
📂 **GitHub Repository**: **[https://github.com/Shailesh-0305/wastewise](https://github.com/Shailesh-0305/wastewise)**

---

## 🎨 Visual Design Direction: Clean, Minimal, Light, Nature-Inspired

WasteWise features a nature-inspired light design system:
- **Primary Forest Green**: `#166534` (Primary actions, main brand highlights)
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
1. **Plastic** (PETE 1, HDPE 2, LDPE 4, PP 5)
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
- **Curbside Pickup Requests**: Comprehensive booking modal with category selector, quantity, unit (`bags`, `kg`, `items`), preferred pickup day/time slot, and GPS geolocation coordinate capture.
- **Live Status Tracking**: Multi-stage progress tracking (*Reported ➔ Confirmed ➔ Assigned ➔ In Progress ➔ Collected ➔ Recycled*) with courier details and route polyline.
- **Eco-Points & Gamification**: Points awarded for responsible recycling, community ranking (*Eco Green 82*), and estimated CO₂ reduction.
- **Waste Catalog & Segregation Guide**: Resin identification codes, segregation rules (*Clean, Crush, Pack*), and prep tips.
- **Simulated AI Waste Scanner**: Interactive camera/sample classifier demonstrating automated recyclability detection and carbon metrics.

### 2. Interactive Recycling Centres Directory
- **Leaflet Map Integration**: Light-themed interactive map with custom pins for municipal depots and drop-off stations.
- **Transit Mode Estimator**: Dynamic travel times calculated for **Walking**, **Cycling**, and **Driving**.
- **Material Filtering**: Instant filter by waste category with operating hours, phone contact, and distance specs.

### 3. Collection Schedule Calendar
- **Interactive Monthly Grid**: Date matrix with color-coded collection tags indicating scheduled neighborhood rounds.
- **District Timetable**: Zone North & Zone Central schedules with driver details and curbside collection guidelines.

### 4. Municipal Operations & Fleet Dispatch (Admin)
- **Database-Driven Analytics**: KPI cards showing total reports, pending pickups, completed pickups, and total collected mass in kg.
- **Environmental Impact Metrics**: EPA-based lifecycle carbon calculations (*CO₂ diverted, tree-equivalent preserved, kWh saved*), clearly designated as estimates.
- **Chart.js Visualizations**: Category distribution Doughnut chart and 6-month collection trend Bar chart.
- **TSP Route Optimization**: Nearest-Neighbor Traveling Salesperson algorithm calculating the shortest multi-stop path from Central Depot through all active pickup waypoints to the nearest recycling facility, with fuel savings estimates.
- **Full CRUD Management**: View, filter by category/status, search by tracking ID or citizen name, update status in real time, or delete records with MongoDB persistence.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Leaflet, React-Leaflet, Chart.js, React-ChartJS-2, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js REST API, JSON Web Tokens (JWT), Bcrypt.js, CORS, Dotenv |
| **Database** | MongoDB with Mongoose (Local `mongod` or MongoDB Atlas) + Adaptive In-Memory Store Sync Fallback |
| **Security** | Role-based authorization, strict JWT validation, public registration privilege control |

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)
- MongoDB (Optional: Local `mongod` service or MongoDB Atlas URI; server runs with adaptive synchronization if database is unreachable)

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
Create a `.env` file in the `server` directory (or copy from `server/.env.example`):
```bash
cp server/.env.example server/.env
```

`server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/wastewise
JWT_SECRET=wastewise_secret_key_2026_super_secure
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

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Citizen** | `alex@example.com` | `citizen123` | Request pickups, track reports, view eco-points |
| **Admin** | `admin@wastewise.org` | `admin123` | Full CRUD operations, status transitions, TSP route optimizer, analytics |
| **Driver** | `travis@wastewise.org` | `driver123` | Fleet dispatch, route tracking, collection updates |

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
- `GET /api/analytics/overview` – Database-driven statistics, category distribution, monthly trends, and EPA environmental impact estimates.
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

Verify backend health:
```bash
curl http://localhost:5000/api/health
```

---

## 📄 License
This project is licensed under the MIT License. Developed for University Full Stack Development Assessment.
