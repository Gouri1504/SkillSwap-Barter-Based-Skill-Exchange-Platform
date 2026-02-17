'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

export function useSocket() {
  const { userProfile } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('user-online', userProfile._id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

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

  const sendMessage = useCallback((roomId: string, message: {
    _id: string;
    content: string;
    sender: { _id: string; displayName: string; photoURL: string };
    messageType: string;
    createdAt: string;
  }) => {
    socketRef.current?.emit('send-message', { roomId, message });
  }, []);

  const emitTyping = useCallback((roomId: string, userId: string, displayName: string) => {
    socketRef.current?.emit('typing', { roomId, userId, displayName });
  }, []);

  const emitStopTyping = useCallback((roomId: string, userId: string) => {
    socketRef.current?.emit('stop-typing', { roomId, userId });
  }, []);

  const onNewMessage = useCallback((callback: (message: {
    _id: string;
    content: string;
    sender: { _id: string; displayName: string; photoURL: string };
    messageType: string;
    createdAt: string;
  }) => void) => {
    socketRef.current?.on('new-message', callback);
    return () => {
      socketRef.current?.off('new-message', callback);
    };
  }, []);

  const onUserTyping = useCallback((callback: (data: { userId: string; displayName: string }) => void) => {
    socketRef.current?.on('user-typing', callback);
    return () => {
      socketRef.current?.off('user-typing', callback);
    };
  }, []);

  const onUserStopTyping = useCallback((callback: (data: { userId: string }) => void) => {
    socketRef.current?.on('user-stop-typing', callback);
    return () => {
      socketRef.current?.off('user-stop-typing', callback);
    };
  }, []);

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
