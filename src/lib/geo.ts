import type { Shipment } from '@/types';

// Map of common cities to [latitude, longitude]
export const KNOWN_CITY_COORDINATES: Record<string, [number, number]> = {
  'new york': [40.7128, -74.006],
  'ny': [40.7128, -74.006],
  'brooklyn': [40.6782, -73.9442],
  'manhattan': [40.7831, -73.9712],
  'boston': [42.3601, -71.0589],
  'hartford': [41.7658, -72.6734],
  'chicago': [41.8781, -87.6298],
  'los angeles': [34.0522, -118.2437],
  'springfield': [44.0462, -123.022],
  'austin': [30.2672, -97.7431],
  'houston': [29.7604, -95.3698],
  'dallas': [32.7767, -96.797],
  'san francisco': [37.7749, -122.4194],
  'san jose': [37.3382, -121.8863],
  'seattle': [47.6062, -122.3321],
  'portland': [45.5152, -122.6784],
  'miami': [25.7617, -80.1918],
  'orlando': [28.5383, -81.3792],
  'atlanta': [33.749, -84.388],
  'denver': [39.7392, -104.9903],
  'phoenix': [33.4484, -112.074],
  'las vegas': [36.1699, -115.1398],
  'philadelphia': [39.9526, -75.1652],
  'washington': [38.9072, -77.0369],
  'dc': [38.9072, -77.0369],
  'detroit': [42.3314, -83.0458],
  'minneapolis': [44.9778, -93.265],
  'san diego': [32.7157, -117.1611],
  'sacramento': [38.5816, -121.4944],
  'baltimore': [39.2904, -76.6122],
  'secaucus': [40.7895, -74.0565],
  'newark': [40.7357, -74.1724],
};

export function getCityCoordinates(city?: string, state?: string): [number, number] {
  if (!city) return [40.7128, -74.006]; // default NYC
  const cleanCity = city.toLowerCase().replace(/,/g, '').trim();

  // Direct match
  if (KNOWN_CITY_COORDINATES[cleanCity]) {
    return KNOWN_CITY_COORDINATES[cleanCity];
  }

  // Token match (e.g. "Hartford, CT Hub" matches "hartford")
  for (const [key, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (cleanCity.includes(key) || (state && state.toLowerCase() === key)) {
      return coords;
    }
  }

  // Hash based deterministic offset from center of US [39.8283, -98.5795] for any unknown city
  let hash = 0;
  for (let i = 0; i < cleanCity.length; i++) {
    hash = (hash << 5) - hash + cleanCity.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 100) / 100) * 10 - 5;
  const lngOffset = ((Math.abs(hash >> 3) % 100) / 100) * 20 - 10;
  return [39.8283 + latOffset, -98.5795 + lngOffset];
}

export interface ShipmentResolvedCoords {
  origin: [number, number];
  destination: [number, number];
  current: [number, number];
  hasLiveCoords: boolean;
  progressPercent: number;
}

export function resolveShipmentCoordinates(shipment: Shipment): ShipmentResolvedCoords {
  const origin: [number, number] =
    shipment.senderLatitude !== undefined && shipment.senderLongitude !== undefined
      ? [shipment.senderLatitude, shipment.senderLongitude]
      : getCityCoordinates(shipment.senderCity, shipment.senderState);

  const destination: [number, number] =
    shipment.recipientLatitude !== undefined && shipment.recipientLongitude !== undefined
      ? [shipment.recipientLatitude, shipment.recipientLongitude]
      : getCityCoordinates(shipment.recipientCity, shipment.recipientState);

  let current: [number, number];
  let hasLiveCoords = false;

  if (shipment.currentLatitude !== undefined && shipment.currentLongitude !== undefined) {
    current = [shipment.currentLatitude, shipment.currentLongitude];
    hasLiveCoords = true;
  } else if (shipment.currentCity) {
    current = getCityCoordinates(shipment.currentCity);
  } else {
    // Interpolate based on status
    const statusRatio: Record<string, number> = {
      CREATED: 0.05,
      PENDING: 0.1,
      PICKED_UP: 0.25,
      WAREHOUSE: 0.45,
      SORTING_FACILITY: 0.55,
      IN_TRANSIT: 0.65,
      OUT_FOR_DELIVERY: 0.88,
      DELIVERED: 1.0,
      EXCEPTION: 0.5,
      CANCELLED: 0.0,
    };
    const ratio = statusRatio[shipment.status] ?? 0.5;
    current = [
      origin[0] + (destination[0] - origin[0]) * ratio,
      origin[1] + (destination[1] - origin[1]) * ratio,
    ];
  }

  // Calculate progress ratio
  const totalDist = calculateDistance(origin[0], origin[1], destination[0], destination[1]);
  let progressPercent = 50;
  if (totalDist > 0) {
    if (shipment.status === 'DELIVERED') {
      progressPercent = 100;
    } else if (shipment.status === 'CREATED') {
      progressPercent = 5;
    } else {
      const distFromOrigin = calculateDistance(origin[0], origin[1], current[0], current[1]);
      progressPercent = Math.min(100, Math.max(5, Math.round((distFromOrigin / totalDist) * 100)));
    }
  }

  return {
    origin,
    destination,
    current,
    hasLiveCoords,
    progressPercent,
  };
}

// Great-circle distance between two points on the Earth (in km)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatKmToMiles(km: number): string {
  const miles = Math.round(km * 0.621371);
  return `${miles.toLocaleString()} mi (${km.toLocaleString()} km)`;
}

export interface GeoFenceZone {
  id: string;
  name: string;
  type: 'DESTINATION_DELIVERY' | 'ORIGIN_DISPATCH' | 'CUSTOM';
  center: [number, number];
  radiusKm: number;
  color: string;
  fillColor: string;
  description: string;
}

export function getShipmentGeoFenceZones(shipment: Shipment, radiusKm = 25): GeoFenceZone[] {
  const { origin, destination } = resolveShipmentCoordinates(shipment);
  return [
    {
      id: `geo_dest_${shipment.id}`,
      name: `${shipment.recipientCity || 'Destination'} Final-Mile Delivery Zone`,
      type: 'DESTINATION_DELIVERY',
      center: destination,
      radiusKm,
      color: '#10b981',
      fillColor: '#10b981',
      description: `Target delivery zone for ${shipment.recipientName} (${radiusKm} km radius)`,
    },
    {
      id: `geo_orig_${shipment.id}`,
      name: `${shipment.senderCity || 'Origin'} Dispatch Zone`,
      type: 'ORIGIN_DISPATCH',
      center: origin,
      radiusKm: Math.max(10, Math.round(radiusKm * 0.5)),
      color: '#6366f1',
      fillColor: '#6366f1',
      description: `Merchant departure perimeter (${Math.max(10, Math.round(radiusKm * 0.5))} km radius)`,
    },
  ];
}

export interface GeoFenceCheckResult {
  zone: GeoFenceZone;
  isInside: boolean;
  distanceKm: number;
}

export function evaluateGeoFence(
  coords: [number, number],
  zone: GeoFenceZone,
): GeoFenceCheckResult {
  const distanceKm = calculateDistance(coords[0], coords[1], zone.center[0], zone.center[1]);
  return {
    zone,
    isInside: distanceKm <= zone.radiusKm,
    distanceKm,
  };
}
