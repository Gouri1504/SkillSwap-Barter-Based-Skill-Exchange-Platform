'use client';

import React, { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Search, Circle, Wifi, WifiOff } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useSocket } from '@/hooks/useSocket';
import { useRouter, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    displayName: string;
    photoURL: string;
    lastActive: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    displayName: string;
    photoURL: string;
  };
  messageType: string;
  createdAt: string;
}

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen t-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatPage />
    </Suspense>
  );
}

function ChatPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { request } = useApi();
  const { isConnected, joinRoom, leaveRoom, sendMessage: socketSendMessage, onNewMessage, emitTyping, emitStopTyping, onUserTyping, onUserStopTyping } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousConvoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !userProfile) router.push('/');
  }, [authLoading, userProfile, router]);

  const fetchConversations = useCallback(async () => {
    const data = await request('/api/chat/conversations');
    if (data) setConversations(data as Conversation[]);
  }, [request]);

  useEffect(() => {
    if (userProfile) fetchConversations();
  }, [userProfile, fetchConversations]);

  useEffect(() => {
    const userId = searchParams?.get('user');
    if (userId && userProfile) {
      initConversation(userId);
    }
  }, [searchParams, userProfile]);

  const initConversation = async (recipientId: string) => {
    const data = await request('/api/chat/messages', 'POST', {
      recipientId,
      content: 'Hey! I\'d like to exchange skills with you.',
    });
    if (data) {
      const result = data as { conversationId: string };
      setSelectedConvo(result.conversationId);
      fetchConversations();
      loadMessages(result.conversationId);
    }
  };

  const loadMessages = async (convoId: string) => {
    setLoadingMessages(true);
    const data = await request(`/api/chat/messages?conversationId=${convoId}`);
    if (data) setMessages((data as Message[]) || []);
    setLoadingMessages(false);
  };

  // Socket.io: join/leave rooms when conversation changes
  useEffect(() => {
    if (previousConvoRef.current) {
      leaveRoom(previousConvoRef.current);
    }
    if (selectedConvo) {
      joinRoom(selectedConvo);
      loadMessages(selectedConvo);
    }
    previousConvoRef.current = selectedConvo;
  }, [selectedConvo, joinRoom, leaveRoom]);

  // Socket.io: listen for new messages
  useEffect(() => {
    const cleanup = onNewMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });
    return cleanup;
  }, [onNewMessage]);

  // Socket.io: listen for typing
  useEffect(() => {
    const cleanupTyping = onUserTyping((data) => {
      if (data.userId !== userProfile?._id) {
        setTypingUser(data.displayName);
      }
    });
    const cleanupStopTyping = onUserStopTyping(() => {
      setTypingUser(null);
    });
    return () => {
      cleanupTyping?.();
      cleanupStopTyping?.();
    };
  }, [onUserTyping, onUserStopTyping, userProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const handleTyping = () => {
    if (!selectedConvo || !userProfile) return;
    emitTyping(selectedConvo, userProfile._id, userProfile.displayName);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(selectedConvo, userProfile._id);
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConvo || !userProfile) return;

    const data = await request('/api/chat/messages', 'POST', {
      conversationId: selectedConvo,
      content: newMessage,
    });

    if (data) {
      const result = data as { message: Message };
      setMessages((prev) => [...prev, result.message]);
      setNewMessage('');
      fetchConversations();

      // Broadcast via socket
      socketSendMessage(selectedConvo, result.message);
      emitStopTyping(selectedConvo, userProfile._id);
    }
  };

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen t-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredConvos = conversations.filter((c) =>
    c.participants.some(
      (p) =>
        p._id !== userProfile._id &&
        p.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <main className="min-h-screen t-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-4 h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4 pt-4">
          <div className="flex items-center gap-3">
            <MessageSquare size={28} className="text-primary-500" />
            <h1 className="text-2xl font-bold t-text">Messages</h1>
          </div>
          <Badge variant={isConnected ? 'success' : 'danger'} size="sm">
            {isConnected ? <Wifi size={12} className="mr-1" /> : <WifiOff size={12} className="mr-1" />}
            {isConnected ? 'Connected' : 'Offline'}
          </Badge>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Conversations List */}
          <Card className="w-80 flex-shrink-0 flex flex-col p-0 overflow-hidden">
            <div className="p-3 border-b border-[rgb(var(--border))]">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={14} />}
                className="text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConvos.map((convo) => {
                const otherUser = convo.participants.find((p) => p._id !== userProfile._id);
                if (!otherUser) return null;

                const isActive = convo._id === selectedConvo;
                const isOnline = otherUser.lastActive &&
                  new Date(otherUser.lastActive).getTime() > Date.now() - 5 * 60 * 1000;

                return (
                  <button
                    key={convo._id}
                    onClick={() => setSelectedConvo(convo._id)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-3 text-left transition-all hover:bg-black/5 dark:hover:bg-white/5',
                      isActive && 'bg-primary-500/10 border-l-2 border-primary-500'
                    )}
                  >
                    <div className="relative">
                      <Avatar src={otherUser.photoURL} name={otherUser.displayName} size="md" />
                      {isOnline && (
                        <Circle size={10} className="absolute bottom-0 right-0 fill-green-400 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium t-text truncate">{otherUser.displayName}</p>
                      {convo.lastMessage && (
                        <p className="text-xs t-text-muted truncate">{convo.lastMessage.content}</p>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredConvos.length === 0 && (
                <div className="text-center py-8 px-4">
                  <MessageSquare size={32} className="mx-auto t-text-muted mb-2" />
                  <p className="text-sm t-text-muted">No conversations yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col p-0 overflow-hidden">
            {selectedConvo ? (
              <>
                <div className="p-4 border-b border-[rgb(var(--border))]">
                  {(() => {
                    const convo = conversations.find((c) => c._id === selectedConvo);
                    const otherUser = convo?.participants.find((p) => p._id !== userProfile._id);
                    return otherUser ? (
                      <div className="flex items-center gap-3">
                        <Avatar src={otherUser.photoURL} name={otherUser.displayName} size="md" />
                        <div>
                          <p className="font-medium t-text">{otherUser.displayName}</p>
                          <p className="text-xs text-green-500">Online</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender._id === userProfile._id;
                      return (
                        <motion.div
                          key={msg._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={clsx('flex', isOwn ? 'justify-end' : 'justify-start')}
                        >
                          <div className={clsx(
                            'max-w-[70%] rounded-2xl px-4 py-2.5',
                            isOwn
                              ? 'bg-primary-500 text-white rounded-br-sm'
                              : 'bg-[rgb(var(--bg-secondary))] t-text rounded-bl-sm border border-[rgb(var(--border))]'
                          )}>
                            <p className="text-sm">{msg.content}</p>
                            <p className={clsx('text-[10px] mt-1', isOwn ? 'text-white/50' : 't-text-muted')}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {typingUser && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-2xl rounded-bl-sm px-4 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs t-text-muted">{typingUser} is typing</span>
                          <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-[rgb(var(--border))]">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-400 transition-colors disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto t-text-muted mb-4" />
                  <h3 className="text-lg font-semibold t-text-secondary">Select a conversation</h3>
                  <p className="text-sm t-text-muted mt-1">Choose a chat to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
