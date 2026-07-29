# CourierOS — Enterprise Courier & Logistics Tracking System

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

CourierOS is an end-to-end, full-stack logistics and package tracking platform designed for modern courier agencies, dispatch centers, delivery agents, and customers. It features real-time GPS tracking simulation, dynamic QR code generation, multi-role access control, e-signature proof of delivery, and comprehensive enterprise analytics.

---

## 🚀 Features Highlights

### 📦 Customer Dashboard
- **Create & Book Shipments**: Multi-step booking wizard with package weight, dimension calculations, and service selection (Standard, Express, Overnight, Same Day).
- **Public & Guest Tracking Portal**: Instant parcel lookup with interactive milestone timelines.
- **Dynamic QR Code Generation**: Download & print high-resolution QR codes for physical package labels.
- **In-App Notification Center**: Live notification alerts for package check-ins and delivery completion.

### 🚚 Delivery Agent Console
- **Assigned Route Queue**: View, filter, and process active deliveries.
- **Driver GPS Location Broadcast**: Live GPS coordinate transmitter and turn-by-turn navigation link generation.
- **E-Signature & Photo Proof**: Capture digital signatures on touchscreens/mouse and upload package delivery photos.
- **Delivery Timeline Logging**: Add driver notes and status transitions (`PICKED_UP` → `WAREHOUSE` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`).

### 📊 Enterprise Admin & Control Center
- **Logistics Analytics & KPIs**: Interactive Recharts volume throughput area charts and status pie breakdowns.
- **Global Fleet & Vehicle Monitoring**: Vehicle status, driver assignments, fuel gauge indicators, and payload capacity.
- **Warehouse Capacity Management**: Multi-branch stock levels and storage limits monitoring.
- **Financial Transactions & Payments**: Revenue reports and transaction logs.
- **Security & Audit Trail**: Granular security audit log recording every system state change with IP addresses and timestamps.
- **CSV Data Export**: One-click export for shipments, user lists, and audit reports.

---

## 📁 Repository Structure

```
courier-tracking-system/
├── docs/
│   ├── API.md             # Complete API Endpoints & Data Models Specification
│   ├── ARCHITECTURE.md    # Folder Structure, State Management & System Architecture
│   ├── INSTALLATION.md    # Local Setup & Development Instructions
│   └── DEPLOYMENT.md      # Docker & Cloud Run Deployment Guide
├── src/
│   ├── components/
│   │   ├── admin/         # Enterprise Control Center & Analytics
│   │   ├── auth/          # ProtectedRoute & Auth Guards
│   │   ├── customer/      # Booking, Customer Dashboard & QR Modal
│   │   ├── delivery/      # Agent Console & Proof of Delivery Signature Canvas
│   │   ├── layout/        # Sidebar, Topbar, AppLayout
│   │   └── ui/            # Reusable UI Primitives (Button, Card, Badge, Input, Toast, Theme)
│   ├── lib/
│   │   ├── dataStore.ts   # Centralized Persistent Data Store & State Emitter
│   │   ├── socket.ts      # Real-Time Socket.io Connection Helper
│   │   └── utils.ts       # Utility Helpers (cn class merger)
│   ├── pages/             # Route Page Views (Public Tracking, Dashboard, Shipments, Fleet, Settings)
│   ├── providers/         # Theme, Query, Toast & Auth Context Providers
│   ├── types/             # Domain TypeScript Interfaces & Enums
│   └── utils/             # Formatters (Currency, Date)
├── .env.example
├── CONTRIBUTING.md
├── LICENSE
├── package.json
└── README.md
```

---

## 🔧 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Quick Start
```bash
# Clone the repository
git clone https://github.com/d3v3sh-711/courier-tracking-system.git
cd courier-tracking-system

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
