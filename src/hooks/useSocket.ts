'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

interface MessagePayload {
  _id: string;
  content: string;
  sender: { _id: string; displayName: string; photoURL: string };
  messageType: string;
  createdAt: string;
}

export function useSocket() {
  const { userProfile } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map());

  const registerListener = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }

    return () => {
      listenersRef.current.get(event)?.delete(callback);
      socketRef.current?.off(event, callback);
    };
  }, []);

  useEffect(() => {
    if (!userProfile) return;

    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socketio',
      addTrailingSlash: false,
      transports: ['polling', 'websocket'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('user-online', userProfile._id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    listenersRef.current.forEach((callbacks, event) => {
      callbacks.forEach((cb) => socket.on(event, cb));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userProfile]);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join-room', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave-room', roomId);
  }, []);

  const sendMessage = useCallback((roomId: string, message: MessagePayload) => {
    socketRef.current?.emit('send-message', { roomId, message });
  }, []);

  const emitTyping = useCallback((roomId: string, userId: string, displayName: string) => {
    socketRef.current?.emit('typing', { roomId, userId, displayName });
  }, []);

  const emitStopTyping = useCallback((roomId: string, userId: string) => {
    socketRef.current?.emit('stop-typing', { roomId, userId });
  }, []);

  const onNewMessage = useCallback((callback: (message: MessagePayload) => void) => {
    return registerListener('new-message', callback as (...args: unknown[]) => void);
  }, [registerListener]);

  const onUserTyping = useCallback((callback: (data: { userId: string; displayName: string }) => void) => {
    return registerListener('user-typing', callback as (...args: unknown[]) => void);
  }, [registerListener]);

  const onUserStopTyping = useCallback((callback: (data: { userId: string }) => void) => {
    return registerListener('user-stop-typing', callback as (...args: unknown[]) => void);
  }, [registerListener]);

  return {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    emitTyping,
    emitStopTyping,
    onNewMessage,
    onUserTyping,
    onUserStopTyping,
  };
}
