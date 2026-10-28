# 🌿 WasteWise – Smart Waste Management Platform

> **Full Stack Development (FSD) Mini Project**  
> Problem: Poor waste segregation and inefficient collection create environmental problems.  
> Purpose: Empower citizens to report waste, classify recyclable materials using AI, track collection in real time, and assist municipal collection teams with route-optimized pickups.

---

## ✨ Features

### 👤 Citizen Portal
- **User Authentication**: Secure registration & login for citizens and administrators.
- **AI Waste Classification**: Upload or live-capture waste to identify categories (Plastic, Organic, Electronic, Medical, Glass, Metal, Paper), calculate estimated CO2 saved, and award Eco-Points.
- **Smart Pickup Scheduling**: Step-by-step booking choosing category, package quantity, time window, and interactive map location pin.
- **Live Status Tracking**: Real-time progress timeline (*Reported ➔ Confirmed ➔ Driver Assigned ➔ On The Way ➔ Collected ➔ Recycled*) with animated route simulation and driver details.
- **Eco-Rewards & Gamification**: Earn points, level up (*Eco Green badges*), and track personal carbon reduction.
- **Waste Catalog & Sorting Guide**: Material breakdown (PETE, HDPE, PVC, LDPE) with actionable segregation steps (*Clean, Crush, Pack*).

### 🚛 Collection Team & Driver Features
- **Pickup Dispatch & Assignment**: View assigned tasks with citizen address, contact details, and waste types.
- **Collection Route Optimization**: Dynamic route generation finding the shortest path between pending pickup stops and local recycling facilities.
- **Real-Time Status Updates**: Update pickup status directly as bags are collected.

### 🏢 Municipal Admin Dashboard
- **Comprehensive CRUD Operations**: Manage waste reports, pickup schedules, recycling centers, and users.
- **Recycling Centres Map**: Dark-themed interactive directory displaying accepted materials, operating hours, and transit times (Walk, Bike, Drive).
- **Collection Schedule Calendar**: Color-coded monthly calendar tracking scheduled pickups by zone and waste type.
- **Waste Analytics**: Visual charts showing waste breakdown by category, recycling rates, and environmental impact.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Lucide Icons, Leaflet Maps, Chart.js
- **Backend**: Node.js, Express.js REST API
- **Database**: MongoDB with Mongoose
- **Styling**: Modern Vanilla CSS Design Tokens (Forest Green & Dark Mode aesthetics)

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/Shailesh-0305/wastewise.git

# Install dependencies and start server
cd wastewise
npm install
npm run dev
```

---

*Developed by Shailesh-0305 for the FSD Mini Project.*
