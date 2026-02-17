import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
    });

    socket.on('send-message', (data: {
      roomId: string;
      message: {
        _id: string;
        content: string;
        sender: { _id: string; displayName: string; photoURL: string };
        messageType: string;
        createdAt: string;
      };
    }) => {
      socket.to(data.roomId).emit('new-message', data.message);
    });

    socket.on('typing', (data: { roomId: string; userId: string; displayName: string }) => {
      socket.to(data.roomId).emit('user-typing', {
        userId: data.userId,
        displayName: data.displayName,
      });
    });

    socket.on('stop-typing', (data: { roomId: string; userId: string }) => {
      socket.to(data.roomId).emit('user-stop-typing', { userId: data.userId });
    });

    socket.on('user-online', (userId: string) => {
      socket.broadcast.emit('user-status', { userId, online: true });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
