'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Users, Calendar, MessageSquare, Star, Shield, Check } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NotificationData {
  _id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, typeof Bell> = {
  match: Users,
  session: Calendar,
  message: MessageSquare,
  review: Star,
  system: Shield,
};

export default function NotificationsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { request } = useApi();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!authLoading && !userProfile) router.push('/');
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    async function fetchNotifications() {
      const data = await request('/api/notifications');
      if (data) setNotifications(data as NotificationData[]);
    }
    if (userProfile) fetchNotifications();
  }, [userProfile, request]);

  const markAllRead = async () => {
    await request('/api/notifications', 'PATCH');
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen t-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="min-h-screen t-bg">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bell size={28} className="text-primary-400" />
              <h1 className="text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary-500 text-xs font-medium t-text">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <Check size={14} /> Mark all read
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.map((notification, i) => {
            const Icon = typeIcons[notification.type] || Bell;

            return (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link href={notification.link || '#'}>
                  <Card
                    hover
                    className={`flex items-start gap-4 ${!notification.read ? 'border-primary-500/30' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      !notification.read ? 'bg-primary-500/20' : 'bg-[rgb(var(--bg-secondary))]'
                    }`}>
                      <Icon size={18} className={!notification.read ? 'text-primary-400' : 't-text-secondary'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.read ? 't-text' : 't-text-secondary'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm t-text-muted mt-0.5">{notification.message}</p>
                      <p className="text-xs t-text-muted mt-1">
                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                    )}
                  </Card>
                </Link>
              </motion.div>
            );
          })}
          {notifications.length === 0 && (
            <div className="text-center py-20">
              <Bell size={48} className="mx-auto t-text-muted mb-4" />
              <h3 className="text-lg font-semibold t-text-secondary">No notifications</h3>
              <p className="t-text-muted text-sm mt-1">You&apos;re all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
