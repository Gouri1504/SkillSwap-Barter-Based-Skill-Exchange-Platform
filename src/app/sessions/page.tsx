'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Video, CheckCircle2, XCircle, Play, ExternalLink,
  FileText, Link2, Plus, Save, BookOpen, Upload, StickyNote,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import { formatDate, formatTime } from '@/utils/helpers';

interface SessionNote {
  _id: string;
  content: string;
  author: { _id: string; displayName: string; photoURL: string };
  createdAt: string;
}

interface SessionResource {
  _id: string;
  title: string;
  url: string;
  type: string;
  addedBy: { _id: string; displayName: string; photoURL: string };
  addedAt: string;
}

interface SessionData {
  _id: string;
  skill: string;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingLink: string;
  notes: string;
  summary: string;
  sessionNotes: SessionNote[];
  resources: SessionResource[];
  host: { _id: string; displayName: string; photoURL: string };
  participant: { _id: string; displayName: string; photoURL: string };
}

const statusConfig: Record<string, { color: 'success' | 'warning' | 'danger' | 'info' | 'primary'; icon: typeof CheckCircle2 }> = {
  scheduled: { color: 'info', icon: Calendar },
  'in-progress': { color: 'warning', icon: Play },
  completed: { color: 'success', icon: CheckCircle2 },
  cancelled: { color: 'danger', icon: XCircle },
};

const resourceIcons: Record<string, typeof Link2> = {
  link: Link2,
  document: FileText,
  video: Video,
  image: Upload,
  other: FileText,
};

export default function SessionsPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { request, loading } = useApi();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'resources' | 'summary'>('details');

  // Note form
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Resource form
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceType, setResourceType] = useState('link');
  const [savingResource, setSavingResource] = useState(false);

  // Summary
  const [summaryText, setSummaryText] = useState('');
  const [savingSummary, setSavingSummary] = useState(false);

  useEffect(() => {
    if (!authLoading && !userProfile) router.push('/');
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    async function fetchSessions() {
      const url = filter === 'all' ? '/api/sessions' : `/api/sessions?status=${filter}`;
      const data = await request(url);
      if (data) setSessions((data as SessionData[]) || []);
    }
    if (userProfile) fetchSessions();
  }, [userProfile, filter, request]);

  const handleSelectSession = async (session: SessionData) => {
    const data = await request(`/api/sessions/${session._id}`);
    if (data) setSelectedSession(data as SessionData);
    setActiveTab('details');
  };

  const handleUpdateSession = async (sessionId: string, status: string) => {
    await request(`/api/sessions/${sessionId}`, 'PATCH', { status });
    setSessions(sessions.map((s) => s._id === sessionId ? { ...s, status } : s));
    setSelectedSession(null);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedSession) return;
    setSavingNote(true);
    const data = await request(`/api/sessions/${selectedSession._id}/notes`, 'POST', { content: newNote });
    if (data) {
      setSelectedSession(data as SessionData);
      setNewNote('');
    }
    setSavingNote(false);
  };

  const handleAddResource = async () => {
    if (!resourceTitle.trim() || !resourceUrl.trim() || !selectedSession) return;
    setSavingResource(true);
    const data = await request(`/api/sessions/${selectedSession._id}/resources`, 'POST', {
      title: resourceTitle,
      url: resourceUrl,
      type: resourceType,
    });
    if (data) {
      setSelectedSession(data as SessionData);
      setResourceTitle('');
      setResourceUrl('');
      setResourceType('link');
      setShowResourceForm(false);
    }
    setSavingResource(false);
  };

  const handleSaveSummary = async () => {
    if (!selectedSession) return;
    setSavingSummary(true);
    const data = await request(`/api/sessions/${selectedSession._id}/summary`, 'PUT', { summary: summaryText });
    if (data) {
      setSelectedSession({ ...selectedSession, summary: summaryText });
    }
    setSavingSummary(false);
  };

  useEffect(() => {
    if (selectedSession) {
      setSummaryText(selectedSession.summary || '');
    }
  }, [selectedSession]);

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={28} className="text-primary-500" />
            <h1 className="text-3xl font-bold t-text">Sessions</h1>
          </div>
          <p className="t-text-secondary">Manage your learning sessions, notes, and resources</p>
        </motion.div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['all', 'scheduled', 'in-progress', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-[rgb(var(--bg-secondary))] t-text-secondary border border-[rgb(var(--border))] hover:bg-primary-500/10'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, i) => {
              const otherUser = session.host._id === userProfile._id ? session.participant : session.host;
              const config = statusConfig[session.status] || statusConfig.scheduled;
              const StatusIcon = config.icon;

              return (
                <motion.div key={session._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card hover onClick={() => handleSelectSession(session)} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar src={otherUser.photoURL} name={otherUser.displayName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold t-text">{session.skill}</h3>
                      <p className="text-sm t-text-secondary">with {otherUser.displayName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs t-text-muted">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(new Date(session.scheduledAt))}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(new Date(session.scheduledAt))}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {session.duration} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={config.color}>
                        <StatusIcon size={12} className="mr-1" />
                        {session.status}
                      </Badge>
                      {session.status === 'completed' && (
                        <Badge variant="default">
                          <StickyNote size={12} className="mr-1" />
                          History
                        </Badge>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
            {sessions.length === 0 && (
              <div className="text-center py-20">
                <Calendar size={48} className="mx-auto t-text-muted mb-4" />
                <h3 className="text-lg font-semibold t-text-secondary">No sessions found</h3>
                <p className="t-text-muted text-sm mt-1">Book a session from your matches</p>
              </div>
            )}
          </div>
        )}

        {/* Session Detail Modal */}
        <Modal isOpen={!!selectedSession} onClose={() => setSelectedSession(null)} title="Session Details" size="lg">
          {selectedSession && (
            <div className="space-y-4">
              {/* Session Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Calendar size={24} className="text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold t-text text-lg">{selectedSession.skill}</h3>
                  <p className="text-sm t-text-secondary">
                    {formatDate(new Date(selectedSession.scheduledAt))} at {formatTime(new Date(selectedSession.scheduledAt))}
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge variant={statusConfig[selectedSession.status]?.color || 'info'}>{selectedSession.status}</Badge>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-[rgb(var(--border))] pb-0">
                {(['details', 'notes', 'resources', 'summary'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                      activeTab === tab
                        ? 'bg-primary-500/10 text-primary-500 border-b-2 border-primary-500'
                        : 't-text-muted hover:t-text-secondary'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-[rgb(var(--bg-secondary))]">
                      <p className="text-xs t-text-muted mb-1">Duration</p>
                      <p className="text-sm font-medium t-text">{selectedSession.duration} minutes</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[rgb(var(--bg-secondary))]">
                      <p className="text-xs t-text-muted mb-1">Status</p>
                      <Badge variant={statusConfig[selectedSession.status]?.color || 'info'}>{selectedSession.status}</Badge>
                    </div>
                  </div>

                  {selectedSession.notes && (
                    <div className="p-3 rounded-lg bg-[rgb(var(--bg-secondary))]">
                      <p className="text-xs t-text-muted mb-1">Pre-session Notes</p>
                      <p className="text-sm t-text">{selectedSession.notes}</p>
                    </div>
                  )}

                  {selectedSession.meetingLink && (
                    <a href={`/meet/${selectedSession.meetingLink}`} target="_blank" className="flex items-center gap-2 text-primary-500 hover:underline text-sm">
                      <ExternalLink size={14} /> Join Meeting
                    </a>
                  )}

                  <div className="flex gap-2 pt-2">
                    {selectedSession.status === 'scheduled' && (
                      <>
                        <Button onClick={() => handleUpdateSession(selectedSession._id, 'in-progress')} className="flex-1">
                          <Play size={14} /> Start Session
                        </Button>
                        <Button variant="danger" onClick={() => handleUpdateSession(selectedSession._id, 'cancelled')} className="flex-1">
                          <XCircle size={14} /> Cancel
                        </Button>
                      </>
                    )}
                    {selectedSession.status === 'in-progress' && (
                      <Button onClick={() => handleUpdateSession(selectedSession._id, 'completed')} className="flex-1">
                        <CheckCircle2 size={14} /> Complete Session
                      </Button>
                    )}
                    {selectedSession.status === 'completed' && (
                      <Button onClick={() => router.push(`/reviews?sessionId=${selectedSession._id}`)} className="flex-1">
                        Leave Review
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote size={18} className="text-primary-500" />
                    <h4 className="font-semibold t-text">Session Notes</h4>
                  </div>

                  {/* Existing notes */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedSession.sessionNotes?.length > 0 ? (
                      selectedSession.sessionNotes.map((note) => (
                        <div key={note._id} className="p-3 rounded-lg bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))]">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar src={note.author?.photoURL} name={note.author?.displayName || 'User'} size="sm" />
                            <span className="text-sm font-medium t-text">{note.author?.displayName}</span>
                            <span className="text-xs t-text-muted ml-auto">
                              {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm t-text-secondary whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <StickyNote size={32} className="mx-auto t-text-muted mb-2" />
                        <p className="text-sm t-text-muted">No notes yet. Add your first note below.</p>
                      </div>
                    )}
                  </div>

                  {/* Add note form */}
                  <div className="border-t border-[rgb(var(--border))] pt-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write your session notes here... (key learnings, observations, follow-ups)"
                      className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-4 py-3 t-text placeholder:t-text-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 min-h-[100px] resize-none text-sm"
                      maxLength={5000}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs t-text-muted">{newNote.length}/5000</span>
                      <Button onClick={handleAddNote} loading={savingNote} size="sm" disabled={!newNote.trim()}>
                        <Save size={14} /> Save Note
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-primary-500" />
                      <h4 className="font-semibold t-text">Resources</h4>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setShowResourceForm(!showResourceForm)}>
                      <Plus size={14} /> Add Resource
                    </Button>
                  </div>

                  {/* Add resource form */}
                  {showResourceForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 rounded-lg bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] space-y-3"
                    >
                      <Input
                        label="Title"
                        placeholder="e.g., React Documentation"
                        value={resourceTitle}
                        onChange={(e) => setResourceTitle(e.target.value)}
                      />
                      <Input
                        label="URL"
                        placeholder="https://..."
                        value={resourceUrl}
                        onChange={(e) => setResourceUrl(e.target.value)}
                        icon={<Link2 size={14} />}
                      />
                      <div>
                        <label className="block text-sm font-medium t-text-secondary mb-1.5">Type</label>
                        <select
                          value={resourceType}
                          onChange={(e) => setResourceType(e.target.value)}
                          className="w-full bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border))] rounded-xl px-4 py-2.5 t-text focus:outline-none focus:border-primary-500/50 text-sm"
                        >
                          <option value="link">Link</option>
                          <option value="document">Document</option>
                          <option value="video">Video</option>
                          <option value="image">Image</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddResource} loading={savingResource} size="sm" disabled={!resourceTitle.trim() || !resourceUrl.trim()}>
                          <Upload size={14} /> Upload Resource
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowResourceForm(false)}>Cancel</Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Existing resources */}
                  <div className="space-y-2">
                    {selectedSession.resources?.length > 0 ? (
                      selectedSession.resources.map((resource) => {
                        const Icon = resourceIcons[resource.type] || FileText;
                        return (
                          <a
                            key={resource._id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] hover:border-primary-500/30 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                              <Icon size={18} className="text-primary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium t-text group-hover:text-primary-500 truncate">{resource.title}</p>
                              <p className="text-xs t-text-muted truncate">{resource.url}</p>
                            </div>
                            <Badge variant="default" size="sm">{resource.type}</Badge>
                            <ExternalLink size={14} className="t-text-muted group-hover:text-primary-500" />
                          </a>
                        );
                      })
                    ) : (
                      <div className="text-center py-6">
                        <BookOpen size={32} className="mx-auto t-text-muted mb-2" />
                        <p className="text-sm t-text-muted">No resources yet. Share helpful links and documents.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={18} className="text-primary-500" />
                    <h4 className="font-semibold t-text">Session Summary</h4>
                  </div>

                  <p className="text-sm t-text-muted">
                    Summarize what was covered, key takeaways, and next steps.
                  </p>

                  <textarea
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    placeholder="What was covered in this session? Key learnings, next steps, homework assignments..."
                    className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-4 py-3 t-text placeholder:t-text-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 min-h-[160px] resize-none text-sm"
                    maxLength={3000}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs t-text-muted">{summaryText.length}/3000</span>
                    <Button onClick={handleSaveSummary} loading={savingSummary} size="sm">
                      <Save size={14} /> Save Summary
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
}
