'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, Calendar, AlertTriangle, TrendingUp, Ban, CheckCircle2,
  UserX, BarChart3, Activity,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  completedSessions: number;
  totalMatches: number;
  pendingReports: number;
  bannedUsers: number;
  recentUsers: Array<{
    _id: string;
    displayName: string;
    email: string;
    photoURL: string;
    createdAt: string;
    role: string;
    isBanned: boolean;
  }>;
}

interface ReportData {
  _id: string;
  reporter: { _id: string; displayName: string; email: string; photoURL: string };
  reported: { _id: string; displayName: string; email: string; photoURL: string; isBanned: boolean };
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function AdminPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { request } = useApi();
  const [tab, setTab] = useState<'overview' | 'users' | 'reports'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push('/');
    } else if (userProfile && userProfile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    async function fetchStats() {
      const data = await request('/api/admin/stats');
      if (data) setStats(data as AdminStats);
    }
    if (userProfile?.role === 'admin') fetchStats();
  }, [userProfile, request]);

  useEffect(() => {
    async function fetchReports() {
      const data = await request('/api/admin/reports?status=pending');
      if (data) setReports((data as ReportData[]) || []);
    }
    if (userProfile?.role === 'admin' && tab === 'reports') fetchReports();
  }, [userProfile, tab, request]);

  const handleBanUser = async (userId: string, action: 'ban' | 'unban') => {
    await request('/api/admin/users', 'PATCH', { userId, action });
    if (stats) {
      setStats({
        ...stats,
        recentUsers: stats.recentUsers.map((u) =>
          u._id === userId ? { ...u, isBanned: action === 'ban' } : u
        ),
      });
    }
  };

  const handleUpdateReport = async (reportId: string, status: string) => {
    await request('/api/admin/reports', 'PATCH', { reportId, status });
    setReports(reports.filter((r) => r._id !== reportId));
  };

  if (authLoading || !userProfile || userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen t-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'from-primary-500 to-blue-500' },
    { label: 'Active Users (7d)', value: stats?.activeUsers || 0, icon: Activity, color: 'from-green-500 to-emerald-500' },
    { label: 'Total Sessions', value: stats?.totalSessions || 0, icon: Calendar, color: 'from-purple-500 to-violet-500' },
    { label: 'Completed Sessions', value: stats?.completedSessions || 0, icon: CheckCircle2, color: 'from-cyan-500 to-teal-500' },
    { label: 'Active Matches', value: stats?.totalMatches || 0, icon: TrendingUp, color: 'from-yellow-500 to-orange-500' },
    { label: 'Pending Reports', value: stats?.pendingReports || 0, icon: AlertTriangle, color: 'from-red-500 to-pink-500' },
  ];

  return (
    <main className="min-h-screen t-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <motion.div initial="hidden" animate="visible" className="mb-8">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-2">
            <Shield size={28} className="text-primary-400" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </motion.div>
          <motion.p variants={fadeUp} custom={1} className="t-text-secondary">
            Platform management and moderation
          </motion.p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          {(['overview', 'users', 'reports'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-primary-500 t-text' : 'bg-[rgb(var(--bg-secondary))] t-text-secondary hover:bg-[rgb(var(--bg-secondary))]'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {statCards.map((stat, i) => (
                <motion.div key={stat.label} variants={fadeUp} custom={i}>
                  <Card>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon size={22} className="t-text" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold t-text">{stat.value}</div>
                        <div className="text-sm t-text-secondary">{stat.label}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users size={18} className="text-primary-400" />
                Recent Users
              </h2>
              <div className="space-y-3">
                {stats?.recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg-secondary))]">
                    <Avatar src={user.photoURL} name={user.displayName} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium t-text">{user.displayName}</p>
                      <p className="text-xs t-text-muted">{user.email}</p>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>{user.role}</Badge>
                    {user.isBanned && <Badge variant="danger">Banned</Badge>}
                    <p className="text-xs t-text-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === 'users' && (
          <div>
            <div className="mb-4">
              <Input
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                icon={<Users size={16} />}
              />
            </div>
            <Card>
              <div className="space-y-3">
                {stats?.recentUsers
                  .filter(
                    (u) =>
                      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((user) => (
                    <div key={user._id} className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg-secondary))]">
                      <Avatar src={user.photoURL} name={user.displayName} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium t-text">{user.displayName}</p>
                        <p className="text-xs t-text-muted">{user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        {user.isBanned ? (
                          <Button size="sm" variant="secondary" onClick={() => handleBanUser(user._id, 'unban')}>
                            <CheckCircle2 size={14} /> Unban
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" onClick={() => handleBanUser(user._id, 'ban')}>
                            <Ban size={14} /> Ban
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-4">
            {reports.map((report, i) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={18} className="text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="danger">{report.reason}</Badge>
                        <span className="text-xs t-text-muted">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm t-text mb-2">{report.description}</p>
                      <div className="flex items-center gap-4 text-xs t-text-muted">
                        <span>Reporter: {report.reporter.displayName}</span>
                        <span>Reported: {report.reported.displayName}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => handleUpdateReport(report._id, 'resolved')}>
                        <CheckCircle2 size={14} /> Resolve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleUpdateReport(report._id, 'dismissed')}>
                        Dismiss
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleBanUser(report.reported._id, 'ban')}>
                        <Ban size={14} /> Ban User
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-20">
                <AlertTriangle size={48} className="mx-auto t-text-muted mb-4" />
                <h3 className="text-lg font-semibold t-text-secondary">No pending reports</h3>
                <p className="t-text-muted text-sm mt-1">The community is looking good!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
