import { Server as IOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: IOServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new IOServer(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
  });

  const onlineUsers = new Map<string, string>();

  io.on('connection', (socket) => {
    socket.on('user-online', (userId: string) => {
      onlineUsers.set(userId, socket.id);
      const onlineIds: string[] = [];
      onlineUsers.forEach((_, uid) => onlineIds.push(uid));
      io.emit('online-users', onlineIds);
    });

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
    });

    socket.on('send-message', (data: { roomId: string; message: unknown }) => {
      socket.to(data.roomId).emit('new-message', data.message);
    });

    socket.on('typing', (data: { roomId: string; userId: string; displayName: string }) => {
      socket.to(data.roomId).emit('user-typing', {
        userId: data.userId,
        displayName: data.displayName,
      });
    });

    socket.on('stop-typing', (data: { roomId: string; userId: string }) => {
      socket.to(data.roomId).emit('user-stop-typing', {
        userId: data.userId,
      });
    });

    socket.on('disconnect', () => {
      let disconnectedUser: string | null = null;
      onlineUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          disconnectedUser = userId;
        }
      });
      if (disconnectedUser) {
        onlineUsers.delete(disconnectedUser);
      }
      const ids: string[] = [];
      onlineUsers.forEach((_, uid) => ids.push(uid));
      io.emit('online-users', ids);
    });
  });

  res.socket.server.io = io;
  res.end();
}
