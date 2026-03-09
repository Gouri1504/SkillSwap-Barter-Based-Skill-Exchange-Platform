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

function log(tag: string, ...args: unknown[]) {
  console.log(`[Socket.IO ${tag}]`, ...args);
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
  const meetingRooms = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    log('connect', `Socket connected: ${socket.id}`);

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

    // --- WebRTC Meeting Signaling ---

    socket.on('join-meeting', (data: { meetingId: string; userId: string; displayName: string }) => {
      const { meetingId, userId, displayName } = data;
      log('meeting', `${displayName} (${socket.id}) joining meeting: ${meetingId}`);

      socket.join(`meeting-${meetingId}`);

      if (!meetingRooms.has(meetingId)) {
        meetingRooms.set(meetingId, new Set());
      }

      const existingParticipants: string[] = [];
      meetingRooms.get(meetingId)!.forEach((sid) => {
        existingParticipants.push(sid);
      });

      meetingRooms.get(meetingId)!.add(socket.id);

      log('meeting', `Room ${meetingId} now has ${meetingRooms.get(meetingId)!.size} participants`);
      log('meeting', `Existing participants for ${socket.id}: [${existingParticipants.join(', ')}]`);

      socket.emit('meeting-participants', existingParticipants);

      socket.to(`meeting-${meetingId}`).emit('user-joined-meeting', {
        socketId: socket.id,
        userId,
        displayName,
      });
    });

    socket.on('webrtc-offer', (data: { target: string; offer: unknown }) => {
      log('webrtc', `Offer from ${socket.id} -> ${data.target}`);
      io.to(data.target).emit('webrtc-offer', {
        offer: data.offer,
        from: socket.id,
      });
    });

    socket.on('webrtc-answer', (data: { target: string; answer: unknown }) => {
      log('webrtc', `Answer from ${socket.id} -> ${data.target}`);
      io.to(data.target).emit('webrtc-answer', {
        answer: data.answer,
        from: socket.id,
      });
    });

    socket.on('webrtc-ice-candidate', (data: { target: string; candidate: unknown }) => {
      io.to(data.target).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        from: socket.id,
      });
    });

    socket.on('leave-meeting', (meetingId: string) => {
      log('meeting', `${socket.id} leaving meeting: ${meetingId}`);
      socket.leave(`meeting-${meetingId}`);
      meetingRooms.get(meetingId)?.delete(socket.id);
      if (meetingRooms.get(meetingId)?.size === 0) {
        meetingRooms.delete(meetingId);
      }
      socket.to(`meeting-${meetingId}`).emit('user-left-meeting', {
        socketId: socket.id,
      });
    });

    socket.on('disconnect', () => {
      log('disconnect', `Socket disconnected: ${socket.id}`);

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

      meetingRooms.forEach((participants, meetingId) => {
        if (participants.has(socket.id)) {
          participants.delete(socket.id);
          log('meeting', `${socket.id} removed from meeting ${meetingId} on disconnect`);
          socket.to(`meeting-${meetingId}`).emit('user-left-meeting', {
            socketId: socket.id,
          });
          if (participants.size === 0) {
            meetingRooms.delete(meetingId);
          }
        }
      });
    });
  });

  res.socket.server.io = io;
  log('init', 'Socket.IO server initialized');
  res.end();
}
