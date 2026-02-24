'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Users, MessageSquare, ArrowLeftRight, Calendar,
  Star, MapPin, ChevronDown, X, Loader2, UserPlus,
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
import { SKILL_CATEGORIES } from '@/utils/helpers';

interface UserResult {
  _id: string;
  displayName: string;
  photoURL: string;
  bio: string;
  location: string;
  skillsOffered: Array<{ name: string; category: string; level: string }>;
  skillsWanted: Array<{ name: string; category: string; level: string }>;
  rating: number;
  totalSessions: number;
  totalReviews: number;
  experienceLevel: string;
  badges: string[];
  isVerified: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

export default function ExplorePage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { request, loading } = useApi();

  const [users, setUsers] = useState<UserResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !userProfile) router.push('/');
  }, [authLoading, userProfile, router]);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category) params.set('category', category);
    if (level) params.set('level', level);
    if (sortBy) params.set('sortBy', sortBy);
    params.set('page', String(page));
    params.set('limit', '18');

    const data = await request(`/api/users/search?${params.toString()}`);
    console.log(data);
    if (data) {
      const response = data as { data: UserResult[]; pagination: { pages: number } };
      setUsers(response || []);
      setTotalPages(response.pagination?.pages || 1);
    }
  }, [searchQuery, category, level, sortBy, page, request]);

  useEffect(() => {
    if (!userProfile) return;
    fetchUsers();
  }, [userProfile, fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleConnect = async (targetUser: UserResult) => {
    if (!userProfile) return;
    setConnectingTo(targetUser._id);

    const skillOffered = userProfile.skillsOffered?.[0]?.name || '';
    const skillWanted = targetUser.skillsOffered?.[0]?.name || '';

    await request('/api/matches', 'POST', {
      targetUserId: targetUser._id,
      skillOffered,
      skillWanted,
    });
    setConnectingTo(null);
  };

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen t-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen t-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold t-text">Explore Users</h1>
              <p className="t-text-secondary text-sm">Find skill partners, connect, and start learning</p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, skill, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={16} />}
                />
              </div>
              <Button type="submit" disabled={loading}>
                <Search size={16} /> Search
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={16} />
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </form>

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
                      <label className="block text-xs font-medium t-text-secondary mb-1.5">Category</label>
                      <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm t-text focus:outline-none focus:border-primary-500/50"
                      >
                        <option value="">All Categories</option>
                        {SKILL_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium t-text-secondary mb-1.5">Experience Level</label>
                      <select
                        value={level}
                        onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                        className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm t-text focus:outline-none focus:border-primary-500/50"
                      >
                        <option value="">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium t-text-secondary mb-1.5">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                        className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm t-text focus:outline-none focus:border-primary-500/50"
                      >
                        <option value="rating">Highest Rating</option>
                        <option value="sessions">Most Sessions</option>
                        <option value="newest">Newest</option>
                        <option value="name">Name (A-Z)</option>
                      </select>
                    </div>
                  </div>
                  {(category || level) && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs t-text-muted">Active filters:</span>
                      {category && (
                        <Badge variant="primary" size="sm">
                          {category}
                          <button onClick={() => setCategory('')} className="ml-1"><X size={10} /></button>
                        </Badge>
                      )}
                      {level && (
                        <Badge variant="info" size="sm">
                          {level}
                          <button onClick={() => setLevel('')} className="ml-1"><X size={10} /></button>
                        </Badge>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : users.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Users size={56} className="mx-auto t-text-muted mb-4" />
            <h3 className="text-xl font-semibold t-text mb-2">No users found</h3>
            <p className="t-text-secondary text-sm">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {users.map((user, i) => (
                <motion.div
                  key={user._id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i}
                >
                  <Card hover className="h-full flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar src={user.photoURL} name={user.displayName} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold t-text truncate">{user.displayName}</h3>
                          {user.isVerified && (
                            <span className="text-primary-500" title="Verified">✓</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarRating rating={user.rating} size={12} />
                          <span className="text-xs t-text-muted">({user.totalReviews})</span>
                        </div>
                        {user.location && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="t-text-muted" />
                            <span className="text-xs t-text-muted truncate">{user.location}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="default" size="sm">{user.experienceLevel}</Badge>
                    </div>

                    {user.bio && (
                      <p className="text-sm t-text-secondary mb-3 line-clamp-2">{user.bio}</p>
                    )}

                    <div className="space-y-2 mb-4 flex-1">
                      <div>
                        <p className="text-xs font-medium t-text-muted mb-1">Teaches</p>
                        <div className="flex flex-wrap gap-1">
                          {user.skillsOffered.slice(0, 4).map((s) => (
                            <Badge key={s.name} variant="success" size="sm">{s.name}</Badge>
                          ))}
                          {user.skillsOffered.length > 4 && (
                            <Badge variant="default" size="sm">+{user.skillsOffered.length - 4}</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium t-text-muted mb-1">Wants to learn</p>
                        <div className="flex flex-wrap gap-1">
                          {user.skillsWanted.slice(0, 4).map((s) => (
                            <Badge key={s.name} variant="info" size="sm">{s.name}</Badge>
                          ))}
                          {user.skillsWanted.length > 4 && (
                            <Badge variant="default" size="sm">+{user.skillsWanted.length - 4}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[rgb(var(--border))]">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleConnect(user)}
                        loading={connectingTo === user._id}
                      >
                        <UserPlus size={14} /> Connect
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/chat?user=${user._id}`)}
                      >
                        <MessageSquare size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        View
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm t-text-secondary">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* User Detail Modal */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setSelectedUser(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg glass-card p-6 max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold t-text">User Profile</h2>
                  <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 t-text-secondary">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-5">
                  <Avatar src={selectedUser.photoURL} name={selectedUser.displayName} size="xl" />
                  <div>
                    <h3 className="text-lg font-semibold t-text">{selectedUser.displayName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={selectedUser.rating} size={14} />
                      <span className="text-sm t-text-secondary">{selectedUser.totalReviews} reviews</span>
                    </div>
                    {selectedUser.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={13} className="t-text-muted" />
                        <span className="text-sm t-text-muted">{selectedUser.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-sm t-text-secondary">
                      <span><strong>{selectedUser.totalSessions}</strong> sessions</span>
                      <span>•</span>
                      <Badge variant="primary" size="sm">{selectedUser.experienceLevel}</Badge>
                    </div>
                  </div>
                </div>

                {selectedUser.bio && (
                  <p className="text-sm t-text-secondary mb-5 leading-relaxed">{selectedUser.bio}</p>
                )}

                <div className="space-y-4 mb-5">
                  <div>
                    <h4 className="text-sm font-semibold t-text mb-2">Skills Offered</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.skillsOffered.map((s) => (
                        <Badge key={s.name} variant="success" size="md">{s.name} ({s.level})</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold t-text mb-2">Wants to Learn</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.skillsWanted.map((s) => (
                        <Badge key={s.name} variant="info" size="md">{s.name} ({s.level})</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedUser.badges.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold t-text mb-2">Badges</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.badges.map((b) => (
                        <Badge key={b} variant="warning" size="sm">{b}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-[rgb(var(--border))]">
                  <Button className="flex-1" onClick={() => { handleConnect(selectedUser); setSelectedUser(null); }}>
                    <ArrowLeftRight size={16} /> Send Exchange Request
                  </Button>
                  <Button variant="secondary" onClick={() => { router.push(`/chat?user=${selectedUser._id}`); setSelectedUser(null); }}>
                    <MessageSquare size={16} /> Message
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
