export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';
export const MAP_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const QUERY_KEYS = {
  shipments: ['shipments'] as const,
  shipment: (id: string) => ['shipments', id] as const,
  tracking: (trackingNumber: string) => ['tracking', trackingNumber] as const,
  users: ['users'] as const,
  stats: ['stats'] as const,
} as const;

export const STORAGE_KEYS = {
  theme: 'courier-theme',
  token: 'courier-token',
} as const;
