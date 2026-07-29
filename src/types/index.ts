export type Role = 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER';

export type ShipmentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PICKED_UP'
  | 'WAREHOUSE'
  | 'SORTING_FACILITY'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'CANCELLED';

export type ServiceType = 'STANDARD' | 'EXPRESS' | 'SAME_DAY' | 'OVERNIGHT' | 'FREIGHT';

export type TrackingEventType =
  | 'CREATED'
  | 'PICKED_UP'
  | 'DEPARTED'
  | 'WAREHOUSE'
  | 'SORTING_FACILITY'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'LOCATION_UPDATE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryProof {
  id: string;
  shipmentId: string;
  photoUrl?: string;
  signatureDataUrl?: string;
  recipientName?: string;
  notes?: string;
  driverLat?: number;
  driverLng?: number;
  createdAt: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  serviceType: ServiceType;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity: string;
  senderState: string;
  senderPostalCode: string;
  senderLatitude?: number;
  senderLongitude?: number;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientPostalCode: string;
  recipientLatitude?: number;
  recipientLongitude?: number;
  weight: number; // in kg
  dimensions?: string; // e.g. "30x20x15 cm"
  declaredValue?: number;
  price?: number;
  notes?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  currentCity?: string;
  customerId: string;
  customer?: User;
  assignedDriverId?: string;
  assignedDriverName?: string;
  deliveryProof?: DeliveryProof;
  trackingLogs?: TrackingLog[];
  routeStops?: RouteStop[];
  createdAt: string;
  updatedAt: string;
}

export interface TrackingLog {
  id: string;
  shipmentId: string;
  eventType: TrackingEventType;
  message: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  recordedBy?: string;
  user?: User;
  timestamp: string;
}

export interface RouteStop {
  id: string;
  shipmentId: string;
  sequence: number;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  status: 'PENDING' | 'ARRIVED' | 'DEPARTED' | 'SKIPPED' | 'FAILED';
  arrivedAt?: string;
  departedAt?: string;
  driverId?: string;
  driver?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  capacity: number;
  currentPackages: number;
  managerName: string;
  contactPhone: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Vehicle {
  id: string;
  code: string;
  plateNumber: string;
  type: 'VAN' | 'TRUCK' | 'MOTORCYCLE' | 'CAR';
  capacityKg: number;
  driverId?: string;
  driverName?: string;
  fuelLevel: number; // percentage 0 - 100
  status: 'AVAILABLE' | 'EN_ROUTE' | 'MAINTENANCE';
}

export interface Payment {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  customerName: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'REFUNDED';
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'STATUS_CHANGE';
  read: boolean;
  createdAt: string;
  shipmentId?: string;
  trackingNumber?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}

