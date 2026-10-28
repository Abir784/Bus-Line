Here are all the generated files.
<div align="center">

# 🚌 BusLine

### Online Bus Ticketing & Live Bus Tracking Platform

**Book seats. Pay online. Watch your bus move counter by counter — in real time.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn-ui-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

> 💡 **BusLine** is a full-stack intercity bus ticketing platform with **real-time GPS tracking**, **owner-managed routes & fares**, **QR boarding passes**, **SMS/email notifications**, and a **refund/cancellation flow**. Built as a custom-build engagement template — owned outright by the operator, no per-ticket commission to a marketplace.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🖼️ Screenshots](#️-screenshots)
- [🏗️ Architecture](#️-architecture)
- [📊 Data Flow](#-data-flow)
- [🗂️ Project Structure](#️-project-structure)
- [🚀 Getting Started](#-getting-started)
- [📖 API Reference](#-api-reference)
- [🧱 Database Schema](#-database-schema)
- [🎨 Design System](#-design-system)
- [🧭 Roadmap](#-roadmap)
- [🛠️ Tech Stack](#️-tech-stack)
- [📄 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

---

## ✨ Features

### 🎟️ Three Core Capabilities

| # | Feature | What it does |
|---|---------|--------------|
| 1 | **Online Ticketing + Payment Gateway** | Passengers search by route/date, see live seat maps, pay via Card / bKash / Nagad / Cash, get instant e-tickets |
| 2 | **Owner-Managed Routes & Buses** | Non-technical staff add buses, build routes with ordered counters, schedule trips, set per-seat pricing — no developer needed |
| 3 | **Live Bus Tracking** | Every active bus broadcasts its position over WebSockets; passengers see current counter, next stop, ETA, speed, and progress — live |

### 🚀 Four Additional Modules

| # | Module | What it does |
|---|--------|--------------|
| 4 | **GPS Device Integration** | Real GPS hardware pushes positions to `/api/gps/push` — bus self-reports instead of dispatcher manually advancing it |
| 5 | **SMS & Email Notifications** | Booking confirmation, departure reminders, delay alerts, refund notices — all logged for audit |
| 6 | **QR Boarding Pass** | Each paid booking generates a scannable QR (PNG) encoding booking ID, seats, route, payment ref |
| 7 | **Refund & Cancellation** | One-click cancel releases seats immediately, marks REFUNDED, generates refund ref, fires SMS notice |

### 🎯 Highlights

- ⚡ **True real-time** — WebSocket push, not polling. Bus moves on screen within ~1 second of GPS update.
- 🗺️ **Visual route map** — SVG-based counter-by-counter map with animated bus marker, progress bar, and full timeline.
- 💺 **Live seat map** — booked seats flagged in real time, no double-booking possible (server-side validation).
- 💳 **Multi-method payments** — simulated gateway supports Card / bKash / Nagad / Cash-at-counter with 5% failure rate for realistic testing.
- 🔐 **GPS device authentication** — each bus has its own `gpsDeviceToken`; only authorized hardware can push positions.
- 📊 **Owner dashboard** — KPI cards (revenue, tickets sold, active buses), revenue-by-route chart, active trips monitor.
- 🌗 **Light + dark mode** — full theme support via `next-themes`.
- 📱 **Responsive** — mobile-first design works on phone, tablet, desktop.

---

## 🖼️ Screenshots

> All screenshots taken from the live app at 1440×900 viewport.

### 🏠 Passenger Home

```
┌────────────────────────────────────────────────────────────────┐
│ 🚌 BusLine          Find tickets  Track bus  My bookings   🌙 │
│                                                                │
│  Book your bus seat. Track it live all the way to your dest.   │
│                                                                │
│  ┌──────────────┬──────────────┬────────────┬──────────────┐  │
│  │ 📍 From      │ 📍 To        │ 📅 Date    │  🔍 Search   │  │
│  │ Dhaka        │ Chittagong   │ 27 Oct 26  │              │  │
│  └──────────────┴──────────────┴────────────┴──────────────┘  │
│                                                                │
│  📡 Buses on the road right now                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ DEPARTED  Dhaka → Chittagong • At Jatrabari Counter      │ │
│  │ DEPARTED  Dhaka → Sylhet    • At Mohakhali Bus Terminal  │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 💺 Seat Selection

```
                  FRONT OF BUS  🚌 Driver
            ┌─────────────────────────────────┐
            │   [A1]   [A2]    |    [A3]  [A4]│   ← A1,A2 = booked (red)
            │   [B1]   [B2]    |    [B3]  [B4]│   ← B3 = booked
            │   [C1]   [C2]    |    [C3]  [C4]│   ← grey = available
            │   [D1]   [D2]    |    [D3]  [D4]│   ← green = selected
            │   [E1]   [E2]    |    [E3]  [E4]│
            └─────────────────────────────────┘
                       ↓ Back entrance

   Selected: A3, A4          Total: ৳2,400
   Boarding: Gabtoli Bus Terminal
   [ Proceed to checkout → ]
```

### 🗺️ Live Bus Tracking

```
   🟢 LIVE     Dhaka → Chittagong     Green Line — GL-01

   🚩────────●─────────●─────────●─────────●────────📍
   Gabtoli   Jatrabari  Comilla    Feni      Chittagong
                        ↑
                   🚌 bus is here (pulsing)

   ┌────────────────┬───────────────┬───────────────┬──────────┐
   │ Current counter│ Next stop     │ ETA           │ Speed    │
   │ Comilla Counter│ Feni Counter  │ 1h 20m        │ 62 km/h  │
   └────────────────┴───────────────┴───────────────┴──────────┘

   Trip progress  ████████████░░░░░░░░░░░░░░░  40%
```

### 📊 Owner Dashboard

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ 💰 Revenue      │ 🎫 Tickets sold │ 🚌 Active buses │ 🛣️ Routes        │
│ ৳36,000         │ 6               │ 2               │ 3               │
│ from paid       │ 4 bookings total│ on the road now │ 6 trips sched.  │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

  📡 Active trips                         📈 Revenue by route
  ┌────────────────────────────┐          Dhaka–Chittagong  █████████ ৳24k
  │ DEPARTED  07:30 AM         │          Dhaka–Sylhet     █████      ৳9k
  │ Dhaka → Chittagong         │          Dhaka–Khulna     ███        ৳3k
  │ Green Line · GL-01         │
  └────────────────────────────┘
```

> 📸 **18 full screenshots** are in the `BusLine-Workflow-and-User-Guide.docx` document in `download/`.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────┐
                    │       Passenger Browser      │
                    │   (Next.js client components)│
                    └──────────────┬──────────────┘
                                   │
                          HTTP + WebSocket
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
       ▼                           ▼                           ▼
┌─────────────┐           ┌─────────────────┐         ┌──────────────┐
│  Next.js 16 │           │  Next.js API    │         │  Tracking    │
│  App Router │◄──────────│  Routes         │────────►│  WebSocket   │
│  (port 3000)│  SSR/CSR  │  /api/*         │  emit   │  Service     │
└─────────────┘           └────────┬────────┘         │  (port 3003) │
                                   │                   └──────┬───────┘
                                   │ Prisma                   │
                                   ▼                          │
                          ┌─────────────────┐                 │
                          │   SQLite DB     │                 │
                          │  (Prisma ORM)   │                 │
                          └─────────────────┘                 │
                                                              │
              ┌─────────────────────────────────────────────┘
              │  broadcast 'location-update' to subscribers
              ▼
   ┌────────────────────────────┐
   │  All passenger browsers    │
   │  tracking this trip        │
   │  receive live updates      │
   └────────────────────────────┘
                                   ▲
                                   │  POST /api/gps/push
                                   │  (token-authenticated)
                          ┌────────┴────────┐
                          │  GPS Device     │
                          │  (hardware or   │
                          │   driver app)   │
                          └─────────────────┘
```

**Key design decisions:**

- **Single-page app** — All passenger and owner views live in `src/app/page.tsx` with view-switching state. The Next.js route is only `/` (per sandbox constraints).
- **WebSocket for real-time** — Socket.IO mini-service on port 3003 broadcasts bus positions. The Caddy gateway routes browser connections via `?XTransformPort=3003`.
- **Prisma + SQLite** — Zero-config database, perfect for demos. Swap to PostgreSQL for production by changing the `DATABASE_URL`.
- **Simulated gateway** — Payment, SMS, and email are all simulated (with realistic 3-5% failure rates) so the app is fully functional out of the box. Swap in real providers in `src/lib/notifications.ts` and `src/app/api/payment/route.ts`.

---

## 📊 Data Flow

### 🎟️ Booking Flow

```
Passenger ──► /api/trips ──────► DB: Trip + Route + Bus + Counter
           (search)              + Booking (taken seats)

Passenger ──► /api/bookings ───► DB: Booking (status=PENDING)
           (create)

Passenger ──► /api/payment ───► DB: Booking (status=PAID)
           (pay)                 + Notification (SMS + email queued)

Passenger ◄── /api/bookings/[id]/qrcode ◄── PNG QR generated
           (display)

Passenger ──► /api/bookings/lookup ──► DB: Booking + Trip + Route + Bus
           (My Bookings)
```

### 📍 Real-time Tracking Flow

```
GPS device ──► /api/gps/push {token, lat, lng, speed}
              │
              ├─► authenticate by Bus.gpsDeviceToken
              ├─► find bus's active trip (DEPARTED or BOARDING)
              ├─► project (lat,lng) onto route counters (Haversine)
              ├─► persist BusLocation row
              └─► broadcast via socket.io to ws://localhost:3003
                                          │
                                          ▼
                          Tracking service fans out to
                          all subscribers in the trip's room
                                          │
                                          ▼
                          Passenger browser receives
                          'location-update' event →
                          React state update → live map re-renders
                          (no polling, true push, ~1 second latency)
```

### 🔔 Notification Flow

```
Payment success ──► /api/payment
                  ├─► sendBookingConfirmationSMS()
                  ├─► sendBookingConfirmationEmail()
                  └─► DB: Notification (channel, type, recipient, body, status, providerRef)

Booking cancel ───► /api/bookings/[id]/cancel
                  ├─► sendRefundNoticeSMS()
                  └─► DB: Notification (REFUND_NOTICE)

Admin ───────────► /api/admin/notifications ──► table of all sends
                                                    (filters by channel/type)
```

---

## 🗂️ Project Structure

```
busline/
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📄 page.tsx              # Single-page app — all passenger + owner views
│   │   ├── 📄 layout.tsx            # Root layout with ThemeProvider
│   │   ├── 📄 globals.css           # Tailwind + BusLine palette (emerald + amber)
│   │   └── 📁 api/                  # 21 API routes
│   │       ├── 📁 trips/            # Search, list, detail
│   │       ├── 📁 bookings/         # Create, lookup, cancel, qrcode
│   │       ├── 📁 payment/          # Simulated payment gateway
│   │       ├── 📁 tracking/         # Live tracking data
│   │       ├── 📁 gps/push/         # GPS hardware push endpoint
│   │       ├── 📁 routes/  📁 buses/# Public read endpoints
│   │       └── 📁 admin/            # Owner-only: trips, routes, buses,
│   │                                #   bus-location, gps-sim, gps-token,
│   │                                #   stats, notifications
│   ├── 📁 components/
│   │   ├── 📄 route-map.tsx         # SVG-based live route visualization
│   │   ├── 📄 seat-map.tsx          # Visual seat selection
│   │   ├── 📄 theme-provider.tsx    # next-themes wrapper
│   │   └── 📁 ui/                   # shadcn/ui components
│   ├── 📁 lib/
│   │   ├── 📄 db.ts                 # Prisma client singleton
│   │   ├── 📄 types.ts              # Shared TypeScript types + helpers
│   │   └── 📄 notifications.ts      # SMS/email helpers (simulated gateway)
│   └── 📁 hooks/
│       ├── 📄 use-toast.ts          # Toast notifications
│       └── 📄 use-mobile.ts         # Mobile breakpoint hook
│
├── 📁 prisma/
│   └── 📄 schema.prisma             # 7 models: Route, Counter, Bus, Trip,
│                                    #   Booking, BusLocation, Notification
│
├── 📁 mini-services/
│   └── 📁 tracking-service/         # Socket.IO WebSocket service (port 3003)
│       ├── 📄 index.ts              # Subscribes, broadcasts location updates
│       └── 📄 package.json
│
├── 📁 scripts/
│   ├── 📄 seed.ts                   # Database seed: 3 routes, 4 buses, 6 trips
│   ├── 📄 start-dev-daemon.py       # Daemonized Next.js dev server
│   ├── 📄 start-tracking-daemon.py  # Daemonized tracking service
│   ├── 📄 ensure-tracking-service.py# Restart tracking if it dies
│   ├── 📄 generate-proposal.js      # Generates the commercial proposal .docx
│   ├── 📄 generate-feature-list.js  # Generates the feature list + pricing .docx
│   └── 📄 generate-workflow-doc.js  # Generates the workflow guide .docx
│
├── 📁 download/                     # Generated deliverables (.docx files)
├── 📁 screenshots/                  # App screenshots (18 PNGs)
├── 📁 public/                       # Static assets
├── 📄 prisma/schema.prisma          # Database schema
├── 📄 Caddyfile                     # Gateway config (port 81 → 3000/3003)
├── 📄 tailwind.config.ts            # Tailwind theme
├── 📄 eslint.config.mjs             # Lint rules
├── 📄 package.json                  # Dependencies + scripts
└── 📄 README.md                     # You are here ✨
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (or [Bun](https://bun.sh/) — recommended)
- **Python 3** (for the daemon scripts that keep background services alive)
- A terminal, a browser, and ~5 minutes

### Installation

```bash
# 1. Clone the repo
git clone <your-repo-url> busline
cd busline

# 2. Install dependencies
bun install
# or: npm install

# 3. Set up the database
cp .env.example .env   # or just ensure DATABASE_URL is set
bun run db:push        # creates the SQLite database + tables
bun run db:generate    # generates the Prisma client

# 4. Seed with sample data (3 routes, 4 buses, 6 trips, 3 bookings)
bun run scripts/seed.ts

# 5. Start the Next.js dev server (port 3000)
bun run dev

# 6. In a separate terminal, start the tracking WebSocket service (port 3003)
cd mini-services/tracking-service
bun install
bun run dev
```

### Try it out

Open `http://localhost:3000` in your browser. You should see:

- 🏠 Home page with trip search + live bus ticker
- 🚌 6 sample trips across 3 routes (Dhaka–Chittagong, Dhaka–Sylhet, Dhaka–Khulna)
- 📡 3 buses currently active (DEPARTED or BOARDING status)

### Demo accounts / credentials

This demo has **no authentication** — click **"Owner login"** in the top-right header to toggle admin mode and reveal the admin dashboard.

### Demo payment card

```
Card number: 4242 4242 4242 4242
Expiry:      12/27 (any future date)
CVC:         123 (any 3 digits)
```

### Demo GPS device tokens

The seed script pre-configures GPS tokens for all 4 buses:

| Bus | Token |
|-----|-------|
| Green Line — GL-01 | `gps_gl01_demo` |
| Shohagh — SP-02 | `gps_sp02_demo` |
| Hanif — HE-03 | `gps_he03_demo` |
| Saintmartin — ST-04 | `gps_st04_demo` |

Push a position from a "GPS device" with:

```bash
curl -X POST http://localhost:3000/api/gps/push \
  -H "Content-Type: application/json" \
  -d '{"token":"gps_gl01_demo","lat":23.7305,"lng":90.3880,"speed":62,"heading":95}'
```

Or use the **"Simulate GPS device"** button on the admin Live tracking tab.

---

## 📖 API Reference

### Public endpoints (passenger-facing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/trips` | List trips (filters: origin, destination, date, status, search) |
| `GET` | `/api/trips/[id]` | Single trip with route, counters, taken seats |
| `GET` | `/api/routes` | List all routes with counters |
| `GET` | `/api/buses` | List all buses |
| `POST` | `/api/bookings` | Create a booking (status=PENDING) |
| `POST` | `/api/payment` | Simulate payment, marks PAID, fires notifications |
| `GET` | `/api/bookings/lookup` | Find bookings by email or phone |
| `POST` | `/api/bookings/[id]/cancel` | Cancel + refund + release seats + SMS notice |
| `GET` | `/api/bookings/[id]/qrcode` | PNG QR boarding pass |
| `GET` | `/api/tracking` | List active trips with latest location |
| `GET` | `/api/tracking/[tripId]` | Single trip + counters + latest location |

### GPS device endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/gps/push` | GPS hardware push (token-authenticated, projects onto route) |

### Owner-only endpoints (admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/trips` | Schedule a new trip |
| `POST` | `/api/admin/routes` | Create a route with ordered counters |
| `POST` | `/api/admin/buses` | Add a bus |
| `POST` | `/api/admin/buses/[id]/gps-token` | Set/rotate a bus's GPS device token |
| `POST` | `/api/admin/bus-location` | Manual position update (advance or set progress) |
| `POST` | `/api/admin/gps-sim` | Auto-drive a bus along its route (for demos) |
| `GET` | `/api/admin/stats` | Dashboard KPIs (revenue, tickets, active trips, by-route) |
| `GET` | `/api/admin/notifications` | List sent notifications (filters: channel, type) |

---

## 🧱 Database Schema

```prisma
model Route {
  id          String   @id @default(cuid())
  name        String
  origin      String
  destination String
  distanceKm  Float
  estimatedMinutes Int
  counters    Counter[]
  trips       Trip[]
}

model Counter {
  id               String  @id @default(cuid())
  routeId          String
  name             String
  address          String?
  lat              Float
  lng              Float
  sequence         Int
  minutesFromStart Int
}

model Bus {
  id              String  @id @default(cuid())
  name            String
  plateNumber     String  @unique
  totalSeats      Int
  type            String
  driverName      String?
  driverPhone     String?
  gpsDeviceToken  String?   // ← authenticates /api/gps/push
}

model Trip {
  id            String   @id @default(cuid())
  busId         String
  routeId       String
  departureTime DateTime
  arrivalTime   DateTime
  pricePerSeat  Float
  status        String   // SCHEDULED | BOARDING | DEPARTED | ARRIVED | CANCELLED
}

model Booking {
  id             String   @id @default(cuid())
  tripId         String
  passengerName  String
  passengerEmail String
  passengerPhone String
  seatNumbers    String   // comma-separated e.g. "A1,A2"
  boardingCounterName String?
  totalAmount    Float
  paymentStatus  String   // PENDING | PAID | FAILED | REFUNDED
  paymentRef     String?
  status         String   // CONFIRMED | CANCELLED
  cancelledAt    DateTime?
  cancelReason   String?
  refundAmount   Float?
  refundRef      String?
  refundedAt     DateTime?
}

model BusLocation {
  id                 String  @id @default(cuid())
  busId              String
  tripId             String?
  lat                Float
  lng                Float
  currentCounterId   String?
  currentCounterName String?
  nextCounterId      String?
  nextCounterName    String?
  speed              Float
  heading            Float
  status             String  // IDLE | MOVING | AT_COUNTER | ARRIVED
  progressPct        Float
  etaMinutes         Int
  lastUpdated        DateTime
}

model Notification {
  id          String   @id @default(cuid())
  bookingId   String?
  tripId      String?
  channel     String   // SMS | EMAIL
  type        String   // BOOKING_CONFIRMATION | DEPARTURE_REMINDER | DELAY_ALERT | REFUND_NOTICE
  recipient   String
  subject     String?
  body        String
  status      String   // PENDING | SENT | FAILED
  providerRef String?
  error       String?
  sentAt      DateTime?
}
```

---

## 🎨 Design System

BusLine uses a custom **emerald + amber "highway" palette** — no indigo/blue, intentionally warm and earthy.

| Token | Color | Usage |
|-------|-------|-------|
| `--primary` | `oklch(0.45 0.13 165)` — emerald | Buttons, active states, headings, brand |
| `--accent` | `oklch(0.78 0.16 75)` — amber | Highlights, boarding badges, "next stop" markers |
| `--background` | `oklch(0.99 0.005 90)` — warm cream | Page background |
| `--foreground` | `oklch(0.18 0.01 200)` — near-black | Body text |
| `--muted` | `oklch(0.965 0.005 90)` — soft cream | Muted backgrounds, cards |
| `--destructive` | `oklch(0.577 0.245 27.325)` — red | Cancelled, errors |

**Typography:**

- **Headings:** Calibri (modern, friendly)
- **Body:** Times New Roman (formal, readable)
- **Mono:** Courier New (code, data flow, API paths)

**Components:** shadcn/ui (New York style) with Lucide icons. Custom components:

- `RouteMap` — SVG-based live route visualization with animated bus marker
- `SeatMap` — visual seat selection with taken/selected/available states

---

## 🧭 Roadmap

### ✅ Done

- [x] Trip search, seat selection, checkout, payment
- [x] Live WebSocket-based bus tracking with route map
- [x] Owner dashboard: trips, routes, buses management
- [x] GPS device integration (`/api/gps/push`)
- [x] SMS + email notifications (simulated gateway)
- [x] QR boarding passes
- [x] Refund & cancellation flow

### 🔜 Planned

- [ ] **Real SMS gateway** — wire `sendBookingConfirmationSMS` etc. to Twilio / SSL Wireless
- [ ] **Real email** — wire `sendBookingConfirmationEmail` to nodemailer + SMTP
- [ ] **Cron-based departure reminders** — fire 1 hour before each trip's departure
- [ ] **Delay alert trigger** — fire when ETA slips >15 min from schedule
- [ ] **Conductor QR scanner page** — decode the QR payload at boarding
- [ ] **Native mobile apps** — iOS + Android (React Native or Expo)
- [ ] **Analytics module** — revenue trends, route performance, no-show tracking
- [ ] **NextAuth.js authentication** — real owner login with role-based access
- [ ] **PostgreSQL migration** — swap SQLite for production Postgres
- [ ] **Multi-tenant / white-label** — multiple operators on one deployment

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | React 19, RSC, API routes in one app |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Type safety end-to-end |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Rapid, consistent, themeable |
| **Database** | [Prisma ORM](https://www.prisma.io/) + SQLite | Zero-config, type-safe queries |
| **Real-time** | [Socket.IO](https://socket.io/) | WebSocket with auto-reconnect, rooms |
| **State** | React hooks + TanStack Query | Server state caching, optimistic updates |
| **Forms** | [react-hook-form](https://react-hook-form.com/) + [zod](https://zod.dev/) | Type-safe validation |
| **Notifications** | [sonner](https://sonner.emilkowal.ski/) + Radix Toast | User feedback |
| **Charts** | [Recharts](https://recharts.org/) | Revenue-by-route bars |
| **QR codes** | [qrcode](https://www.npmjs.com/package/qrcode) | PNG generation |
| **Theme** | [next-themes](https://github.com/pacocoursey/next-themes) | Light/dark mode |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent icon set |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Subtle transitions |

---

## 📄 Documentation

Three downloadable documents in `download/`:

| Document | What's in it |
|----------|--------------|
| 📄 **`BusLine-Commercial-Proposal.docx`** | Custom-build proposal for investors — problem, solution, market opportunity, engagement model (~600 words) |
| 📄 **`BusLine-Feature-List-and-Pricing.docx`** | Non-technical feature list (built + planned) with BDT pricing table |
| 📄 **`BusLine-Workflow-and-User-Guide.docx`** | Data flow diagrams, step-by-step workflows, 18 embedded screenshots, API & DB reference (~19 pages) |

To regenerate any of these:

```bash
bun run scripts/generate-proposal.js
bun run scripts/generate-feature-list.js
bun run scripts/generate-workflow-doc.js
```

---

## 🤝 Contributing

This is a custom-build engagement template. To customize for a client:

1. **Rebrand** — edit `src/app/globals.css` (palette) and `src/app/page.tsx` (BusLine name → client brand)
2. **Add real providers** — swap simulated gateways in `src/lib/notifications.ts` and `src/app/api/payment/route.ts`
3. **Add auth** — NextAuth.js is already installed; wire up owner login with role checks
4. **Migrate database** — change `DATABASE_URL` in `.env` to PostgreSQL, run `bun run db:push`
5. **Deploy** — Vercel for the Next.js app, Railway/Render for the tracking service, managed Postgres

---

## 📝 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

**Built with** ❤️ **using Next.js, TypeScript, Prisma, and Socket.IO**

[🏠 Home](#-busline) · [✨ Features](#-features) · [🚀 Getting Started](#-getting-started) · [📖 API Reference](#-api-reference)

</div>
