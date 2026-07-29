# CourierOS — API & Data Schema Documentation

This document outlines the API endpoints, data models, and WebSocket event specifications for CourierOS.

---

## 📐 Data Models

### 1. `Shipment`
```typescript
export interface Shipment {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderState: string;
  senderPostalCode: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientPostalCode: string;
  weight: number; // in kg
  dimensions: string; // e.g. "30x20x15 cm"
  serviceType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'SAME_DAY';
  status: ShipmentStatus;
  price: number;
  customerId: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  currentCity?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  estimatedDelivery?: string;
  notes?: string;
  trackingLogs?: TrackingLog[];
  deliveryProof?: DeliveryProof;
  createdAt: string;
  updatedAt: string;
}
```

### 2. `ShipmentStatus` Enums
- `CREATED`: Booking recorded in system.
- `PENDING`: Awaiting courier pickup.
- `PICKED_UP`: Package collected from sender address.
- `WAREHOUSE`: Checked into regional sorting hub.
- `SORTING_FACILITY`: Under sorting and batching.
- `IN_TRANSIT`: En route on long-distance vehicle route.
- `OUT_FOR_DELIVERY`: Dispatched with local courier agent.
- `DELIVERED`: Delivered with recorded signature/photo proof.
- `EXCEPTION`: Delivery issue logged.
- `CANCELLED`: Shipment cancelled by customer/admin.

---

## ⚡ Real-Time WebSocket Events (`Socket.io`)

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `shipment:update_status` | Client → Server | `{ shipmentId, status, city }` | Emit when driver/admin changes package status |
| `shipment:status_changed` | Server → Client | `{ shipmentId, status, city }` | Broadcast to all active clients for instant re-render |
| `driver:location_update` | Client → Server | `{ driverId, lat, lng }` | Transmit live agent GPS position |

---

## 🔌 DataStore Methods (Frontend API)

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `getShipments()` | None | `Shipment[]` | Returns all global shipments |
| `getShipmentByTracking()` | `trackingNumber: string` | `Shipment \| undefined` | Look up parcel by tracking code |
| `getShipmentsForUser()` | `userId: string, role: Role` | `Shipment[]` | Returns filtered shipments by customer or driver |
| `createShipment()` | `data: Partial<Shipment>` | `Shipment` | Create new package record |
| `updateShipmentStatus()` | `id, status, msg, city, updatedBy, proof` | `Shipment \| undefined` | Transition status & log audit |
