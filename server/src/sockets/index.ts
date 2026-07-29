import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('[socket] connected:', socket.id);

    socket.on('track:subscribe', (trackingNumber: string) => {
      void socket.join(`shipment:${trackingNumber}`);
    });

    socket.on('track:unsubscribe', (trackingNumber: string) => {
      void socket.leave(`shipment:${trackingNumber}`);
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', socket.id, reason);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
