import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';
import { dataStore } from './dataStore';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('shipment:status_changed', (data: { shipmentId: string; status: any; city?: string }) => {
      dataStore.updateShipmentStatus(data.shipmentId, data.status, undefined, data.city);
    });
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

