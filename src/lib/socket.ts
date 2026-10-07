import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';
import { dataStore } from './dataStore';
import type { ShipmentStatus } from '@/types';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('shipment:status_changed', (data: { shipmentId: string; status: ShipmentStatus; city?: string }) => {
      dataStore.updateShipmentStatus(data.shipmentId, data.status, undefined, data.city);
    });

    socket.on(
      'track:location',
      (data: { trackingNumber: string; latitude: number; longitude: number; city?: string }) => {
        dataStore.updateShipmentLocation(data.trackingNumber, data.latitude, data.longitude, data.city);
      },
    );
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    try {
      s.connect();
    } catch {
      // Fallback gracefully if backend socket server is offline
    }
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
}

export function emitStatusChange(shipmentId: string, status: string, city?: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit('shipment:update_status', { shipmentId, status, city });
  }
}

export function emitLocationUpdate(
  trackingNumber: string,
  latitude: number,
  longitude: number,
  city?: string,
) {
  const s = getSocket();
  if (s.connected) {
    s.emit('track:location', { trackingNumber, latitude, longitude, city });
  }
}

