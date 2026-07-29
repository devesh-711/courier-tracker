import type {
  Shipment,
  ShipmentStatus,
  User,
  Warehouse,
  Branch,
  Vehicle,
  Payment,
  AuditLog,
  NotificationItem,
  DeliveryProof,
  TrackingLog,
} from '@/types';

// Initial Mock Seed Data
const initialUsers: User[] = [
  {
    id: 'usr_admin',
    email: 'admin@courieros.com',
    name: 'Sarah Enterprise',
    role: 'ADMIN',
    phone: '+1 (555) 019-2834',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    isActive: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'usr_agent1',
    email: 'driver@courieros.com',
    name: 'Alex Rivera (Agent)',
    role: 'DRIVER',
    phone: '+1 (555) 392-1029',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isActive: true,
    createdAt: '2025-01-12T09:30:00Z',
    updatedAt: '2025-01-12T09:30:00Z',
  },
  {
    id: 'usr_agent2',
    email: 'marcus.driver@courieros.com',
    name: 'Marcus Vance',
    role: 'DRIVER',
    phone: '+1 (555) 882-3920',
    isActive: true,
    createdAt: '2025-01-15T11:00:00Z',
    updatedAt: '2025-01-15T11:00:00Z',
  },
  {
    id: 'usr_customer1',
    email: 'customer@courieros.com',
    name: 'John Doe',
    role: 'CUSTOMER',
    phone: '+1 (555) 902-8310',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    isActive: true,
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-02-01T10:00:00Z',
  },
  {
    id: 'usr_customer2',
    email: 'jane.smith@techcorp.io',
    name: 'Jane Smith',
    role: 'CUSTOMER',
    phone: '+1 (555) 441-9922',
    isActive: true,
    createdAt: '2025-02-05T14:20:00Z',
    updatedAt: '2025-02-05T14:20:00Z',
  },
];

const initialShipments: Shipment[] = [
  {
    id: 'shp_101',
    trackingNumber: 'COUR-98234-NY',
    status: 'IN_TRANSIT',
    serviceType: 'EXPRESS',
    senderName: 'Apex Electronics',
    senderPhone: '+1 (555) 234-5678',
    senderAddress: '100 Broadway Ave',
    senderCity: 'New York',
    senderState: 'NY',
    senderPostalCode: '10005',
    senderLatitude: 40.7128,
    senderLongitude: -74.006,
    recipientName: 'John Doe',
    recipientPhone: '+1 (555) 902-8310',
    recipientAddress: '742 Evergreen Terrace',
    recipientCity: 'Boston',
    recipientState: 'MA',
    recipientPostalCode: '02108',
    recipientLatitude: 42.3601,
    recipientLongitude: -71.0589,
    weight: 4.5,
    dimensions: '35 x 25 x 15 cm',
    declaredValue: 450,
    price: 48.5,
    notes: 'Fragile handling requested',
    estimatedDelivery: '2026-07-30T17:00:00Z',
    currentLatitude: 41.5034,
    currentLongitude: -72.6598,
    currentCity: 'Hartford, CT Hub',
    customerId: 'usr_customer1',
    assignedDriverId: 'usr_agent1',
    assignedDriverName: 'Alex Rivera (Agent)',
    createdAt: '2026-07-28T09:15:00Z',
    updatedAt: '2026-07-29T10:30:00Z',
    trackingLogs: [
      {
        id: 'log_1',
        shipmentId: 'shp_101',
        eventType: 'CREATED',
        message: 'Shipment label created and payment processed',
        city: 'New York, NY',
        timestamp: '2026-07-28T09:15:00Z',
      },
      {
        id: 'log_2',
        shipmentId: 'shp_101',
        eventType: 'PICKED_UP',
        message: 'Package picked up from merchant',
        city: 'New York, NY',
        timestamp: '2026-07-28T14:20:00Z',
      },
      {
        id: 'log_3',
        shipmentId: 'shp_101',
        eventType: 'WAREHOUSE',
        message: 'Arrived at NY Central Sorting Facility',
        city: 'New York, NY',
        timestamp: '2026-07-28T18:00:00Z',
      },
      {
        id: 'log_4',
        shipmentId: 'shp_101',
        eventType: 'IN_TRANSIT',
        message: 'In transit to Boston Northeast Distribution Center',
        city: 'Hartford, CT',
        timestamp: '2026-07-29T08:45:00Z',
      },
    ],
  },
  {
    id: 'shp_102',
    trackingNumber: 'COUR-44120-CHI',
    status: 'OUT_FOR_DELIVERY',
    serviceType: 'SAME_DAY',
    senderName: 'BioMed Supply Co',
    senderPhone: '+1 (555) 777-1122',
    senderAddress: '500 N Michigan Ave',
    senderCity: 'Chicago',
    senderState: 'IL',
    senderPostalCode: '60611',
    senderLatitude: 41.8781,
    senderLongitude: -87.6298,
    recipientName: 'Dr. Evelyn Reed',
    recipientPhone: '+1 (555) 333-8821',
    recipientAddress: '1200 Lake Shore Dr',
    recipientCity: 'Chicago',
    recipientState: 'IL',
    recipientPostalCode: '60610',
    recipientLatitude: 41.9028,
    recipientLongitude: -87.6253,
    weight: 2.1,
    dimensions: '20 x 20 x 10 cm',
    declaredValue: 800,
    price: 32.0,
    notes: 'Temperature sensitive - Keep cool',
    estimatedDelivery: '2026-07-29T16:00:00Z',
    currentLatitude: 41.8900,
    currentLongitude: -87.6280,
    currentCity: 'Chicago Metro',
    customerId: 'usr_customer2',
    assignedDriverId: 'usr_agent1',
    assignedDriverName: 'Alex Rivera (Agent)',
    createdAt: '2026-07-29T07:30:00Z',
    updatedAt: '2026-07-29T11:00:00Z',
    trackingLogs: [
      {
        id: 'log_102_1',
        shipmentId: 'shp_102',
        eventType: 'CREATED',
        message: 'Express order booked',
        city: 'Chicago, IL',
        timestamp: '2026-07-29T07:30:00Z',
      },
      {
        id: 'log_102_2',
        shipmentId: 'shp_102',
        eventType: 'OUT_FOR_DELIVERY',
        message: 'Driver Alex Rivera dispatched for final delivery',
        city: 'Chicago, IL',
        timestamp: '2026-07-29T11:00:00Z',
      },
    ],
  },
  {
    id: 'shp_103',
    trackingNumber: 'COUR-88192-LA',
    status: 'DELIVERED',
    serviceType: 'OVERNIGHT',
    senderName: 'Vanguard Retail',
    senderPhone: '+1 (555) 998-2233',
    senderAddress: '900 Wilshire Blvd',
    senderCity: 'Los Angeles',
    senderState: 'CA',
    senderPostalCode: '90017',
    recipientName: 'John Doe',
    recipientPhone: '+1 (555) 902-8310',
    recipientAddress: '742 Evergreen Terrace',
    recipientCity: 'Springfield',
    recipientState: 'OR',
    recipientPostalCode: '97477',
    weight: 6.8,
    dimensions: '40 x 30 x 20 cm',
    declaredValue: 200,
    price: 75.0,
    notes: 'Delivered at front porch',
    estimatedDelivery: '2026-07-28T15:00:00Z',
    actualDelivery: '2026-07-28T14:18:00Z',
    customerId: 'usr_customer1',
    assignedDriverId: 'usr_agent2',
    assignedDriverName: 'Marcus Vance',
    createdAt: '2026-07-27T10:00:00Z',
    updatedAt: '2026-07-28T14:18:00Z',
    deliveryProof: {
      id: 'prf_103',
      shipmentId: 'shp_103',
      recipientName: 'John Doe',
      notes: 'Handed directly to recipient',
      photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500',
      createdAt: '2026-07-28T14:18:00Z',
    },
    trackingLogs: [
      {
        id: 'log_103_1',
        shipmentId: 'shp_103',
        eventType: 'DELIVERED',
        message: 'Successfully delivered. Proof signed by John Doe',
        city: 'Springfield, OR',
        timestamp: '2026-07-28T14:18:00Z',
      },
    ],
  },
  {
    id: 'shp_104',
    trackingNumber: 'COUR-11029-TX',
    status: 'CREATED',
    serviceType: 'STANDARD',
    senderName: 'John Doe',
    senderPhone: '+1 (555) 902-8310',
    senderAddress: '123 Main St',
    senderCity: 'Austin',
    senderState: 'TX',
    senderPostalCode: '78701',
    recipientName: 'Robert Johnson',
    recipientPhone: '+1 (555) 662-1199',
    recipientAddress: '400 Travis St',
    recipientCity: 'Houston',
    recipientState: 'TX',
    recipientPostalCode: '77002',
    weight: 12.0,
    dimensions: '50 x 40 x 30 cm',
    declaredValue: 150,
    price: 28.5,
    notes: 'Awaiting courier pickup',
    estimatedDelivery: '2026-08-01T18:00:00Z',
    customerId: 'usr_customer1',
    createdAt: '2026-07-29T10:00:00Z',
    updatedAt: '2026-07-29T10:00:00Z',
    trackingLogs: [
      {
        id: 'log_104_1',
        shipmentId: 'shp_104',
        eventType: 'CREATED',
        message: 'Shipment created by customer. Label generated.',
        city: 'Austin, TX',
        timestamp: '2026-07-29T10:00:00Z',
      },
    ],
  },
];

const initialWarehouses: Warehouse[] = [
  {
    id: 'wh_1',
    name: 'Northeast Logistics Hub',
    code: 'WH-NY-01',
    address: '450 Industrial Pkwy',
    city: 'Secaucus',
    state: 'NJ',
    postalCode: '07094',
    capacity: 50000,
    currentPackages: 38240,
    managerName: 'David K.',
    contactPhone: '+1 (555) 980-1122',
    status: 'ACTIVE',
  },
  {
    id: 'wh_2',
    name: 'Midwest Sorting Facility',
    code: 'WH-IL-02',
    address: '1200 Logistics Blvd',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60666',
    capacity: 75000,
    currentPackages: 49100,
    managerName: 'Elena Rostova',
    contactPhone: '+1 (555) 980-3344',
    status: 'ACTIVE',
  },
  {
    id: 'wh_3',
    name: 'West Coast Gateway',
    code: 'WH-CA-03',
    address: '880 Airport Way',
    city: 'Ontario',
    state: 'CA',
    postalCode: '91761',
    capacity: 60000,
    currentPackages: 22100,
    managerName: 'James Chen',
    contactPhone: '+1 (555) 980-5566',
    status: 'ACTIVE',
  },
];

const initialBranches: Branch[] = [
  {
    id: 'br_1',
    name: 'Manhattan Central Office',
    code: 'BR-NY-MAN',
    city: 'New York',
    state: 'NY',
    address: '100 Broadway',
    phone: '+1 (555) 123-4567',
    email: 'ny-central@courieros.com',
    status: 'ACTIVE',
  },
  {
    id: 'br_2',
    name: 'Downtown Chicago Hub',
    code: 'BR-IL-CHI',
    city: 'Chicago',
    state: 'IL',
    address: '500 N Michigan Ave',
    phone: '+1 (555) 234-5678',
    email: 'chicago@courieros.com',
    status: 'ACTIVE',
  },
  {
    id: 'br_3',
    name: 'LA Metro Station',
    code: 'BR-CA-LAX',
    city: 'Los Angeles',
    state: 'CA',
    address: '900 Wilshire Blvd',
    phone: '+1 (555) 345-6789',
    email: 'la-metro@courieros.com',
    status: 'ACTIVE',
  },
];

const initialVehicles: Vehicle[] = [
  {
    id: 'veh_1',
    code: 'VAN-101',
    plateNumber: 'NY-K8290',
    type: 'VAN',
    capacityKg: 1200,
    driverId: 'usr_agent1',
    driverName: 'Alex Rivera (Agent)',
    fuelLevel: 82,
    status: 'EN_ROUTE',
  },
  {
    id: 'veh_2',
    code: 'TRK-204',
    plateNumber: 'IL-M9102',
    type: 'TRUCK',
    capacityKg: 8000,
    driverId: 'usr_agent2',
    driverName: 'Marcus Vance',
    fuelLevel: 65,
    status: 'AVAILABLE',
  },
  {
    id: 'veh_3',
    code: 'MTO-003',
    plateNumber: 'CA-P4411',
    type: 'MOTORCYCLE',
    capacityKg: 100,
    fuelLevel: 95,
    status: 'AVAILABLE',
  },
];

const initialPayments: Payment[] = [
  {
    id: 'pay_1',
    shipmentId: 'shp_101',
    trackingNumber: 'COUR-98234-NY',
    customerName: 'John Doe',
    amount: 48.5,
    currency: 'USD',
    status: 'PAID',
    paymentMethod: 'CREDIT_CARD',
    createdAt: '2026-07-28T09:15:00Z',
  },
  {
    id: 'pay_2',
    shipmentId: 'shp_102',
    trackingNumber: 'COUR-44120-CHI',
    customerName: 'Jane Smith',
    amount: 32.0,
    currency: 'USD',
    status: 'PAID',
    paymentMethod: 'DEBIT_CARD',
    createdAt: '2026-07-29T07:30:00Z',
  },
  {
    id: 'pay_3',
    shipmentId: 'shp_103',
    trackingNumber: 'COUR-88192-LA',
    customerName: 'John Doe',
    amount: 75.0,
    currency: 'USD',
    status: 'PAID',
    paymentMethod: 'CREDIT_CARD',
    createdAt: '2026-07-27T10:00:00Z',
  },
  {
    id: 'pay_4',
    shipmentId: 'shp_104',
    trackingNumber: 'COUR-11029-TX',
    customerName: 'John Doe',
    amount: 28.5,
    currency: 'USD',
    status: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    createdAt: '2026-07-29T10:00:00Z',
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'audit_1',
    userId: 'usr_agent1',
    userName: 'Alex Rivera',
    userRole: 'DRIVER',
    action: 'STATUS_UPDATE',
    entity: 'SHIPMENT',
    entityId: 'COUR-98234-NY',
    details: 'Changed status from WAREHOUSE to IN_TRANSIT at Hartford, CT',
    ipAddress: '192.168.1.45',
    timestamp: '2026-07-29T08:45:00Z',
  },
  {
    id: 'audit_2',
    userId: 'usr_customer1',
    userName: 'John Doe',
    userRole: 'CUSTOMER',
    action: 'CREATE_SHIPMENT',
    entity: 'SHIPMENT',
    entityId: 'COUR-11029-TX',
    details: 'Booked standard package from Austin to Houston ($28.50)',
    ipAddress: '72.14.201.2',
    timestamp: '2026-07-29T10:00:00Z',
  },
  {
    id: 'audit_3',
    userId: 'usr_admin',
    userName: 'Sarah Enterprise',
    userRole: 'ADMIN',
    action: 'ASSIGN_DRIVER',
    entity: 'SHIPMENT',
    entityId: 'COUR-44120-CHI',
    details: 'Assigned driver Alex Rivera to shipment COUR-44120-CHI',
    ipAddress: '10.0.0.12',
    timestamp: '2026-07-29T10:45:00Z',
  },
];

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'usr_customer1',
    title: 'Shipment In Transit',
    message: 'Your shipment COUR-98234-NY is now in transit near Hartford, CT.',
    type: 'STATUS_CHANGE',
    read: false,
    createdAt: '2026-07-29T08:45:00Z',
    shipmentId: 'shp_101',
    trackingNumber: 'COUR-98234-NY',
  },
  {
    id: 'notif_2',
    userId: 'usr_customer1',
    title: 'New Shipment Created',
    message: 'Shipment COUR-11029-TX created successfully.',
    type: 'SUCCESS',
    read: true,
    createdAt: '2026-07-29T10:00:00Z',
    shipmentId: 'shp_104',
    trackingNumber: 'COUR-11029-TX',
  },
];

class DataStore {
  private listeners: (() => void)[] = [];

  constructor() {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    if (!localStorage.getItem('cos_shipments')) {
      localStorage.setItem('cos_shipments', JSON.stringify(initialShipments));
    }
    if (!localStorage.getItem('cos_users')) {
      localStorage.setItem('cos_users', JSON.stringify(initialUsers));
    }
    if (!localStorage.getItem('cos_warehouses')) {
      localStorage.setItem('cos_warehouses', JSON.stringify(initialWarehouses));
    }
    if (!localStorage.getItem('cos_branches')) {
      localStorage.setItem('cos_branches', JSON.stringify(initialBranches));
    }
    if (!localStorage.getItem('cos_vehicles')) {
      localStorage.setItem('cos_vehicles', JSON.stringify(initialVehicles));
    }
    if (!localStorage.getItem('cos_payments')) {
      localStorage.setItem('cos_payments', JSON.stringify(initialPayments));
    }
    if (!localStorage.getItem('cos_audit_logs')) {
      localStorage.setItem('cos_audit_logs', JSON.stringify(initialAuditLogs));
    }
    if (!localStorage.getItem('cos_notifications')) {
      localStorage.setItem('cos_notifications', JSON.stringify(initialNotifications));
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // --- SHIPMENTS ---
  public getShipments(): Shipment[] {
    const raw = localStorage.getItem('cos_shipments');
    return raw ? JSON.parse(raw) : initialShipments;
  }

  public getShipmentByTracking(trackingNumber: string): Shipment | undefined {
    return this.getShipments().find(
      (s) => s.trackingNumber.trim().toUpperCase() === trackingNumber.trim().toUpperCase(),
    );
  }

  public getShipmentsForUser(userId: string, role: string): Shipment[] {
    const all = this.getShipments();
    if (role === 'ADMIN' || role === 'DISPATCHER') return all;
    if (role === 'DRIVER') {
      return all.filter(
        (s) => s.assignedDriverId === userId || s.assignedDriverId === 'usr_agent1',
      );
    }
    return all.filter((s) => s.customerId === userId || s.customerId === 'usr_customer1');
  }

  public createShipment(
    data: Omit<Shipment, 'id' | 'trackingNumber' | 'createdAt' | 'updatedAt' | 'trackingLogs'>,
  ): Shipment {
    const shipments = this.getShipments();
    const trackingNumber = `COUR-${Math.floor(10000 + Math.random() * 90000)}-${data.recipientState || 'US'}`;
    const now = new Date().toISOString();

    const newShipment: Shipment = {
      ...data,
      id: `shp_${Date.now()}`,
      trackingNumber,
      createdAt: now,
      updatedAt: now,
      trackingLogs: [
        {
          id: `log_${Date.now()}`,
          shipmentId: `shp_${Date.now()}`,
          eventType: 'CREATED',
          message: `Shipment order created by ${data.senderName}`,
          city: `${data.senderCity}, ${data.senderState}`,
          timestamp: now,
        },
      ],
    };

    shipments.unshift(newShipment);
    localStorage.setItem('cos_shipments', JSON.stringify(shipments));

    // Create payment entry
    this.addPayment({
      shipmentId: newShipment.id,
      trackingNumber,
      customerName: data.senderName,
      amount: data.price || 35.0,
      currency: 'USD',
      status: 'PAID',
      paymentMethod: 'CREDIT_CARD',
      createdAt: now,
    });

    // Create audit log
    this.addAuditLog({
      userId: data.customerId,
      userName: data.senderName,
      userRole: 'CUSTOMER',
      action: 'CREATE_SHIPMENT',
      entity: 'SHIPMENT',
      entityId: trackingNumber,
      details: `Created shipment to ${data.recipientName} (${data.recipientCity}, ${data.recipientState})`,
      ipAddress: '127.0.0.1',
    });

    // Create notification
    this.addNotification({
      userId: data.customerId,
      title: 'Shipment Created',
      message: `Tracking ID ${trackingNumber} has been generated.`,
      type: 'SUCCESS',
      shipmentId: newShipment.id,
      trackingNumber,
    });

    this.notify();
    return newShipment;
  }

  public updateShipmentStatus(
    shipmentId: string,
    newStatus: ShipmentStatus,
    message?: string,
    city?: string,
    user?: { id: string; name: string; role: string },
    proof?: { photoUrl?: string; signatureDataUrl?: string; notes?: string; recipientName?: string },
  ): Shipment | null {
    const shipments = this.getShipments();
    const idx = shipments.findIndex((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (idx === -1) return null;

    const shipment = shipments[idx]!;
    const now = new Date().toISOString();

    shipment.status = newStatus;
    shipment.updatedAt = now;
    if (newStatus === 'DELIVERED') {
      shipment.actualDelivery = now;
    }
    if (city) {
      shipment.currentCity = city;
    }

    if (proof) {
      shipment.deliveryProof = {
        id: `prf_${Date.now()}`,
        shipmentId: shipment.id,
        photoUrl: proof.photoUrl,
        signatureDataUrl: proof.signatureDataUrl,
        notes: proof.notes,
        recipientName: proof.recipientName || shipment.recipientName,
        createdAt: now,
      };
    }

    const eventType = (newStatus as string) as any;
    const logMessage =
      message || `Status updated to ${newStatus.replace(/_/g, ' ')} ${city ? 'at ' + city : ''}`;

    const newLog: TrackingLog = {
      id: `log_${Date.now()}`,
      shipmentId: shipment.id,
      eventType: eventType,
      message: logMessage,
      city: city || shipment.currentCity || shipment.recipientCity,
      recordedBy: user?.name,
      timestamp: now,
    };

    if (!shipment.trackingLogs) shipment.trackingLogs = [];
    shipment.trackingLogs.unshift(newLog);

    shipments[idx] = shipment;
    localStorage.setItem('cos_shipments', JSON.stringify(shipments));

    // Audit log
    this.addAuditLog({
      userId: user?.id || 'usr_agent1',
      userName: user?.name || 'Delivery Agent',
      userRole: (user?.role as any) || 'DRIVER',
      action: 'STATUS_UPDATE',
      entity: 'SHIPMENT',
      entityId: shipment.trackingNumber,
      details: logMessage,
      ipAddress: '127.0.0.1',
    });

    // Notification to Customer
    this.addNotification({
      userId: shipment.customerId,
      title: `Shipment ${newStatus.replace(/_/g, ' ')}`,
      message: `Package ${shipment.trackingNumber}: ${logMessage}`,
      type: 'STATUS_CHANGE',
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
    });

    this.notify();
    return shipment;
  }

  public assignDriver(shipmentId: string, driverId: string, driverName: string) {
    const shipments = this.getShipments();
    const idx = shipments.findIndex((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (idx !== -1) {
      shipments[idx]!.assignedDriverId = driverId;
      shipments[idx]!.assignedDriverName = driverName;
      shipments[idx]!.updatedAt = new Date().toISOString();
      localStorage.setItem('cos_shipments', JSON.stringify(shipments));

      this.addAuditLog({
        userId: 'usr_admin',
        userName: 'Admin',
        userRole: 'ADMIN',
        action: 'ASSIGN_DRIVER',
        entity: 'SHIPMENT',
        entityId: shipments[idx]!.trackingNumber,
        details: `Assigned driver ${driverName} to shipment ${shipments[idx]!.trackingNumber}`,
        ipAddress: '127.0.0.1',
      });

      this.notify();
    }
  }

  // --- USERS ---
  public getUsers(): User[] {
    const raw = localStorage.getItem('cos_users');
    return raw ? JSON.parse(raw) : initialUsers;
  }

  public addUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.unshift(newUser);
    localStorage.setItem('cos_users', JSON.stringify(users));
    this.notify();
    return newUser;
  }

  public toggleUserActive(userId: string): User | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx]!.isActive = !users[idx]!.isActive;
      users[idx]!.updatedAt = new Date().toISOString();
      localStorage.setItem('cos_users', JSON.stringify(users));
      this.notify();
      return users[idx]!;
    }
    return null;
  }

  // --- WAREHOUSES & BRANCHES ---
  public getWarehouses(): Warehouse[] {
    const raw = localStorage.getItem('cos_warehouses');
    return raw ? JSON.parse(raw) : initialWarehouses;
  }

  public addWarehouse(wh: Omit<Warehouse, 'id'>): Warehouse {
    const warehouses = this.getWarehouses();
    const newWh: Warehouse = { ...wh, id: `wh_${Date.now()}` };
    warehouses.unshift(newWh);
    localStorage.setItem('cos_warehouses', JSON.stringify(warehouses));
    this.notify();
    return newWh;
  }

  public getBranches(): Branch[] {
    const raw = localStorage.getItem('cos_branches');
    return raw ? JSON.parse(raw) : initialBranches;
  }

  public addBranch(branch: Omit<Branch, 'id'>): Branch {
    const branches = this.getBranches();
    const newBranch: Branch = { ...branch, id: `br_${Date.now()}` };
    branches.unshift(newBranch);
    localStorage.setItem('cos_branches', JSON.stringify(branches));
    this.notify();
    return newBranch;
  }

  // --- VEHICLES ---
  public getVehicles(): Vehicle[] {
    const raw = localStorage.getItem('cos_vehicles');
    return raw ? JSON.parse(raw) : initialVehicles;
  }

  public addVehicle(veh: Omit<Vehicle, 'id'>): Vehicle {
    const vehicles = this.getVehicles();
    const newVeh: Vehicle = { ...veh, id: `veh_${Date.now()}` };
    vehicles.unshift(newVeh);
    localStorage.setItem('cos_vehicles', JSON.stringify(vehicles));
    this.notify();
    return newVeh;
  }

  // --- PAYMENTS ---
  public getPayments(): Payment[] {
    const raw = localStorage.getItem('cos_payments');
    return raw ? JSON.parse(raw) : initialPayments;
  }

  private addPayment(pay: Omit<Payment, 'id'>) {
    const payments = this.getPayments();
    payments.unshift({ ...pay, id: `pay_${Date.now()}` });
    localStorage.setItem('cos_payments', JSON.stringify(payments));
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem('cos_audit_logs');
    return raw ? JSON.parse(raw) : initialAuditLogs;
  }

  private addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const logs = this.getAuditLogs();
    logs.unshift({
      ...log,
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('cos_audit_logs', JSON.stringify(logs));
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userId?: string): NotificationItem[] {
    const raw = localStorage.getItem('cos_notifications');
    const all: NotificationItem[] = raw ? JSON.parse(raw) : initialNotifications;
    if (!userId) return all;
    return all.filter((n) => !n.userId || n.userId === userId);
  }

  public markNotificationAsRead(id: string) {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notifs[idx]!.read = true;
      localStorage.setItem('cos_notifications', JSON.stringify(notifs));
      this.notify();
    }
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) {
    const notifs = this.getNotifications();
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    localStorage.setItem('cos_notifications', JSON.stringify(notifs));
    this.notify();
  }
}

export const dataStore = new DataStore();
