'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, BookOpen, Users, Star, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  activeExchanges: number;
  skillsLearned: number;
  averageRating: number;
  recentReviews: Array<{
    _id: string;
    rating: number;
    comment: string;
    reviewer: { displayName: string; photoURL: string };
  }>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function DashboardPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { request, loading } = useApi<DashboardStats>();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push('/');
    }
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    async function fetchStats() {
      const data = await request('/api/users/dashboard');
      if (data) setStats(data);
    }
    if (userProfile) fetchStats();
  }, [userProfile, request]);

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen t-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Sessions', value: stats?.totalSessions || 0, icon: Calendar, color: 'from-primary-500 to-blue-500' },
    { label: 'Completed', value: stats?.completedSessions || 0, icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
    { label: 'Active Exchanges', value: stats?.activeExchanges || 0, icon: Users, color: 'from-accent-500 to-pink-500' },
    { label: 'Skills Learned', value: stats?.skillsLearned || 0, icon: BookOpen, color: 'from-purple-500 to-violet-500' },
  ];

  return (
    <main className="min-h-screen t-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <motion.div initial="hidden" animate="visible" className="mb-8">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-2">
            <LayoutDashboard size={28} className="text-primary-400" />
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </motion.div>
          <motion.p variants={fadeUp} custom={1} className="t-text-secondary">
            Welcome back, {userProfile.displayName}! Here&apos;s your activity overview.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i + 2}>
              <Card className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon size={20} className="t-text" />
                </div>
                <div className="text-2xl font-bold t-text">{stat.value}</div>
                <div className="text-sm t-text-secondary">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial="hidden" animate="visible" className="lg:col-span-2">
            <motion.div variants={fadeUp} custom={6}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary-400" />
                    Your Skills
                  </h2>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      Edit Profile <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium t-text-secondary mb-2">Skills You Offer</h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skillsOffered.length > 0 ? (
                        userProfile.skillsOffered.map((skill) => (
                          <Badge key={skill.name} variant="primary">{skill.name}</Badge>
                        ))
                      ) : (
                        <p className="text-sm t-text-muted">No skills added yet</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium t-text-secondary mb-2">Skills You Want to Learn</h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.skillsWanted.length > 0 ? (
                        userProfile.skillsWanted.map((skill) => (
                          <Badge key={skill.name} variant="info">{skill.name}</Badge>
                        ))
                      ) : (
                        <p className="text-sm t-text-muted">No skills added yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={7}>
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Star size={20} className="text-yellow-400" />
                  <h2 className="text-lg font-semibold">Your Rating</h2>
                </div>

                <div className="text-center py-4">
                  <div className="text-4xl font-bold t-text mb-2">
                    {stats?.averageRating?.toFixed(1) || '0.0'}
                  </div>
                  <StarRating rating={stats?.averageRating || 0} size={24} />
                  <p className="text-sm t-text-secondary mt-2">
                    {userProfile.totalReviews || 0} reviews
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {stats?.recentReviews?.slice(0, 3).map((review) => (
                    <div key={review._id} className="p-3 rounded-lg bg-[rgb(var(--bg-secondary))]">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={review.rating} size={12} />
                        <span className="text-xs t-text-secondary">{review.reviewer.displayName}</span>
                      </div>
                      <p className="text-sm t-text-secondary line-clamp-2">{review.comment}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Link href="/matches" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">Find Matches</Button>
                  </Link>
                  <Link href="/sessions" className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">Sessions</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
