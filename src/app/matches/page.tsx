'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, ArrowLeftRight, Check, X, MessageSquare, Star,
  SlidersHorizontal, ArrowUpDown, Calendar, Loader2, UserPlus, ChevronDown,
} from 'lucide-react';
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
  createdAt: string;
}

type SortOption = 'score' | 'rating' | 'sessions' | 'name';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
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
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !userProfile) router.push('/');
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    if (!userProfile) return;

    async function fetchData() {
      if (tab === 'discover') {
        const data = await request('/api/matches/find?limit=50');
        if (data) setPotentialMatches((data as { data: PotentialMatch[] }).data || []);
      } else {
        const status = tab === 'pending' ? 'pending' : 'accepted';
        const data = await request(`/api/matches?status=${status}`);
        if (data) setExistingMatches((data as { data: ExistingMatch[] }).data || []);
      }
    }
    fetchData();
  }, [tab, userProfile, request]);

  const handleSendRequest = async (targetUser: MatchUser) => {
    if (!userProfile) return;
    setConnectingTo(targetUser._id);
    const skillOffered = userProfile.skillsOffered[0]?.name || '';
    const skillWanted = targetUser.skillsOffered[0]?.name || '';

    await request('/api/matches', 'POST', {
      targetUserId: targetUser._id,
      skillOffered,
      skillWanted,
    });
    setConnectingTo(null);
  };

  const handleUpdateMatch = async (matchId: string, status: 'accepted' | 'rejected') => {
    await request(`/api/matches/${matchId}`, 'PATCH', { status });
    setExistingMatches(existingMatches.filter((m) => m._id !== matchId));
  };

  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    potentialMatches.forEach((m) => {
      m.user.skillsOffered.forEach((s) => skills.add(s.name));
    });
    return Array.from(skills).sort();
  }, [potentialMatches]);

  const filteredAndSorted = useMemo(() => {
    let results = [...potentialMatches];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (m) =>
          m.user.displayName.toLowerCase().includes(q) ||
          m.user.skillsOffered.some((s) => s.name.toLowerCase().includes(q)) ||
          m.user.skillsWanted.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    if (minScore > 0) {
      results = results.filter((m) => m.score >= minScore);
    }

    if (selectedSkillFilter) {
      results = results.filter((m) =>
        m.user.skillsOffered.some((s) => s.name === selectedSkillFilter)
      );
    }

    switch (sortBy) {
      case 'score':
        results.sort((a, b) => b.score - a.score);
        break;
      case 'rating':
        results.sort((a, b) => b.user.rating - a.user.rating);
        break;
      case 'sessions':
        results.sort((a, b) => b.user.totalSessions - a.user.totalSessions);
        break;
      case 'name':
        results.sort((a, b) => a.user.displayName.localeCompare(b.user.displayName));
        break;
    }

    return results;
  }, [potentialMatches, searchQuery, sortBy, minScore, selectedSkillFilter]);

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen t-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: 'discover' as const, label: 'Discover', icon: Users, count: potentialMatches.length },
    { key: 'pending' as const, label: 'Pending', icon: Calendar, count: existingMatches.length },
    { key: 'active' as const, label: 'Active', icon: Check, count: existingMatches.length },
  ];

  return (
    <main className="min-h-screen t-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <ArrowLeftRight size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold t-text">Skill Matches</h1>
                <p className="t-text-secondary text-sm">Find your perfect skill exchange partner</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => router.push('/explore')}>
              <Users size={16} /> Explore All Users
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 mb-6 p-1 rounded-xl bg-[rgb(var(--bg-secondary))] w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-primary-500 text-white shadow-md'
                  : 't-text-secondary hover:t-text hover:bg-[rgb(var(--bg-primary))]'
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </motion.div>

        {tab === 'discover' && (
          <>
            {/* Search + Filters */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Search matches by name or skill..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={<Search size={16} />}
                    />
                  </div>
                  <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
                    <SlidersHorizontal size={16} />
                    Filters
                    <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[rgb(var(--border))]">
                        <div>
                          <label className="block text-xs font-medium t-text-secondary mb-1.5">
                            <ArrowUpDown size={12} className="inline mr-1" />Sort By
                          </label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm t-text focus:outline-none focus:border-primary-500/50"
                          >
                            <option value="score">Compatibility Score</option>
                            <option value="rating">Highest Rating</option>
                            <option value="sessions">Most Sessions</option>
                            <option value="name">Name (A-Z)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium t-text-secondary mb-1.5">
                            Min Score: {minScore}%
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={minScore}
                            onChange={(e) => setMinScore(Number(e.target.value))}
                            className="w-full accent-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium t-text-secondary mb-1.5">Filter by Skill</label>
                          <select
                            value={selectedSkillFilter}
                            onChange={(e) => setSelectedSkillFilter(e.target.value)}
                            className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm t-text focus:outline-none focus:border-primary-500/50"
                          >
                            <option value="">All Skills</option>
                            {allSkills.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgb(var(--border))]">
                  <p className="text-sm t-text-muted">
                    Showing <strong className="t-text">{filteredAndSorted.length}</strong> compatible users
                  </p>
                  {(searchQuery || minScore > 0 || selectedSkillFilter) && (
                    <button
                      onClick={() => { setSearchQuery(''); setMinScore(0); setSelectedSkillFilter(''); }}
                      className="text-xs text-primary-500 hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          </>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : tab === 'discover' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSorted.map((match, i) => (
              <motion.div
                key={match.user._id}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i}
              >
                <Card hover className="h-full flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar src={match.user.photoURL} name={match.user.displayName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold t-text truncate">{match.user.displayName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={match.user.rating} size={12} />
                        <span className="text-xs t-text-muted">{match.user.totalSessions} sessions</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        match.score >= 80 ? 'text-green-500' :
                        match.score >= 50 ? 'text-yellow-500' : 'text-orange-400'
                      }`}>
                        {match.score}%
                      </div>
                      <span className="text-[10px] t-text-muted uppercase tracking-wider">match</span>
                    </div>
                  </div>

                  {match.user.bio && (
                    <p className="text-sm t-text-secondary mb-3 line-clamp-2">{match.user.bio}</p>
                  )}

                  <div className="space-y-2 mb-4 flex-1">
                    <div>
                      <p className="text-xs font-medium t-text-muted mb-1">Teaches</p>
                      <div className="flex flex-wrap gap-1">
                        {match.user.skillsOffered.slice(0, 4).map((s) => (
                          <Badge key={s.name} variant="success" size="sm">{s.name}</Badge>
                        ))}
                        {match.user.skillsOffered.length > 4 && (
                          <Badge variant="default" size="sm">+{match.user.skillsOffered.length - 4}</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium t-text-muted mb-1">Wants to learn</p>
                      <div className="flex flex-wrap gap-1">
                        {match.user.skillsWanted.slice(0, 4).map((s) => (
                          <Badge key={s.name} variant="info" size="sm">{s.name}</Badge>
                        ))}
                        {match.user.skillsWanted.length > 4 && (
                          <Badge variant="default" size="sm">+{match.user.skillsWanted.length - 4}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[rgb(var(--border))]">
                    <Button
                      onClick={() => handleSendRequest(match.user)}
                      size="sm"
                      className="flex-1"
                      loading={connectingTo === match.user._id}
                    >
                      <UserPlus size={14} /> Connect
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => router.push(`/chat?user=${match.user._id}`)}>
                      <MessageSquare size={14} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
            {filteredAndSorted.length === 0 && !loading && (
              <div className="col-span-full text-center py-20">
                <Users size={56} className="mx-auto t-text-muted mb-4" />
                <h3 className="text-xl font-semibold t-text mb-2">No matches found</h3>
                <p className="t-text-secondary text-sm mb-4">
                  {minScore > 0 || selectedSkillFilter
                    ? 'Try adjusting your filters to see more results'
                    : 'Add more skills to your profile to find matches'}
                </p>
                <Button variant="secondary" onClick={() => router.push('/explore')}>
                  <Users size={16} /> Explore All Users
                </Button>
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
                  <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar src={otherUser.photoURL} name={otherUser.displayName} size="lg" />
                      <div className="min-w-0">
                        <h3 className="font-semibold t-text truncate">{otherUser.displayName}</h3>
                        <div className="flex items-center gap-2 text-sm t-text-secondary">
                          <span>{match.skillOfferedByA}</span>
                          <ArrowLeftRight size={14} className="text-primary-400 flex-shrink-0" />
                          <span>{match.skillOfferedByB}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={otherUser.rating} size={11} />
                          <span className="text-xs t-text-muted">{match.compatibilityScore}% match</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={match.status === 'accepted' ? 'success' : match.status === 'pending' ? 'warning' : 'danger'}>
                        {match.status}
                      </Badge>
                      {isPending && (
                        <>
                          <Button size="sm" onClick={() => handleUpdateMatch(match._id, 'accepted')}>
                            <Check size={14} /> Accept
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleUpdateMatch(match._id, 'rejected')}>
                            <X size={14} />
                          </Button>
                        </>
                      )}
                      {match.status === 'accepted' && (
                        <Button size="sm" variant="secondary" onClick={() => router.push(`/chat?user=${otherUser._id}`)}>
                          <MessageSquare size={14} /> Chat
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
            {existingMatches.length === 0 && !loading && (
              <div className="text-center py-20">
                <Users size={56} className="mx-auto t-text-muted mb-4" />
                <h3 className="text-xl font-semibold t-text mb-2">No {tab} matches</h3>
                <p className="t-text-secondary text-sm mb-4">Start discovering skill partners!</p>
                <Button onClick={() => setTab('discover')}>
                  <Users size={16} /> Discover Matches
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
