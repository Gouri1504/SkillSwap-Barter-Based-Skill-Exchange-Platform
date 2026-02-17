'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Plus, X, Briefcase, Globe, BookOpen } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { SKILL_CATEGORIES } from '@/utils/helpers';

interface SkillInput {
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export default function ProfilePage() {
  const { userProfile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const { request, loading } = useApi({ showSuccessToast: true });

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<string>('beginner');
  const [skillsOffered, setSkillsOffered] = useState<SkillInput[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<SkillInput[]>([]);
  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillWanted, setNewSkillWanted] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Programming');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    if (!authLoading && !userProfile) {
      router.push('/');
    }
  }, [authLoading, userProfile, router]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setLocation('');
      setExperienceLevel('beginner');
      setSkillsOffered(
        userProfile.skillsOffered?.map((s) => ({
          name: s.name,
          category: s.category,
          level: s.level as SkillInput['level'],
        })) || []
      );
      setSkillsWanted(
        userProfile.skillsWanted?.map((s) => ({
          name: s.name,
          category: s.category,
          level: s.level as SkillInput['level'],
        })) || []
      );
    }
  }, [userProfile]);

  const addSkill = (type: 'offered' | 'wanted') => {
    const skillName = type === 'offered' ? newSkillOffered : newSkillWanted;
    if (!skillName.trim()) return;

    const skill: SkillInput = {
      name: skillName.trim().toLowerCase(),
      category: selectedCategory,
      level: 'beginner',
    };

    if (type === 'offered') {
      setSkillsOffered([...skillsOffered, skill]);
      setNewSkillOffered('');
    } else {
      setSkillsWanted([...skillsWanted, skill]);
      setNewSkillWanted('');
    }
  };

  const removeSkill = (type: 'offered' | 'wanted', index: number) => {
    if (type === 'offered') {
      setSkillsOffered(skillsOffered.filter((_, i) => i !== index));
    } else {
      setSkillsWanted(skillsWanted.filter((_, i) => i !== index));
    }
  };

  const addPortfolioLink = () => {
    if (!newLink.trim()) return;
    try {
      new URL(newLink);
      setPortfolioLinks([...portfolioLinks, newLink.trim()]);
      setNewLink('');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const handleSave = async () => {
    const result = await request('/api/users/profile', 'PUT', {
      displayName,
      bio,
      location,
      experienceLevel,
      skillsOffered,
      skillsWanted,
      portfolioLinks,
    });

    if (result) {
      await refreshProfile();
    }
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
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <User size={28} className="text-primary-400" />
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </motion.div>

        <div className="space-y-6">
          {/* Basic Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User size={18} className="text-primary-400" />
                Basic Information
              </h2>
              <div className="flex items-start gap-6">
                <Avatar src={userProfile.photoURL} name={userProfile.displayName} size="xl" />
                <div className="flex-1 space-y-4">
                  <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                  <div>
                    <label className="block text-sm font-medium text-dark-50 mb-1.5">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell others about yourself..."
                      className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-4 py-2.5 t-text placeholder-dark-200 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 min-h-[100px] resize-none"
                      maxLength={500}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" icon={<Globe size={16} />} />
                    <div>
                      <label className="block text-sm font-medium text-dark-50 mb-1.5">Experience Level</label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-4 py-2.5 t-text focus:outline-none focus:border-primary-500/50"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Skills Offered */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase size={18} className="text-green-400" />
                Skills You Offer
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {skillsOffered.map((skill, index) => (
                  <Badge key={index} variant="success" size="md">
                    {skill.name}
                    <button onClick={() => removeSkill('offered', index)} className="ml-1 hover:t-text">
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm t-text focus:outline-none">
                  {SKILL_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <Input placeholder="Add a skill..." value={newSkillOffered} onChange={(e) => setNewSkillOffered(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill('offered')} />
                <Button onClick={() => addSkill('offered')} size="sm"><Plus size={16} /></Button>
              </div>
            </Card>
          </motion.div>

          {/* Skills Wanted */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-400" />
                Skills You Want to Learn
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {skillsWanted.map((skill, index) => (
                  <Badge key={index} variant="info" size="md">
                    {skill.name}
                    <button onClick={() => removeSkill('wanted', index)} className="ml-1 hover:t-text">
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add a skill..." value={newSkillWanted} onChange={(e) => setNewSkillWanted(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill('wanted')} />
                <Button onClick={() => addSkill('wanted')} size="sm"><Plus size={16} /></Button>
              </div>
            </Card>
          </motion.div>

          {/* Portfolio Links */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe size={18} className="text-purple-400" />
                Portfolio Links
              </h2>
              <div className="space-y-2 mb-4">
                {portfolioLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-[rgb(var(--bg-secondary))]">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-400 hover:underline flex-1 truncate">{link}</a>
                    <button onClick={() => setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index))} className="t-text-secondary hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="https://..." value={newLink} onChange={(e) => setNewLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPortfolioLink()} />
                <Button onClick={addPortfolioLink} size="sm"><Plus size={16} /></Button>
              </div>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Button onClick={handleSave} loading={loading} size="lg" className="w-full">
              <Save size={18} />
              Save Profile
            </Button>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
