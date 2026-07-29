# Architecture & System Design

CourierOS is structured following modular component practices and clean separation of concerns.

---

## 🏛️ System Architecture

```
                       ┌─────────────────────────┐
                       │  Public Guest Portal    │
                       │  (/public-tracking)     │
                       └────────────┬────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           React 19 Frontend                             │
│                                                                         │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │ Customer Dashboard│  │ Delivery Agent    │  │ Enterprise Admin    │  │
│  │ (Book, Track, QR) │  │ Console (POD, GPS)│  │ Dashboard (Analytics│  │
│  └─────────┬─────────┘  └─────────┬─────────┘  └──────────┬──────────┘  │
│            │                      │                       │             │
└────────────┼──────────────────────┼───────────────────────┼─────────────┘
             │                      │                       │
             ▼                      ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   DataStore & LocalStorage Service                      │
│                  (Pub/Sub Event Listener Engine)                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Core Architecture Pillars

1. **Pub/Sub Data Engine (`src/lib/dataStore.ts`)**:
   - Single source of truth for shipments, users, fleet vehicles, warehouses, payments, and audit logs.
   - Triggers re-renders across all active components via subscription listeners whenever state changes.

2. **Multi-Role User Context (`src/providers/AuthProvider.tsx`)**:
   - Provides role-aware views and navigation guards (`CUSTOMER`, `DRIVER`, `DISPATCHER`, `ADMIN`).

3. **Digital Signature Canvas (`src/components/delivery/ProofOfDeliveryModal.tsx`)**:
   - HTML5 Canvas drawing context rendering smooth touch and cursor vector paths for recipient verification.
