'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, ArrowLeftRight, Check, X, MessageSquare, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';

interface MatchUser {
  _id: string;
  displayName: string;
  photoURL: string;
  skillsOffered: Array<{ name: string; level: string }>;
  skillsWanted: Array<{ name: string; level: string }>;
  rating: number;
  totalSessions: number;
  bio?: string;
}

interface PotentialMatch {
  user: MatchUser;
  score: number;
}

interface ExistingMatch {
  _id: string;
  userA: MatchUser;
  userB: MatchUser;
  skillOfferedByA: string;
  skillOfferedByB: string;
  compatibilityScore: number;
  status: string;
  initiatedBy: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function MatchesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'discover' | 'pending' | 'active'>('discover');
  const { request, loading } = useApi();
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [existingMatches, setExistingMatches] = useState<ExistingMatch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !userProfile) router.push('/');
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    if (!userProfile) return;
    
    async function fetchData() {
      if (tab === 'discover') {
        const data = await request('/api/matches/find');
        if (data) setPotentialMatches((data as { matches: PotentialMatch[] }).matches || []);
      } else {
        const status = tab === 'pending' ? 'pending' : 'accepted';
        const data = await request(`/api/matches?status=${status}`);
        if (data) setExistingMatches((data as ExistingMatch[]) || []);
      }
    }
    fetchData();
  }, [tab, userProfile, request]);

  const handleSendRequest = async (targetUser: MatchUser) => {
    if (!userProfile) return;
    const skillOffered = userProfile.skillsOffered[0]?.name || '';
    const skillWanted = targetUser.skillsOffered[0]?.name || '';
    
    await request('/api/matches', 'POST', {
      targetUserId: targetUser._id,
      skillOffered,
      skillWanted,
    });
  };

  const handleUpdateMatch = async (matchId: string, status: 'accepted' | 'rejected') => {
    await request(`/api/matches/${matchId}`, 'PATCH', { status });
    setExistingMatches(existingMatches.filter((m) => m._id !== matchId));
  };

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen t-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredMatches = potentialMatches.filter((m) =>
    m.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user.skillsOffered.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="min-h-screen t-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <motion.div initial="hidden" animate="visible" className="mb-8">
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-2">
            <Users size={28} className="text-primary-400" />
            <h1 className="text-3xl font-bold">Skill Matches</h1>
          </motion.div>
          <motion.p variants={fadeUp} custom={1} className="t-text-secondary">
            Find your perfect skill exchange partner
          </motion.p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mb-6">
          {(['discover', 'pending', 'active'] as const).map((t) => (
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
        </motion.div>

        {tab === 'discover' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Input
              placeholder="Search by name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={16} />}
            />
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'discover' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((match, i) => (
              <motion.div key={match.user._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card hover className="h-full">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar src={match.user.photoURL} name={match.user.displayName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold t-text truncate">{match.user.displayName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={match.user.rating} size={12} />
                        <span className="text-xs t-text-secondary">{match.user.totalSessions} sessions</span>
                      </div>
                    </div>
                    <Badge variant="primary">{match.score}% match</Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs t-text-muted mb-1">Offers</p>
                      <div className="flex flex-wrap gap-1">
                        {match.user.skillsOffered.slice(0, 4).map((s) => (
                          <Badge key={s.name} variant="success" size="sm">{s.name}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs t-text-muted mb-1">Wants to learn</p>
                      <div className="flex flex-wrap gap-1">
                        {match.user.skillsWanted.slice(0, 4).map((s) => (
                          <Badge key={s.name} variant="info" size="sm">{s.name}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleSendRequest(match.user)} size="sm" className="flex-1">
                      <ArrowLeftRight size={14} /> Exchange
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/chat?user=${match.user._id}`)}>
                      <MessageSquare size={14} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
            {filteredMatches.length === 0 && (
              <div className="col-span-full text-center py-20">
                <Users size={48} className="mx-auto t-text-muted mb-4" />
                <h3 className="text-lg font-semibold t-text-secondary">No matches found</h3>
                <p className="t-text-muted text-sm mt-1">Add more skills to your profile to find matches</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {existingMatches.map((match, i) => {
              const otherUser = match.userA._id === userProfile._id ? match.userB : match.userA;
              const isPending = match.status === 'pending' && match.initiatedBy !== userProfile._id;

              return (
                <motion.div key={match._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="flex items-center gap-4">
                    <Avatar src={otherUser.photoURL} name={otherUser.displayName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold t-text">{otherUser.displayName}</h3>
                      <div className="flex items-center gap-2 text-sm t-text-secondary">
                        <span>{match.skillOfferedByA}</span>
                        <ArrowLeftRight size={14} className="text-primary-400" />
                        <span>{match.skillOfferedByB}</span>
                      </div>
                    </div>
                    <Badge variant={match.status === 'accepted' ? 'success' : match.status === 'pending' ? 'warning' : 'danger'}>
                      {match.status}
                    </Badge>
                    {isPending && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateMatch(match._id, 'accepted')}>
                          <Check size={14} /> Accept
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleUpdateMatch(match._id, 'rejected')}>
                          <X size={14} />
                        </Button>
                      </div>
                    )}
                    {match.status === 'accepted' && (
                      <Button size="sm" variant="secondary" onClick={() => router.push(`/chat?user=${otherUser._id}`)}>
                        <MessageSquare size={14} /> Chat
                      </Button>
                    )}
                  </Card>
                </motion.div>
              );
            })}
            {existingMatches.length === 0 && (
              <div className="text-center py-20">
                <Users size={48} className="mx-auto t-text-muted mb-4" />
                <h3 className="text-lg font-semibold t-text-secondary">No {tab} matches</h3>
                <p className="t-text-muted text-sm mt-1">Start discovering skill partners!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
