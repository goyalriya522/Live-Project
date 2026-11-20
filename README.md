# CampusBus – Smart College Bus Tracking & Management System

> **"Track • Manage • Travel Smart"**  
> A full-stack MERN Progressive Web Application (PWA) designed to make college transportation smarter, reliable, and accessible for students, bus drivers, and university transit administrators.

---

## 🌟 Key Highlights

- **Interactive Leaflet & OpenStreetMap Tracking**: Real-time moving bus markers with simulated GPS telemetry, route polyline overlays, and designated bus stop pins with landmark details.
- **Dynamic Estimated Arrival Time (ETA)**: Adaptive ETA calculations modeled along actual road corridors and vehicle speed, with traffic delay advisories.
- **Offline Access (PWA + Service Worker + IndexedDB)**: Students passing through rural areas or dead zones can continue accessing saved routes, stops, schedules, and last-known bus coordinates without an internet connection.
- **Driver Cockpit**: High-accessibility interface with oversized buttons, clear status badges, minimal typing, one-touch trip lifecycle actions, and instant emergency dispatch.
- **Central Admin Control Center (`/admin`)**: Complete management suite for buses, drivers, routes, stops, timetables, and incident resolution.
- **One-Click Exam Mode**: Instantly activates special examination express routes, modified morning departure times, and broadcasts alerts across the college.
- **Real-Time Communication**: Authenticated Socket.io rooms delivering live GPS pulses, delay updates, and emergency broadcasts.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide Icons |
| **Mapping** | Leaflet 1.9, React-Leaflet, OpenStreetMap |
| **Real-Time** | Socket.io Client & Server |
| **Offline Storage** | Service Worker, Browser Cache API, IndexedDB (`idb`) |
| **Backend** | Node.js (v24), Express.js (v4) |
| **Database** | MongoDB Atlas (Cloud) + Resilient In-Memory Fallback Engine |
| **Security** | JWT (JSON Web Tokens), bcryptjs, Helmet, CORS, Role-Based Access Control |

---

## 🚀 Pre-Configured Demo Credentials

The application is pre-seeded with 1-click test accounts for all user roles:

| Role | Email | Password | Access Path | Features |
|---|---|---|---|---|
| **Admin** | `admin@campusbus.edu` | `Admin@123` | `/admin` | Full fleet control, bus/driver/route CRUD, Exam Mode toggle, broadcast notifications |
| **Driver** | `driver1@campusbus.edu` | `Driver@123` | `/driver` | Large tactile buttons, trip start/stop, delay updates, emergency dispatch |
| **Student** | `student1@campusbus.edu` | `Student@123` | `/student` | Interactive live tracking map, dynamic ETAs, stop sequence timeline, offline view |

---

## 📁 Project Structure

```text
CampusBus/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas connector & status tracker
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Profile
│   │   ├── studentController.js  # Bus selection, ETAs, stops, notifications
│   │   ├── driverController.js   # Trip status, emergency reports
│   │   ├── adminController.js    # Buses, drivers, routes, schedules, exam mode
│   │   ├── trackingController.js # Fleet coordinates & telemetry ingestion
│   │   └── offlineController.js  # Snapshot distribution & offline queue sync
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer token protection
│   │   ├── roleMiddleware.js     # Student / Driver / Admin authorization
│   │   └── errorHandler.js       # Central error handling
│   ├── models/                   # Mongoose Cloud Schemas
│   │   ├── User.js
│   │   ├── Bus.js
│   │   ├── Route.js
│   │   ├── Stop.js
│   │   ├── Schedule.js
│   │   ├── Trip.js
│   │   ├── BusLocation.js
│   │   ├── Notification.js
│   │   ├── EmergencyReport.js
│   │   ├── ExamSchedule.js
│   │   └── SystemSettings.js
│   ├── routes/                   # Express REST APIs
│   ├── services/
│   │   ├── gpsSimulationService.js # Simulated GPS pulse engine along routes
│   │   └── notificationService.js  # Socket.io broadcast dispatch
│   ├── sockets/
│   │   └── socketHandler.js      # Authenticated room management
│   ├── utils/
│   │   ├── memoryStore.js        # Seed data & standalone resilient storage
│   │   └── seedData.js           # CLI MongoDB Atlas seeder
│   ├── .env                      # Backend environment config
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Express + Socket.io entry point
│
├── frontend/
│   ├── public/
│   │   ├── icons/bus-logo.svg    # Official CampusBus icon
│   │   ├── manifest.json         # PWA Manifest
│   │   └── service-worker.js     # Cache-First static + Network-First API sync
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LiveMap.jsx       # React Leaflet map with custom icons
│   │   │   ├── ETAProgressCard.jsx # Dynamic ETA calculation card
│   │   │   ├── StopTimeline.jsx  # Sequence of stops
│   │   │   ├── NotificationModal.jsx
│   │   │   ├── EmergencyModal.jsx
│   │   │   ├── OfflineBanner.jsx # Persistent offline notification
│   │   │   └── OfflineIndicator.jsx # Live/Syncing/Offline badge
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── OfflineContext.jsx # IndexedDB synchronization manager
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── DriverDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── studentService.js
│   │   │   ├── driverService.js
│   │   │   ├── adminService.js
│   │   │   └── offlineStorage.js # idb-backed IndexedDB store
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env                      # Frontend environment config
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v24)
- **npm**: v9.0.0 or higher
- **MongoDB Atlas Account** (Optional for cloud sync, app runs out-of-the-box in standalone resilient mode)

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
The server will initialize on `http://localhost:5000`:
- REST API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`
- WebSocket Server: `ws://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌐 MongoDB Atlas Integration

In `backend/.env`, set your connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusbus?retryWrites=true&w=majority
```
To seed MongoDB Atlas with initial routes, buses, and schedules:
```bash
cd backend
npm run seed
```

---

## 📡 Core API Reference

### Authentication
- `POST /api/auth/register` – Register new student/driver
- `POST /api/auth/login` – Authenticate with role verification
- `GET /api/auth/me` – Retrieve profile and assigned transit asset

### Student Endpoints
- `GET /api/student/dashboard` – Live bus telemetry, route, ETAs, and notifications
- `GET /api/student/buses` – Available buses for assignment
- `POST /api/student/select-bus` – Select or switch assigned bus

### Driver Endpoints
- `GET /api/driver/dashboard` – Assigned bus, route, and current trip
- `POST /api/driver/start-trip` – Start trip and trigger GPS simulation
- `PUT /api/driver/trip-status` – Update status (`started`, `on_route`, `approaching_stop`, `delayed`, `completed`)
- `POST /api/driver/emergency` – Report vehicle breakdown, accident, or hazard

### Admin Endpoints (`/admin`)
- `GET /api/admin/overview` – Central fleet metrics, active trips, and multi-vehicle map
- `GET / POST / PUT / DELETE /api/admin/buses` – Fleet asset management
- `GET / POST / PUT /api/admin/drivers` – Driver assignment and registration
- `GET / POST / PUT / DELETE /api/admin/routes` – Route and stop configuration
- `POST /api/admin/exam-mode` – Toggle college-wide Exam Mode
- `POST /api/admin/notifications` – Broadcast transit announcements
- `PUT /api/admin/trips/:tripId` – Operator manual trip override
- `PUT /api/admin/emergencies/:id` – Resolve emergency incident

### Offline & PWA Sync
- `GET /api/offline/snapshot` – Full route/stop/schedule snapshot for IndexedDB caching
- `POST /api/offline/sync` – Synchronize offline-queued trip events when connectivity returns

